// ============================================================
//  Gestión de Inscripciones — FCAD UNER
// ============================================================

const API_URL         = 'http://localhost:3000/inscripciones';
const API_ESTUDIANTES = 'http://localhost:3000/estudiantes';
const API_CURSOS      = 'http://localhost:3000/cursos';

// 1) Control de acceso
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// 2) Estado en memoria
let paginaActual   = 1;
let limiteActual   = 10;
let activoActual   = 1;   // 1 = vigentes | 0 = canceladas
let busquedaActual = '';
let debounceId     = null;

// 3) Referencias del DOM
let tablaBody, infoPaginacion, comboPaginacion, modalFormEl, modalDetalleEl;

document.addEventListener('DOMContentLoaded', () => {
  tablaBody       = document.getElementById('tablaInscripciones');
  infoPaginacion  = document.getElementById('infoPaginacion');
  comboPaginacion = document.getElementById('comboPaginacion');
  modalFormEl     = document.getElementById('modalInscripcion');
  modalDetalleEl  = document.getElementById('modalDetalle');

  try {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nav = document.getElementById('navUsuario');
    if (nav && (u.nombre || u.nombre_usuario)) {
      nav.textContent = u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : u.nombre_usuario;
    }
  } catch (_) {}

  cargarInscripciones();
});

// ============================================================
//  Helper fetch con JWT
// ============================================================
async function fetchAutenticado(url, opciones = {}) {
  const t = localStorage.getItem('token');
  opciones.headers = {
    ...opciones.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${t}`,
  };
  try {
    const resp = await fetch(url, opciones);
    if (resp.status === 401 || resp.status === 403) {
      alert('Tu sesión expiró. Iniciá sesión nuevamente.');
      logout();
      return null;
    }
    return resp;
  } catch (e) {
    console.error('Error de red:', e);
    alert('No se pudo conectar con el servidor. ¿Está corriendo node index.js?');
    return null;
  }
}

// ============================================================
//  BROWSE
// ============================================================
async function cargarInscripciones() {
  const params = new URLSearchParams({
    busqueda: busquedaActual,
    pagina:   paginaActual,
    limite:   limiteActual,
    activo:   activoActual,
  });

  const resp = await fetchAutenticado(`${API_URL}?${params.toString()}`);
  if (!resp) return;

  const data  = await resp.json();
  const lista = data.datos || [];

  renderizarTabla(lista);
  actualizarPaginacion({
    pagina:       data.pagina || 1,
    totalPaginas: data.totalPaginas || 1,
    total:        data.total ?? lista.length,
  });
}

function renderizarTabla(lista) {
  if (!tablaBody) return;
  tablaBody.innerHTML = '';

  if (!lista.length) {
    tablaBody.innerHTML =
      `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron inscripciones</td></tr>`;
    return;
  }

  lista.forEach(i => {
    const vigente = i.es_activo === 1 || i.es_activo === true;
    const btnOjo = `<button class="btn btn-sm btn-outline-info me-1" data-accion="detalle" data-id="${i.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>`;
    const btnDiploma = `<button class="btn btn-sm btn-outline-secondary me-1" data-accion="diploma" data-id="${i.id}" title="Descargar diploma"><i class="bi bi-award"></i></button>`;
    const acciones = vigente
      ? `${btnOjo}
         ${btnDiploma}
         <button class="btn btn-sm btn-outline-danger" data-accion="cancelar" data-id="${i.id}" title="Cancelar inscripción"><i class="bi bi-x-circle"></i></button>`
      : `${btnOjo}`;

    const tr = document.createElement('tr');
    if (!vigente) tr.classList.add('opacity-50');
    tr.innerHTML = `
      <td>${i.estudiante || ''} <span class="text-muted small">(${i.documento || ''})</span></td>
      <td>${i.curso || ''}</td>
      <td>${i.fecha_inscripcion || '—'}</td>
      <td><span class="badge ${vigente ? 'bg-success' : 'bg-danger'}">${i.estado || (vigente ? 'Confirmada' : 'Cancelada')}</span></td>
      <td class="text-end px-4">${acciones}</td>`;
    tablaBody.appendChild(tr);
  });
}

// Delegación de eventos
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-accion]');
  if (!btn || !tablaBody || !tablaBody.contains(btn)) return;
  const id = btn.dataset.id;
  if (btn.dataset.accion === 'detalle')  verDetalle(id);
  if (btn.dataset.accion === 'diploma')  descargarDiploma(id);
  if (btn.dataset.accion === 'cancelar') cancelarInscripcion(id);
});

