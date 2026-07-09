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
  - **Firebase Firestore** (opcional): sincroniza en tiempo real entre celular, laptop y cualquier otro dispositivo, protegido con inicio de sesión (correo/contraseña) para que solo tú puedas entrar. Ver guía abajo.

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
│   ├── auth.js              # Login (correo/contraseña) cuando Firebase está activo
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

### 5. Activar el inicio de sesión (para que solo tú puedas entrar)

Como vas a ser la única persona que use esta página, la configuramos para que pida correo y contraseña antes de mostrar nada.

1. En Firebase Console, ve a **Compilación → Authentication**.
2. Clic en **"Comenzar"**, luego en la pestaña **"Sign-in method"** habilita el proveedor **"Correo electrónico/contraseña"** (Email/Password) → Guardar.
3. Ve a la pestaña **"Users"** (Usuarios) → **"Agregar usuario"** → escribe el correo y la contraseña que vas a usar tú para entrar. Con eso ya tienes tu única cuenta.

No necesitas tocar nada más en el código: `index.html` ya carga el SDK de Firebase Auth y `js/auth.js` muestra automáticamente una pantalla de inicio de sesión antes de dejar ver el panel, **siempre que `FIREBASE_ENABLED` esté en `true`**. En modo local no aparece ningún login.

### 6. Asegurar las reglas de Firestore

Ve a **Firestore Database → Reglas** y reemplaza el contenido por esto, que solo permite leer/escribir a quien haya iniciado sesión (es decir, solo tú, con la cuenta del paso anterior):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /movies/{movieId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Publica los cambios ("Publicar"). Con esto, aunque alguien más abra el link de tu sitio, no podrá ver ni modificar tus películas sin la contraseña que creaste en el paso 5.

> **Nota sobre el `apiKey`:** en apps web de Firebase este valor no es secreto (queda visible en el código del navegador) — es normal y esperado. La seguridad real la dan estas reglas de Firestore combinadas con el login, no ocultar el `apiKey`.

### 7. Probar la sincronización

1. Abre el sitio (local o publicado) en tu celular y en tu laptop al mismo tiempo, e inicia sesión con tu correo y contraseña en ambos.
2. Agrega una película en un dispositivo.
3. Debería aparecer automáticamente en el otro en segundos, sin recargar la página — eso es Firestore sincronizando en tiempo real.
4. Junto a los contadores verás una insignia verde **"Sincronizado en la nube"** y un botón de cerrar sesión — eso confirma que Firebase + login están activos.

### Volver al modo local

Si en algún momento quieres desactivar Firebase (por ejemplo, para probar algo sin afectar tus datos en la nube), simplemente cambia `FIREBASE_ENABLED` a `false` en `js/firebase-config.js`. La app volverá a usar `localStorage` de inmediato, sin pedir login.

---

## Un dispositivo no ve los cambios / no aparece "Sincronizado en la nube"

Si un dispositivo (por ejemplo tu computadora) muestra **"Almacenamiento local"** en vez de **"Sincronizado en la nube"**, o simplemente no se actualiza, casi siempre es por **caché del navegador** sirviendo una versión vieja de los archivos (muy común justo después de subir cambios a GitHub Pages/Netlify). Revisa en este orden:

1. **Haz un refresco forzado** en ese dispositivo: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac), o abre el sitio en una ventana de incógnito. Esto ignora la caché y descarga los archivos más recientes.
2. **Confirma que subiste el mismo `js/firebase-config.js`** (con `FIREBASE_ENABLED = true` y tus credenciales) al mismo repositorio/sitio que abres desde la computadora — es fácil editarlo localmente y olvidar subir ese cambio específico.
3. **Espera 1-2 minutos** después de publicar: tanto GitHub Pages como el propio navegador tardan un poco en refrescar la versión pública.
4. **Revisa la consola del navegador** (F12 → pestaña "Console") por errores en rojo relacionados con `firebase` o `gstatic.com` — un bloqueador de anuncios o un firewall de red/antivirus a veces bloquea esos dominios.
5. Cada vez que subas cambios nuevos, sube también el número de versión (`?v=3` en los `<script>` de `index.html`) — así el navegador sabe que debe descargar la versión nueva en vez de usar la que tenía guardada. Súbelo a `?v=4`, `?v=5`, etc. en cada publicación futura.

## Arquitectura de almacenamiento

Toda la persistencia está aislada en `js/storage.js`, que expone un único objeto `storageService` con una interfaz fija (`getAll`, `addMovie`, `updateMovie`, `deleteMovie`, `replaceAll`, `exportData`, `importData`, `subscribe`) sin importar el backend. El resto de la app (`crud.js`, `ui.js`, `modal.js`, `app.js`) solo habla con esa interfaz, así que cambiar de backend — o migrar en el futuro a Supabase/Appwrite — no requiere tocar nada más que ese archivo. El control de acceso vive aparte, en `js/auth.js`, y solo se activa cuando `storageService.mode === 'firebase'`.
