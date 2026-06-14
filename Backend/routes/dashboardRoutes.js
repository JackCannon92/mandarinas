import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔒 Protegido con JWT
router.use(verificarToken);

// GET /dashboard  -> totales + cursos activos
router.get('/', dashboardController.obtenerResumen);

export default router;
