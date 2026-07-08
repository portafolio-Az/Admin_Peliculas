/**
 * crud.js
 * Lógica de negocio: crear, leer, actualizar, eliminar y duplicar películas.
 * Mantiene una copia en memoria sincronizada con storage.js, tanto por
 * escritura directa (optimista) como por el listener en tiempo real de
 * storageService.subscribe (útil para el backend de Firestore, donde otro
 * dispositivo puede modificar los datos en cualquier momento).
 */

/* Depende de storage.js (storageService) y utils.js (generateId, nowISO),
   que deben cargarse antes que este archivo en index.html. */

class MovieRepository {
  constructor() {
    this.movies = [];
    this._unsubscribe = null;
  }

  /**
   * Carga los datos iniciales y, si el backend lo soporta, se suscribe a
   * cambios en tiempo real. `onRemoteChange` se invoca cada vez que los
   * datos cambian por sincronización (por ejemplo, desde otro dispositivo).
   */
  async init(onRemoteChange) {
    this.movies = await storageService.getAll();
    if (typeof storageService.subscribe === 'function') {
      this._unsubscribe = storageService.subscribe((movies) => {
        this.movies = movies;
        if (typeof onRemoteChange === 'function') onRemoteChange();
      });
    }
    return this.movies;
  }

  getAll() {
    return this.movies;
  }

  getById(id) {
    return this.movies.find((movie) => movie.id === id) || null;
  }

  /** Crea una nueva película. `data` = { name, servers } */
  async create(data) {
    const movie = {
      id: generateId('movie'),
      name: data.name.trim(),
      servers: this._normalizeServers(data.servers),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await storageService.addMovie(movie);
    this.movies.unshift(movie);
    return movie;
  }

  /** Actualiza una película existente. */
  async update(id, data) {
    const movie = this.getById(id);
    if (!movie) throw new Error('Película no encontrada.');
    const updated = {
      ...movie,
      name: data.name.trim(),
      servers: this._normalizeServers(data.servers),
      updatedAt: nowISO(),
    };
    await storageService.updateMovie(id, updated);
    const idx = this.movies.findIndex((m) => m.id === id);
    this.movies[idx] = updated;
    return updated;
  }

  /** Elimina una película por id. */
  async remove(id) {
    await storageService.deleteMovie(id);
    this.movies = this.movies.filter((movie) => movie.id !== id);
  }

  /** Duplica una película, incluyendo todos sus servidores y enlaces. */
  async duplicate(id) {
    const original = this.getById(id);
    if (!original) throw new Error('Película no encontrada.');
    const copy = {
      ...structuredClone(original),
      id: generateId('movie'),
      name: `${original.name} (copia)`,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    copy.servers = copy.servers.map((server) => ({ ...server, id: generateId('server') }));
    await storageService.addMovie(copy);
    this.movies.unshift(copy);
    return copy;
  }

  async replaceAll(movies) {
    await storageService.replaceAll(movies);
    this.movies = movies;
  }

  /** Actualiza solo la copia en memoria, sin volver a escribir en el backend
      (útil después de storageService.importData, que ya persistió los datos). */
  setLocal(movies) {
    this.movies = movies;
  }

  destroy() {
    if (this._unsubscribe) this._unsubscribe();
  }

  /** Normaliza la estructura de servidores/enlaces, asignando ids si faltan. */
  _normalizeServers(servers = []) {
    return servers
      .filter((server) => server.name && server.name.trim())
      .map((server) => ({
        id: server.id || generateId('server'),
        name: server.name.trim(),
        links: (server.links || [])
          .filter((link) => (link.original && link.original.trim()) || (link.short && link.short.trim()))
          .slice(0, 4)
          .map((link) => ({
            original: (link.original || '').trim(),
            short: (link.short || '').trim(),
          })),
      }));
  }
}

const movieRepository = new MovieRepository();
