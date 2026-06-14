import pool from '../config/db.js';

// SELECT base con los datos del estudiante, del curso y del estado de la inscripción
const SELECT_BASE = `
  SELECT i.*,
         e.documento, e.apellido, e.nombres,
         c.nombre AS curso_nombre, c.inscriptos_max,
         ie.descripcion AS estado_descripcion, ie.es_activo
  FROM inscripciones i
  JOIN estudiantes e            ON e.id_estudiante = i.id_estudiante
  JOIN cursos c                 ON c.id_curso = i.id_curso
  JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
`;

// BROWSE: búsqueda (estudiante o curso) + paginación + filtro vigentes/canceladas
const obtenerTodos = async ({ busqueda = '', pagina = 1, limite = 10, activo = 1 } = {}) => {
  const offset = (pagina - 1) * limite;
  const filtro = `%${busqueda}%`;

  const where = `
    WHERE ie.es_activo = $1
      AND (e.apellido       ILIKE $2
        OR e.nombres        ILIKE $2
        OR e.documento::text ILIKE $2
        OR c.nombre         ILIKE $2)
  `;

  const consultaDatos = `${SELECT_BASE} ${where} ORDER BY i.id_inscripcion DESC LIMIT $3 OFFSET $4`;

  const consultaTotal = `
    SELECT COUNT(*)
    FROM inscripciones i
    JOIN estudiantes e            ON e.id_estudiante = i.id_estudiante
    JOIN cursos c                 ON c.id_curso = i.id_curso
    JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
    ${where}
  `;

  const resultado = await pool.query(consultaDatos, [activo, filtro, limite, offset]);
  const totalRes  = await pool.query(consultaTotal, [activo, filtro]);
  const total     = parseInt(totalRes.rows[0].count);

  return {
    datos: resultado.rows,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite) || 1,
  };
};

// READ
const obtenerPorId = async (id) => {
  const r = await pool.query(`${SELECT_BASE} WHERE i.id_inscripcion = $1`, [id]);
  return r.rows[0];
};

// ¿El estudiante ya tiene una inscripción VIGENTE en ese curso?
const existeInscripcionActiva = async (id_estudiante, id_curso) => {
  const r = await pool.query(`
    SELECT 1
    FROM inscripciones i
    JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
    WHERE i.id_estudiante = $1 AND i.id_curso = $2 AND ie.es_activo = 1
    LIMIT 1
  `, [id_estudiante, id_curso]);
  return r.rowCount > 0;
};

// Cantidad de inscripciones VIGENTES de un curso (para el control de cupo)
const contarActivasPorCurso = async (id_curso) => {
  const r = await pool.query(`
    SELECT COUNT(*)
    FROM inscripciones i
    JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
    WHERE i.id_curso = $1 AND ie.es_activo = 1
  `, [id_curso]);
  return parseInt(r.rows[0].count);
};

// ADD — crea la inscripción en el estado vigente (es_activo = 1 => CONFIRMADA)
const crear = async ({ id_estudiante, id_curso }) => {
  const r = await pool.query(`
    INSERT INTO inscripciones
      (id_curso, id_estudiante, fecha_hora_inscripcion, id_inscripcion_estado,
       id_usuario_modificacion, fecha_hora_modificacion)
    VALUES ($1, $2, CURRENT_TIMESTAMP,
      (SELECT id_inscripcion_estado FROM inscripciones_estados WHERE es_activo = 1 ORDER BY id_inscripcion_estado LIMIT 1),
      1, CURRENT_TIMESTAMP)
    RETURNING *
  `, [id_curso, id_estudiante]);
  return r.rows[0];
};

// DELETE (baja lógica) — pasa la inscripción al estado baja (es_activo = 0 => CANCELADA)
const eliminar = async (id) => {
  const r = await pool.query(`
    UPDATE inscripciones
    SET id_inscripcion_estado = (SELECT id_inscripcion_estado FROM inscripciones_estados WHERE es_activo = 0 ORDER BY id_inscripcion_estado LIMIT 1),
        id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_inscripcion = $1
    RETURNING *
  `, [id]);
  return r.rows[0];
};

export { obtenerTodos, obtenerPorId, existeInscripcionActiva, contarActivasPorCurso, crear, eliminar };
