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

&nbsp;&nbsp;&nbsp; .
&nbsp;&nbsp;&nbsp; ├── controller/
&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; └── ideasController.js &nbsp;# Lógica de negocio y control de rutas
&nbsp;&nbsp;&nbsp; ├── dev-data/
&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; └── ideas.json &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Archivo que funciona como base de datos
&nbsp;&nbsp;&nbsp; ├── Models/
&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; └── ideasModels.js &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Funciones de lectura y validación de datos
&nbsp;&nbsp;&nbsp; ├── Routes/
&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; └── ideasRoute.js &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Definición de rutas (endpoints)
&nbsp;&nbsp;&nbsp; ├── node_modules/
&nbsp;&nbsp;&nbsp; ├── .gitignore
&nbsp;&nbsp;&nbsp; ├── index.js &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Punto de entrada del servidor
&nbsp;&nbsp;&nbsp; ├── package.json
&nbsp;&nbsp;&nbsp; └── package-lock.json

### Modelo de Datos (`ideas.json`)

El archivo JSON principal contiene un objeto con la descripción general y un array de objetos de ideas.

&nbsp;&nbsp;&nbsp; {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "actividades_santiago": {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "descripcion": "50 Ideas y panoramas para jóvenes (15-40 años) en Santiago de Chile y en casa.",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "ideas": [
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "ID": "1",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "idea": "Subir el Cerro San Cristóbal a pie o en bici (para los fit) y bajar en teleférico (para la foto de Instagram).",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "ubicacion": "Parque Metropolitano, Providencia",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "etiquetas": [
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "outdoor",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "deporte",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "vista",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "panorama",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "barato"
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; },
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "ID": "2",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "idea": "Noche de Catan, Dixit o el juego de mesa que arruina amistades de turno.",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "ubicacion": "En casa",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "etiquetas": [
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "indoor",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "juego",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "amigos",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "social",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "barato"
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; }
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; ]
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp; }
&nbsp;&nbsp;&nbsp; }

---

## 📖 Documentación de Endpoints

A continuación se detallan los endpoints disponibles en la API.

### 1. Obtener Todas las Ideas

-   **Método:** `GET`
-   **Endpoint:** `/` o `/ideas`
-   **Descripción:** Devuelve el objeto completo, incluyendo la lista de todas las ideas.
-   **Ejemplo con `curl`:**

&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; curl -X GET http://quehacersantiago-production.up.railway.app/ideas

-   **Respuesta Exitosa (200 OK):** Muestra el contenido completo de `ideas.json`.

### 2. Obtener una Idea Específica por ID

-   **Método:** `GET`
-   **Endpoint:** `/ideas?id=<IDEA_ID>` (También funciona con `/`)
-   **Descripción:** Busca y devuelve el objeto de una única idea que coincida con el `id` proporcionado.
-   **Parámetros de Consulta:**
&nbsp;&nbsp;&nbsp; -   `id` (string, requerido): El ID de la idea a buscar.
-   **Ejemplo con `curl`:**

&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; curl -X GET "http://quehacersantiago-production.up.railway.app/ideas?id=1"

-   **Respuesta Exitosa (200 OK):**

&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "ID": "1",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "idea": "Subir el Cerro San Cristóbal a pie o en bici (para los fit) y bajar en teleférico (para la foto de Instagram).",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "ubicacion": "Parque Metropolitano, Providencia",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "etiquetas": [
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "outdoor",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "deporte",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "vista",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "panorama",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; "barato"
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; ]
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; }

-   **Respuesta de Error (404 Not Found):** Si no se encuentra la idea.

&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; { "Error": "Idea no existe" }

### 3. Crear una Nueva Idea

-   **Método:** `POST`
-   **Endpoint:** `/ideas`
-   **Descripción:** Agrega una nueva idea a la lista.
-   **Cuerpo de la Solicitud (Body - raw JSON):**

&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; {
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "idea": "Ir a Fantasilandia",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "ubicacion": "Parque O'Higgins",
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; &nbsp;&nbsp; "etiquetas": ["parque", "juegos", "adrenalina"]
&nbsp;&nbsp;&nbsp; &nbsp;&nbsp