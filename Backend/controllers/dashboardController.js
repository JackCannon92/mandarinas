import * as dashboardService from '../services/dashboardService.js';

const obtenerResumen = async (req, res) => {
  try {
    const resumen = await dashboardService.obtenerResumen();

    const cursosActivos = resumen.cursosActivos.map((c) => ({
      id:             c.id_curso,
      nombre:         c.nombre,
      fecha_inicio:   c.fecha_inicio
        ? new Date(c.fecha_inicio).toLocaleDateString('es-AR')
        : null,
      cantidad_horas: c.cantidad_horas,
      inscriptos_max: c.inscriptos_max,
    }));

    res.json({
      totalEstudiantes: resumen.totalEstudiantes,
      totalCursos:      resumen.totalCursos,
      cursosActivos,
    });
  } catch (error) {
    console.error('Error en DASHBOARD:', error.message);
    res.status(500).json({ error: 'Error al obtener el resumen' });
  }
};

export { obtenerResumen };
