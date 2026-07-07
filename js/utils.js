/**
 * utils.js
 * Funciones auxiliares reutilizables en toda la aplicación.
 * No contiene lógica de negocio ni acceso a almacenamiento.
 */

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
