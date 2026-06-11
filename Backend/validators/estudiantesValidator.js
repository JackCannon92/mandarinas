import { body, validationResult } from 'express-validator';

// Reglas de validación usando express-validator
export const validarDatosEstudiante = [
  body('documento')
    .notEmpty().withMessage('El documento es obligatorio')
    .isNumeric().withMessage('El documento debe ser numérico'),

  body('apellido')
    .notEmpty().withMessage('El apellido es obligatorio')
    .isString().withMessage('El apellido debe ser texto'),

  body('nombres')
    .notEmpty().withMessage('Los nombres son obligatorios')
    .isString().withMessage('Los nombres deben ser texto'),

  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato válido'),

  body('fecha_nacimiento')
    .optional({ nullable: true })
    .isDate().withMessage('La fecha de nacimiento no tiene un formato válido (YYYY-MM-DD)'),

  // Middleware final: si hay errores los devuelve, si no deja pasar
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];
