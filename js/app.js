/**
 * app.js
 * Punto de entrada de la aplicación. Inicializa los módulos y conecta
 * los eventos de la interfaz con la lógica de negocio (crud.js).
 */

/* Este archivo se carga al final, después de utils.js, storage.js, crud.js,
   modal.js y ui.js, de los cuales depende (ver orden de <script> en index.html). */

class App {
  constructor() {
    this.ui = new UIController();
    this.modal = new ModalController();
    this.searchTerm = '';
  }

  async init() {
    Toast.init();
    await movieRepository.init();
    this.bindEvents();
    this.render();
    this.ui.hideLoader();
  }

  bindEvents() {
    document.getElementById('addMovieBtn').addEventListener('click', () => {
      this.modal.openMovieForm(null, async (data) => {
        await movieRepository.create(data);
        Toast.success('Película agregada correctamente.');
        this.render();
      });
    });

    document.getElementById('searchInput').addEventListener(
      'input',
      debounce((e) => {
        this.searchTerm = e.target.value.trim().toLowerCase();
        this.ui.resetPage();
        this.render();
      }, 200)
    );

    document.getElementById('sortSelect').addEventListener('change', () => {
      this.ui.resetPage();
      this.render();
    });

    document.getElementById('tableBody').addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]');
      const actionBtn = e.target.closest('[data-action]');
      if (!row || !actionBtn) return;
      const id = row.dataset.id;
      const action = actionBtn.dataset.action;
      this.handleRowAction(action, id);
    });

    document.getElementById('pagination').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const page = Number(btn.dataset.page);
      if (page < 1) return;
      this.ui.goToPage(page);
      this.render();
    });

    document.getElementById('exportBtn').addEventListener('click', async () => {
      const data = await storageService.exportData();
      const filename = `movie-links-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJSON(data, filename);
      Toast.success('Base de datos exportada.');
    });

    const importInput = document.getElementById('importInput');
    document.getElementById('importBtn').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const payload = await readJSONFile(file);
        const confirmed = await this.modal.confirm({
          title: 'Importar base de datos',
          message: `Se reemplazarán todos los datos actuales con el contenido de "${file.name}". ¿Deseas continuar?`,
          confirmLabel: 'Importar',
          danger: true,
        });
        if (!confirmed) return;
        const movies = await storageService.importData(payload);
        await movieRepository.replaceAll(movies);
        Toast.success('Base de datos importada correctamente.');
        this.render();
      } catch (err) {
        Toast.error(err.message || 'No se pudo importar el archivo.');
      } finally {
        importInput.value = '';
      }
    });
  }

  async handleRowAction(action, id) {
    const movie = movieRepository.getById(id);
    if (!movie) return;

    if (action === 'view') {
      this.modal.openViewLinks(movie);
    } else if (action === 'edit') {
      this.modal.openMovieForm(movie, async (data) => {
        await movieRepository.update(id, data);
        Toast.success('Película actualizada.');
        this.render();
      });
    } else if (action === 'duplicate') {
      await movieRepository.duplicate(id);
      Toast.success('Película duplicada.');
      this.render();
    } else if (action === 'delete') {
      const confirmed = await this.modal.confirm({
        title: 'Eliminar película',
        message: `¿Seguro que deseas eliminar "${movie.name}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (confirmed) {
        await movieRepository.remove(id);
        Toast.success('Película eliminada.');
        this.render();
      }
    }
  }

  getFilteredMovies() {
    const all = movieRepository.getAll();
    const filtered = this.searchTerm
      ? all.filter((movie) => movie.name.toLowerCase().includes(this.searchTerm))
      : all;
    const sorted = this.ui.sortMovies(filtered, document.getElementById('sortSelect').value);
    return sorted;
  }

  render() {
    const all = movieRepository.getAll();
    const filtered = this.getFilteredMovies();
    this.ui.updateCounters(all);
    this.ui.renderTable(filtered);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
