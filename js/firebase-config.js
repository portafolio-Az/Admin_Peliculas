/**
 * firebase-config.js
 * -----------------------------------------------------------------------
 * Pega aquí la configuración de TU proyecto de Firebase (la encuentras en
 * Firebase Console → ⚙️ Configuración del proyecto → General → "Tus apps" →
 * ícono web </> → "Config"). Instrucciones completas paso a paso en README.md.
 *
 * Mientras FIREBASE_ENABLED esté en false, la aplicación funciona 100% en
 * modo local (localStorage), exactamente como antes — no se requiere
 * ninguna configuración para seguir usándola sin conexión.
 * -----------------------------------------------------------------------
 */

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDrSmWU_kG-6Ay6MCliacNbvyCPeLhUjLA',
  authDomain: 'admin-peliculas.firebaseapp.com',
  projectId: 'admin-peliculas',
  storageBucket: 'admin-peliculas.firebasestorage.app',
  messagingSenderId: '381742107664',
  appId: '1:381742107664:web:b2d6eec54c5ca9e2c7ce95',
};

/* Cambia esto a "true" una vez que hayas completado FIREBASE_CONFIG arriba
   y creado la base de datos Firestore en tu proyecto. */
const FIREBASE_ENABLED = true;
