const transformarCurso = (curso) => {
  return {
    id:             curso.id_curso,
    nombre:         curso.nombre,
    descripcion:    curso.descripcion,
    fecha_inicio:   curso.fecha_inicio
      ? new Date(curso.fecha_inicio).toLocaleDateString('es-AR')
      : null,
    cantidad_horas: curso.cantidad_horas,
    inscriptos_max: curso.inscriptos_max,
    id_curso_estado: curso.id_curso_estado,
    estado:         curso.estado_descripcion ?? null,
    es_activo:      curso.es_activo,
  };
};

const transformarListaCursos = (cursos) => {
  return cursos.map(transformarCurso);
};

export { transformarCurso, transformarListaCursos };
