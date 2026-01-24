-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Media types enum
CREATE TYPE media_type AS ENUM ('movie', 'series', 'episode', 'documentary', 'anime', 'anime_series', 'anime_movie', 'unknown');
CREATE TYPE media_status AS ENUM ('pending', 'processing', 'completed', 'error');

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tmdb_id INTEGER UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actors table
CREATE TABLE IF NOT EXISTS actors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tmdb_id INTEGER UNIQUE,
    photo_path TEXT,
    biography TEXT,
    birth_date DATE,
    birth_place VARCHAR(255),
    popularity FLOAT DEFAULT 0,
    external_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directors table
CREATE TABLE IF NOT EXISTS directors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tmdb_id INTEGER UNIQUE,
    photo_path TEXT,
    biography TEXT,
    birth_date DATE,
    popularity FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media table (movies, series, etc)
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    filename VARCHAR(500) NOT NULL,
    title VARCHAR(500),
    original_title VARCHAR(500),
    year INTEGER,
    media_type media_type DEFAULT 'unknown',

    -- TMDB info
    tmdb_id INTEGER,
    imdb_id VARCHAR(20),
    overview TEXT,
    tagline TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    rating FLOAT,
    vote_count INTEGER,
    popularity FLOAT,
    release_date DATE,
    runtime INTEGER,
    language VARCHAR(10),
    country VARCHAR(100),

    -- Series specific
    season_number INTEGER,
    episode_number INTEGER,
    episode_title VARCHAR(500),
    series_id INTEGER REFERENCES media(id) ON DELETE SET NULL,

    -- Technical info
    duration FLOAT,
    width INTEGER,
    height INTEGER,
    fps FLOAT,
    bitrate BIGINT,
    codec VARCHAR(50),
    audio_codec VARCHAR(50),
    audio_channels INTEGER,
    file_size BIGINT,
    file_hash TEXT,
    perceptual_hash TEXT,

    -- Thumbnails
    thumbnail_path TEXT,
    preview_path TEXT,

    -- Processing
    status media_status DEFAULT 'pending',
    processing_progress INTEGER DEFAULT 0,
    processing_step VARCHAR(50),
    error_message TEXT,
    processed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media-Genre relationship
CREATE TABLE IF NOT EXISTS media_genres (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    confidence FLOAT DEFAULT 1.0,
    source VARCHAR(20) DEFAULT 'tmdb',
    UNIQUE(media_id, genre_id)
);

-- Media-Actor relationship
CREATE TABLE IF NOT EXISTS media_actors (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES actors(id) ON DELETE CASCADE,
    character_name VARCHAR(255),
    cast_order INTEGER,
    UNIQUE(media_id, actor_id)
);

-- Media-Director relationship
CREATE TABLE IF NOT EXISTS media_directors (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    director_id INTEGER REFERENCES directors(id) ON DELETE CASCADE,
    UNIQUE(media_id, director_id)
);

-- Collections (for movie franchises)
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tmdb_id INTEGER UNIQUE,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media-Collection relationship
CREATE TABLE IF NOT EXISTS media_collections (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(media_id, collection_id)
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watch_duration FLOAT,
    completed BOOLEAN DEFAULT FALSE
);

-- User lists (favorites, watchlist, etc)
CREATE TABLE IF NOT EXISTS user_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List items
CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES user_lists(id) ON DELETE CASCADE,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_id, media_id)
);

-- AI Scene classifications
CREATE TABLE IF NOT EXISTS scene_classifications (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    timestamp FLOAT,
    classification VARCHAR(100),
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing logs
CREATE TABLE IF NOT EXISTS processing_logs (
    id SERIAL PRIMARY KEY,
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    step VARCHAR(50),
    message TEXT,
    level VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_year ON media(year);
CREATE INDEX IF NOT EXISTS idx_media_tmdb ON media(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
CREATE INDEX IF NOT EXISTS idx_media_hash ON media(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_actors_name ON actors(name);
CREATE INDEX IF NOT EXISTS idx_actors_tmdb ON actors(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_directors_tmdb ON directors(tmdb_id);

-- Insert default genres (from TMDB + custom)
INSERT INTO genres (name, slug, tmdb_id) VALUES
    ('Acción', 'action', 28),
    ('Aventura', 'adventure', 12),
    ('Animación', 'animation', 16),
    ('Anime', 'anime', NULL),
    ('Comedia', 'comedy', 35),
    ('Crimen', 'crime', 80),
    ('Documental', 'documentary', 99),
    ('Drama', 'drama', 18),
    ('Familia', 'family', 10751),
    ('Fantasía', 'fantasy', 14),
    ('Historia', 'history', 36),
    ('Terror', 'horror', 27),
    ('Música', 'music', 10402),
    ('Misterio', 'mystery', 9648),
    ('Romance', 'romance', 10749),
    ('Ciencia Ficción', 'science-fiction', 878),
    ('Película de TV', 'tv-movie', 10770),
    ('Suspense', 'thriller', 53),
    ('Bélica', 'war', 10752),
    ('Western', 'western', 37),
    ('Shonen', 'shonen', NULL),
    ('Seinen', 'seinen', NULL),
    ('Shojo', 'shojo', NULL),
    ('Isekai', 'isekai', NULL),
    ('Mecha', 'mecha', NULL),
    ('Slice of Life', 'slice-of-life', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert default user lists
INSERT INTO user_lists (name, slug, is_system) VALUES
    ('Favoritos', 'favorites', true),
    ('Ver más tarde', 'watchlist', true),
    ('Vistos', 'watched', true)
ON CONFLICT (slug) DO NOTHING;
