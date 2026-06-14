// ============================================================
//  Gestión de Estudiantes — FCAD UNER
//  Reescrito para coincidir con los IDs y handlers de index.html
// ============================================================

const API_URL = 'http://localhost:3000/estudiantes';

// 1) Control de acceso
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// 2) Estado en memoria
let paginaActual   = 1;
let limiteActual   = 10;
let activoActual   = 1;   // 1 = activos | 0 = dados de baja
let busquedaActual = '';
let debounceId     = null;

// 3) Referencias del DOM (se completan al cargar)
let tablaBody, infoPaginacion, comboPaginacion, modalFormEl, modalDetalleEl;

document.addEventListener('DOMContentLoaded', () => {
  tablaBody       = document.getElementById('tablaEstudiantes');
  infoPaginacion  = document.getElementById('infoPaginacion');
  comboPaginacion = document.getElementById('comboPaginacion');
  modalFormEl     = document.getElementById('modalEstudiante');
  modalDetalleEl  = document.getElementById('modalDetalle');

  // Nombre del usuario en la barra superior
  try {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nav = document.getElementById('navUsuario');
    if (nav && (u.nombre || u.nombre_usuario)) {
      nav.textContent = u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : u.nombre_usuario;
    }
  } catch (_) {}

  cargarEstudiantes();
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
//  BROWSE — listar con búsqueda, paginación y filtro activo/baja
// ============================================================
async function cargarEstudiantes() {
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
      `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron estudiantes</td></tr>`;
    return;
  }

  lista.forEach(est => {
    const activo = est.estado === 'Activo';
    const btnOjo = `<button class="btn btn-sm btn-outline-info me-1" data-accion="detalle" data-id="${est.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>`;
    const acciones = activo
      ? `${btnOjo}
         <button class="btn btn-sm btn-outline-primary me-1" data-accion="editar"   data-id="${est.id}" title="Editar"><i class="bi bi-pencil"></i></button>
         <button class="btn btn-sm btn-outline-danger"        data-accion="eliminar" data-id="${est.id}" title="Dar de baja"><i class="bi bi-trash"></i></button>`
      : `${btnOjo}
         <button class="btn btn-sm btn-outline-success" data-accion="restaurar" data-id="${est.id}" title="Reactivar"><i class="bi bi-arrow-counterclockwise me-1"></i>Reactivar</button>`;

    const tr = document.createElement('tr');
    if (!activo) tr.classList.add('opacity-50');
    tr.innerHTML = `
      <td>${est.documento || ''}</td>
      <td>${est.apellido || ''}, ${est.nombres || ''}</td>
      <td>${est.email || ''}</td>
      <td><span class="badge ${activo ? 'bg-success' : 'bg-danger'}">${est.estado}</span></td>
      <td class="text-end px-4">${acciones}</td>`;
    tablaBody.appendChild(tr);
  });
}

// Delegación de eventos para los botones de cada fila
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-accion]');
  if (!btn || !tablaBody || !tablaBody.contains(btn)) return;
  const id = btn.dataset.id;
  if (btn.dataset.accion === 'detalle')   verDetalle(id);
  if (btn.dataset.accion === 'editar')    abrirEditar(id);
  if (btn.dataset.accion === 'eliminar')  eliminarEstudiante(id);
  if (btn.dataset.accion === 'restaurar') restaurarEstudiante(id);
});

// ============================================================
//  Paginación
// ============================================================
function actualizarPaginacion({ pagina, totalPaginas, total }) {
  paginaActual = pagina;

  if (infoPaginacion) {
    infoPaginacion.textContent = `Página ${pagina} de ${totalPaginas} — ${total} estudiante(s)`;
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
      cargarEstudiantes();
    });
    li.appendChild(a);
    return li;
  };

  comboPaginacion.appendChild(item('«', pagina - 1, { disabled: pagina <= 1 }));

  for (let p = 1; p <= totalPaginas; p++) {
    // Ventana de páginas para no llenar la pantalla cuando hay muchas
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
//  Filtros (búsqueda, baja, límite) — llamados desde el HTML
// ============================================================
function buscarEstudiante(e) {
  clearTimeout(debounceId);
  const valor = e.target.value;
  debounceId = setTimeout(() => {
    busquedaActual = valor.trim();
    paginaActual = 1;
    cargarEstudiantes();
  }, 300);
}

function alternarInactivos(e) {
  activoActual = e.target.checked ? 0 : 1;
  paginaActual = 1;
  cargarEstudiantes();
}

function cambiarLimite(e) {
  limiteActual = parseInt(e.target.value) || 10;
  paginaActual = 1;
  cargarEstudiantes();
}

// ============================================================
//  Modal alta / edición
// ============================================================
function modalForm() {
  return bootstrap.Modal.getOrCreateInstance(modalFormEl);
}

function abrirModalNuevo() {
  document.getElementById('estudianteId').value    = '';
  document.getElementById('documento').value        = '';
  document.getElementById('apellido').value          = '';
  document.getElementById('nombres').value           = '';
  document.getElementById('email').value             = '';
  document.getElementById('fechaNacimiento').value   = '';
  document.getElementById('modalTitulo').textContent = 'Nuevo Estudiante';
  modalForm().show();
}

async function abrirEditar(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}`);
  if (!resp || !resp.ok) { alert('No se pudo obtener el estudiante.'); return; }
  const est = await resp.json();

  document.getElementById('estudianteId').value = est.id_estudiante ?? est.id ?? '';
  document.getElementById('documento').value     = est.documento ?? '';
  document.getElementById('apellido').value       = est.apellido ?? '';
  document.getElementById('nombres').value        = est.nombres ?? '';
  document.getElementById('email').value          = est.email ?? '';

  // Normalizar fecha a YYYY-MM-DD para el <input type="date">
  let fecha = est.fecha_nacimiento ?? '';
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) {
      fecha = fecha.slice(0, 10);
    } else if (fecha.includes('/')) {            // por si viene en formato es-AR (dd/mm/aaaa)
      const [d, m, a] = fecha.split('/');
      if (a) fecha = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  document.getElementById('fechaNacimiento').value = fecha;

  document.getElementById('modalTitulo').textContent = 'Editar Estudiante';
  modalForm().show();
}

async function guardarEstudiante() {
  const id    = document.getElementById('estudianteId').value;
  const fecha = document.getElementById('fechaNacimiento').value;

  const datos = {
    documento:        document.getElementById('documento').value.trim(),
    apellido:         document.getElementById('apellido').value.trim(),
    nombres:          document.getElementById('nombres').value.trim(),
    email:            document.getElementById('email').value.trim(),
    fecha_nacimiento: fecha || null,
  };

  const esEditar = id !== '';
  const url      = esEditar ? `${API_URL}/${id}` : API_URL;
  const metodo   = esEditar ? 'PUT' : 'POST';

  const resp = await fetchAutenticado(url, { method: metodo, body: JSON.stringify(datos) });
  if (!resp) return;

  const resultado = await resp.json();
  if (resp.ok) {
    modalForm().hide();
    cargarEstudiantes();
  } else {
    // El validador del backend devuelve { errores: [...] }
    const msg = resultado.errores
      ? resultado.errores.map(x => x.msg).join('\n')
      : (resultado.error || 'Revisá los campos obligatorios.');
    alert('Error al guardar:\n' + msg);
  }
}

function cerrarModalForm() {
  modalForm().hide();
}

function cerrarModalDetalle() {
  if (modalDetalleEl) bootstrap.Modal.getOrCreateInstance(modalDetalleEl).hide();
}

// Muestra los datos completos del estudiante en el modal de detalle (botón ojo)
async function verDetalle(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}`);
  if (!resp || !resp.ok) { alert('No se pudieron obtener los datos del estudiante.'); return; }
  const est = await resp.json();

  // Fecha YYYY-MM-DD -> DD/MM/AAAA sin problemas de zona horaria
  let fechaFmt = '—';
  const f = est.fecha_nacimiento ?? '';
  if (typeof f === 'string' && f.length >= 10) {
    const [a, m, d] = f.slice(0, 10).split('-');
    if (a && m && d) fechaFmt = `${d}/${m}/${a}`;
  }

  const esActivo = (est.activo ?? 1) === 1;

  document.getElementById('detalleBody').innerHTML = `
    <dl class="row mb-0">
      <dt class="col-sm-4">Documento</dt>  <dd class="col-sm-8">${est.documento ?? '—'}</dd>
      <dt class="col-sm-4">Apellido</dt>   <dd class="col-sm-8">${est.apellido ?? '—'}</dd>
      <dt class="col-sm-4">Nombres</dt>    <dd class="col-sm-8">${est.nombres ?? '—'}</dd>
      <dt class="col-sm-4">Email</dt>      <dd class="col-sm-8">${est.email ?? '—'}</dd>
      <dt class="col-sm-4">Nacimiento</dt> <dd class="col-sm-8">${fechaFmt}</dd>
      <dt class="col-sm-4">Estado</dt>     <dd class="col-sm-8"><span class="badge ${esActivo ? 'bg-success' : 'bg-danger'}">${esActivo ? 'Activo' : 'Inactivo'}</span></dd>
    </dl>`;

  bootstrap.Modal.getOrCreateInstance(modalDetalleEl).show();
}

// ============================================================
//  DELETE (baja lógica) / RESTAURAR
// ============================================================
async function eliminarEstudiante(id) {
  if (!confirm('¿Dar de baja a este estudiante?')) return;
  const resp = await fetchAutenticado(`${API_URL}/${id}`, { method: 'DELETE' });
  if (resp?.ok) cargarEstudiantes();
}

async function restaurarEstudiante(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}/activar`, { method: 'PATCH' });
  if (resp?.ok) cargarEstudiantes();
}

// ============================================================
//  Sesión
// ============================================================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}