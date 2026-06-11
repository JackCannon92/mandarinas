// PARCHE TEMPORAL DE LOGIN
const getHeaders = () => { return { 'Content-Type': 'application/json' }; };
const handleAuth = (response) => { return false; };
const logout = () => { Swal.fire('Info', 'Simulación de salida', 'info'); };

const API_URL = 'http://localhost:3000/estudiantes';

// Estado global de la pantalla
let estado = { pagina: 1, limite: 10, busqueda: '', totalPaginas: 1, verInactivos: false };

// Control manual de modales para asegurar estabilidad
let bsModalForm = null;
let bsModalDetalle = null;

document.addEventListener("DOMContentLoaded", () => {
  bsModalForm = new bootstrap.Modal(document.getElementById('modalEstudiante'));
  bsModalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
  cargarEstudiantes();
});

/* ── OBTENER ESTUDIANTES (BROWSE) ────────────────────────────────────────── */
const cargarEstudiantes = async () => {
  document.getElementById('tablaEstudiantes').innerHTML = `
    <tr><td colspan="5" class="text-center py-5">
      <div class="spinner-border text-secondary" role="status"></div>
    </td></tr>`;
    
  try {
    const params = new URLSearchParams({ 
      busqueda: estado.busqueda, 
      pagina: estado.pagina, 
      limite: estado.limite 
    });
    
    const r = await fetch(`${API_URL}?${params}`, { headers: getHeaders() });
    if (!r.ok) throw new Error();
    const json = await r.json();
    
    estado.totalPaginas = json.totalPaginas;
    
    // Filtrar localmente si se muestran activos o inactivos según el Checkbox
    let datosFiltrados = json.datos;
    if (!estado.verInactivos) {
      datosFiltrados = json.datos.filter(est => est.estado === 'Activo');
    } else {
      datosFiltrados = json.datos.filter(est => est.estado === 'Inactivo');
    }
    
    renderizarTabla(datosFiltrados);
    actualizarPaginacion(json.pagina, json.totalPaginas);
  } catch (error) {
    Swal.fire('Error', 'No se pudo conectar con el backend o la BD.', 'error');
  }
};

