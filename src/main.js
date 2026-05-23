import './style.css';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plepqtlpqcijznbbreke.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8FJuez_F2RT3p3rU20Bi4Q_mjkSGVmX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State management
let currentUser = null;
let personas = [];
let eventos = [];
let reuniones = [];
let selectedDate = new Date();
let activeSection = 'personas';

// UI Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleSignup = document.getElementById('toggle-signup');
const toggleLogin = document.getElementById('toggle-login');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnMobile = document.getElementById('logout-btn-mobile');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');

// SQL script for table generation (for developer/user guidance)
const SQL_SCHEMA = `
-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE:

CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  edad INTEGER,
  categoria TEXT,
  primera_vez BOOLEAN DEFAULT true,
  veces INTEGER DEFAULT 0,
  contenida BOOLEAN DEFAULT false,
  primera_visita DATE,
  cumple DATE,
  encuentro BOOLEAN DEFAULT false,
  bautismo BOOLEAN DEFAULT false,
  discipulado BOOLEAN DEFAULT false,
  escuela BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT,
  fecha DATE NOT NULL,
  hora TIME,
  lugar TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS reuniones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tema TEXT,
  bienvenida TEXT,
  ora_bienvenida TEXT,
  sillas_vacias TEXT,
  palabra TEXT,
  ora_alabanza TEXT,
  ora_palabra TEXT,
  ora_misiones TEXT,
  ora_ofrenda TEXT,
  ora_necesidades TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en las tablas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reuniones ENABLE ROW LEVEL SECURITY;

-- Crear políticas para que cada usuario vea solo sus datos
CREATE POLICY "Permitir todo a usuarios autenticados en sus personas" ON personas 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir todo a usuarios autenticados en sus eventos" ON eventos 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir todo a usuarios autenticados en sus reuniones" ON reuniones 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;

// Log schema code in console for convenience
console.log('%cScript SQL para crear las tablas en Supabase:', 'color: #4C061D; font-weight: bold; font-size: 14px;');
console.log(SQL_SCHEMA);

// Notifications/Toast utility
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<i class="fas fa-check-circle"></i>';
  if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Check session on load
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    setupApp();
  } else {
    showLoginScreen();
  }
  setupAppNavigation();
  setupEventListeners();
});

// Setup Auth Screens toggle
if (toggleSignup) {
  toggleSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    document.getElementById('login-card').querySelector('h1').innerText = 'Registrarse';
  });
}

if (toggleLogin) {
  toggleLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('login-card').querySelector('h1').innerText = 'GC Buchardo';
  });
}

// Auth Handlers
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  
  btn.disabled = true;
  btn.querySelector('span').innerText = 'Ingresando...';
  errorEl.innerText = '';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.innerText = error.message;
    btn.disabled = false;
    btn.querySelector('span').innerText = 'Ingresar';
  } else {
    currentUser = data.user;
    showToast('¡Bienvenido!');
    setupApp();
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const btn = document.getElementById('signup-btn');
  const errorEl = document.getElementById('signup-error');
  
  btn.disabled = true;
  btn.querySelector('span').innerText = 'Creando cuenta...';
  errorEl.innerText = '';

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    errorEl.innerText = error.message;
    btn.disabled = false;
    btn.querySelector('span').innerText = 'Crear cuenta';
  } else {
    showToast('Cuenta creada con éxito. Ya podés iniciar sesión.');
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('login-card').querySelector('h1').innerText = 'GC Buchardo';
    btn.disabled = false;
    btn.querySelector('span').innerText = 'Crear cuenta';
  }
});

// Logout Handlers
const handleLogout = async () => {
  await supabase.auth.signOut();
  currentUser = null;
  personas = [];
  eventos = [];
  reuniones = [];
  appScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
};
logoutBtn.addEventListener('click', handleLogout);
logoutBtnMobile.addEventListener('click', handleLogout);

// Mobile Sidebar Toggle
mobileMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  }
});

// Setup Main App Environment
async function setupApp() {
  loginScreen.style.display = 'none';
  appScreen.style.display = 'flex';
  userEmailDisplay.innerText = currentUser.email;
  
  // Try to load initial data
  await loadData();
}

function showLoginScreen() {
  appScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
}

// Load data from Supabase
async function loadData() {
  try {
    const pReq = supabase.from('personas').select('*').order('nombre', { ascending: true });
    const eReq = supabase.from('eventos').select('*').order('fecha', { ascending: true });
    const rReq = supabase.from('reuniones').select('*').order('fecha', { ascending: false });

    const [pRes, eRes, rRes] = await Promise.all([pReq, eReq, rReq]);

    // Handle initial state if tables don't exist yet
    if (pRes.error) {
      console.warn("Error cargando personas. Tal vez falte crear las tablas.", pRes.error);
      showToast("Asegurá de ejecutar el script SQL en Supabase para las tablas.", "error");
    } else {
      personas = pRes.data || [];
    }

    if (eRes.error) console.warn("Error cargando eventos", eRes.error);
    else eventos = eRes.data || [];

    if (rRes.error) console.warn("Error cargando reuniones", rRes.error);
    else reuniones = rRes.data || [];

    renderAll();
  } catch (err) {
    console.error(err);
    showToast("Error conectando con Supabase.", "error");
  }
}

// Render components
function renderAll() {
  renderPersonas();
  renderCalendar();
  renderReuniones();
}

// Navigation logic
function setupAppNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = item.getAttribute('data-section');
      
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
      });
      document.getElementById(`section-${targetSection}`).classList.add('active');
      
      activeSection = targetSection;
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    });
  });
}

// ==========================================
// SECCION: PERSONAS
// ==========================================
function renderPersonas() {
  const tbody = document.getElementById('personas-tbody');
  const empty = document.getElementById('personas-empty');
  tbody.innerHTML = '';

  const searchValue = document.getElementById('search-personas').value.toLowerCase();
  const filterCat = document.getElementById('filter-categoria').value;

  const filtered = personas.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchValue);
    const matchesCat = filterCat === '' || p.categoria === filterCat;
    return matchesSearch && matchesCat;
  });

  // Calculate statistics
  document.getElementById('stat-total').innerText = filtered.length;
  document.getElementById('stat-primera-vez').innerText = filtered.filter(p => p.primera_vez).length;
  document.getElementById('stat-contenidas').innerText = filtered.filter(p => p.contenida).length;
  document.getElementById('stat-bautizadas').innerText = filtered.filter(p => p.bautismo).length;

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td>${p.edad || '-'}</td>
      <td><span class="badge badge-category">${p.categoria || '-'}</span></td>
      <td><span class="badge ${p.primera_vez ? 'badge-yes' : 'badge-no'}">${p.primera_vez ? 'Sí' : 'No'}</span></td>
      <td>${p.veces || 0}</td>
      <td><span class="badge ${p.contenida ? 'badge-yes' : 'badge-no'}">${p.contenida ? 'Sí' : 'No'}</span></td>
      <td>${p.primera_visita ? formatDate(p.primera_visita) : '-'}</td>
      <td>${p.cumple ? formatDate(p.cumple) : '-'}</td>
      <td><span class="badge ${p.encuentro ? 'badge-yes' : 'badge-no'}">${p.encuentro ? 'Sí' : 'No'}</span></td>
      <td><span class="badge ${p.bautismo ? 'badge-yes' : 'badge-no'}">${p.bautismo ? 'Sí' : 'No'}</span></td>
      <td><span class="badge ${p.discipulado ? 'badge-yes' : 'badge-no'}">${p.discipulado ? 'Sí' : 'No'}</span></td>
      <td><span class="badge ${p.escuela ? 'badge-yes' : 'badge-no'}">${p.escuela ? 'Sí' : 'No'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit-persona" data-id="${p.id}"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete delete-persona" data-id="${p.id}"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach table event actions
  tbody.querySelectorAll('.edit-persona').forEach(btn => {
    btn.addEventListener('click', () => openPersonaModal(btn.getAttribute('data-id')));
  });
  tbody.querySelectorAll('.delete-persona').forEach(btn => {
    btn.addEventListener('click', () => deletePersona(btn.getAttribute('data-id')));
  });
}

// Add filters/search listeners
document.getElementById('search-personas').addEventListener('input', renderPersonas);
document.getElementById('filter-categoria').addEventListener('change', renderPersonas);

// Persona Modal Functions
const personaModal = document.getElementById('modal-persona');
const personaForm = document.getElementById('persona-form');

document.getElementById('add-persona-btn').addEventListener('click', () => openPersonaModal());
document.getElementById('modal-persona-close').addEventListener('click', closePersonaModal);
document.getElementById('modal-persona-cancel').addEventListener('click', closePersonaModal);

function openPersonaModal(id = null) {
  personaForm.reset();
  document.getElementById('persona-id').value = '';
  document.getElementById('modal-persona-title').innerHTML = '<i class="fas fa-user-plus"></i> Nueva Persona';
  
  if (id) {
    const p = personas.find(item => item.id === id);
    if (p) {
      document.getElementById('persona-id').value = p.id;
      document.getElementById('persona-nombre').value = p.nombre || '';
      document.getElementById('persona-edad').value = p.edad || '';
      document.getElementById('persona-categoria').value = p.categoria || 'Adultos';
      document.getElementById('persona-primera-vez').value = String(p.primera_vez);
      document.getElementById('persona-veces').value = p.veces || 0;
      document.getElementById('persona-contenida').value = String(p.contenida);
      document.getElementById('persona-primera-visita').value = p.primera_visita || '';
      document.getElementById('persona-cumple').value = p.cumple || '';
      document.getElementById('persona-encuentro').value = String(p.encuentro);
      document.getElementById('persona-bautismo').value = String(p.bautismo);
      document.getElementById('persona-discipulado').value = String(p.discipulado);
      document.getElementById('persona-escuela').value = String(p.escuela);
      
      document.getElementById('modal-persona-title').innerHTML = '<i class="fas fa-user-edit"></i> Editar Persona';
    }
  }
  personaModal.style.display = 'flex';
}

function closePersonaModal() {
  personaModal.style.display = 'none';
}

personaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('persona-id').value;
  const data = {
    nombre: document.getElementById('persona-nombre').value,
    edad: document.getElementById('persona-edad').value ? parseInt(document.getElementById('persona-edad').value) : null,
    categoria: document.getElementById('persona-categoria').value,
    primera_vez: document.getElementById('persona-primera-vez').value === 'true',
    veces: document.getElementById('persona-veces').value ? parseInt(document.getElementById('persona-veces').value) : 0,
    contenida: document.getElementById('persona-contenida').value === 'true',
    primera_visita: document.getElementById('persona-primera-visita').value || null,
    cumple: document.getElementById('persona-cumple').value || null,
    encuentro: document.getElementById('persona-encuentro').value === 'true',
    bautismo: document.getElementById('persona-bautismo').value === 'true',
    discipulado: document.getElementById('persona-discipulado').value === 'true',
    escuela: document.getElementById('persona-escuela').value === 'true',
    user_id: currentUser.id
  };

  let res;
  if (id) {
    res = await supabase.from('personas').update(data).eq('id', id);
  } else {
    res = await supabase.from('personas').insert([data]);
  }

  if (res.error) {
    showToast('Error al guardar persona.', 'error');
    console.error(res.error);
  } else {
    showToast('Persona guardada correctamente.');
    closePersonaModal();
    loadData();
  }
});

async function deletePersona(id) {
  if (confirm('¿Estás seguro de eliminar a esta persona?')) {
    const { error } = await supabase.from('personas').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar.', 'error');
    } else {
      showToast('Persona eliminada.');
      loadData();
    }
  }
}


// ==========================================
// SECCION: CALENDARIO
// ==========================================
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearLabel = document.getElementById('cal-month-year');
  grid.innerHTML = '';

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  monthYearLabel.innerText = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Days from previous month
  for (let x = firstDayIndex; x > 0; x--) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day empty';
    grid.appendChild(dayDiv);
  }

  // Days of current month
  for (let i = 1; i <= lastDay; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.innerText = i;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Check if there are events on this day
    const hasEvents = eventos.some(e => e.fecha === dateStr);
    if (hasEvents) {
      const dot = document.createElement('span');
      dot.className = 'event-dot';
      dayDiv.appendChild(dot);
    }

    // Is it selected?
    const todayStr = getFormattedToday();
    if (dateStr === todayStr) {
      dayDiv.classList.add('today');
    }

    dayDiv.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
      dayDiv.classList.add('selected');
      renderEventsForDate(dateStr);
    });

    grid.appendChild(dayDiv);
  }

  // Initial event load for today
  renderEventsForDate(getFormattedToday());
  renderUpcomingEvents();
}

function getFormattedToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  selectedDate.setMonth(selectedDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  selectedDate.setMonth(selectedDate.getMonth() + 1);
  renderCalendar();
});

// Event rendering
function renderEventsForDate(dateStr) {
  const list = document.getElementById('events-list');
  const title = document.getElementById('events-date-title');
  list.innerHTML = '';
  
  const parsedDate = new Date(dateStr + 'T00:00:00');
  title.innerText = `Eventos del ${parsedDate.getDate()} de ${monthNames[parsedDate.getMonth()]}`;

  const dayEvents = eventos.filter(e => e.fecha === dateStr);

  if (dayEvents.length === 0) {
    list.innerHTML = `
      <div class="empty-state small">
        <i class="fas fa-calendar-day"></i>
        <p>No hay eventos para este día</p>
      </div>
    `;
    return;
  }

  dayEvents.forEach(e => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-card-content">
        <h4>${escapeHtml(e.titulo)}</h4>
        <p>${escapeHtml(e.descripcion || '')}</p>
        <div class="event-meta">
          <span><i class="fas fa-clock"></i> ${e.hora ? e.hora.substring(0, 5) : 'Todo el día'}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(e.lugar || 'No definido')}</span>
          <span class="badge badge-category">${e.tipo}</span>
        </div>
      </div>
      <div class="action-btns">
        <button class="btn-icon delete delete-event" data-id="${e.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.delete-event').forEach(btn => {
    btn.addEventListener('click', () => deleteEvent(btn.getAttribute('data-id')));
  });
}

function renderUpcomingEvents() {
  const panel = document.getElementById('upcoming-events');
  panel.innerHTML = '';
  
  const todayStr = getFormattedToday();
  const upcoming = eventos.filter(e => e.fecha >= todayStr).slice(0, 5);

  if (upcoming.length === 0) {
    panel.innerHTML = '<p class="text-secondary" style="font-size:0.85rem;">No hay próximos eventos programados.</p>';
    return;
  }

  upcoming.forEach(e => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-card-content">
        <h4>${escapeHtml(e.titulo)}</h4>
        <div class="event-meta">
          <span><i class="fas fa-calendar"></i> ${formatDate(e.fecha)}</span>
          <span><i class="fas fa-clock"></i> ${e.hora ? e.hora.substring(0, 5) : ''}</span>
          <span class="badge badge-category">${e.tipo}</span>
        </div>
      </div>
    `;
    panel.appendChild(card);
  });
}

