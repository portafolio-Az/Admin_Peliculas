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
  apiKey: "AIzaSyCeVhlqOLp-yQ2fQndiijcW057zY1AAm9k",
  authDomain: "sistema-cuentas-b0bbe.firebaseapp.com",
  projectId: "sistema-cuentas-b0bbe",
  storageBucket: "sistema-cuentas-b0bbe.firebasestorage.app",
  messagingSenderId: "734076486112",
  appId: "1:734076486112:web:3f1ea891e5906b730d6b85",
  measurementId: "G-3CPE8PKLNT",
};

/* Cambia esto a "true" una vez que hayas completado FIREBASE_CONFIG arriba
   y creado la base de datos Firestore en tu proyecto. */
const FIREBASE_ENABLED = true;