/* ── RENDERIZAR LA TABLA ─────────────────────────────────────────────────── */
const renderizarTabla = (estudiantes) => {
  const tbody = document.getElementById('tablaEstudiantes');
  if (estudiantes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron estudiantes para este filtro.</td></tr>`;
    return;
  }

  tbody.innerHTML = estudiantes.map(est => {
    const esActivo = est.estado === 'Activo';
    const badge = esActivo 
      ? '<span class="badge bg-success">Activo</span>' 
      : '<span class="badge bg-danger">Inactivo</span>';

    const botonAccion = esActivo
      ? `<button class="btn btn-sm btn-outline-danger me-1" onclick="darDeBaja(${est.id})" title="Dar de baja"><i class="bi bi-trash"></i></button>`
      : `<button class="btn btn-sm btn-outline-success me-1" onclick="restaurar(${est.id})" title="Restaurar"><i class="bi bi-arrow-counterclockwise"></i></button>`;

    return `
      <tr>
        <td><strong>${est.documento}</strong></td>
        <td>${est.apellido}, ${est.nombres}</td>
        <td>${est.email}</td>
        <td>${badge}</td>
        <td class="text-end px-4">
          <button class="btn btn-sm btn-outline-info me-1" onclick="verDetalle(${est.id})"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-dark me-1" onclick="abrirModalEditar(${JSON.stringify(est).replace(/"/g, '&quot;')})"><i class="bi bi-pencil"></i></button>
          ${botonAccion}
        </td>
      </tr>
    `;
  }).join('');
};

/* ── PAGINACIÓN Y FILTROS ────────────────────────────────────────────────── */
const actualizarPaginacion = (actual, total) => {
  document.getElementById('infoPaginacion').textContent = `Página ${actual} de ${total}`;
  const combo = document.getElementById('comboPaginacion');
  combo.innerHTML = '';

  // Botón Anterior
  combo.innerHTML += `<li class="page-item ${actual === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="cambiarPagina(${actual - 1})">Anterior</a>
  </li>`;

  // Números
  for (let i = 1; i <= total; i++) {
    combo.innerHTML += `<li class="page-item ${actual === i ? 'active' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
    </li>`;
  }

  // Botón Siguiente
  combo.innerHTML += `<li class="page-item ${actual === total ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="cambiarPagina(${actual + 1})">Siguiente</a>
  </li>`;
};

const cambiarPagina = (n) => {
  if (n < 1 || n > estado.totalPaginas) return;
  estado.pagina = n;
  cargarEstudiantes();
};

const buscarEstudiante = (e) => {
  estado.busqueda = e.target.value;
  estado.pagina = 1;
  cargarEstudiantes();
};

const cambiarLimite = (e) => {
  estado.limite = parseInt(e.target.value);
  estado.pagina = 1;
  cargarEstudiantes();
};

// Control de vista Activos/Inactivos
const alternarInactivos = (e) => {
  estado.verInactivos = e.target.checked;
  estado.pagina = 1;
  cargarEstudiantes();
};

/* ── MODALES: DETALLE Y FORMULARIO ───────────────────────────────────────── */
const verDetalle = async (id) => {
  try {
    const r = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
    if (!r.ok) throw new Error();
    const est = await r.json();
    
    document.getElementById('detalleBody').innerHTML = `
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><strong>ID:</strong> ${est.id_estudiante}</li>
        <li class="list-group-item"><strong>Documento:</strong> ${est.documento}</li>
        <li class="list-group-item"><strong>Nombre Completo:</strong> ${est.apellido}, ${est.nombres}</li>
        <li class="list-group-item"><strong>Email:</strong> ${est.email}</li>
        <li class="list-group-item"><strong>Fecha Nacimiento:</strong> ${est.fecha_nacimiento ? est.fecha_nacimiento.split('T')[0] : '—'}</li>
        <li class="list-group-item"><strong>Estado:</strong> ${est.activo === 1 ? 'Activo' : 'Inactivo'}</li>
      </ul>`;
    bsModalDetalle.show();
  } catch (error) {
    Swal.fire('Error', 'No se pudo traer el detalle del estudiante.', 'error');
  }
};

const abrirModalNuevo = () => {
  document.getElementById('modalTitulo').textContent = 'Nuevo Estudiante';
  document.getElementById('estudianteId').value = '';
  document.getElementById('documento').value = '';
  document.getElementById('apellido').value = '';
  document.getElementById('nombres').value = '';
  document.getElementById('email').value = '';
  document.getElementById('fechaNacimiento').value = '';
  bsModalForm.show();
};

const abrirModalEditar = (est) => {
  document.getElementById('modalTitulo').textContent = 'Editar Estudiante';
  document.getElementById('estudianteId').value = est.id;
  document.getElementById('documento').value = est.documento;
  document.getElementById('apellido').value = est.apellido;
  document.getElementById('nombres').value = est.nombres;
  document.getElementById('email').value = est.email;
  
  // Ajustar formato fecha para el input date
  if (est.fecha_nacimiento) {
    const partes = est.fecha_nacimiento.split('/');
    if (partes.length === 3) {
      document.getElementById('fechaNacimiento').value = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
  }
  bsModalForm.show();
};

const cerrarModalForm = () => bsModalForm.hide();
const cerrarModalDetalle = () => bsModalDetalle.hide();

/* ── PROCESAR GUARDAR / ACTUALIZAR ──────────────────────────────────────── */
const guardarEstudiante = async () => {
  const id = document.getElementById('estudianteId').value;
  const datos = {
    documento: document.getElementById('documento').value,
    apellido: document.getElementById('apellido').value,
    nombres: document.getElementById('nombres').value,
    email: document.getElementById('email').value,
    fecha_nacimiento: document.getElementById('fechaNacimiento').value || null
  };

  const metodo = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/${id}` : API_URL;

  try {
    const r = await fetch(url, {
      method: metodo,
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    const resJson = await r.json();

    if (!r.ok) {
      let msg = 'Revisá los datos ingresados.';
      if (resJson.errores) msg = resJson.errores.map(e => e.msg).join('<br>');
      Swal.fire('Error de Validación', msg, 'warning');
      return;
    }

    bsModalForm.hide();
    Swal.fire('Guardado', 'El estudiante se guardó con éxito.', 'success');
    cargarEstudiantes();
  } catch (error) {
    Swal.fire('Error', 'No se pudo guardar el estudiante.', 'error');
  }
};

/* ── BAJA LOGICA / RESTAURAR ────────────────────────────────────────────── */
const darDeBaja = (id) => {
  Swal.fire({
    title: '¿Dar de baja?',
    text: 'Pasará a la lista de alumnos inactivos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Sí, dar de baja',
    cancelButtonText: 'Cancelar'
  }).then(async res => {
    if (!res.isConfirmed) return;
    const r = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (r.ok) {
      Swal.fire('Eliminado', 'Estudiante dado de baja.', 'success');
      cargarEstudiantes();
    }
  });
};

const restaurar = (id) => {
  Swal.fire({
    title: '¿Restaurar estudiante?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    confirmButtonText: 'Sí, reactivar',
    cancelButtonText: 'Cancelar'
  }).then(async res => {
    if (!res.isConfirmed) return;
    const r = await fetch(`${API_URL}/${id}/activar`, { method: 'PATCH', headers: getHeaders() });
    if (r.ok) {
      Swal.fire('Reactivado', 'El alumno volvió a estar activo.', 'success');
      cargarEstudiantes();
    }
  });
};