// ============================================================
//  Dashboard — FCAD UNER
// ============================================================

const API_URL = 'http://localhost:3000/dashboard';

// Control de acceso
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Nombre del usuario en la barra
  try {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nav = document.getElementById('navUsuario');
    if (nav && (u.nombre || u.nombre_usuario)) {
      nav.textContent = u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : u.nombre_usuario;
    }
  } catch (_) {}

  cargarResumen();
});

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

async function cargarResumen() {
  const resp = await fetchAutenticado(API_URL);
  if (!resp) return;

  const data = await resp.json();

  document.getElementById('totalEstudiantes').textContent = data.totalEstudiantes ?? 0;
  document.getElementById('totalCursos').textContent      = data.totalCursos ?? 0;

  const cont = document.getElementById('cursosActivos');
  cont.innerHTML = '';

  const cursos = data.cursosActivos || [];
  if (!cursos.length) {
    cont.innerHTML = `<div class="list-group-item text-muted">No hay cursos activos</div>`;
    return;
  }

  cursos.forEach(c => {
    const a = document.createElement('a');
    a.href = 'cursos.html';
    a.className = 'list-group-item list-group-item-action curso-item d-flex justify-content-between align-items-center';
    a.innerHTML = `
      <span>
        <i class="bi bi-journal-text me-2 text-secondary"></i>
        <strong>${c.nombre || 'Sin nombre'}</strong>
        ${c.fecha_inicio ? `<span class="text-muted ms-2 small">Inicia: ${c.fecha_inicio}</span>` : ''}
      </span>
      <span class="text-muted small">
        ${c.cantidad_horas ?? '—'} hs · Cupo ${c.inscriptos_max ?? '—'}
        <i class="bi bi-chevron-right ms-2"></i>
      </span>`;
    cont.appendChild(a);
  });
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}
