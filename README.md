# Administrador de Enlaces de Películas

Panel administrativo para organizar películas, sus servidores de descarga/streaming y los enlaces originales junto con sus versiones acortadas. Proyecto 100% estático: HTML5, CSS3 y JavaScript ES6+ puro, sin frameworks.

## Características

- CRUD completo de películas (crear, editar, eliminar, duplicar, consultar).
- Cada película puede tener múltiples servidores, con insignias de icono reconocibles (Mega, Mediafire, Google Drive, Dropbox, OneDrive, 4shared, Descarga Directa, Otro).
- Cada servidor admite hasta 4 pares de enlaces (original + acortador).
- Buscador instantáneo por nombre, sin necesidad de presionar Enter.
- Orden por nombre, fecha de creación o última modificación.
- Paginación automática cuando hay muchos registros; tabla convertida en tarjetas en pantallas pequeñas.
- Copiar enlaces al portapapeles y abrirlos en una nueva pestaña.
- Exportar/importar toda la base de datos como archivo JSON.
- Notificaciones tipo toast, confirmaciones antes de eliminar, estados vacíos y loader inicial.
- **Dos modos de almacenamiento intercambiables:**
  - **Local** (por defecto): guarda en `localStorage` del navegador, sin configuración.
  - **Firebase Firestore** (opcional): sincroniza en tiempo real entre celular, laptop y cualquier otro dispositivo. Ver guía abajo.

## Estructura del proyecto

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js              # Punto de entrada, conecta UI y lógica de negocio
│   ├── firebase-config.js  # Tus credenciales de Firebase (opcional)
│   ├── storage.js          # Capa de persistencia (localStorage o Firestore)
│   ├── crud.js              # Lógica de negocio (crear/leer/actualizar/eliminar/duplicar)
│   ├── ui.js                # Renderizado de tabla, contadores y paginación
│   ├── modal.js              # Modales (formulario, visor de enlaces, confirmaciones)
│   └── utils.js              # Helpers, catálogo de iconos de servidores, toasts, import/export
├── assets/
│   └── icons/
└── README.md
```

## Uso local

Abre `index.html` directamente en tu navegador (doble clic funciona). No requiere instalación, build ni servidor local — los scripts se cargan como `<script>` planos en orden de dependencia (`utils → SDK de Firebase + firebase-config → storage → crud → modal → ui → app`) precisamente para evitar los bloqueos CORS que los navegadores aplican a los módulos ES (`type="module"`) bajo el protocolo `file://`.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En "Source" selecciona la rama principal (`main`) y la carpeta raíz (`/`).
4. Guarda; GitHub te dará una URL pública en unos minutos.

## Publicar en Netlify

1. Arrastra la carpeta del proyecto al panel de Netlify ("Deploys" → arrastrar y soltar), o conecta el repositorio de GitHub.
2. No se requiere configurar comando de build ni carpeta de publicación especial: el sitio ya es estático (raíz = `/`).

## Respaldo de datos (modo local)

Usa el botón **Exportar** para descargar un archivo `.json` con toda tu base de datos, y **Importar** para restaurarla en cualquier navegador o dispositivo. Si usas el modo local, los datos viven solo en el navegador donde los creaste — exporta periódicamente si quieres conservarlos, o mejor, configura Firebase (ver abajo) para no depender de un solo dispositivo.

---

## Conectar Firebase Firestore paso a paso

Con esto tus datos se guardan en la nube y se sincronizan automáticamente entre tu celular, tu laptop y cualquier navegador donde abras el sitio — sin exportar/importar manualmente.

### 1. Crear el proyecto de Firebase

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. Clic en **"Agregar proyecto"**, ponle un nombre (ej. `admin-peliculas`) y sigue el asistente (puedes desactivar Google Analytics, no lo necesitas para esto).

### 2. Crear la base de datos Firestore