// Event Modal Functions
const eventModal = document.getElementById('modal-event');
const eventForm = document.getElementById('event-form');

document.getElementById('add-event-btn').addEventListener('click', () => openEventModal());
document.getElementById('modal-event-close').addEventListener('click', closeEventModal);
document.getElementById('modal-event-cancel').addEventListener('click', closeEventModal);

function openEventModal() {
  eventForm.reset();
  document.getElementById('event-id').value = '';
  document.getElementById('event-fecha').value = getFormattedToday();
  eventModal.style.display = 'flex';
}

function closeEventModal() {
  eventModal.style.display = 'none';
}

eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    titulo: document.getElementById('event-titulo').value,
    tipo: document.getElementById('event-tipo').value,
    fecha: document.getElementById('event-fecha').value,
    hora: document.getElementById('event-hora').value || null,
    lugar: document.getElementById('event-lugar').value,
    descripcion: document.getElementById('event-descripcion').value,
    user_id: currentUser.id
  };

  const res = await supabase.from('eventos').insert([data]);

  if (res.error) {
    showToast('Error al guardar evento.', 'error');
    console.error(res.error);
  } else {
    showToast('Evento creado.');
    closeEventModal();
    loadData();
  }
});

async function deleteEvent(id) {
  if (confirm('¿Estás seguro de eliminar este evento?')) {
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar.', 'error');
    } else {
      showToast('Evento eliminado.');
      loadData();
    }
  }
}


