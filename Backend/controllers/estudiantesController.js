import * as estudiantesService   from '../services/estudiantesService.js';
import * as estudiantesTransform from '../Transforms/estudiantesTransform.js';

// BROWSE — lee busqueda/pagina/limite/activo del query string y los pasa al servicio
const obtenerTodos = async (req, res) => {
  try {
    const { busqueda = '', pagina = 1, limite = 10, activo = 1 } = req.query;

    const resultado = await estudiantesService.obtenerTodos({
      busqueda,
      pagina:  parseInt(pagina),
      limite:  parseInt(limite),
      activo:  parseInt(activo),   // 1 = activos | 0 = dados de baja
    });

    // Transformamos solo el array de datos; el resto (total, paginas) va tal cual
    res.json({
      datos:        estudiantesTransform.transformarListaEstudiantes(resultado.datos),
      total:        resultado.total,
      pagina:       resultado.pagina,
      totalPaginas: resultado.totalPaginas,
    });
  } catch (error) {
    console.error('Error en BROWSE:', error.message);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};

// READ
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await estudiantesService.obtenerPorId(id);
    if (!estudiante) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado o inactivo' });
    }
    res.json(estudiante);
  } catch (error) {
    console.error('Error en READ:', error.message);
    res.status(500).json({ error: 'Error al buscar el estudiante' });
  }
};

// ADD
const crear = async (req, res) => {
  try {
    const nuevoEstudiante = await estudiantesService.crear(req.body);
    res.status(201).json(estudiantesTransform.transformarEstudiante(nuevoEstudiante));
  } catch (error) {
    console.error('Error en ADD:', error.message);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  }
};

// EDIT
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await estudiantesService.actualizar(id, req.body);
    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado para editar' });
    }
    res.json(estudiantesTransform.transformarEstudiante(actualizado));
  } catch (error) {
    console.error('Error en EDIT:', error.message);
    res.status(500).json({ error: 'Error al actualizar el estudiante' });
  }
};

// DELETE
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await estudiantesService.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado para eliminar' });
    }
    res.json({ mensaje: 'Estudiante dado de baja correctamente', estudiante: eliminado });
  } catch (error) {
    console.error('Error en DELETE:', error.message);
    res.status(500).json({ error: 'Error al eliminar el estudiante' });
  }
};

// RESTAURAR
const restaurar = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurado = await estudiantesService.restaurar(id);
    if (!restaurado) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado en la base de datos' });
    }
    res.json({ mensaje: 'Estudiante reactivado correctamente', estudiante: restaurado });
  } catch (error) {
    console.error('Error en RESTAURAR:', error.message);
    res.status(500).json({ error: 'Error al reactivar el estudiante' });
  }
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar };