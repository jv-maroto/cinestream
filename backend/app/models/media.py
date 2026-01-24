from sqlalchemy import Column, Integer, String, Text, Float, BigInteger, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class MediaType(enum.Enum):
    movie = "movie"
    series = "series"
    episode = "episode"
    documentary = "documentary"
    anime = "anime"
    anime_series = "anime_series"
    anime_movie = "anime_movie"
    opening = "opening"  # Anime/series openings and endings
    unknown = "unknown"


class MediaStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    error = "error"


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(Text, unique=True, nullable=False)
    filename = Column(String(500), nullable=False)
    title = Column(String(500))
    original_title = Column(String(500))
    year = Column(Integer)
    media_type = Column(String(20), default="unknown")

    # TMDB info
    tmdb_id = Column(Integer)
    imdb_id = Column(String(20))
    overview = Column(Text)
    tagline = Column(Text)
    poster_path = Column(Text)
    backdrop_path = Column(Text)
    rating = Column(Float)
    vote_count = Column(Integer)
    popularity = Column(Float)
    release_date = Column(TIMESTAMP)
    runtime = Column(Integer)
    language = Column(String(10))  # Original language from TMDB
    audio_language = Column(String(20))  # Detected from filename (es-LA, es-ES, en, etc)
    country = Column(String(100))

    # Series specific
    season_number = Column(Integer)
    episode_number = Column(Integer)
    episode_title = Column(String(500))
    series_id = Column(Integer, ForeignKey('media.id'))
    parent_tmdb_id = Column(Integer)  # For openings/extras linked to a series/anime

    # Technical info
    duration = Column(Float)
    width = Column(Integer)
    height = Column(Integer)
    fps = Column(Float)
    bitrate = Column(BigInteger)
    codec = Column(String(50))
    audio_codec = Column(String(50))
    audio_channels = Column(Integer)
    file_size = Column(BigInteger)
    file_hash = Column(Text)
    perceptual_hash = Column(Text, index=True)

    # Thumbnails
    thumbnail_path = Column(Text)
    preview_path = Column(Text)

    # Processing
    status = Column(String(20), default="pending", index=True)
    processing_progress = Column(Integer, default=0)
    processing_step = Column(String(50))
    error_message = Column(Text)
    processed_at = Column(TIMESTAMP)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    genres = relationship("MediaGenre", back_populates="media", cascade="all, delete-orphan")
    actors = relationship("MediaActor", back_populates="media", cascade="all, delete-orphan")
    directors = relationship("MediaDirector", back_populates="media", cascade="all, delete-orphan")
    collections = relationship("MediaCollection", back_populates="media", cascade="all, delete-orphan")
    episodes = relationship("Media", backref="series", remote_side=[id])
    watch_history = relationship("WatchHistory", back_populates="media", cascade="all, delete-orphan")
    processing_logs = relationship("ProcessingLog", back_populates="media", cascade="all, delete-orphan")


class MediaGenre(Base):
    __tablename__ = "media_genres"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    genre_id = Column(Integer, ForeignKey('genres.id', ondelete='CASCADE'))
    confidence = Column(Float, default=1.0)
    source = Column(String(20), default='tmdb')

    media = relationship("Media", back_populates="genres")
    genre = relationship("Genre", back_populates="media_genres")


class MediaActor(Base):
    __tablename__ = "media_actors"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    actor_id = Column(Integer, ForeignKey('actors.id', ondelete='CASCADE'))
    character_name = Column(String(255))
    cast_order = Column(Integer)

    media = relationship("Media", back_populates="actors")
    actor = relationship("Actor", back_populates="media_actors")


class MediaDirector(Base):
    __tablename__ = "media_directors"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    director_id = Column(Integer, ForeignKey('directors.id', ondelete='CASCADE'))

    media = relationship("Media", back_populates="directors")
    director = relationship("Director", back_populates="media_directors")


class MediaCollection(Base):
    __tablename__ = "media_collections"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    collection_id = Column(Integer, ForeignKey('collections.id', ondelete='CASCADE'))

    media = relationship("Media", back_populates="collections")
    collection = relationship("Collection", back_populates="media_collections")