// ==========================================
// SECCION: ORGANIZACION GC
// ==========================================
function renderReuniones() {
  const container = document.getElementById('gc-meetings-list');
  const empty = document.getElementById('gc-empty');
  
  // Clear non-empty states
  const cards = container.querySelectorAll('.meeting-card');
  cards.forEach(c => c.remove());

  if (reuniones.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  reuniones.forEach(r => {
    const card = document.createElement('div');
    card.className = 'meeting-card';
    card.innerHTML = `
      <div class="meeting-card-header">
        <div>
          <h3>Palabra: ${escapeHtml(r.tema || 'Sin tema')}</h3>
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(r.fecha)}</span>
        </div>
      </div>
      <div class="meeting-roles">
        <div class="role-row">
          <span class="role-label">Bienvenida:</span>
          <span class="role-val">${escapeHtml(r.bienvenida || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora por Bienvenida:</span>
          <span class="role-val">${escapeHtml(r.ora_bienvenida || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora por Sillas Vacías:</span>
          <span class="role-val">${escapeHtml(r.sillas_vacias || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Da la Palabra:</span>
          <span class="role-val">${escapeHtml(r.palabra || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora dsp Alabanza:</span>
          <span class="role-val">${escapeHtml(r.ora_alabanza || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora dsp Palabra:</span>
          <span class="role-val">${escapeHtml(r.ora_palabra || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora por Misiones:</span>
          <span class="role-val">${escapeHtml(r.ora_misiones || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora por Ofrendas:</span>
          <span class="role-val">${escapeHtml(r.ora_ofrenda || '-')}</span>
        </div>
        <div class="role-row">
          <span class="role-label">Ora por Necesidades:</span>
          <span class="role-val">${escapeHtml(r.ora_necesidades || '-')}</span>
        </div>
      </div>
      ${r.notes || r.notas ? `<p style="font-size:0.8rem; color:var(--ebony); font-style:italic; margin-top: 8px;"><strong>Notas:</strong> ${escapeHtml(r.notas || r.notes)}</p>` : ''}
      <div class="meeting-card-footer">
        <button class="btn-icon edit-meeting" data-id="${r.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete delete-meeting" data-id="${r.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.edit-meeting').forEach(btn => {
    btn.addEventListener('click', () => openGCModal(btn.getAttribute('data-id')));
  });
  container.querySelectorAll('.delete-meeting').forEach(btn => {
    btn.addEventListener('click', () => deleteMeeting(btn.getAttribute('data-id')));
  });
}

// GC Modal Functions
const gcModal = document.getElementById('modal-gc');
const gcForm = document.getElementById('gc-form');

document.getElementById('add-gc-btn').addEventListener('click', () => openGCModal());
document.getElementById('modal-gc-close').addEventListener('click', closeGCModal);
document.getElementById('modal-gc-cancel').addEventListener('click', closeGCModal);

function openGCModal(id = null) {
  gcForm.reset();
  document.getElementById('gc-id').value = '';
  document.getElementById('gc-fecha').value = getFormattedToday();
  document.getElementById('modal-gc-title').innerHTML = '<i class="fas fa-clipboard-list"></i> Nueva Reunión GC';

  if (id) {
    const r = reuniones.find(item => item.id === id);
    if (r) {
      document.getElementById('gc-id').value = r.id;
      document.getElementById('gc-fecha').value = r.fecha;
      document.getElementById('gc-tema').value = r.tema || '';
      document.getElementById('gc-bienvenida').value = r.bienvenida || '';
      document.getElementById('gc-ora-bienvenida').value = r.ora_bienvenida || '';
      document.getElementById('gc-sillas-vacias').value = r.sillas_vacias || '';
      document.getElementById('gc-palabra').value = r.palabra || '';
      document.getElementById('gc-ora-alabanza').value = r.ora_alabanza || '';
      document.getElementById('gc-ora-palabra').value = r.ora_palabra || '';
      document.getElementById('gc-ora-misiones').value = r.ora_misiones || '';
      document.getElementById('gc-ora-ofrenda').value = r.ora_ofrenda || '';
      document.getElementById('gc-ora-necesidades').value = r.ora_necesidades || '';
      document.getElementById('gc-notas').value = r.notas || '';

      document.getElementById('modal-gc-title').innerHTML = '<i class="fas fa-edit"></i> Editar Reunión GC';
    }
  }
  gcModal.style.display = 'flex';
}

function closeGCModal() {
  gcModal.style.display = 'none';
}

gcForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('gc-id').value;
  const data = {
    fecha: document.getElementById('gc-fecha').value,
    tema: document.getElementById('gc-tema').value,
    bienvenida: document.getElementById('gc-bienvenida').value,
    ora_bienvenida: document.getElementById('gc-ora-bienvenida').value,
    sillas_vacias: document.getElementById('gc-sillas-vacias').value,
    palabra: document.getElementById('gc-palabra').value,
    ora_alabanza: document.getElementById('gc-ora-alabanza').value,
    ora_palabra: document.getElementById('gc-ora-palabra').value,
    ora_misiones: document.getElementById('gc-ora-misiones').value,
    ora_ofrenda: document.getElementById('gc-ora-ofrenda').value,
    ora_necesidades: document.getElementById('gc-ora-necesidades').value,
    notas: document.getElementById('gc-notas').value,
    user_id: currentUser.id
  };

  let res;
  if (id) {
    res = await supabase.from('reuniones').update(data).eq('id', id);
  } else {
    res = await supabase.from('reuniones').insert([data]);
  }

  if (res.error) {
    showToast('Error al guardar la reunión.', 'error');
    console.error(res.error);
  } else {
    showToast('Planificación de reunión guardada correctamente.');
    closeGCModal();
    loadData();
  }
});

async function deleteMeeting(id) {
  if (confirm('¿Estás seguro de eliminar esta planificación?')) {
    const { error } = await supabase.from('reuniones').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar.', 'error');
    } else {
      showToast('Planificación eliminada.');
      loadData();
    }
  }
}


// ==========================================
// HELPERS
// ==========================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupEventListeners() {
  // Global modal closing on click outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closePersonaModal();
      closeEventModal();
      closeGCModal();
    }
  });
}
