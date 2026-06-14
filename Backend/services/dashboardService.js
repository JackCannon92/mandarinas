import * as dashboardRepository from '../repositories/dashboardRepository.js';

const obtenerResumen = async () => {
  return await dashboardRepository.obtenerResumen();
};

export { obtenerResumen };
