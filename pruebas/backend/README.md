# Backend (FastAPI)

Run the development server locally:

```bash
# from the backend folder
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If you use the provided `podman-compose.yml`, the backend will be run inside a Python container and the
command will be executed automatically when you bring the compose up.

## Database configuration

The application reads the database URL from the `DATABASE_URL` environment variable. If not provided,
the template defaults to a local SQLite file (`sqlite+aiosqlite:///./data.db`). Examples:

- SQLite (default):

```bash
export DATABASE_URL="sqlite+aiosqlite:///./data.db"
```

- Postgres (example):

```bash
export DATABASE_URL="postgresql+asyncpg://user:password@db-host:5432/dbname"
```

- MySQL (example):

```bash
export DATABASE_URL="mysql+aiomysql://user:password@db-host:3306/dbname"
```

If you want to use Postgres or MySQL with the template, make sure to add the corresponding async driver
to `requirements.txt` (e.g. `asyncpg` for Postgres, `aiomysql` for MySQL) or enable `runInstall` in the generator
so the generator can install them for you.
