import * as inscripcionesService   from '../services/inscripcionesService.js';
import * as inscripcionesTransform from '../Transforms/inscripcionesTransform.js';
import * as diplomaService         from '../services/diplomaService.js';
import { construirDiploma }        from '../utils/diplomaPdf.js';
import PDFDocument                 from 'pdfkit';

// BROWSE
const obtenerTodos = async (req, res) => {
  try {
    const { busqueda = '', pagina = 1, limite = 10, activo = 1 } = req.query;

    const resultado = await inscripcionesService.obtenerTodos({
      busqueda,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      activo: parseInt(activo),
    });

    res.json({
      datos:        inscripcionesTransform.transformarListaInscripciones(resultado.datos),
      total:        resultado.total,
      pagina:       resultado.pagina,
      totalPaginas: resultado.totalPaginas,
    });
  } catch (error) {
    console.error('Error en BROWSE inscripciones:', error.message);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
};

// READ
const obtenerPorId = async (req, res) => {
  try {
    const insc = await inscripcionesService.obtenerPorId(req.params.id);
    res.json(inscripcionesTransform.transformarInscripcion(insc));
  } catch (error) {
    if (error.message === 'Inscripción no encontrada') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error en READ inscripción:', error.message);
    res.status(500).json({ error: 'Error al buscar la inscripción' });
  }
};

// ADD
const crear = async (req, res) => {
  try {
    const nueva = await inscripcionesService.crear(req.body);
    res.status(201).json({ mensaje: 'Inscripción registrada correctamente', inscripcion: nueva });
  } catch (error) {
    // Reglas de negocio (cupo, duplicado, curso no habilitado) -> 400
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en ADD inscripción:', error.message);
    res.status(500).json({ error: 'Error al crear la inscripción' });
  }
};

// DELETE (baja lógica / cancelar)
const eliminar = async (req, res) => {
  try {
    const cancelada = await inscripcionesService.eliminar(req.params.id);
    res.json({ mensaje: 'Inscripción cancelada correctamente', inscripcion: cancelada });
  } catch (error) {
    if (error.message === 'Inscripción no encontrada') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error en DELETE inscripción:', error.message);
    res.status(500).json({ error: 'Error al cancelar la inscripción' });
  }
};

// DIPLOMA (PDF individual de la inscripción)
const generarDiploma = async (req, res) => {
  try {
    const datos = await diplomaService.obtenerDatosDiploma(req.params.id);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="diploma_${req.params.id}.pdf"`);

    doc.pipe(res);
    construirDiploma(doc, datos);
    doc.end();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.message === 'Inscripción no encontrada') {
      return res.status(404).json({ mensaje: error.message });
    }
    console.error('Error al generar diploma:', error.message);
    res.status(500).json({ error: 'Error al generar el diploma' });
  }
};

export { obtenerTodos, obtenerPorId, crear, eliminar, generarDiploma };
