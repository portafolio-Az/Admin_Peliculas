/**
 * crud.js
 * Lógica de negocio: crear, leer, actualizar, eliminar y duplicar películas.
 * Mantiene una copia en memoria sincronizada con storage.js.
 */

/* Depende de storage.js (storageService) y utils.js (generateId, nowISO),
   que deben cargarse antes que este archivo en index.html. */

class MovieRepository {
  constructor() {
    this.movies = [];
  }

  async init() {
    this.movies = await storageService.getAll();
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
    this.movies.unshift(movie);
    await storageService.saveAll(this.movies);
    return movie;
  }

  /** Actualiza una película existente. */
  async update(id, data) {
    const movie = this.getById(id);
    if (!movie) throw new Error('Película no encontrada.');
    movie.name = data.name.trim();
    movie.servers = this._normalizeServers(data.servers);
    movie.updatedAt = nowISO();
    await storageService.saveAll(this.movies);
    return movie;
  }

  /** Elimina una película por id. */
  async remove(id) {
    this.movies = this.movies.filter((movie) => movie.id !== id);
    await storageService.saveAll(this.movies);
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
    this.movies.unshift(copy);
    await storageService.saveAll(this.movies);
    return copy;
  }

  async replaceAll(movies) {
    this.movies = movies;
    await storageService.saveAll(this.movies);
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
