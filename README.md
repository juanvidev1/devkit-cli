# Stackforge CLI

Generador de proyectos fullstack con FastAPI + React, base de datos y soporte para Podman.

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

- Backend FastAPI listo para usar (con opción de JWT demo y base de datos a elegir)
- Frontend React (con Vite, o plantilla base)
- Archivos de configuración para desarrollo local y contenedores (Podman)
- `.gitignore` para cada parte del stack

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

## Personalización

- Elige base de datos: SQLite, Postgres o MySQL
- Incluye o no autenticación JWT demo
- Usa el instalador oficial de Vite para el frontend si lo deseas

## Contribuir

¡Pull requests y sugerencias son bienvenidas!

---

Hecho con ❤️ por juanvidev1
