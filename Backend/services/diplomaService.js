import * as inscripcionesRepository from '../repositories/inscripcionesRepository.js';
import * as cursosRepository       from '../repositories/cursosRepository.js';

const errorNegocio = (mensaje) => {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
};

// Reúne todos los datos necesarios para emitir el diploma de una inscripción
const obtenerDatosDiploma = async (idInscripcion) => {
  const insc = await inscripcionesRepository.obtenerPorId(idInscripcion);
  if (!insc) {
    throw new Error('Inscripción no encontrada');
  }
  // Solo se emite diploma de inscripciones vigentes (no canceladas)
  if (insc.es_activo !== 1) {
    throw errorNegocio('No se puede emitir un diploma de una inscripción cancelada');
  }

  const curso = await cursosRepository.obtenerPorId(insc.id_curso);

  return {
    estudiante:     [insc.apellido, insc.nombres].filter(Boolean).join(', '),
    documento:      insc.documento,
    curso:          insc.curso_nombre,
    cantidad_horas: curso ? curso.cantidad_horas : null,
    fecha_inicio:   curso && curso.fecha_inicio
      ? new Date(curso.fecha_inicio).toLocaleDateString('es-AR')
      : null,
    fecha_emision:  new Date().toLocaleDateString('es-AR'),
  };
};

export { obtenerDatosDiploma };
