import express from 'express';
import * as inscripcionesController from '../controllers/inscripcionesController.js';
import { validarDatosInscripcion } from '../validators/inscripcionesValidator.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔒 Protegido con JWT
router.use(verificarToken);

// 1. BROWSE (Listar con paginación, búsqueda y filtro vigentes/canceladas)
router.get('/', inscripcionesController.obtenerTodos);

// 2. READ (Ver detalle)
router.get('/:id', inscripcionesController.obtenerPorId);

// DIPLOMA (PDF individual)
router.get('/:id/diploma', inscripcionesController.generarDiploma);

// 3. ADD (Crear inscripción, con controles de cupo/duplicado/habilitado)
router.post('/', validarDatosInscripcion, inscripcionesController.crear);

// 4. DELETE (Baja lógica / cancelar) — NO aplica edición
router.delete('/:id', inscripcionesController.eliminar);

export default router;
