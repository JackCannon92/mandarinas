import express from 'express';
import * as cursosController from '../controllers/cursosController.js';
import { validarDatosCurso } from '../validators/cursosValidator.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔒 Proteger todas las rutas de cursos con JWT
router.use(verificarToken);

// 1. BROWSE (Listar con paginación, búsqueda y filtro activo/baja)
router.get('/', cursosController.obtenerTodos);

// 2. READ (Ver detalle de un curso)
router.get('/:id', cursosController.obtenerPorId);

// 3. ADD (Crear un nuevo curso)
router.post('/', validarDatosCurso, cursosController.crear);

// 4. EDIT (Actualizar un curso existente)
router.put('/:id', validarDatosCurso, cursosController.actualizar);

// 5. DELETE (Baja lógica)
router.delete('/:id', cursosController.eliminar);

// 6. RESTAURAR
router.patch('/:id/activar', cursosController.restaurar);

export default router;
