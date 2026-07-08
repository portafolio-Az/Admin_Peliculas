/**
 * ui.js
 * Renderizado de la interfaz: tabla principal, contadores, paginación
 * y estados vacíos. No contiene lógica de persistencia.
 */

/* Depende de utils.js (escapeHtml, formatDate, getServerIcon) y modal.js (ICONS),
   que deben cargarse antes que este archivo en index.html. */

const PAGE_SIZE = 8;

class UIController {
  constructor() {
    this.tableBody = document.getElementById('tableBody');
    this.emptyState = document.getElementById('emptyState');
    this.tableWrapper = document.getElementById('tableWrapper');
    this.movieCount = document.getElementById('movieCount');
    this.serverCount = document.getElementById('serverCount');
    this.paginationEl = document.getElementById('pagination');
    this.sortSelect = document.getElementById('sortSelect');

    this.currentPage = 1;
  }

  /** Actualiza los contadores del encabezado. */
  updateCounters(movies) {
    const totalServers = movies.reduce((sum, movie) => sum + movie.servers.length, 0);
    this.movieCount.textContent = movies.length;
    this.serverCount.textContent = totalServers;
  }

  /** Aplica orden a un arreglo de películas según el criterio seleccionado. */
  sortMovies(movies, criterion) {
    const list = [...movies];
    switch (criterion) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, 'es'));
      case 'date-newest':
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'date-oldest':
        return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'modified':
        return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      default:
        return list;
    }
  }

  /** Renderiza la tabla principal con paginación. */
  renderTable(movies) {
    if (movies.length === 0) {
      this.tableWrapper.hidden = true;
      this.paginationEl.hidden = true;
      this.emptyState.hidden = false;
      return;
    }

    this.tableWrapper.hidden = false;
    this.emptyState.hidden = true;

    const totalPages = Math.max(1, Math.ceil(movies.length / PAGE_SIZE));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * PAGE_SIZE;
    const pageItems = movies.slice(start, start + PAGE_SIZE);

    this.tableBody.innerHTML = pageItems
      .map((movie) => `
        <tr data-id="${movie.id}">
          <td class="cell-movie" data-label="Película">
            <span class="movie-name">${escapeHtml(movie.name)}</span>
          </td>
          <td data-label="Servidores">
            ${this.renderServerIcons(movie.servers)}
          </td>
          <td class="cell-date" data-label="Creación">${formatDate(movie.createdAt)}</td>
          <td class="cell-date" data-label="Modificación">${formatDate(movie.updatedAt)}</td>
          <td class="cell-actions" data-label="Acciones">
            <button class="icon-btn" data-action="view" title="Ver enlaces" aria-label="Ver enlaces">${ICONS.eye}</button>
            <button class="icon-btn" data-action="edit" title="Editar" aria-label="Editar">${ICONS.edit}</button>
            <button class="icon-btn" data-action="duplicate" title="Duplicar" aria-label="Duplicar">${ICONS.duplicate}</button>
            <button class="icon-btn icon-btn--danger" data-action="delete" title="Eliminar" aria-label="Eliminar">${ICONS.trash}</button>
          </td>
        </tr>
      `)
      .join('');

    this.renderPagination(totalPages);
  }

  /** Genera las insignias de iconos de servidores usados por una película. */
  renderServerIcons(servers) {
    if (!servers || servers.length === 0) {
      return `<span class="server-icons server-icons--empty">Sin servidores</span>`;
    }
    const MAX_VISIBLE = 5;
    const visible = servers.slice(0, MAX_VISIBLE);
    const extra = servers.length - visible.length;

    const badges = visible
      .map((server) => {
        const { label, color, icon } = getServerIcon(server.name);
        return `<span class="server-icons__badge" style="color:${color}; background:${color}22;" title="${escapeHtml(label)}">${icon}</span>`;
      })
      .join('');

    const extraBadge = extra > 0
      ? `<span class="server-icons__badge server-icons__badge--extra" title="${extra} servidor(es) más">+${extra}</span>`
      : '';

    return `<div class="server-icons">${badges}${extraBadge}</div>`;
  }

  renderPagination(totalPages) {
    if (totalPages <= 1) {
      this.paginationEl.hidden = true;
      return;
    }
    this.paginationEl.hidden = false;

    let buttons = '';
    for (let page = 1; page <= totalPages; page += 1) {
      buttons += `<button class="page-btn ${page === this.currentPage ? 'is-active' : ''}" data-page="${page}">${page}</button>`;
    }

    this.paginationEl.innerHTML = `
      <button class="page-btn page-btn--nav" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>
      ${buttons}
      <button class="page-btn page-btn--nav" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente">›</button>
    `;
  }

  goToPage(page) {
    this.currentPage = page;
  }

  resetPage() {
    this.currentPage = 1;
  }

  hideLoader() {
    if (window.__loaderSafety) clearTimeout(window.__loaderSafety);
    const loader = document.getElementById('initialLoader');
    if (!loader) return;
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 400);
  }
}
