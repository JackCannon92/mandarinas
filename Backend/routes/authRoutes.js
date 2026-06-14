import express from 'express';
import * as authController from '../controllers/authController.js';
import { validarLogin } from '../validators/authValidator.js';

const router = express.Router();

// POST /auth/login
router.post('/login', validarLogin, authController.login);

export default router;
