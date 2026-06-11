import * as estudiantesRepository from '../repositories/estudiantesRepository.js';

// 1. BROWSE — recibe y pasa los parámetros de búsqueda y paginación al repository
const obtenerTodos = async (params) => {
  return await estudiantesRepository.obtenerTodos(params);
};

// 2. READ
const obtenerPorId = async (id) => {
  const estudiante = await estudiantesRepository.obtenerPorId(id);
  if (!estudiante) {
    throw new Error('Estudiante no encontrado');
  }
  return estudiante;
};

// 3. ADD
const crear = async (datos) => {
  return await estudiantesRepository.crear(datos);
};

// 4. EDIT
const actualizar = async (id, datos) => {
  const estudiante = await estudiantesRepository.obtenerPorId(id);
  if (!estudiante) {
    throw new Error('Estudiante no encontrado');
  }
  return await estudiantesRepository.actualizar(id, datos);
};

// 5. DELETE
const eliminar = async (id) => {
  const estudiante = await estudiantesRepository.obtenerPorId(id);
  if (!estudiante) {
    throw new Error('Estudiante no encontrado');
  }
  return await estudiantesRepository.eliminar(id);
};

// RESTAURAR
const restaurar = async (id) => {
  return await estudiantesRepository.restaurar(id);
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar };
