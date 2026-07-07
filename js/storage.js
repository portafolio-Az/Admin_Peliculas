/**
 * storage.js
 * Capa de persistencia. Toda la interacción con LocalStorage vive aquí,
 * de modo que en el futuro se pueda sustituir por Firebase / Supabase / Appwrite
 * sin tocar el resto de la aplicación (ver métodos async).
 */

const STORAGE_KEY = 'movieLinkManager.movies.v1';

class StorageService {
  /** Devuelve todas las películas almacenadas. */
  async getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Error leyendo LocalStorage:', err);
      return [];
    }
  }

  /** Sobrescribe por completo la colección de películas. */
  async saveAll(movies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
      return true;
    } catch (err) {
      console.error('Error guardando en LocalStorage:', err);
      return false;
    }
  }

  /** Elimina toda la información almacenada. */
  async clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Exporta toda la base de datos como objeto plano listo para descargar. */
  async exportData() {
    const movies = await this.getAll();
    return {
      app: 'Administrador de Enlaces de Películas',
      version: 1,
      exportedAt: new Date().toISOString(),
      movies,
    };
  }

  /** Importa datos desde un objeto (validando estructura mínima). */
  async importData(payload) {
    if (!payload || !Array.isArray(payload.movies)) {
      throw new Error('El archivo JSON no tiene el formato esperado.');
    }
    await this.saveAll(payload.movies);
    return payload.movies;
  }
}

const storageService = new StorageService();
