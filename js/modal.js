/**
 * modal.js
 * Construcción y control de todos los modales de la aplicación:
 * formulario de película, visor de enlaces y confirmación de borrado.
 */

/* Depende de utils.js (escapeHtml, copyToClipboard, openInNewTab, Toast, generateId,
   SERVER_CATALOG, getServerIcon), que debe cargarse antes que este archivo en index.html. */

const SERVER_PRESETS = SERVER_CATALOG.map((entry) => entry.label);

class ModalController {
  constructor() {
    this.overlay = document.getElementById('modalOverlay');
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('is-open')) this.close();
    });
  }

  close() {
    this.overlay.classList.remove('is-open');
    this.overlay.innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  _open(html) {
    this.overlay.innerHTML = html;
    this.overlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  /**
   * Abre el formulario de película (crear o editar).
   * @param {object|null} movie - película existente, o null para crear una nueva.
   * @param {function} onSave - callback(data) al confirmar.
   */
  openMovieForm(movie, onSave) {
    const isEdit = Boolean(movie);
    const servers = movie ? structuredClone(movie.servers) : [this._emptyServer()];

    const html = `
      <div class="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header class="modal__header">
          <h2 class="modal__title" id="modalTitle">${isEdit ? 'Editar película' : 'Agregar película'}</h2>
          <button type="button" class="icon-btn" data-action="close" aria-label="Cerrar">${ICONS.close}</button>
        </header>
        <form class="modal__body" id="movieForm">
          <div class="field">
            <label for="movieName">Nombre de la película</label>
            <input type="text" id="movieName" name="movieName" placeholder="Ej. Interstellar" value="${escapeHtml(movie?.name || '')}" required autocomplete="off" />
          </div>

          <div class="servers-section">
            <div class="servers-section__header">
              <h3>Servidores</h3>
              <button type="button" class="btn btn--ghost btn--sm" id="addServerBtn">${ICONS.plus} Agregar servidor</button>
            </div>
            <div id="serversList" class="servers-list"></div>
          </div>
        </form>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" data-action="close">Cancelar</button>
          <button type="submit" form="movieForm" class="btn btn--primary">${ICONS.save} ${isEdit ? 'Guardar cambios' : 'Guardar película'}</button>
        </footer>
      </div>
    `;
    this._open(html);

    const serversList = document.getElementById('serversList');
    const renderServers = () => {
      serversList.innerHTML = servers.map((server, sIdx) => this._serverBlockHtml(server, sIdx)).join('');
    };
    renderServers();

    document.getElementById('addServerBtn').addEventListener('click', () => {
      servers.push(this._emptyServer());
      renderServers();
    });

    serversList.addEventListener('click', (e) => {
      const removeServerBtn = e.target.closest('[data-remove-server]');
      const addLinkBtn = e.target.closest('[data-add-link]');
      const removeLinkBtn = e.target.closest('[data-remove-link]');

      if (removeServerBtn) {
        const idx = Number(removeServerBtn.dataset.removeServer);
        servers.splice(idx, 1);
        renderServers();
      } else if (addLinkBtn) {
        const idx = Number(addLinkBtn.dataset.addLink);
        if (servers[idx].links.length < 4) {
          servers[idx].links.push({ original: '', short: '' });
          renderServers();
        } else {
          Toast.info('Cada servidor admite un máximo de 4 enlaces.');
        }
      } else if (removeLinkBtn) {
        const [sIdx, lIdx] = removeLinkBtn.dataset.removeLink.split('-').map(Number);
        servers[sIdx].links.splice(lIdx, 1);
        renderServers();
      }
    });

    serversList.addEventListener('input', (e) => {
      const target = e.target;
      if (target.matches('[data-server-custom-name]')) {
        const idx = Number(target.dataset.serverCustomName);
        servers[idx].name = target.value;
        this._updateServerIconPreview(idx, target.value);
      } else if (target.matches('[data-link-original]')) {
        const [sIdx, lIdx] = target.dataset.linkOriginal.split('-').map(Number);
        servers[sIdx].links[lIdx].original = target.value;
      } else if (target.matches('[data-link-short]')) {
        const [sIdx, lIdx] = target.dataset.linkShort.split('-').map(Number);
        servers[sIdx].links[lIdx].short = target.value;
      }
    });

    serversList.addEventListener('change', (e) => {
      const target = e.target;
      if (target.matches('[data-server-select]')) {
        const idx = Number(target.dataset.serverSelect);
        if (target.value === 'Otro') {
          servers[idx]._pendingCustom = true;
          servers[idx].name = '';
          renderServers();
          const customInput = serversList.querySelector(`[data-server-custom-name="${idx}"]`);
          if (customInput) customInput.focus();
        } else {
          servers[idx]._pendingCustom = false;
          servers[idx].name = target.value;
          this._updateServerIconPreview(idx, servers[idx].name);
        }
      }
    });

    serversList.addEventListener('click', (e) => {
      const backBtn = e.target.closest('[data-server-back-to-list]');
      if (backBtn) {
        const idx = Number(backBtn.dataset.serverBackToList);
        servers[idx]._pendingCustom = false;
        servers[idx].name = '';
        renderServers();
      }
    });

    this.overlay.querySelectorAll('[data-action="close"]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    document.getElementById('movieForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('movieName').value.trim();
      if (!name) {
        Toast.error('El nombre de la película es obligatorio.');
        return;
      }
      onSave({ name, servers });
      this.close();
    });
  }

  _emptyServer() {
    return { id: generateId('server'), name: '', links: [{ original: '', short: '' }] };
  }

  /** Actualiza en vivo la insignia de icono junto al nombre del servidor. */
  _updateServerIconPreview(sIdx, name) {
    const badge = this.overlay.querySelector(`[data-server-icon="${sIdx}"]`);
    if (!badge) return;
    const { color, icon } = getServerIcon(name);
    badge.style.color = color;
    badge.style.background = `${color}22`;
    badge.innerHTML = icon;
  }

  _serverBlockHtml(server, sIdx) {
    const matchedPreset = SERVER_PRESETS.includes(server.name)
      ? server.name
      : (server.name || server._pendingCustom ? 'Otro' : '');
    const isCustom = matchedPreset === 'Otro';

    const options = [`<option value="" disabled ${!server.name ? 'selected' : ''}>Selecciona un servidor…</option>`]
      .concat(
        SERVER_PRESETS.map(
          (preset) => `<option value="${preset}" ${matchedPreset === preset ? 'selected' : ''}>${preset}</option>`
        )
      )
      .join('');

    const linksHtml = server.links
      .map((link, lIdx) => `
        <div class="link-pair">
          <div class="field field--sm">
            <label>Original ${lIdx + 1}</label>
            <input type="text" placeholder="Pega el enlace o texto que quieras guardar" data-link-original="${sIdx}-${lIdx}" value="${escapeHtml(link.original)}" />
          </div>
          <div class="field field--sm">
            <label>Acortador ${lIdx + 1}</label>
            <input type="text" placeholder="Pega el enlace o texto que quieras guardar" data-link-short="${sIdx}-${lIdx}" value="${escapeHtml(link.short)}" />
          </div>
          <button type="button" class="icon-btn icon-btn--danger" data-remove-link="${sIdx}-${lIdx}" aria-label="Quitar enlace" title="Quitar enlace">${ICONS.trash}</button>
        </div>
      `)
      .join('');

    const preview = getServerIcon(server.name);

    const selectorControl = isCustom
      ? `
        <input type="text" placeholder="Nombre del servidor" data-server-custom-name="${sIdx}" value="${escapeHtml(server.name)}" />
        <button type="button" class="icon-btn" data-server-back-to-list="${sIdx}" aria-label="Volver a la lista de servidores" title="Volver a la lista">${ICONS.list}</button>
      `
      : `<select data-server-select="${sIdx}">${options}</select>`;

    return `
      <div class="server-block">
        <div class="server-block__header">
          <span class="server-icon-badge" data-server-icon="${sIdx}" style="color:${preview.color}; background:${preview.color}22;">${preview.icon}</span>
          ${selectorControl}
          <button type="button" class="icon-btn icon-btn--danger" data-remove-server="${sIdx}" aria-label="Quitar servidor" title="Quitar servidor">${ICONS.trash}</button>
        </div>
        <div class="links-list">${linksHtml}</div>
        <button type="button" class="btn btn--ghost btn--sm" data-add-link="${sIdx}">${ICONS.plus} Agregar enlace</button>
      </div>
    `;
  }

  /** Abre el modal para visualizar los enlaces de una película. */
  openViewLinks(movie) {
    const servers = movie.servers || [];
    const options = servers
      .map((server) => `<option value="${server.id}">${escapeHtml(server.name)} (${server.links.length})</option>`)
      .join('');

    const html = `
      <div class="modal modal--view" role="dialog" aria-modal="true" aria-labelledby="viewTitle">
        <header class="modal__header">
          <h2 class="modal__title" id="viewTitle">${escapeHtml(movie.name)}</h2>
          <button type="button" class="icon-btn" data-action="close" aria-label="Cerrar">${ICONS.close}</button>
        </header>
        <div class="modal__body">
          ${servers.length === 0
            ? `<div class="empty-state empty-state--modal"><p>Esta película no tiene servidores registrados.</p></div>`
            : `
              <div class="field">
                <label for="serverSelect">Servidor</label>
                <div class="select-with-badge">
                  <span class="server-icon-badge" id="serverSelectBadge"></span>
                  <select id="serverSelect">${options}</select>
                </div>
              </div>
              <div id="linksContainer" class="links-view"></div>
            `}
        </div>
      </div>
    `;
    this._open(html);

    this.overlay.querySelectorAll('[data-action="close"]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    if (servers.length === 0) return;

    const select = document.getElementById('serverSelect');
    const badge = document.getElementById('serverSelectBadge');
    const container = document.getElementById('linksContainer');

    const updateBadge = (serverId) => {
      const server = servers.find((s) => s.id === serverId);
      const { color, icon } = getServerIcon(server ? server.name : '');
      badge.style.color = color;
      badge.style.background = `${color}22`;
      badge.innerHTML = icon;
    };

    const renderLinks = (serverId) => {
      updateBadge(serverId);
      const server = servers.find((s) => s.id === serverId);
      if (!server || server.links.length === 0) {
        container.innerHTML = `<div class="empty-state empty-state--modal"><p>Este servidor no tiene enlaces registrados.</p></div>`;
        return;
      }
      container.innerHTML = server.links
        .map((link, idx) => `
          <div class="link-view-group">
            <span class="link-view-group__label">Enlace ${idx + 1}</span>
            ${this._linkRowHtml('Original', link.original)}
            ${this._linkRowHtml('Acortador', link.short)}
          </div>
        `)
        .join('');

      container.querySelectorAll('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await copyToClipboard(btn.dataset.copy);
          ok ? Toast.success('Enlace copiado al portapapeles.') : Toast.error('No se pudo copiar el enlace.');
        });
      });
      container.querySelectorAll('[data-open]').forEach((btn) => {
        btn.addEventListener('click', () => openInNewTab(btn.dataset.open));
      });
    };

    select.addEventListener('change', () => renderLinks(select.value));
    renderLinks(servers[0].id);
  }

  _linkRowHtml(label, url) {
    if (!url) {
      return `
        <div class="link-row link-row--empty">
          <span class="link-row__label">${label}</span>
          <span class="link-row__url">Sin registrar</span>
        </div>
      `;
    }
    return `
      <div class="link-row">
        <span class="link-row__label">${label}</span>
        <span class="link-row__url" title="${escapeHtml(url)}">${escapeHtml(url)}</span>
        <div class="link-row__actions">
          <button type="button" class="icon-btn" data-copy="${escapeHtml(url)}" title="Copiar">${ICONS.copy}</button>
          <button type="button" class="icon-btn" data-open="${escapeHtml(url)}" title="Abrir">${ICONS.external}</button>
        </div>
      </div>
    `;
  }

  /** Abre un modal de confirmación genérico. Devuelve una Promise<boolean>. */
  confirm({ title, message, confirmLabel = 'Eliminar', danger = true }) {
    return new Promise((resolve) => {
      const html = `
        <div class="modal modal--confirm" role="alertdialog" aria-modal="true">
          <header class="modal__header">
            <h2 class="modal__title">${escapeHtml(title)}</h2>
          </header>
          <div class="modal__body">
            <p>${escapeHtml(message)}</p>
          </div>
          <footer class="modal__footer">
            <button type="button" class="btn btn--ghost" id="confirmCancel">Cancelar</button>
            <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" id="confirmOk">${escapeHtml(confirmLabel)}</button>
          </footer>
        </div>
      `;
      this._open(html);

      const cleanup = (result) => {
        this.close();
        resolve(result);
      };

      document.getElementById('confirmCancel').addEventListener('click', () => cleanup(false));
      document.getElementById('confirmOk').addEventListener('click', () => cleanup(true));
    });
  }
}

const ICONS = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  duplicate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
};
