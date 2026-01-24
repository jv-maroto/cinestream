# CineStream

Tu biblioteca personal de películas, series y anime con análisis automático mediante IA.

![CineStream](https://img.shields.io/badge/CineStream-v1.0.0-e50914?style=for-the-badge)
![License](https://img.shields.io/badge/License-Private-blue?style=for-the-badge)

## Descripción

CineStream es una aplicación completa para gestionar tu colección multimedia personal. Escanea automáticamente tus archivos de video, obtiene metadatos de TMDB, y organiza todo en una interfaz moderna estilo Netflix/Prime Video.

### Características principales

- **Escaneo automático** de archivos multimedia (películas, series, anime, documentales)
- **Identificación inteligente** usando parsing de nombres de archivos
- **Metadatos automáticos** desde TMDB (The Movie Database)
- **Clasificación por IA** de escenas usando YOLO
- **Interfaz moderna** estilo plataformas de streaming
- **Seguimiento de progreso** de visualización (continuar viendo)
- **Búsqueda avanzada** por título, actor, género, año
- **Soporte multi-idioma** (español por defecto)

## Stack Tecnológico

### Backend

| Tecnología | Uso |
|------------|-----|
| **FastAPI** | Framework web Python de alto rendimiento |
| **PostgreSQL 16** | Base de datos relacional |
| **pgvector** | Extensión para búsqueda vectorial/embeddings |
| **SQLAlchemy 2.0** | ORM para Python |
| **Celery** | Cola de tareas asíncronas |
| **Redis** | Broker de mensajes y caché |
| **Uvicorn** | Servidor ASGI |

### Frontend

| Tecnología | Uso |
|------------|-----|
| **React 18** | Biblioteca UI |
| **TypeScript** | Tipado estático |
| **Vite** | Build tool y dev server |
| **Tailwind CSS** | Framework de estilos utility-first |
| **TanStack Query** | Gestión de estado del servidor |
| **React Router 6** | Enrutamiento SPA |
| **Lucide React** | Iconos |

### Servicios de IA

| Tecnología | Uso |
|------------|-----|
| **YOLO** | Detección de objetos en escenas |
| **OpenCV** | Procesamiento de video |
| **Pillow** | Procesamiento de imágenes |
| **ImageHash** | Detección de duplicados |

### Infraestructura

| Tecnología | Uso |
|------------|-----|
| **Docker** | Containerización |
| **Docker Compose** | Orquestación de servicios |
| **Nginx** | Servidor web para producción |

### APIs Externas

| Servicio | Uso |
|----------|-----|
| **TMDB API** | Metadatos de películas y series |

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                      http://localhost:3001                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (FastAPI)                       │
│                      http://localhost:8010                       │
├─────────────────────────────────────────────────────────────────┤
│  /api/media      │  /api/series    │  /api/anime               │
│  /api/actors     │  /api/genres    │  /api/stats               │
│  /api/queue      │  /api/watch-history                          │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  PostgreSQL  │    │    Redis     │    │  Celery Worker   │
│  + pgvector  │    │   (cache)    │    │  (procesamiento) │
│  :5433       │    │   :6380      │    │                  │
└──────────────┘    └──────────────┘    └──────────────────┘
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           ▼                      ▼                      ▼
                    ┌────────────┐         ┌────────────┐         ┌────────────┐
                    │  YOLO API  │         │ Classifier │         │    TMDB    │
                    │   :8011    │         │   :8013    │         │    API     │
                    └────────────┘         └────────────┘         └────────────┘
```

## Instalación

### Requisitos previos

- Docker Desktop
- Git
- (Opcional) GPU NVIDIA para aceleración de IA

### Inicio rápido

1. **Clonar el repositorio**
```bash
git clone https://github.com/jv-maroto/cinestream.git
cd cinestream
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu API key de TMDB
```

3. **Iniciar con Docker Compose**
```bash
# Con GPU NVIDIA
docker-compose up -d

# Sin GPU
docker-compose -f docker-compose.no-gpu.yml up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3001
- API: http://localhost:8010
- API Docs: http://localhost:8010/docs

### Desarrollo local

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Estructura del proyecto

```
cinestream/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── routers/        # Endpoints API
│   │   ├── services/       # Lógica de negocio
│   │   └── workers/        # Tareas Celery
│   ├── migrations/         # Migraciones SQL
│   └── requirements.txt
│
├── frontend/               # App React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas/vistas
│   │   ├── services/      # Cliente API
│   │   └── types/         # Tipos TypeScript
│   ├── tailwind.config.js
│   └── package.json
│
├── ai-services/            # Microservicios IA
│   ├── yolo-api/          # Detección de objetos
│   └── classifier-api/    # Clasificación de escenas
│
├── scripts/               # Scripts de utilidad
│   └── init-db.sql       # Inicialización BD
│
├── docker-compose.yml     # Orquestación (GPU)
├── docker-compose.no-gpu.yml
└── README.md
```

## API Endpoints

### Media
- `GET /api/media` - Listar media con filtros
- `GET /api/media/{id}` - Obtener detalle
- `POST /api/media/scan` - Escanear directorio

### Series
- `GET /api/series` - Listar series agrupadas
- `GET /api/series/{tmdb_id}` - Detalle de serie

### Anime
- `GET /api/anime` - Listar anime
- `GET /api/anime/{tmdb_id}` - Detalle de anime

### Actores
- `GET /api/actors` - Listar actores
- `GET /api/actors/{id}` - Filmografía de actor

### Estadísticas
- `GET /api/stats/general` - Estadísticas generales
- `GET /api/stats/recent` - Contenido reciente

### Cola de procesamiento
- `GET /api/queue/status` - Estado de la cola
- `GET /api/queue/items` - Items en cola

## Capturas de pantalla

### Inicio
Interfaz principal con hero destacado y filas de contenido estilo Netflix.

### Biblioteca
Grid de contenido con filtros por tipo, género y búsqueda.

### Detalle
Información completa con sinopsis, reparto, géneros y opciones de reproducción.

## Configuración

### Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://...` |
| `REDIS_URL` | URL de Redis | `redis://localhost:6380` |
| `TMDB_API_KEY` | API Key de TMDB | - |
| `MEDIA_PATH` | Ruta de archivos multimedia | `/media` |
| `THUMBNAILS_PATH` | Ruta de thumbnails | `/data/thumbnails` |

## Roadmap

- [ ] Soporte para subtítulos
- [ ] Transcodificación on-the-fly
- [ ] Usuarios múltiples
- [ ] Apps móviles (React Native)
- [ ] Integración con Plex/Jellyfin
- [ ] Recomendaciones basadas en IA

## Contribuir

Este es un proyecto privado. Para contribuir, contacta al propietario del repositorio.

## Licencia

Proyecto privado. Todos los derechos reservados.

---

Desarrollado con Claude AI
