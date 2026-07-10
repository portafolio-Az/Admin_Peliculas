/**
 * utils.js
 * Funciones auxiliares reutilizables en toda la aplicación.
 * No contiene lógica de negocio ni acceso a almacenamiento.
 */

/**
 * Catálogo de servidores conocidos. Cada uno usa el archivo PNG real del
 * servicio (carpeta assets/icons/) en vez de un dibujo genérico. Si agregas
 * un servidor nuevo más adelante, solo añade su PNG a esa carpeta y una
 * entrada aquí con el nombre de archivo exacto (sensible a mayúsculas).
 */
const SERVER_CATALOG = [
  {
    id: 'mega',
    label: 'Mega',
    match: ['mega'],
    color: '#E63946',
    iconFile: 'mega.png',
  },
  {
    id: 'mediafire',
    label: 'Mediafire',
    match: ['mediafire', 'media fire'],
    color: '#1299D8',
    iconFile: 'mediafire.png',
  },
  {
    id: 'drive',
    label: 'Google Drive',
    match: ['drive', 'google drive', 'googledrive'],
    color: '#34A853',
    iconFile: 'drive.png',
  },
  {
    id: 'dropbox',
    label: 'Dropbox',
    match: ['dropbox', 'drop box'],
    color: '#0061FF',
    iconFile: 'dropbox.png',
  },
  {
    id: 'onedrive',
    label: 'OneDrive',
    match: ['onedrive', 'one drive'],
    color: '#0078D4',
    iconFile: 'onedrive.png',
  },
  {
    id: '4shared',
    label: '4shared',
    match: ['4shared', '4 shared'],
    color: '#1CADE4',
    iconFile: '4shared.png',
  },
  {
    id: 'directo',
    label: 'Descarga Directa',
    match: ['descarga directa', 'directo', 'download'],
    color: '#5B8DEF',
    iconFile: 'Download.png',
  },
  {
    id: 'otro',
    label: 'Otro',
    match: ['otro'],
    color: '#7C8798',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.36-1.36"/></svg>',
  },
];

const SERVER_ICON_BASE_PATH = 'assets/icons/';

/**
 * Busca en el catálogo el servidor que coincide con el nombre escrito por el
 * usuario y devuelve { color, icon, isImage }. Los servidores del catálogo
 * usan su PNG real (isImage: true); los nombres personalizados que no
 * coinciden con ninguno usan una insignia con la inicial (isImage: false).
 */
function getServerIcon(name) {
  const normalized = (name || '').trim().toLowerCase();
  const found = SERVER_CATALOG.find((entry) => entry.match.some((alias) => normalized === alias || normalized.includes(alias)));

  if (found) {
    if (found.iconFile) {
      return {
        color: found.color,
        icon: `<img src="${SERVER_ICON_BASE_PATH}${found.iconFile}" alt="${escapeHtml(found.label)}" />`,
        isImage: true,
      };
    }
    return { color: found.color, icon: found.icon, isImage: false };
  }

  return {
    color: '#7C8798',
    icon: `<svg viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="Poppins, Inter, sans-serif">${escapeHtml((name || '?').trim().charAt(0).toUpperCase())}</text></svg>`,
    isImage: false,
  };
}

/**
 * Aplica el icono de un servidor a una insignia (elemento con clase
 * server-icon-badge / server-icons__badge). Centraliza la lógica para que
 * modal.js y ui.js no dupliquen el mismo cálculo de color/fondo.
 */
function applyServerIconToBadge(el, name) {
  if (!el) return;
  const { color, icon, isImage } = getServerIcon(name);
  el.innerHTML = icon;
  el.style.color = color;
  el.style.background = isImage ? 'var(--color-surface-3)' : `${color}22`;
}

/** Genera un identificador único razonablemente corto. */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Devuelve la fecha/hora actual en formato ISO. */
function nowISO() {
  return new Date().toISOString();
}

/** Formatea una fecha ISO a algo legible en español (es-MX). */
function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' · ' + date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Debounce clásico: retrasa la ejecución hasta que el usuario deja de escribir. */
function debounce(fn, delay = 250) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/** Escapa texto para insertarlo de forma segura en HTML. */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

/** Copia texto al portapapeles. Devuelve una Promise<boolean>. */
async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback para contextos no seguros / navegadores antiguos.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('No se pudo copiar al portapapeles:', err);
    return false;
  }
}

/** Abre un enlace en una nueva pestaña de forma segura. */
function openInNewTab(url) {
  if (!url) return;
  const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}

/** Descarga un objeto JS como archivo JSON. */
function downloadJSON(data, filename = 'export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Lee un archivo JSON seleccionado por el usuario y devuelve el objeto parseado. */
function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No se proporcionó ningún archivo.'));
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(new Error('El archivo no contiene JSON válido.'));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

/** Sistema simple de notificaciones tipo Toast. */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(message, type = 'info', duration = 3200) {
    if (!this.container) this.init();
    if (!this.container) return;

    const icons = {
      success: '<path d="M20 6 9 17l-5-5"/>',
      error: '<path d="M18 6 6 18M6 6l12 12"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[type] || icons.info}</svg>
      <span class="toast__message">${escapeHtml(message)}</span>
    `;
    this.container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  },

  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  info(message) { this.show(message, 'info'); },
};
