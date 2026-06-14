import pool from '../config/db.js';

// SELECT base reutilizable: trae el curso + la descripción y el flag de su estado
const SELECT_BASE = `
  SELECT c.*, ce.descripcion AS estado_descripcion, ce.es_activo
  FROM cursos c
  JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
`;

// BROWSE: búsqueda por texto + paginación + filtro activos/baja (vía es_activo del estado)
const obtenerTodos = async ({ busqueda = '', pagina = 1, limite = 10, activo = 1 } = {}) => {
  const offset = (pagina - 1) * limite;
  const filtro = `%${busqueda}%`;

  const where = `
    WHERE ce.es_activo = $1
      AND (c.nombre      ILIKE $2
        OR c.descripcion ILIKE $2)
  `;

  const consultaDatos = `
    ${SELECT_BASE}
    ${where}
    ORDER BY c.id_curso ASC
    LIMIT $3 OFFSET $4
  `;

  const consultaTotal = `
    SELECT COUNT(*)
    FROM cursos c
    JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
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
  const resultado = await pool.query(`${SELECT_BASE} WHERE c.id_curso = $1`, [id]);
  return resultado.rows[0];
};

// ADD — si no llega id_curso_estado, toma el primer estado activo disponible
const crear = async (datos) => {
  const {
    nombre,
    descripcion     = null,
    fecha_inicio    = null,
    cantidad_horas,
    inscriptos_max,
    id_curso_estado = null,
  } = datos;

  const consulta = `
    INSERT INTO cursos
      (nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max,
       id_curso_estado, id_usuario_modificacion, fecha_hora_modificacion)
    VALUES ($1, $2, $3, $4, $5,
      COALESCE($6, (SELECT id_curso_estado FROM cursos_estados WHERE es_activo = 1 ORDER BY id_curso_estado LIMIT 1)),
      1, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const resultado = await pool.query(consulta,
    [nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado]);
  return resultado.rows[0];
};

// EDIT — si no llega id_curso_estado, conserva el actual
const actualizar = async (id, datos) => {
  const {
    nombre,
    descripcion     = null,
    fecha_inicio    = null,
    cantidad_horas,
    inscriptos_max,
    id_curso_estado = null,
  } = datos;

  const consulta = `
    UPDATE cursos
    SET nombre = $1, descripcion = $2, fecha_inicio = $3,
        cantidad_horas = $4, inscriptos_max = $5,
        id_curso_estado = COALESCE($6, id_curso_estado),
        id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_curso = $7
    RETURNING *
  `;
  const resultado = await pool.query(consulta,
    [nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado, id]);
  return resultado.rows[0];
};

// DELETE (soft) — mueve el curso al estado de baja (es_activo = 0)
const eliminar = async (id) => {
  const consulta = `
    UPDATE cursos
    SET id_curso_estado = (SELECT id_curso_estado FROM cursos_estados WHERE es_activo = 0 ORDER BY id_curso_estado LIMIT 1),
        id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_curso = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id]);
  return resultado.rows[0];
};

// RESTAURAR — vuelve el curso a un estado activo (es_activo = 1)
const restaurar = async (id) => {
  const consulta = `
    UPDATE cursos
    SET id_curso_estado = (SELECT id_curso_estado FROM cursos_estados WHERE es_activo = 1 ORDER BY id_curso_estado LIMIT 1),
        id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_curso = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id]);
  return resultado.rows[0];
};

// Lista de estados para el combo (excluye la baja: ELIMINADO / es_activo = 0)
const obtenerEstados = async () => {
  const r = await pool.query(`
    SELECT id_curso_estado, descripcion, es_activo
    FROM cursos_estados
    WHERE es_activo = 1
    ORDER BY id_curso_estado ASC
  `);
  return r.rows;
};

// Cambia solo el estado del curso (botones rápidos Abrir / Cerrar inscripción)
const cambiarEstado = async (id, id_curso_estado) => {
  const r = await pool.query(`
    UPDATE cursos
    SET id_curso_estado = $1,
        id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_curso = $2
    RETURNING *
  `, [id_curso_estado, id]);
  return r.rows[0];
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar, obtenerEstados, cambiarEstado };