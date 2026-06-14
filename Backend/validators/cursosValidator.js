import { body, validationResult } from 'express-validator';

export const validarDatosCurso = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isString().withMessage('El nombre debe ser texto'),

  body('descripcion')
    .optional({ nullable: true })
    .isString().withMessage('La descripción debe ser texto'),

  body('fecha_inicio')
    .optional({ nullable: true })
    .isDate().withMessage('La fecha de inicio no tiene un formato válido (YYYY-MM-DD)'),

  body('cantidad_horas')
    .notEmpty().withMessage('La cantidad de horas es obligatoria')
    .isInt({ min: 1 }).withMessage('La cantidad de horas debe ser un entero mayor a 0'),

  body('inscriptos_max')
    .notEmpty().withMessage('El cupo máximo es obligatorio')
    .isInt({ min: 1 }).withMessage('El cupo máximo debe ser un entero mayor a 0'),

  body('id_curso_estado')
    .optional({ nullable: true })
    .isInt().withMessage('El estado del curso debe ser un id numérico'),

  // Middleware final
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];
