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
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: 'TU_SENDER_ID',
  appId: 'TU_APP_ID',
};

/* Cambia esto a "true" una vez que hayas completado FIREBASE_CONFIG arriba
   y creado la base de datos Firestore en tu proyecto. */
const FIREBASE_ENABLED = false;
