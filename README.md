# Administrador de Enlaces de Películas

Panel administrativo para organizar películas, sus servidores de descarga/streaming y los enlaces originales junto con sus versiones acortadas. Proyecto 100% estático: HTML5, CSS3 y JavaScript ES6+ puro, sin frameworks ni backend.

## Características

- CRUD completo de películas (crear, editar, eliminar, duplicar, consultar).
- Cada película puede tener múltiples servidores (Mega, Mediafire, Google Drive, Dropbox, Pixeldrain, Otro...).
- Cada servidor admite hasta 4 pares de enlaces (original + acortador).
- Buscador instantáneo por nombre, sin necesidad de presionar Enter.
- Orden por nombre, fecha de creación o última modificación.
- Paginación automática cuando hay muchos registros.
- Copiar enlaces al portapapeles y abrirlos en una nueva pestaña.
- Exportar/importar toda la base de datos como archivo JSON.
- Notificaciones tipo toast, confirmaciones antes de eliminar, estados vacíos y loader inicial.
- Persistencia automática en `localStorage` — no requiere servidor.

## Estructura del proyecto

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js       # Punto de entrada, conecta UI y lógica de negocio
│   ├── storage.js   # Capa de persistencia (localStorage)
│   ├── crud.js       # Lógica de negocio (crear/leer/actualizar/eliminar/duplicar)
│   ├── ui.js         # Renderizado de tabla, contadores y paginación
│   ├── modal.js       # Modales (formulario, visor de enlaces, confirmaciones)
│   └── utils.js       # Helpers (fechas, toasts, portapapeles, import/export JSON)
├── assets/
│   └── icons/
└── README.md
```

## Uso local

Abre `index.html` directamente en tu navegador (doble clic funciona). No requiere instalación, build, dependencias ni servidor local — los scripts se cargan como `<script>` planos en orden de dependencia (`utils → storage → crud → modal → ui → app`) precisamente para evitar los bloqueos CORS que los navegadores aplican a los módulos ES (`type="module"`) cuando se abren bajo el protocolo `file://`.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En "Source" selecciona la rama principal (`main`) y la carpeta raíz (`/`).
4. Guarda; GitHub te dará una URL pública en unos minutos.

## Publicar en Netlify

1. Arrastra la carpeta del proyecto al panel de Netlify ("Deploys" → arrastrar y soltar), o conecta el repositorio de GitHub.
2. No se requiere configurar comando de build ni carpeta de publicación especial: el sitio ya es estático (raíz = `/`).

## Respaldo de datos

Usa el botón **Exportar** para descargar un archivo `.json` con toda tu base de datos, y **Importar** para restaurarla en cualquier navegador o dispositivo. Como los datos viven en `localStorage`, son locales a cada navegador — exporta periódicamente si quieres conservarlos.

## Migración futura a una base de datos real

Toda la persistencia está aislada en `js/storage.js`. Para migrar a Firebase, Supabase o Appwrite, basta con reemplazar los métodos `getAll`, `saveAll`, `exportData` e `importData` de `StorageService` por llamadas a la API correspondiente — el resto de la aplicación (`crud.js`, `ui.js`, `modal.js`, `app.js`) no necesita cambios porque solo consume `storageService` a través de una interfaz async.
