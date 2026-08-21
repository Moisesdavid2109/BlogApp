# Blog Sencillo

Blog minimalista hecho como proyecto de parcial. Es una app de tres contenedores: un frontend en React, una API en Node/Express y PostgreSQL para guardar las publicaciones. Todo se orquesta con Docker Compose.

## Stack

- Frontend: React 18 + Vite, servido con Nginx
- Backend: Node.js 20 + Express (API REST)
- Base de datos: PostgreSQL 16 con volumen persistente
- Docker Compose para levantar todo junto

## Estructura

```
BlogWeb/
├── backend/            # API RESTful en Node.js + Express
│   ├── src/
│   │   ├── index.js    # Punto de entrada
│   │   ├── app.js      # Configuración de Express y rutas
│   │   ├── db.js       # Conexión a Postgres, crea el esquema
│   │   └── routes/     # Rutas de la API
│   └── Dockerfile      # node:20-alpine
├── frontend/           # App React + Vite
│   ├── src/
│   ├── Dockerfile      # Multi-stage: build con Vite → Nginx
│   └── nginx.conf
├── docker-compose.yml
├── .env.example        # Ejemplo de credenciales de Postgres
└── README.md
```

## Cómo levantar el proyecto

### Requisitos

- Docker y Docker Compose v2 o superior
- Git

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd BlogWeb
```

### 2. Variables de entorno (opcional)

Todas las variables tienen valores por defecto en `docker-compose.yml`, así que técnicamente no hay que configurar nada. Si quieres cambiar usuario, contraseña o nombre de la base de datos:

```bash
cp .env.example .env
```

y edita los valores. Las únicas que docker-compose lee del `.env` son estas tres:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de Postgres | `blog` |
| `POSTGRES_PASSWORD` | Contraseña | `blog_password` |
| `POSTGRES_DB` | Nombre de la BD | `blog` |

El resto (`NODE_ENV`, `PORT`, `DB_HOST`, etc.) están fijas en el compose. El backend recibe las credenciales automáticamente a través de las variables `DB_*`.

Ojo: si cambias las credenciales después de haber corrido la app una vez, hay que hacer `docker compose down -v` antes de volver a levantar, porque el volumen conserva el usuario viejo.

También hay un `.env.example` dentro de `backend/` y `frontend/`, pero esos son solo para correr las cosas localmente sin Docker (se explica más abajo).

### 3. Construir imágenes y levantar todo

```bash
docker compose up --build
```

o en segundo plano:

```bash
docker compose up --build -d
```

La primera vez tarda un poco porque compila el frontend y descarga las imágenes. Compose espera a que Postgres pase su healthcheck antes de arrancar el backend, y el backend arranca creando la tabla `posts` e insertando dos posts de ejemplo si está vacía.

### 4. Acceder a la app

- Frontend: http://localhost:8080
- API: http://localhost:3000
- Health check: http://localhost:3000/api/health

El puerto 5432 de la base de datos también está publicado al host, pero es solo para probar el backend localmente con `npm run dev`. En producción sobraría.

## Probar la API

```bash
# Listar posts
curl http://localhost:3000/api/posts

# Crear un post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primer post","content":"Hola desde la API"}'
```

Endpoints:

- `GET /api/health` — estado del servicio y de la conexión a la BD
- `GET /api/posts` — lista todas las publicaciones
- `POST /api/posts` — crea una publicación (recibe `title` y `content`)

## Correr sin Docker (solo la base de datos en Docker)

Útil para desarrollar con recarga en caliente:

```bash
# Detener backend y frontend si están corriendo
docker compose stop backend frontend

# Levantar solo la base de datos
docker compose up database -d

# Terminal 1 - backend
cd backend
npm install
npm run dev          # http://localhost:3000

# Terminal 2 - frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

El backend lee sus credenciales de `backend/.env` (copiar desde `backend/.env.example`, ya viene con `DB_HOST=localhost`). En dev el frontend apunta por defecto a `http://localhost:3000/api`.

## Comandos útiles

```bash
docker compose ps          # estado de los servicios
docker compose logs -f     # logs en tiempo real
docker compose down        # detener (conserva los datos)
docker compose down -v     # detener Y borrar los datos de la BD
```

## Notas sobre credenciales

La contraseña de Postgres va en el `.env` de la raíz, que está en `.gitignore`, así que no se sube al repo. En un entorno real lo correcto sería usar secrets de Docker o algo parecido, pero para este proyecto alcanza así.
