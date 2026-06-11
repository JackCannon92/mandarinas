import { Router }              from 'express';
import * as estudiantesController from '../controllers/estudiantesController.js';
import { validarDatosEstudiante } from '../validators/estudiantesValidator.js';
// 1. Esto ya lo tenías comentado y está perfecto:
// import { verificarToken }         from '../middlewares/authMiddleware.js';

const router = Router();

// 2. COMENTÁ ESTA LÍNEA (Ponela igual que acá abajo, con las dos barras '//'):
// router.use(verificarToken);

router.get('/',                 estudiantesController.obtenerTodos);
router.get('/:id',              estudiantesController.obtenerPorId);
router.post('/',   validarDatosEstudiante, estudiantesController.crear);
router.put('/:id', validarDatosEstudiante, estudiantesController.actualizar);
router.delete('/:id',           estudiantesController.eliminar);
router.patch('/:id/activar',    estudiantesController.restaurar);

export default router;