# Recolector local de Que Hacer Santiago

Esta extensión privada descarga y procesa las carteleras desde Chrome o Edge. Las sugerencias se devuelven al panel `/admin` y permanecen en `localStorage`; Railway no ejecuta el scraping.

## Instalar en Chrome

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador**.
3. Presiona **Cargar extensión descomprimida**.
4. Selecciona la carpeta `browser-extension` completa.
5. Recarga la página `/admin` del sitio.

## Instalar en Edge

Repite los mismos pasos desde `edge://extensions`.

El panel debe mostrar **Recolector local conectado** antes de habilitar el botón **Buscar nuevos eventos**.

## Actualizar

Después de actualizar los archivos del proyecto, abre la página de extensiones y presiona el botón de recarga de **Que Hacer Santiago - Recolector local**. Luego recarga `/admin`.

## Permisos

La extensión sólo solicita acceso a los dominios incluidos en `host_permissions` dentro de `manifest.json`. No contiene claves de API, no usa Gemini y no escribe en PostgreSQL. Aprobar una sugerencia continúa siendo la única operación del flujo de descubrimiento que se envía al backend.
