const transformarInscripcion = (i) => {
  return {
    id:            i.id_inscripcion,
    id_estudiante: i.id_estudiante,
    id_curso:      i.id_curso,
    estudiante:    [i.apellido, i.nombres].filter(Boolean).join(', '),
    documento:     i.documento,
    curso:         i.curso_nombre,
    fecha_inscripcion: i.fecha_hora_inscripcion
      ? new Date(i.fecha_hora_inscripcion).toLocaleString('es-AR')
      : null,
    estado:        i.estado_descripcion,
    es_activo:     i.es_activo,
  };
};

const transformarListaInscripciones = (inscripciones) => {
  return inscripciones.map(transformarInscripcion);
};

export { transformarInscripcion, transformarListaInscripciones };
