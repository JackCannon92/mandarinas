import * as cursosRepository from '../repositories/cursosRepository.js';

// BROWSE
const obtenerTodos = async (params) => {
  return await cursosRepository.obtenerTodos(params);
};

// READ
const obtenerPorId = async (id) => {
  const curso = await cursosRepository.obtenerPorId(id);
  if (!curso) {
    throw new Error('Curso no encontrado');
  }
  return curso;
};

// ADD
const crear = async (datos) => {
  return await cursosRepository.crear(datos);
};

// EDIT
const actualizar = async (id, datos) => {
  const curso = await cursosRepository.obtenerPorId(id);
  if (!curso) {
    throw new Error('Curso no encontrado');
  }
  return await cursosRepository.actualizar(id, datos);
};

// DELETE
const eliminar = async (id) => {
  const curso = await cursosRepository.obtenerPorId(id);
  if (!curso) {
    throw new Error('Curso no encontrado');
  }
  return await cursosRepository.eliminar(id);
};

// RESTAURAR
const restaurar = async (id) => {
  return await cursosRepository.restaurar(id);
};

export { obtenerTodos, obtenerPorId, crear, actualizar, eliminar, restaurar };
