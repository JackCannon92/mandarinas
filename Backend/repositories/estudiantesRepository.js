import pool from '../config/db.js';

// obtenerTodos: Devuelve estudiantes con soporte de búsqueda por texto y paginación.
const obtenerTodos = async ({ busqueda = '', pagina = 1, limite = 10 } = {}) => {
  const offset = (pagina - 1) * limite;
  const filtro = `%${busqueda}%`;

  const consultaDatos = `
    SELECT * FROM estudiantes
    WHERE (apellido    ILIKE $1
        OR nombres     ILIKE $1
        OR documento::text ILIKE $1
        OR email       ILIKE $1)
    ORDER BY id_estudiante ASC
    LIMIT $2 OFFSET $3
  `;

  const consultaTotal = `
    SELECT COUNT(*) FROM estudiantes
    WHERE (apellido    ILIKE $1
        OR nombres     ILIKE $1
        OR documento::text ILIKE $1
        OR email       ILIKE $1)
  `;

  const resultado  = await pool.query(consultaDatos, [filtro, limite, offset]);
  const totalRes   = await pool.query(consultaTotal, [filtro]);
  const total      = parseInt(totalRes.rows[0].count);

  return {
    datos: resultado.rows,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite) || 1,
  };
};

// obtenerPorId: Busca un alumno por su ID.
const obtenerPorId = async (id) => {
  const resultado = await pool.query(
    'SELECT * FROM estudiantes WHERE id_estudiante = $1',
    [id]
  );
  return resultado.rows[0];
};

// crear: Inserta un nuevo registro en la tabla de estudiantes.
const crear = async (datos) => {
  const { documento, apellido, nombres, email, fecha_nacimiento } = datos;
  const consulta = `
    INSERT INTO estudiantes
      (documento, apellido, nombres, email, fecha_nacimiento, activo, id_usuario_modificacion, fecha_hora_modificacion)
    VALUES ($1, $2, $3, $4, $5, 1, 1, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [documento, apellido, nombres, email, fecha_nacimiento]);
  return resultado.rows[0];
};

// actualizar: Modifica los datos de un alumno existente.
const actualizar = async (id, datos) => {
  const { documento, apellido, nombres, email, fecha_nacimiento } = datos;
  const consulta = `
    UPDATE estudiantes
    SET documento = $1, apellido = $2, nombres = $3, email = $4,
        fecha_nacimiento = $5, id_usuario_modificacion = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP
    WHERE id_estudiante = $6
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [documento, apellido, nombres, email, fecha_nacimiento, id]);
  return resultado.rows[0];
};

// eliminar: Realiza la baja lógica del estudiante (activo = 0).
const eliminar = async (id) => {
  const consulta = `
    UPDATE estudiantes
    SET activo = 0,
        fecha_hora_modificacion = CURRENT_TIMESTAMP,
        id_usuario_modificacion = 1
    WHERE id_estudiante = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id]);
  return resultado.rows[0];
};

// restaurar: Reactiva un estudiante dado de baja (activo = 1).
const restaurar = async (id) => {
  const consulta = `
    UPDATE estudiantes
    SET activo = 1,
        fecha_hora_modificacion = CURRENT_TIMESTAMP,
        id_usuario_modificacion = 1
    WHERE id_estudiante = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id]);
  return resultado.rows[0];
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar };
