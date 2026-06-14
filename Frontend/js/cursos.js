// ============================================================
//  Gestión de Cursos — FCAD UNER
// ============================================================

const API_URL = 'http://localhost:3000/cursos';

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
let estadosCurso   = [];   // cache de cursos_estados para el combo

// IDs de estado para los botones rápidos (según tu tabla cursos_estados)
const ID_ESTADO_ABIERTA = 2; // INSCRIPCIÓN ABIERTA
const ID_ESTADO_CERRADA = 3; // INSCRIPCIÓN CERRADA

// 3) Referencias del DOM (se completan al cargar)
let tablaBody, infoPaginacion, comboPaginacion, modalFormEl, modalDetalleEl;

document.addEventListener('DOMContentLoaded', () => {
  tablaBody       = document.getElementById('tablaCursos');
  infoPaginacion  = document.getElementById('infoPaginacion');
  comboPaginacion = document.getElementById('comboPaginacion');
  modalFormEl     = document.getElementById('modalCurso');
  modalDetalleEl  = document.getElementById('modalDetalle');

  // Nombre del usuario en la barra superior
  try {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nav = document.getElementById('navUsuario');
    if (nav && (u.nombre || u.nombre_usuario)) {
      nav.textContent = u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : u.nombre_usuario;
    }
  } catch (_) {}

  cargarCursos();
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
async function cargarCursos() {
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
      `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron cursos</td></tr>`;
    return;
  }

  lista.forEach(c => {
    const activo = c.es_activo === 1 || c.es_activo === true;
    const btnOjo = `<button class="btn btn-sm btn-outline-info me-1" data-accion="detalle" data-id="${c.id}" title="Ver detalle"><i class="bi bi-eye"></i></button>`;
    const esAbierta = c.id_curso_estado === ID_ESTADO_ABIERTA;
    const btnEstado = esAbierta
      ? `<button class="btn btn-sm btn-outline-warning me-1" data-accion="cerrar" data-id="${c.id}" title="Cerrar inscripción"><i class="bi bi-lock"></i></button>`
      : `<button class="btn btn-sm btn-outline-success me-1" data-accion="abrir"  data-id="${c.id}" title="Abrir inscripción"><i class="bi bi-unlock"></i></button>`;
    const acciones = activo
      ? `${btnOjo}
         ${btnEstado}
         <button class="btn btn-sm btn-outline-primary me-1" data-accion="editar"   data-id="${c.id}" title="Editar"><i class="bi bi-pencil"></i></button>
         <button class="btn btn-sm btn-outline-danger"        data-accion="eliminar" data-id="${c.id}" title="Dar de baja"><i class="bi bi-trash"></i></button>`
      : `${btnOjo}
         <button class="btn btn-sm btn-outline-success" data-accion="restaurar" data-id="${c.id}" title="Reactivar"><i class="bi bi-arrow-counterclockwise me-1"></i>Reactivar</button>`;

    const tr = document.createElement('tr');
    if (!activo) tr.classList.add('opacity-50');
    tr.innerHTML = `
      <td>${c.nombre || ''}</td>
      <td>${c.fecha_inicio || '—'}</td>
      <td class="text-center">${c.cantidad_horas ?? '—'}</td>
      <td class="text-center">${c.inscriptos_max ?? '—'}</td>
      <td><span class="badge ${activo ? 'bg-success' : 'bg-danger'}">${c.estado || (activo ? 'Activo' : 'Inactivo')}</span></td>
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
  if (btn.dataset.accion === 'eliminar')  eliminarCurso(id);
  if (btn.dataset.accion === 'restaurar') restaurarCurso(id);
  if (btn.dataset.accion === 'abrir')     cambiarEstadoCurso(id, ID_ESTADO_ABIERTA);
  if (btn.dataset.accion === 'cerrar')    cambiarEstadoCurso(id, ID_ESTADO_CERRADA);
});

// ============================================================
//  Paginación
// ============================================================
function actualizarPaginacion({ pagina, totalPaginas, total }) {
  paginaActual = pagina;

  if (infoPaginacion) {
    infoPaginacion.textContent = `Página ${pagina} de ${totalPaginas} — ${total} curso(s)`;
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
      cargarCursos();
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
//  Filtros (búsqueda, baja, límite) — llamados desde el HTML
// ============================================================
function buscarCurso(e) {
  clearTimeout(debounceId);
  const valor = e.target.value;
  debounceId = setTimeout(() => {
    busquedaActual = valor.trim();
    paginaActual = 1;
    cargarCursos();
  }, 300);
}

function alternarInactivos(e) {
  activoActual = e.target.checked ? 0 : 1;
  paginaActual = 1;
  cargarCursos();
}

function cambiarLimite(e) {
  limiteActual = parseInt(e.target.value) || 10;
  paginaActual = 1;
  cargarCursos();
}

// Estados de curso para el combo (se cachea la primera vez)
async function cargarEstadosCurso() {
  if (estadosCurso.length) return estadosCurso;
  const resp = await fetchAutenticado(`${API_URL}/estados`);
  if (resp && resp.ok) estadosCurso = await resp.json();
  return estadosCurso;
}

function llenarComboEstado(seleccionado) {
  const sel = document.getElementById('estado');
  sel.innerHTML = '';
  estadosCurso.forEach(e => {
    const o = document.createElement('option');
    o.value = e.id_curso_estado;
    o.textContent = e.descripcion;
    if (seleccionado != null && Number(seleccionado) === e.id_curso_estado) o.selected = true;
    sel.appendChild(o);
  });
}

// Botones rápidos Abrir / Cerrar inscripción
async function cambiarEstadoCurso(id, idEstado) {
  const resp = await fetchAutenticado(`${API_URL}/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ id_curso_estado: idEstado }),
  });
  if (resp?.ok) cargarCursos();
}

// ============================================================
//  Modal alta / edición
// ============================================================
function modalForm() {
  return bootstrap.Modal.getOrCreateInstance(modalFormEl);
}

async function abrirModalNuevo() {
  document.getElementById('cursoId').value          = '';
  document.getElementById('nombre').value            = '';
  document.getElementById('descripcion').value       = '';
  document.getElementById('fechaInicio').value       = '';
  document.getElementById('cantidadHoras').value     = '';
  document.getElementById('inscriptosMax').value     = '';
  await cargarEstadosCurso();
  llenarComboEstado(null);
  document.getElementById('modalTitulo').textContent = 'Nuevo Curso';
  modalForm().show();
}

async function abrirEditar(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}`);
  if (!resp || !resp.ok) { alert('No se pudo obtener el curso.'); return; }
  const c = await resp.json();

  document.getElementById('cursoId').value       = c.id_curso ?? c.id ?? '';
  document.getElementById('nombre').value         = c.nombre ?? '';
  document.getElementById('descripcion').value    = c.descripcion ?? '';
  document.getElementById('cantidadHoras').value  = c.cantidad_horas ?? '';
  document.getElementById('inscriptosMax').value  = c.inscriptos_max ?? '';

  // Fecha a YYYY-MM-DD para el <input type="date">
  let fecha = c.fecha_inicio ?? '';
  if (typeof fecha === 'string' && fecha.includes('T')) fecha = fecha.slice(0, 10);
  document.getElementById('fechaInicio').value = fecha;

  await cargarEstadosCurso();
  llenarComboEstado(c.id_curso_estado);

  document.getElementById('modalTitulo').textContent = 'Editar Curso';
  modalForm().show();
}

async function guardarCurso() {
  const id = document.getElementById('cursoId').value;
  const fecha = document.getElementById('fechaInicio').value;
  const horas = document.getElementById('cantidadHoras').value;
  const cupo  = document.getElementById('inscriptosMax').value;

  const estadoSel = document.getElementById('estado').value;
  const datos = {
    nombre:         document.getElementById('nombre').value.trim(),
    descripcion:    document.getElementById('descripcion').value.trim() || null,
    fecha_inicio:   fecha || null,
    cantidad_horas: horas ? parseInt(horas) : null,
    inscriptos_max: cupo ? parseInt(cupo) : null,
    id_curso_estado: estadoSel ? parseInt(estadoSel) : null,
  };

  const esEditar = id !== '';
  const url      = esEditar ? `${API_URL}/${id}` : API_URL;
  const metodo   = esEditar ? 'PUT' : 'POST';

  const resp = await fetchAutenticado(url, { method: metodo, body: JSON.stringify(datos) });
  if (!resp) return;

  const resultado = await resp.json();
  if (resp.ok) {
    modalForm().hide();
    cargarCursos();
  } else {
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

// Detalle (botón ojo)
async function verDetalle(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}`);
  if (!resp || !resp.ok) { alert('No se pudieron obtener los datos del curso.'); return; }
  const c = await resp.json();

  // Fecha YYYY-MM-DD -> DD/MM/AAAA sin problemas de zona horaria
  let fechaFmt = '—';
  const f = c.fecha_inicio ?? '';
  if (typeof f === 'string' && f.length >= 10) {
    const [a, m, d] = f.slice(0, 10).split('-');
    if (a && m && d) fechaFmt = `${d}/${m}/${a}`;
  }

  const esActivo = (c.es_activo ?? 1) === 1 || c.es_activo === true;

  document.getElementById('detalleBody').innerHTML = `
    <dl class="row mb-0">
      <dt class="col-sm-4">Nombre</dt>      <dd class="col-sm-8">${c.nombre ?? '—'}</dd>
      <dt class="col-sm-4">Descripción</dt> <dd class="col-sm-8">${c.descripcion ?? '—'}</dd>
      <dt class="col-sm-4">Inicio</dt>      <dd class="col-sm-8">${fechaFmt}</dd>
      <dt class="col-sm-4">Horas</dt>       <dd class="col-sm-8">${c.cantidad_horas ?? '—'}</dd>
      <dt class="col-sm-4">Cupo máximo</dt> <dd class="col-sm-8">${c.inscriptos_max ?? '—'}</dd>
      <dt class="col-sm-4">Estado</dt>      <dd class="col-sm-8"><span class="badge ${esActivo ? 'bg-success' : 'bg-danger'}">${c.estado_descripcion ?? (esActivo ? 'Activo' : 'Inactivo')}</span></dd>
    </dl>`;

  bootstrap.Modal.getOrCreateInstance(modalDetalleEl).show();
}

// ============================================================
//  DELETE (baja lógica) / RESTAURAR
// ============================================================
async function eliminarCurso(id) {
  if (!confirm('¿Dar de baja a este curso?')) return;
  const resp = await fetchAutenticado(`${API_URL}/${id}`, { method: 'DELETE' });
  if (resp?.ok) cargarCursos();
}

async function restaurarCurso(id) {
  const resp = await fetchAutenticado(`${API_URL}/${id}/activar`, { method: 'PATCH' });
  if (resp?.ok) cargarCursos();
}

// ============================================================
//  Sesión
// ============================================================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}