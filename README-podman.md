## Podman quick start (development)

This repository includes a `podman-compose.yml` file which defines two services:

- `backend` — runs a Python image, installs requirements, and launches uvicorn on port 8000
- `frontend` — runs Node, installs dependencies, and launches the Vite dev server on port 5173

Usage (from project root):

```bash
# Build & run both services
podman-compose up --build

# To run in background
podman-compose up -d --build

# To stop and remove containers
podman-compose down
```

Notes:

- The compose file uses absolute image references like `docker.io/library/python:3.11-slim` to be explicit for Podman.
- Volume mounts include `:Z` so SELinux contexts are set appropriately when necessary.
- If your generated project is not in `./my-project`, edit `podman-compose.yml` to point volumes to the correct path.

### Using a database (Postgres / MySQL)

This compose file includes optional database services that are activated via profiles.

- Start backend + frontend + Postgres (use the `postgres` profile):

```bash
podman-compose --profile postgres up --build
```

- Start backend + frontend + MySQL (use the `mysql` profile):

```bash
podman-compose --profile mysql up --build
```

By default, the Postgres service exposes port 5432 and is configured with:

- POSTGRES_USER=user
- POSTGRES_PASSWORD=password
- POSTGRES_DB=mydb

And the MySQL service is configured with:

- MYSQL_USER=user
- MYSQL_PASSWORD=password
- MYSQL_DATABASE=mydb
- MYSQL_ROOT_PASSWORD=rootpass

Configure your backend to use the appropriate DATABASE_URL. Example values:

- SQLite (default local file):

  DATABASE_URL=sqlite+aiosqlite:///./data.db

- Postgres (when using the bundled Postgres service):

  DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/mydb

- MySQL (when using the bundled MySQL service):

  DATABASE_URL=mysql+aiomysql://user:password@mysql:3306/mydb

Notes:

- The examples above assume the backend container can resolve the service names `postgres` or `mysql` on the compose network.
- The generator writes a `.env` file with DATABASE_URL when you pass a DB choice through the CLI. Ensure your backend reads the env variable or add `python-dotenv` to requirements and load it in `main.py` if desired.

Troubleshooting:

- If Podman cannot pull images, ensure you have internet access and the correct registry permissions.
- If ports are already used (5173 or 8000), change them in `podman-compose.yml`.

Enjoy developing with Podman!
