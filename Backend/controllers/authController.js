import * as authService from '../services/authService.js';
import { validationResult } from 'express-validator';

const login = async (req, res) => {
  // Revisamos los errores de express-validator (validarLogin)
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const { nombre_usuario, contrasenia } = req.body;
    const resultado = await authService.login(nombre_usuario, contrasenia);
    res.json(resultado);
  } catch (error) {
    console.error('Error en LOGIN:', error.message);
    res.status(401).json({ error: error.message });
  }
};

export { login };