1. En el menú lateral del proyecto, ve a **Compilación → Firestore Database**.
2. Clic en **"Crear base de datos"**.
3. Elige la ubicación del servidor (cualquiera cercana a tus usuarios, ej. `us-central` o `southamerica-east1`).
4. Selecciona **"Iniciar en modo de prueba"** por ahora (permite lectura/escritura abierta por 30 días; más abajo te explico cómo asegurarla después).

### 3. Registrar una app web y obtener tus credenciales

1. En la página principal del proyecto (ícono ⚙️ **Configuración del proyecto**), baja hasta **"Tus apps"**.
2. Clic en el ícono **`</>`** (Web) para agregar una app web.
3. Ponle un apodo (ej. `admin-peliculas-web`) y clic en **"Registrar app"**. **No** necesitas activar Firebase Hosting.
4. Firebase te mostrará un bloque `firebaseConfig` como este:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "admin-peliculas.firebaseapp.com",
     projectId: "admin-peliculas",
     storageBucket: "admin-peliculas.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### 4. Pegar tus credenciales en el proyecto

Abre `js/firebase-config.js` y reemplaza los valores de `FIREBASE_CONFIG` con los que copiaste, luego cambia `FIREBASE_ENABLED` a `true`:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "admin-peliculas.firebaseapp.com",
  projectId: "admin-peliculas",
  storageBucket: "admin-peliculas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};

const FIREBASE_ENABLED = true;
```

Guarda el archivo. Al recargar `index.html` verás una insignia verde **"Sincronizado en la nube"** junto a los contadores — eso confirma que ya está usando Firestore.

> **Nota sobre el `apiKey`:** en apps web de Firebase este valor no es secreto (queda visible en el código del navegador). La seguridad real la dan las **reglas de Firestore** (siguiente paso), no ocultar el `apiKey`.

### 5. Asegurar las reglas de Firestore

El "modo de prueba" del paso 2 abre lectura/escritura a cualquiera por 30 días y luego se bloquea solo. Para uso personal (tú y quien más tenga el link), una opción simple es dejarlo así mientras pruebas, pero **antes de compartir el link públicamente**, ve a **Firestore Database → Reglas** y usa algo como esto para que no expire y sea razonablemente privado a quien conozca la URL del proyecto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /movies/{movieId} {
      allow read, write: if true;
    }
  }
}
```

Esto sigue siendo abierto (cualquiera con tu `apiKey` podría leer/escribir), suficiente para un proyecto personal/portafolio. Si más adelante quieres restringirlo solo a ti, la forma correcta es agregar **Firebase Authentication** (inicio de sesión) y cambiar la regla a `allow read, write: if request.auth != null;` — es un paso adicional que no está incluido en esta versión, pero la arquitectura de `storage.js` ya está lista para incorporarlo sin tocar el resto de la app.

### 6. Probar la sincronización

1. Abre el sitio (local o publicado) en tu celular y en tu laptop al mismo tiempo.
2. Agrega una película en un dispositivo.
3. Debería aparecer automáticamente en el otro en segundos, sin recargar la página — eso es Firestore sincronizando en tiempo real.

### Volver al modo local

Si en algún momento quieres desactivar Firebase (por ejemplo, para probar algo sin afectar tus datos en la nube), simplemente cambia `FIREBASE_ENABLED` a `false` en `js/firebase-config.js`. La app volverá a usar `localStorage` de inmediato.

## Arquitectura de almacenamiento

Toda la persistencia está aislada en `js/storage.js`, que expone un único objeto `storageService` con una interfaz fija (`getAll`, `addMovie`, `updateMovie`, `deleteMovie`, `replaceAll`, `exportData`, `importData`, `subscribe`) sin importar el backend. El resto de la app (`crud.js`, `ui.js`, `modal.js`, `app.js`) solo habla con esa interfaz, así que cambiar de backend — o migrar en el futuro a Supabase/Appwrite — no requiere tocar nada más que ese archivo.
