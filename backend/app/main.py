from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import settings
from .routers import media, genres, actors, stats, queue, series, anime, watch_history, documentaries

app = FastAPI(
    title="Cine Analyzer API",
    description="API para analizar y organizar películas y series",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for thumbnails
if os.path.exists(settings.THUMBNAILS_PATH):
    app.mount("/thumbnails", StaticFiles(directory=settings.THUMBNAILS_PATH), name="thumbnails")

# Mount photos directory
photos_path = os.path.join(os.path.dirname(settings.THUMBNAILS_PATH), "photos")
if os.path.exists(photos_path):
    app.mount("/photos", StaticFiles(directory=photos_path), name="photos")

# Include routers
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(genres.router, prefix="/api/genres", tags=["genres"])
app.include_router(actors.router, prefix="/api/actors", tags=["actors"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
app.include_router(series.router, prefix="/api/series", tags=["series"])
app.include_router(anime.router, prefix="/api/anime", tags=["anime"])
app.include_router(watch_history.router, prefix="/api/watch-history", tags=["watch-history"])
app.include_router(documentaries.router, prefix="/api/documentaries", tags=["documentaries"])


@app.get("/")
async def root():
    return {"message": "Cine Analyzer API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
