# Frontend (Vue 3 + Vite)

> Plantilla profesional de frontend con Vue 3 y Vite, conectada a backend Express. Incluye ejemplo de login JWT, CRUD de items y consumo de rutas protegidas.

## Instalación y uso

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El frontend se ejecutará en http://localhost:5173

## Características

- Login con JWT (usuario demo: demo / password: password)
- CRUD de items (listar, crear)
- Acceso a rutas protegidas con token JWT
- Código organizado en componentes y helpers de API

## Variables de entorno

Puedes configurar la URL del backend con el archivo `.env`:

```
VITE_API_URL=http://localhost:3000
```

## Estructura recomendada

- `src/App.vue` — Componente principal con lógica de login y CRUD
- `src/api.js` — Funciones para consumir el backend

---

Plantilla generada por [stackforge-cli](https://www.npmjs.com/package/stackforge-cli)
