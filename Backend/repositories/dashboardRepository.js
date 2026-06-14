import pool from '../config/db.js';

const obtenerResumen = async () => {
  // Total de estudiantes activos
  const totalEstudiantesRes = await pool.query(
    'SELECT COUNT(*) FROM estudiantes WHERE activo = 1'
  );

  // Total de cursos activos (según es_activo de su estado)
  const totalCursosRes = await pool.query(`
    SELECT COUNT(*)
    FROM cursos c
    JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    WHERE ce.es_activo = 1
  `);

  // Listado de cursos activos para los links rápidos
  const cursosActivosRes = await pool.query(`
    SELECT c.id_curso, c.nombre, c.fecha_inicio, c.cantidad_horas, c.inscriptos_max
    FROM cursos c
    JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    WHERE ce.es_activo = 1
    ORDER BY c.fecha_inicio ASC NULLS LAST, c.id_curso ASC
  `);

  return {
    totalEstudiantes: parseInt(totalEstudiantesRes.rows[0].count),
    totalCursos:      parseInt(totalCursosRes.rows[0].count),
    cursosActivos:    cursosActivosRes.rows,
  };
};

export { obtenerResumen };
