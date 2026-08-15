# Blog Sencillo

Proyecto de parcial: un blog minimalista con arquitectura **multi-contenedor** usando **Docker Compose**.

## 🧱 Stack Tecnológico

| Capa       | Tecnología                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 18 + Vite 5 (servido con Nginx)           |
| Backend    | Node.js 20 + Express 4 (API RESTful)            |
| Base de Datos | PostgreSQL 16 (volumen persistente)          |
| Orquestación | Docker Compose                               |

## 📁 Estructura del Repositorio

```
BlogWeb/
├── backend/               # API RESTful en Node.js + Express
│   ├── src/
│   │   ├── index.js       # Punto de entrada (arranca y crea el esquema)
│   │   ├── app.js         # Configuración de Express (CORS, rutas, /api/health)
│   │   ├── db.js          # Pool de conexiones a PostgreSQL + esquema + seed
│   │   └── routes/        # Rutas de la API (leer/crear posts)
│   ├── Dockerfile         # Imagen ligera node:20-alpine (usuario no root)
│   └── .env.example       # Variables de entorno de ejemplo
├── frontend/              # App React + Vite
│   ├── src/               # Componentes (App.jsx, estilos)
│   ├── Dockerfile         # Multi-stage: Vite build → Nginx
│   ├── nginx.conf         # Configuración de Nginx (SPA + cache)
│   └── .env.example       # VITE_API_URL de ejemplo
├── docker-compose.yml     # Orquestación de los 3 servicios
├── .env.example           # Credenciales de PostgreSQL de ejemplo
└── README.md
```

## 🚀 Puesta en Marcha

### Requisitos

- [Docker Engine](https://docs.docker.com/engine/install/) y [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Git

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd BlogWeb
```

### 2. Configurar variables de entorno (opcional)

```bash
cp .env.example .env
# Edita .env con tus credenciales para PostgreSQL si deseas personalizarlas
```

### 3. Construir y levantar los servicios

```bash
docker compose up --build
```

Para ejecutarlo en segundo plano:

```bash
docker compose up --build -d
```

### 4. URLs de acceso

| Servicio  | URL                          |
| --------- | ---------------------------- |
| Frontend  | http://localhost:8080        |
| Backend   | http://localhost:3000        |
| Health    | http://localhost:3000/api/health |

> El servicio `database` no expone puertos hacia el host (solo se accede vía red interna de Docker).

## 🔌 Prueba de la API

```bash
# Listar publicaciones
curl http://localhost:3000/api/posts

# Crear una publicación
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primer post","content":"Hola desde la API"}'

# Verificar estado del servicio
curl http://localhost:3000/api/health
```

### Endpoints disponibles

| Método | Ruta            | Descripción                        |
| ------ | --------------- | ---------------------------------- |
| `GET`  | `/api/health`   | Estado del servicio **y de la BD** |
| `GET`  | `/api/posts`    | Lista todas las publicaciones      |
| `POST` | `/api/posts`    | Crea una publicación (`title`, `content`) |

## 🐳 Cómo funciona la arquitectura

1. **`frontend`** se compila en dos etapas: `node:20-alpine` construye los estáticos con Vite y `nginx:alpine` los sirve en el puerto `80` (mapeado al `8080` del host).
2. **`backend`** expone la API REST en el puerto `3000`, dentro de una imagen `node:20-alpine` que ejecuta la app como usuario no privilegiado (`node`).
3. **`database`** corre PostgreSQL 16 con un **volumen persistente** (`pgdata`) para que los datos sobrevivan a `docker compose down` o reinicios.
4. Todos los servicios comparten la **red personalizada** `blog_network`, que los aísla del resto de redes de Docker.
5. `depends_on` garantiza que el backend espere a que la base de datos esté **saludable** (`condition: service_healthy`) y que el frontend espere al backend saludable antes de levantarse.
6. Al arrancar, el backend **crea la tabla `posts`** y, si está vacía, inserta dos publicaciones de ejemplo. Cada post creado desde la app se **persiste en PostgreSQL**.

## 🛠️ Comandos útiles

```bash
# Ver el estado de los servicios
docker compose ps

# Ver los logs en tiempo real
docker compose logs -f

# Detener los servicios (conserva los datos de la BD)
docker compose down

# Detener y eliminar volúmenes (BORRA los datos de la BD)
docker compose down -v

# Reconstruir imágenes tras cambios
docker compose up --build
```

## 🔒 Gestión de credenciales

- Las credenciales de PostgreSQL se leen desde el archivo `.env` de la raíz (con valores por defecto seguros si no existe).
- `POSTGRES_PASSWORD` nunca debe versionarse: el archivo `.env` está excluido en `.gitignore`.
- El `docker-compose.yml` inyecta las mismas credenciales (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) tanto a la base de datos como al backend (variables `DB_*`).
- En producción real, se recomienda usar secretos de Docker o un gestor como Vault.

## 📋 Estado del Proyecto / Siguientes pasos

- [x] **Paso 1 — Backend**: API REST con Express, endpoints y `Dockerfile` optimizado.
- [x] **Paso 2 — Frontend**: React + Vite con `Dockerfile` multi-stage (Vite → Nginx).
- [x] **Paso 3 — Orquestación**: `docker-compose.yml` con frontend, backend y PostgreSQL persistente.
- [x] **Paso 4 — Base de datos**: backend conectado a PostgreSQL (`pg`), creación automática del esquema y persistencia de las publicaciones.
- [ ] **Opcional — Mejoras**: autenticación, edición/borrado de posts, paginación.
