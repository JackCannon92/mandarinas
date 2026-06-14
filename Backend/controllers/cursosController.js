import * as cursosService   from '../services/cursosService.js';
import * as cursosTransform from '../Transforms/cursosTransform.js';

// BROWSE
const obtenerTodos = async (req, res) => {
  try {
    const { busqueda = '', pagina = 1, limite = 10, activo = 1 } = req.query;

    const resultado = await cursosService.obtenerTodos({
      busqueda,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      activo: parseInt(activo),
    });

    res.json({
      datos:        cursosTransform.transformarListaCursos(resultado.datos),
      total:        resultado.total,
      pagina:       resultado.pagina,
      totalPaginas: resultado.totalPaginas,
    });
  } catch (error) {
    console.error('Error en BROWSE cursos:', error.message);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
};

// READ
const obtenerPorId = async (req, res) => {
  try {
    const curso = await cursosService.obtenerPorId(req.params.id);
    res.json(curso);
  } catch (error) {
    if (error.message === 'Curso no encontrado') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error en READ curso:', error.message);
    res.status(500).json({ error: 'Error al buscar el curso' });
  }
};

// ADD
const crear = async (req, res) => {
  try {
    const nuevoCurso = await cursosService.crear(req.body);
    res.status(201).json(cursosTransform.transformarCurso(nuevoCurso));
  } catch (error) {
    console.error('Error en ADD curso:', error.message);
    res.status(500).json({ error: 'Error al crear el curso' });
  }
};

// EDIT
const actualizar = async (req, res) => {
  try {
    const actualizado = await cursosService.actualizar(req.params.id, req.body);
    res.json(cursosTransform.transformarCurso(actualizado));
  } catch (error) {
    if (error.message === 'Curso no encontrado') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error en EDIT curso:', error.message);
    res.status(500).json({ error: 'Error al actualizar el curso' });
  }
};

// DELETE (baja lógica)
const eliminar = async (req, res) => {
  try {
    const eliminado = await cursosService.eliminar(req.params.id);
    res.json({ mensaje: 'Curso dado de baja correctamente', curso: eliminado });
  } catch (error) {
    if (error.message === 'Curso no encontrado') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error en DELETE curso:', error.message);
    res.status(500).json({ error: 'Error al eliminar el curso' });
  }
};

// RESTAURAR
const restaurar = async (req, res) => {
  try {
    const restaurado = await cursosService.restaurar(req.params.id);
    if (!restaurado) {
      return res.status(404).json({ mensaje: 'Curso no encontrado en la base de datos' });
    }
    res.json({ mensaje: 'Curso reactivado correctamente', curso: restaurado });
  } catch (error) {
    console.error('Error en RESTAURAR curso:', error.message);
    res.status(500).json({ error: 'Error al reactivar el curso' });
  }
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar };
