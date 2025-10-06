# Devkit CLI

Generador profesional de proyectos fullstack con FastAPI + React o Express + Vue, soporte para múltiples bases de datos y despliegue con Podman o Docker.

## Instalación

Instala el CLI globalmente desde npm:

```sh
npm install -g devkit-cli
```

## Uso rápido

### Proyectos Fullstack

Crea un proyecto fullstack completo de forma interactiva:

```sh
devkit create
```

O salta las preguntas y usa valores por defecto:

```sh
devkit create --skip-questions
```

### Solo Frontend

Genera únicamente el frontend (React o Vue):

```sh
devkit create --frontend-only
```

Con configuración por defecto:

```sh
devkit create --frontend-only --skip-questions
```

### Solo Backend

Genera únicamente el backend (FastAPI o Express):

```sh
devkit create --backend-only
```

Con configuración por defecto:

```sh
devkit create --backend-only --skip-questions
```

### Opciones principales

- `--frontend-only` Genera solo el frontend (React o Vue)
- `--backend-only` Genera solo el backend (FastAPI o Express)
- `--with-podman` Levanta el proyecto automáticamente con podman-compose después de generarlo
- `--skip-questions` Usa configuración por defecto sin preguntas interactivas

## ¿Qué genera?

### Proyectos Fullstack
- Backend FastAPI (Python) o Express (Node.js) con CRUD de ejemplo, autenticación JWT opcional y soporte de bases de datos
- Frontend React (Vite) o Vue (Vite) con ejemplo de login, CRUD y consumo de rutas protegidas
- Estructura de proyecto completa con frontend y backend

### Solo Frontend
- Proyecto React (Vite) o Vue (Vite) con herramientas modernas
- Dockerfile y docker-compose.yml/podman-compose.yml para desarrollo con contenedores
- Estructura profesional y configuración del proyecto

### Solo Backend
- API FastAPI (Python) o Express (Node.js) con CORS habilitado
- Soporte de bases de datos: SQLite, PostgreSQL, MySQL o MongoDB
- Sistema de autenticación JWT opcional
- Dockerfile y archivos compose con servicios de base de datos
- Configuración de entorno y estructura profesional

### Características Comunes
- Archivos de configuración para desarrollo local y contenedores (Docker/Podman)
- `.gitignore` y estructura profesional del proyecto
- Entorno de desarrollo listo para usar

## Requisitos

- Node.js 20.19+ (para crear el frontend con Vite)
- Podman y podman-compose (opcional, solo si usas `--with-podman`)
- Python 3.10+ (para el backend)

## Ejemplos de Flujos de Trabajo

### Proyecto Fullstack

```sh
# 1. Crea el proyecto fullstack
devkit create

# 2. Entra a la carpeta generada
cd mi-proyecto

# 3. Levanta todo con Docker/Podman
docker-compose up --build
# o
podman-compose up --build

# 4. Accede al backend en http://localhost:8000 y al frontend en http://localhost:5173
```

### Solo Frontend

```sh
# 1. Crea frontend React
devkit create --frontend-only

# 2. Entra a la carpeta generada
cd mi-frontend

# 3. Inicia el servidor de desarrollo
npm run dev
# o con contenedores
docker-compose up

# 4. Accede al frontend en http://localhost:5173
```

### Solo Backend

```sh
# 1. Crea backend FastAPI
devkit create --backend-only

# 2. Entra a la carpeta generada
cd mi-backend

# 3. Inicia con contenedores (incluye base de datos)
docker-compose up --build

# 4. Accede a la API en http://localhost:8000
# 5. Ve la documentación en http://localhost:8000/docs
```

### Tipos de Proyecto y Personalización

#### Proyectos Fullstack
- **Stack**: FastAPI + React o Express + Vue
- **Base de datos**: SQLite, PostgreSQL, MySQL o MongoDB
- **Autenticación JWT**: Sistema de autenticación opcional
- **Frontend**: Instalador oficial de Vite o plantilla base

#### Solo Frontend
- **Framework**: React o Vue (ambos con Vite)
- **Instalador Vite**: Usar instalador oficial o plantilla base
- **Soporte de Contenedores**: Listo para Docker/Podman

#### Solo Backend
- **Framework**: FastAPI (Python) o Express (Node.js)
- **Base de datos**: SQLite, PostgreSQL, MySQL o MongoDB
  - SQLite: No requiere configuración adicional
  - PostgreSQL/MySQL: Host, puerto, usuario, contraseña, nombre de base de datos
  - MongoDB: URI completa o detalles de conexión por separado
- **Autenticación JWT**: Implementación JWT opcional
- **Herramienta de Contenedores**: Docker Compose o Podman Compose

> **Nota:** Todos los generadores crean archivos `.env`, Dockerfiles, archivos compose y configuraciones listas para usar para cada stack tecnológico.

## Contribuir

Este MVP está cerrado a contribuciones externas por ahora. ¡Sugerencias y feedback son bienvenidos!

---

Plantilla generada por [devkit-cli](https://www.npmjs.com/package/devkit-cli)

---

Hecho con ❤️ por juanvidev1
