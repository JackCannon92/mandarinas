import pool from '../config/db.js';

// Busca un usuario activo por su nombre de usuario
const buscarPorUsuario = async (nombre_usuario) => {
  const resultado = await pool.query(
    'SELECT * FROM usuarios WHERE nombre_usuario = $1 AND activo = 1',
    [nombre_usuario]
  );
  return resultado.rows[0];
};

export { buscarPorUsuario };
