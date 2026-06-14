import { body } from 'express-validator';

// Reglas de validación del login usando express-validator
export const validarLogin = [
  body('nombre_usuario')
    .trim()
    .notEmpty().withMessage('El usuario es obligatorio'),

  body('contrasenia')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];
