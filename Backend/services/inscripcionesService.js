import * as inscripcionesRepository from '../repositories/inscripcionesRepository.js';
import * as cursosRepository       from '../repositories/cursosRepository.js';
import * as estudiantesRepository  from '../repositories/estudiantesRepository.js';

// Estado de curso que habilita inscripciones (id 2 = INSCRIPCIÓN ABIERTA)
const ID_CURSO_INSCRIPCION_ABIERTA = 2;

// Helper para errores de regla de negocio (responden 400, no 500)
const errorNegocio = (mensaje) => {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
};

const obtenerTodos = async (params) => {
  return await inscripcionesRepository.obtenerTodos(params);
};

const obtenerPorId = async (id) => {
  const insc = await inscripcionesRepository.obtenerPorId(id);
  if (!insc) throw new Error('Inscripción no encontrada');
  return insc;
};

const crear = async ({ id_estudiante, id_curso }) => {
  // 1. El curso debe existir y estar habilitado para inscribir
  const curso = await cursosRepository.obtenerPorId(id_curso);
  if (!curso) {
    throw errorNegocio('El curso indicado no existe');
  }
  if (curso.id_curso_estado !== ID_CURSO_INSCRIPCION_ABIERTA) {
    throw errorNegocio('El curso no está habilitado para inscripciones (debe estar en "INSCRIPCIÓN ABIERTA")');
  }

  // 2. El estudiante debe existir y estar activo
  const estudiante = await estudiantesRepository.obtenerPorId(id_estudiante);
  if (!estudiante || estudiante.activo !== 1) {
    throw errorNegocio('El estudiante indicado no existe o está dado de baja');
  }

  // 3. No permitir inscripción duplicada (vigente) del mismo estudiante en el mismo curso
  const yaInscripto = await inscripcionesRepository.existeInscripcionActiva(id_estudiante, id_curso);
  if (yaInscripto) {
    throw errorNegocio('El estudiante ya está inscripto en este curso');
  }

  // 4. No superar el cupo máximo del curso
  const inscriptos = await inscripcionesRepository.contarActivasPorCurso(id_curso);
  if (inscriptos >= curso.inscriptos_max) {
    throw errorNegocio('El curso alcanzó su cupo máximo de inscriptos');
  }

  return await inscripcionesRepository.crear({ id_estudiante, id_curso });
};

const eliminar = async (id) => {
  const insc = await inscripcionesRepository.obtenerPorId(id);
  if (!insc) throw new Error('Inscripción no encontrada');
  return await inscripcionesRepository.eliminar(id);
};

export { obtenerTodos, obtenerPorId, crear, eliminar };
