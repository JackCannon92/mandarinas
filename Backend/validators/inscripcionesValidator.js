import { body, validationResult } from 'express-validator';

export const validarDatosInscripcion = [
  body('id_estudiante')
    .notEmpty().withMessage('El estudiante es obligatorio')
    .isInt().withMessage('El id de estudiante debe ser numérico'),

  body('id_curso')
    .notEmpty().withMessage('El curso es obligatorio')
    .isInt().withMessage('El id de curso debe ser numérico'),

  // Middleware final
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];
