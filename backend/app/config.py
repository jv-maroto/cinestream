from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:changeme@localhost:5433/cineanalyzer"

    # Redis
    REDIS_URL: str = "redis://localhost:6380/0"

    # AI Services
    YOLO_API_URL: str = "http://localhost:8011"
    CLASSIFIER_API_URL: str = "http://localhost:8013"

    # Paths
    MEDIA_PATH: str = "/media"
    THUMBNAILS_PATH: str = "/data/thumbnails"

    # TMDB API
    TMDB_API_KEY: str = ""
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE: str = "https://image.tmdb.org/t/p"

    # Security
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # CORS
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:3001"

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    # Processing
    FRAMES_PER_MEDIA: int = 20
    FRAME_INTERVAL_SECONDS: int = 60
    MAX_FRAMES_PER_MEDIA: int = 100
    MAX_WORKERS: int = 2
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.95

    # AI Processing toggles
    ENABLE_SCENE_CLASSIFICATION: bool = True
    ENABLE_OBJECT_DETECTION: bool = True

    # Supported video extensions
    VIDEO_EXTENSIONS: List[str] = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v']

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
