# Backend (Express + JWT + CRUD + Multi-DB)

> Servidor Express profesional con autenticación JWT, CRUD de items y soporte para SQLite, MySQL, Postgres y MongoDB.

## Instalación y uso

1. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env
   # Edita .env según la base de datos que vayas a usar
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```

El backend se ejecutará en http://localhost:3000

## Endpoints principales

- `POST /auth/login` — Login JWT (usuario demo: demo, password: password)
- `GET /items` — Listar items
- `POST /items` — Crear item
- `PUT /items/:id` — Actualizar item
- `DELETE /items/:id` — Eliminar item
- `GET /protected/me` — Ruta protegida (requiere token JWT)

## Configuración de base de datos

Selecciona el motor de base de datos con la variable `DB_TYPE` en tu `.env`:

| DB_TYPE  | Variables requeridas                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| sqlite   | SQLITE_FILE (opcional, por defecto ./data.db)                                        |
| mysql    | MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE                   |
| postgres | PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE                                  |
| mongo    | MONGO_URI (o variables para construir la URI: usuario, password, host, puerto, base) |

Ejemplos de configuración en `.env`:

### SQLite (por defecto)

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

Plantilla generada por [stackforge-cli](https://www.npmjs.com/package/stackforge-cli)