// ============================================================
//  Paginación
// ============================================================
function actualizarPaginacion({ pagina, totalPaginas, total }) {
  paginaActual = pagina;

  if (infoPaginacion) {
    infoPaginacion.textContent = `Página ${pagina} de ${totalPaginas} — ${total} inscripción(es)`;
  }
  if (!comboPaginacion) return;

  comboPaginacion.innerHTML = '';

  const item = (label, page, { disabled = false, active = false } = {}) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`.trim();
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (disabled || active) return;
      paginaActual = page;
      cargarInscripciones();
    });
    li.appendChild(a);
    return li;
  };

  comboPaginacion.appendChild(item('«', pagina - 1, { disabled: pagina <= 1 }));

  for (let p = 1; p <= totalPaginas; p++) {
    if (totalPaginas > 7 && p !== 1 && p !== totalPaginas && Math.abs(p - pagina) > 2) {
      if (p === 2 || p === totalPaginas - 1) {
        comboPaginacion.appendChild(item('…', pagina, { disabled: true }));
      }
      continue;
    }
    comboPaginacion.appendChild(item(String(p), p, { active: p === pagina }));
  }

  comboPaginacion.appendChild(item('»', pagina + 1, { disabled: pagina >= totalPaginas }));
}

// ============================================================
//  Filtros
// ============================================================
function buscarInscripcion(e) {
  clearTimeout(debounceId);
  const valor = e.target.value;
  debounceId = setTimeout(() => {
    busquedaActual = valor.trim();
    paginaActual = 1;
    cargarInscripciones();
  }, 300);
}

function alternarInactivos(e) {
  activoActual = e.target.checked ? 0 : 1;
  paginaActual = 1;
  cargarInscripciones();
}

function cambiarLimite(e) {
  limiteActual = parseInt(e.target.value) || 10;
  paginaActual = 1;
  cargarInscripciones();
}

// ============================================================
//  Modal Nueva Inscripción
// ============================================================
function modalForm() {
  return bootstrap.Modal.getOrCreateInstance(modalFormEl);
}

async function abrirModalNueva() {
  document.getElementById('modalTitulo').textContent = 'Nueva Inscripción';
  await cargarSelects();
  modalForm().show();
}

async function cargarSelects() {
  const selE = document.getElementById('selEstudiante');
  const selC = document.getElementById('selCurso');
  selE.innerHTML = '<option value="">Seleccioná un estudiante...</option>';
  selC.innerHTML = '<option value="">Seleccioná un curso...</option>';

  // Estudiantes activos
  const respE = await fetchAutenticado(`${API_ESTUDIANTES}?activo=1&limite=1000`);
  if (respE) {
    const dataE = await respE.json();
    (dataE.datos || []).forEach(e => {
      const o = document.createElement('option');
      o.value = e.id;
      o.textContent = `${e.apellido}, ${e.nombres} (${e.documento})`;
      selE.appendChild(o);
    });
  }

  // Cursos en "INSCRIPCIÓN ABIERTA"
  const respC = await fetchAutenticado(`${API_CURSOS}?activo=1&limite=1000`);
  if (respC) {
    const dataC = await respC.json();
    const abiertos = (dataC.datos || []).filter(c => c.estado === 'INSCRIPCIÓN ABIERTA');
    if (!abiertos.length) {
      selC.innerHTML = '<option value="">No hay cursos con inscripción abierta</option>';
    } else {
      abiertos.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.nombre;
        selC.appendChild(o);
      });
    }
  }
}

async function guardarInscripcion() {
  const id_estudiante = document.getElementById('selEstudiante').value;
  const id_curso      = document.getElementById('selCurso').value;

  if (!id_estudiante || !id_curso) {
    alert('Elegí un estudiante y un curso.');
    return;
  }

  const resp = await fetchAutenticado(API_URL, {
    method: 'POST',
    body: JSON.stringify({ id_estudiante: parseInt(id_estudiante), id_curso: parseInt(id_curso) }),
  });
  if (!resp) return;

  const resultado = await resp.json();
  if (resp.ok) {
    modalForm().hide();
    cargarInscripciones();
  } else {
    const msg = resultado.errores
      ? resultado.errores.map(x => x.msg).join('\n')
      : (resultado.error || 'No se pudo registrar la inscripción.');
    alert('No se pudo inscribir:\n' + msg);
  }
}

function cerrarModalForm() {
  modalForm().hide();
}

function cerrarModalDetalle() {
  if (modalDetalleEl) bootstrap.Modal.getOrCreateInstance(modalDetalleEl).hide();
}

// Detalle (botón ojo)
async function verDetalle(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}`);
  if (!resp || !resp.ok) { alert('No se pudieron obtener los datos de la inscripción.'); return; }
  const i = await resp.json();

  const vigente = i.es_activo === 1 || i.es_activo === true;

  document.getElementById('detalleBody').innerHTML = `
    <dl class="row mb-0">
      <dt class="col-sm-4">Estudiante</dt> <dd class="col-sm-8">${i.estudiante ?? '—'}</dd>
      <dt class="col-sm-4">Documento</dt>  <dd class="col-sm-8">${i.documento ?? '—'}</dd>
      <dt class="col-sm-4">Curso</dt>      <dd class="col-sm-8">${i.curso ?? '—'}</dd>
      <dt class="col-sm-4">Fecha</dt>      <dd class="col-sm-8">${i.fecha_inscripcion ?? '—'}</dd>
      <dt class="col-sm-4">Estado</dt>     <dd class="col-sm-8"><span class="badge ${vigente ? 'bg-success' : 'bg-danger'}">${i.estado ?? (vigente ? 'Confirmada' : 'Cancelada')}</span></dd>
    </dl>`;

  bootstrap.Modal.getOrCreateInstance(modalDetalleEl).show();
}

// ============================================================
//  DIPLOMA (descarga del PDF)
// ============================================================
async function descargarDiploma(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}/diploma`);
  if (!resp) return;

  if (!resp.ok) {
    // El backend devuelve JSON cuando hay error (ej. inscripción cancelada)
    let msg = 'No se pudo generar el diploma.';
    try { const e = await resp.json(); msg = e.error || e.mensaje || msg; } catch (_) {}
    alert(msg);
    return;
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diploma_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============================================================
//  DELETE (cancelar)
// ============================================================
async function cancelarInscripcion(id) {
  if (!confirm('¿Cancelar esta inscripción?')) return;
  const resp = await fetchAutenticado(`${API_URL}/${id}`, { method: 'DELETE' });
  if (resp?.ok) cargarInscripciones();
}

// ============================================================
//  Sesión
// ============================================================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}
