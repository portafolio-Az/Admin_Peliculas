/**
 * storage.js
 * Capa de persistencia. Expone un único objeto global `storageService` con
 * una interfaz async fija (getAll, addMovie, updateMovie, deleteMovie,
 * replaceAll, exportData, importData, subscribe) sin importar qué backend
 * esté detrás. El resto de la aplicación (crud.js) solo habla con esa
 * interfaz, así que cambiar de backend nunca requiere tocar otro archivo.
 *
 * Backends disponibles:
 *  - LocalStorageService: guarda en el navegador (modo por defecto, sin configuración).
 *  - FirestoreStorageService: sincroniza en tiempo real vía Firebase Firestore,
 *    para ver los mismos datos desde el celular, la laptop, etc.
 *
 * Depende de firebase-config.js (FIREBASE_CONFIG, FIREBASE_ENABLED), que debe
 * cargarse antes que este archivo en index.html.
 */

const STORAGE_KEY = 'movieLinkManager.movies.v1';
const FIRESTORE_COLLECTION = 'movies';

/* ==========================================================================
   Backend local (localStorage)
   ========================================================================== */

class LocalStorageService {
  constructor() {
    this.mode = 'local';
  }

  async getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Error leyendo LocalStorage:', err);
      return [];
    }
  }

  async _saveAll(movies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
      return true;
    } catch (err) {
      console.error('Error guardando en LocalStorage:', err);
      return false;
    }
  }

  async addMovie(movie) {
    const movies = await this.getAll();
    movies.unshift(movie);
    await this._saveAll(movies);
    return movie;
  }

  async updateMovie(id, data) {
    const movies = await this.getAll();
    const idx = movies.findIndex((m) => m.id === id);
    if (idx === -1) {
      // No debería pasar en condiciones normales, pero si un guardado previo
      // falló silenciosamente (cuota excedida, almacenamiento deshabilitado),
      // se inserta en vez de lanzar un error que rompería la interfaz.
      movies.unshift(data);
    } else {
      movies[idx] = { ...movies[idx], ...data };
    }
    await this._saveAll(movies);
    return data;
  }

  async deleteMovie(id) {
    const movies = await this.getAll();
    await this._saveAll(movies.filter((m) => m.id !== id));
  }

  async replaceAll(movies) {
    await this._saveAll(movies);
  }

  async exportData() {
    const movies = await this.getAll();
    return {
      app: 'Administrador de Enlaces de Películas',
      version: 1,
      exportedAt: new Date().toISOString(),
      movies,
    };
  }

  async importData(payload) {
    if (!payload || !Array.isArray(payload.movies)) {
      throw new Error('El archivo JSON no tiene el formato esperado.');
    }
    await this._saveAll(payload.movies);
    return payload.movies;
  }

  /**
   * Sincronización básica entre pestañas del mismo navegador: el evento
   * "storage" solo se dispara en OTRAS pestañas, no en la que hizo el cambio,
   * lo cual es exactamente lo que queremos (evita relecturas innecesarias).
   */
  subscribe(callback) {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        this.getAll().then(callback);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

/* ==========================================================================
   Backend Firebase Firestore
   ========================================================================== */

class FirestoreStorageService {
  constructor(config) {
    this.mode = 'firebase';
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    this.db = firebase.firestore();
    this.collection = this.db.collection(FIRESTORE_COLLECTION);
  }

  async getAll() {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async addMovie(movie) {
    await this.collection.doc(movie.id).set(movie);
    return movie;
  }

  async updateMovie(id, data) {
    await this.collection.doc(id).set(data);
    return data;
  }

  async deleteMovie(id) {
    await this.collection.doc(id).delete();
  }

  /** Reemplaza toda la colección: borra lo existente y escribe la lista nueva. */
  async replaceAll(movies) {
    const existing = await this.collection.get();
    const batchDelete = this.db.batch();
    existing.docs.forEach((doc) => batchDelete.delete(doc.ref));
    await batchDelete.commit();

    // Firestore permite un máximo de 500 operaciones por batch.
    const chunkSize = 400;
    for (let i = 0; i < movies.length; i += chunkSize) {
      const batchWrite = this.db.batch();
      movies.slice(i, i + chunkSize).forEach((movie) => {
        batchWrite.set(this.collection.doc(movie.id), movie);
      });
      await batchWrite.commit();
    }
  }

  async exportData() {
    const movies = await this.getAll();
    return {
      app: 'Administrador de Enlaces de Películas',
      version: 1,
      exportedAt: new Date().toISOString(),
      movies,
    };
  }

  async importData(payload) {
    if (!payload || !Array.isArray(payload.movies)) {
      throw new Error('El archivo JSON no tiene el formato esperado.');
    }
    await this.replaceAll(payload.movies);
    return payload.movies;
  }

  /** Escucha cambios en tiempo real (incluye cambios hechos desde otros dispositivos). */
  subscribe(callback) {
    const unsubscribe = this.collection.onSnapshot(
      (snapshot) => callback(snapshot.docs.map((doc) => doc.data())),
      (err) => console.error('Error en la sincronización con Firestore:', err)
    );
    return unsubscribe;
  }
}

/* ==========================================================================
   Selección automática de backend
   ========================================================================== */

function createStorageService() {
  const firebaseConfigured =
    typeof FIREBASE_ENABLED !== 'undefined' &&
    FIREBASE_ENABLED === true &&
    typeof FIREBASE_CONFIG !== 'undefined' &&
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== 'TU_API_KEY';

  if (firebaseConfigured) {
    try {
      if (typeof firebase === 'undefined') {
        throw new Error('El SDK de Firebase no se cargó (revisa tu conexión a internet o los <script> en index.html).');
      }
      return new FirestoreStorageService(FIREBASE_CONFIG);
    } catch (err) {
      console.error('No se pudo inicializar Firebase, usando almacenamiento local como respaldo:', err);
      return new LocalStorageService();
    }
  }
  return new LocalStorageService();
}

const storageService = createStorageService();
