# API de Ideas "Qué Hacer en Santiago"

Una API RESTful básica construida con **Node.js** y **Express** para gestionar un listado de ideas y panoramas para hacer en Santiago. Permite realizar operaciones CRUD completas (Crear, Leer, Actualizar y Eliminar) sobre las ideas.

---

## 🚀 URL de la API en Producción

Puedes interactuar con la API en vivo a través de la siguiente URL base desplegada en Railway:

**URL Base:** `http://quehacersantiago-production.up.railway.app/`

---

## ✨ Características Principales

-   **Gestión de Ideas**: La API opera sobre un único objeto JSON que contiene una lista de ideas.
-   **CRUD de Ideas**: Funcionalidad completa para Crear, Leer, Actualizar y Eliminar ideas.
-   **Obtener Idea Aleatoria**: Un endpoint específico para obtener una idea al azar.
-   **Validación de Datos**: Funciones helper para asegurar la longitud de los datos de entrada.
-   **Persistencia Local**: Los datos se almacenan y leen desde un archivo `ideas.json`, simulando una base de datos.
-   **IDs Únicos**: Generación automática de identificadores únicos (UUID v4) para cada nueva idea.

---

## 💻 Tecnologías Utilizadas

-   **Node.js**: Entorno de ejecución para JavaScript del lado del servidor.
-   **Express.js**: Framework minimalista para la construcción de la API REST.
-   **uuid**: Librería para la generación de identificadores únicos universales (UUID v4).

---

## 🔧 Estructura del Proyecto y Datos

El proyecto sigue una estructura MVC (Modelo-Vista-Controlador) básica y los datos persisten en un archivo JSON local.

### Estructura de Carpetas

    .
    ├── dev-data/
    │   └── ideas.json        # Archivo que funciona como base de datos
    ├── node_modules/
    ├── .gitignore
    ├── index.js             # Lógica principal del servidor y endpoints
    ├── package.json
    └── package-lock.json
    ├── controller/
    └── ideasController.js   # Lógica de negocio y control de rutas
    ├── Models/
    └── ideasModels.js       # Funciones de lectura y validación de datos
    ├── Routes/
    └── ideasRoute.js        # Definición de rutas (endpoints)

### Modelo de Datos (`ideas.json`)

El archivo JSON principal contiene un objeto con la descripción general y un array de objetos de ideas.

```json
{
  "actividades_santiago": {
    "descripcion": "50 Ideas y panoramas para jóvenes (15-40 años) en Santiago de Chile y en casa.",
    "ideas": [
      {
        "ID": "1",
        "idea": "Subir el Cerro San Cristóbal a pie o en bici (para los fit) y bajar en teleférico (para la foto de Instagram).",
        "ubicacion": "Parque Metropolitano, Providencia",
        "etiquetas": [ "outdoor", "deporte", "vista", "panorama", "barato" ]
      },
      {
        "ID": "2",
        "idea": "Noche de Catan, Dixit o el juego de mesa que arruina amistades de turno.",
        "ubicacion": "En casa",
        "etiquetas": [ "indoor", "juego", "amigos", "social", "barato" ]
      }
    ]
  }
}
```
---

## 📖 Documentación de Endpoints

A continuación se detallan los endpoints disponibles en la API.

### 1. Obtener Todas las Ideas

-   **Método:** `GET`
-   **Endpoint:** `/` o `/ideas`
-   **Descripción:** Devuelve el objeto completo, incluyendo la lista de todas las ideas.
-   **Ejemplo con `curl`:**

curl -X GET http://quehacersantiago-production.up.railway.app/ideas


-   **Respuesta Exitosa (200 OK):** Muestra el contenido completo de `ideas.json`.

### 2. Obtener una Idea Específica por ID

-   **Método:** `GET`
-   **Endpoint:** `/ideas?id=<IDEA_ID>` (También funciona con `/`)
-   **Descripción:** Busca y devuelve el objeto de una única idea que coincida con el `id` proporcionado.
-   **Parámetros de Consulta:**
&nbsp;&nbsp;&nbsp; -   `id` (string, requerido): El ID de la idea a buscar.
-   **Ejemplo con `curl`:**

curl -X GET "http://quehacersantiago-production.up.railway.app/ideas?id=1"


-   **Respuesta Exitosa (200 OK):**
```json
{
    "ID": "1",
    "idea": "Subir el Cerro San Cristóbal a pie o en bici (para los fit) y bajar en teleférico (para la foto de Instagram).",
    "ubicacion": "Parque Metropolitano, Providencia",
    "etiquetas": [
        "outdoor",
        "deporte",
        "vista",
        "panorama",
        "barato"
    ]
}
```
-   **Respuesta de Error (404 Not Found):** Si no se encuentra la idea.

```json
{ "Error": "Idea no existe" }
```

### 3. Crear una Nueva Idea

-   **Método:** `POST`
-   **Endpoint:** `/ideas`
-   **Descripción:** Agrega una nueva idea a la lista.
-   **Cuerpo de la Solicitud (Body - raw JSON):**
```json
{
    "idea": "Ir a Fantasilandia",
    "ubicacion": "Parque O'Higgins",
    "etiquetas": ["parque", "juegos", "adrenalina"]
}
```
## Descubrimiento y archivo de eventos

- Los endpoints públicos ocultan automáticamente los eventos cuya fecha final (o fecha inicial) ya pasó en `America/Santiago`.
- Los planes sin fecha se consideran permanentes y siguen visibles.
- `/admin` permite revisar planes activos, vencidos y sin fecha, además de ejecutar búsquedas de eventos y aprobar o rechazar candidatos.
- El descubrimiento consulta carteleras de bibliotecas, patrimonio, ferias editoriales y agendas de juegos bajo demanda. Biblioteca Nacional, Bibliotecas de Providencia, Patrimonio Cultural y Hoy Jugué tienen extracción directa; `GEMINI_API_KEY` sólo es necesaria para páginas no estructuradas.
- Las publicaciones de Instagram que no sean accesibles automáticamente se pueden procesar desde **Importar desde una URL** al crear un plan.
- En producción, `npm start` ejecuta `prisma db push` antes de iniciar el servidor y crea las tablas nuevas.
