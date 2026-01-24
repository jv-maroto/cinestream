export interface Media {
  id: number
  path: string
  filename: string
  title: string | null
  original_title: string | null
  year: number | null
  media_type: 'movie' | 'series' | 'episode' | 'documentary' | 'anime' | 'anime_series' | 'anime_movie' | 'unknown'

  // TMDB info
  tmdb_id: number | null
  imdb_id: string | null
  overview: string | null
  tagline: string | null
  poster_path: string | null
  backdrop_path: string | null
  rating: number | null
  vote_count: number | null
  popularity: number | null
  release_date: string | null
  runtime: number | null
  language: string | null
  country: string | null

  // Series specific
  season_number: number | null
  episode_number: number | null
  episode_title: string | null
  series_id: number | null

  // Technical info
  duration: number | null
  width: number | null
  height: number | null
  fps: number | null
  bitrate: number | null
  codec: string | null
  audio_codec: string | null
  audio_channels: number | null
  file_size: number | null

  // Thumbnails
  thumbnail_path: string | null
  preview_path: string | null

  // Processing
  status: 'pending' | 'processing' | 'completed' | 'error'
  processing_progress: number
  processing_step: string | null
  error_message: string | null

  // Relations
  genres?: Genre[]
  actors?: Actor[]
  directors?: Director[]

  created_at: string
  updated_at: string
}

export interface Genre {
  id: number
  name: string
  slug: string
  tmdb_id: number | null
  media_count?: number
}

export interface Actor {
  id: number
  name: string
  tmdb_id: number | null
  photo_path: string | null
  biography: string | null
  birth_date: string | null
  birth_place: string | null
  popularity: number
  external_url: string | null
  media_count?: number
  media?: Media[]
  character_name?: string
}

export interface Director {
  id: number
  name: string
  tmdb_id: number | null
  photo_path: string | null
  biography: string | null
  birth_date: string | null
  popularity: number
}

export interface Collection {
  id: number
  name: string
  tmdb_id: number | null
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  media?: Media[]
}

export interface MediaFilters {
  page?: number
  limit?: number
  search?: string
  genre?: string
  media_type?: string
  status?: string
  sort_by?: string
}

export interface Stats {
  movies: number
  series: number
  episodes: number
  anime: number
  documentaries: number
  actors: number
  total_hours: number
  total_size_gb: number
}

export interface QueueStatus {
  pending: number
  processing: number
  completed: number
  error: number
  processing_items?: Media[]
  recent_errors?: Media[]
}
