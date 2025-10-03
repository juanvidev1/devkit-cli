# Stackforge CLI

Generador profesional de proyectos fullstack con FastAPI + React o Express + Vue, soporte para múltiples bases de datos y despliegue con Podman o Docker.

## Instalación

Instala el CLI globalmente desde npm:

```sh
npm install -g stackforge-cli
```

## Uso rápido

Crea un nuevo proyecto de forma interactiva:

```sh
stackforge create
```

O salta las preguntas y usa valores por defecto:

```sh
stackforge create --skip-questions
```

### Opciones principales

- `--with-podman` Levanta el proyecto automáticamente con podman-compose después de generarlo.
- `--skip-questions` Usa configuración por defecto sin preguntas interactivas.

## ¿Qué genera?

- Backend FastAPI (Python) o Express (Node.js), ambos con CRUD de ejemplo, autenticación JWT opcional y soporte para SQLite, Postgres, MySQL o MongoDB
- Frontend React (Vite) o Vue (Vite), con ejemplo de login, CRUD y consumo de rutas protegidas
- Archivos de configuración para desarrollo local y contenedores (Podman/Docker)
- `.gitignore` y estructura profesional para cada parte del stack

## Requisitos

- Node.js 20.19+ (para crear el frontend con Vite)
- Podman y podman-compose (opcional, solo si usas `--with-podman`)
- Python 3.10+ (para el backend)

## Ejemplo de flujo completo

```sh
# 1. Crea el proyecto
stackforge create

# 2. Entra a la carpeta generada
cd mi-proyecto

# 3. (Opcional) Levanta todo con Podman
podman-compose up --build

# 4. Accede al backend en http://localhost:8000 y al frontend en http://localhost:5173
```

### Personalización avanzada

Al crear un proyecto, podrás elegir:

- **Stack**: FastAPI + React o Express + Vue
- **Base de datos**: SQLite, Postgres, MySQL o MongoDB
  - Para SQLite no se solicita información adicional
  - Para Postgres/MySQL: host, puerto, usuario, contraseña y nombre de la base
  - Para MongoDB: puedes ingresar una URI completa o los datos por separado
- **Autenticación JWT**: puedes incluir o no un ejemplo de autenticación
- **Frontend**: usar el instalador oficial de Vite o la plantilla base

> **Nota:** El generador crea archivos `.env` y requirements/configs listos para cada stack y base de datos.

## Contribuir

Este MVP está cerrado a contribuciones externas por ahora. ¡Sugerencias y feedback son bienvenidos!

---

Plantilla generada por [stackforge-cli](https://www.npmjs.com/package/stackforge-cli)

---

Hecho con ❤️ por juanvidev1
