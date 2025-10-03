# Backend (Express + JWT + CRUD + Multi-DB)

> Professional Express server with JWT authentication, items CRUD, and support for SQLite, MySQL, Postgres, and MongoDB.

## Installation & Usage

1. Copy the example environment variables file:
   ```bash
   cp .env.example .env
   # Edit .env according to the database you want to use
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The backend will run at http://localhost:3000

## Main Endpoints

- `POST /auth/login` — JWT login (demo user: demo, password: password)
- `GET /items` — List items
- `POST /items` — Create item
- `PUT /items/:id` — Update item
- `DELETE /items/:id` — Delete item
- `GET /protected/me` — Protected route (requires JWT token)

## Database configuration

Select the database engine with the `DB_TYPE` variable in your `.env`:

| DB_TYPE  | Required variables                                                              |
| -------- | ------------------------------------------------------------------------------- |
| sqlite   | SQLITE_FILE (optional, default ./data.db)                                       |
| mysql    | MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE              |
| postgres | PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE                             |
| mongo    | MONGO_URI (or variables to build the URI: user, password, host, port, database) |

Examples for `.env`:

### SQLite (default)

```
DB_TYPE=sqlite
SQLITE_FILE=./data.db
```

### MySQL

```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=mydb
```

### Postgres

```
DB_TYPE=postgres
PG_HOST=localhost
PG_PORT=5432
PG_USER=user
PG_PASSWORD=password
PG_DATABASE=mydb
```

### MongoDB

```
DB_TYPE=mongo
MONGO_URI=mongodb://user:password@localhost:27017/mydb
```

## Seguridad y buenas prácticas

- Cambia el valor de `JWT_SECRET` en producción.
- Usa HTTPS en producción.
- No expongas tu `.env` ni credenciales sensibles.

---

Plantilla generada por [devkit-cli](https://www.npmjs.com/package/devkit-cli)
