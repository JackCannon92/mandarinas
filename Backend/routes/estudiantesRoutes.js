import express from 'express';
import * as estudiantesController from '../controllers/estudiantesController.js';
import { validarDatosEstudiante } from '../validators/estudiantesValidator.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔒 Proteger todas las rutas de estudiantes con JWT
router.use(verificarToken);

// 1. BROWSE (Listar con paginación, búsqueda y filtro activo/baja)
router.get('/', estudiantesController.obtenerTodos);

// 2. READ (Ver detalle de un estudiante)
router.get('/:id', estudiantesController.obtenerPorId);

// 3. ADD (Crear un nuevo estudiante)
router.post('/', validarDatosEstudiante, estudiantesController.crear);

// 4. EDIT (Actualizar un estudiante existente)
router.put('/:id', validarDatosEstudiante, estudiantesController.actualizar);

// 5. DELETE (Baja lógica / Desactivar)
router.delete('/:id', estudiantesController.eliminar);

// 6. RESTAURAR (Activar un estudiante que estaba de baja)
router.patch('/:id/activar', estudiantesController.restaurar);

export default router;
