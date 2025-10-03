# Backend (FastAPI)

Ejecuta el servidor de desarrollo localmente:

```bash
# desde la carpeta backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Si usas el `podman-compose.yml` incluido, el backend se ejecutará dentro de un contenedor Python y el comando se lanzará automáticamente al levantar el compose.

## Configuración de base de datos

La aplicación lee la URL de la base de datos desde la variable de entorno `DATABASE_URL`. Si no se proporciona, la plantilla usa por defecto un archivo SQLite local (`sqlite+aiosqlite:///./data.db`). Ejemplos:

- SQLite (por defecto):

```bash
export DATABASE_URL="sqlite+aiosqlite:///./data.db"
```

- Postgres (ejemplo):

```bash
export DATABASE_URL="postgresql+asyncpg://user:password@db-host:5432/dbname"
```

- MySQL (ejemplo):

```bash
export DATABASE_URL="mysql+aiomysql://user:password@db-host:3306/dbname"
```

- MongoDB (ejemplo):

```bash
export DATABASE_URL="mongodb://user:password@db-host:27017/dbname"
```

Si quieres usar Postgres, MySQL o MongoDB con la plantilla, asegúrate de agregar el driver async correspondiente a `requirements.txt` (por ejemplo, `asyncpg` para Postgres, `aiomysql` para MySQL, `motor` para MongoDB) o habilita `runInstall` en el generador para que se instalen automáticamente.
