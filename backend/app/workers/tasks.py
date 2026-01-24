import os
import hashlib
from pathlib import Path
from .celery_app import celery_app
from ..database import SessionLocal
from ..models import Media, Genre, MediaGenre, Actor, MediaActor, Director, MediaDirector
from ..config import settings
from ..services.ffmpeg_processor import FFmpegProcessor
from ..services.media_parser import MediaParser
from ..services.tmdb_client import tmdb_client


def compute_file_hash(filepath: str) -> str:
    """Compute SHA256 hash of file"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


@celery_app.task(bind=True)
def scan_media_task(self):
    """Scan media directory for new files"""
    db = SessionLocal()

    try:
        new_media = 0
        queued = 0

        for root, dirs, files in os.walk(settings.MEDIA_PATH):
            for filename in files:
                ext = Path(filename).suffix.lower()
                if ext not in settings.VIDEO_EXTENSIONS:
                    continue

                filepath = os.path.join(root, filename)

                # Check if already in database
                existing = db.query(Media).filter(Media.path == filepath).first()
                if existing:
                    continue

                # Parse filename with folder context for better accuracy
                parsed = MediaParser.parse_with_folder_context(filepath, filename)
                media_type = MediaParser.detect_media_type(parsed, filepath)

                # Handle episode number (can be list from guessit)
                episode_num = parsed.get('episode')
                if isinstance(episode_num, list):
                    episode_num = episode_num[0] if episode_num else None

                season_num = parsed.get('season')
                if isinstance(season_num, list):
                    season_num = season_num[0] if season_num else None

                # Create new media entry
                media = Media(
                    path=filepath,
                    filename=filename,
                    title=MediaParser.clean_title(parsed.get('title', '')),
                    year=parsed.get('year'),
                    media_type=media_type,
                    season_number=season_num,
                    episode_number=episode_num,
                    episode_title=parsed.get('episode_title'),
                    audio_language=parsed.get('detected_language'),  # Language from filename
                    status='pending'
                )

                db.add(media)
                db.commit()
                new_media += 1

                # Queue for processing
                process_media_task.delay(media.id)
                queued += 1

        return {"status": "success", "new_media": new_media, "queued": queued}

    except Exception as e:
        print(f"Scan error: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True)
def process_media_task(self, media_id: int):
    """Process single media file"""
    db = SessionLocal()

    try:
        media = db.query(Media).filter(Media.id == media_id).first()
        if not media:
            return {"status": "error", "error": "Media not found"}

        media.status = "processing"
        media.processing_progress = 0
        media.processing_step = "Iniciando"
        db.commit()

        # 1. Extract metadata
        media.processing_step = "Extrayendo metadatos"
        media.processing_progress = 10
        db.commit()

        metadata = FFmpegProcessor.get_video_metadata(media.path)
        media.duration = metadata.get('duration')
        media.width = metadata.get('width')
        media.height = metadata.get('height')
        media.fps = metadata.get('fps')
        media.bitrate = metadata.get('bitrate')
        media.codec = metadata.get('codec')
        media.audio_codec = metadata.get('audio_codec')
        media.audio_channels = metadata.get('audio_channels')
        media.file_size = metadata.get('file_size')
        db.commit()

        # 2. Generate thumbnail
        media.processing_step = "Generando thumbnail"
        media.processing_progress = 20
        db.commit()

        thumbnail_dir = os.path.join(settings.THUMBNAILS_PATH, str(media_id))
        thumbnail_path = os.path.join(thumbnail_dir, "thumb.jpg")

        if FFmpegProcessor.generate_thumbnail(media.path, thumbnail_path):
            media.thumbnail_path = f"/thumbnails/{media_id}/thumb.jpg"
        db.commit()

        # 3. Search TMDB
        media.processing_step = "Buscando en TMDB"
        media.processing_progress = 40
        db.commit()

        if settings.TMDB_API_KEY and media.title:
            tmdb_data = None

            # Determine search type based on media_type
            is_tv = media.media_type in ['series', 'episode', 'anime_series', 'anime']
            is_anime = media.media_type in ['anime', 'anime_series', 'anime_movie']

            if is_tv:
                # Search TV
                results = tmdb_client.search_tv(media.title, media.year)
                if results:
                    tmdb_data = tmdb_client.get_tv_details(results[0]['id'])
            else:
                # Search movie
                results = tmdb_client.search_movie(media.title, media.year)
                if results:
                    tmdb_data = tmdb_client.get_movie_details(results[0]['id'])

            # If anime and no results, try searching without year
            if is_anime and not tmdb_data:
                if is_tv:
                    results = tmdb_client.search_tv(media.title, None)
                    if results:
                        tmdb_data = tmdb_client.get_tv_details(results[0]['id'])
                else:
                    results = tmdb_client.search_movie(media.title, None)
                    if results:
                        tmdb_data = tmdb_client.get_movie_details(results[0]['id'])

            if tmdb_data:
                media.tmdb_id = tmdb_data.get('id')
                media.imdb_id = tmdb_data.get('imdb_id')
                media.original_title = tmdb_data.get('original_title') or tmdb_data.get('original_name')

                # Update title from TMDB (better than filename parsing)
                tmdb_title = tmdb_data.get('title') or tmdb_data.get('name')
                if tmdb_title:
                    media.title = tmdb_title

                media.overview = tmdb_data.get('overview')
                media.tagline = tmdb_data.get('tagline')
                media.rating = tmdb_data.get('vote_average')
                media.vote_count = tmdb_data.get('vote_count')
                media.popularity = tmdb_data.get('popularity')
                media.runtime = tmdb_data.get('runtime') or tmdb_data.get('episode_run_time', [None])[0] if tmdb_data.get('episode_run_time') else None
                media.language = tmdb_data.get('original_language')

                # Poster and backdrop
                if tmdb_data.get('poster_path'):
                    media.poster_path = tmdb_client.get_poster_url(tmdb_data['poster_path'])
                if tmdb_data.get('backdrop_path'):
                    media.backdrop_path = tmdb_client.get_backdrop_url(tmdb_data['backdrop_path'])

                # Release date/year
                release = tmdb_data.get('release_date') or tmdb_data.get('first_air_date')
                if release and len(release) >= 4:
                    media.year = int(release[:4])

                # Correct media type based on TMDB data
                genres = tmdb_data.get('genres', [])
                genre_ids = [g.get('id') for g in genres]

                # Animation genre ID is 16
                is_animation = 16 in genre_ids
                origin_country = tmdb_data.get('origin_country', [])
                original_language = tmdb_data.get('original_language', '')

                # Anime = Japanese animation
                is_japanese = 'JP' in origin_country or original_language == 'ja'
                is_real_anime = is_animation and is_japanese

                # Correct classification based on TMDB
                if is_real_anime:
                    if media.season_number or media.episode_number:
                        media.media_type = 'anime_series'
                    elif is_tv:
                        media.media_type = 'anime'
                    else:
                        media.media_type = 'anime_movie'
                elif media.media_type in ['anime', 'anime_series', 'anime_movie'] and not is_real_anime:
                    # Was classified as anime but TMDB says it's not Japanese animation
                    if is_tv:
                        media.media_type = 'episode' if media.episode_number else 'series'
                    else:
                        media.media_type = 'movie'

                db.commit()

                # 4. Add genres
                media.processing_step = "Asignando géneros"
                media.processing_progress = 60
                db.commit()

                for genre_data in tmdb_data.get('genres', []):
                    genre = db.query(Genre).filter(Genre.tmdb_id == genre_data['id']).first()
                    if genre:
                        existing = db.query(MediaGenre).filter(
                            MediaGenre.media_id == media.id,
                            MediaGenre.genre_id == genre.id
                        ).first()
                        if not existing:
                            db.add(MediaGenre(media_id=media.id, genre_id=genre.id, source='tmdb'))

                # 5. Add cast
                media.processing_step = "Agregando reparto"
                media.processing_progress = 80
                db.commit()

                credits = tmdb_data.get('credits', {})
                for i, cast in enumerate(credits.get('cast', [])[:10]):
                    actor = db.query(Actor).filter(Actor.tmdb_id == cast['id']).first()
                    if not actor:
                        actor = Actor(
                            name=cast['name'],
                            tmdb_id=cast['id'],
                            photo_path=tmdb_client.get_profile_url(cast.get('profile_path')),
                            popularity=cast.get('popularity', 0)
                        )
                        db.add(actor)
                        db.flush()

                    existing = db.query(MediaActor).filter(
                        MediaActor.media_id == media.id,
                        MediaActor.actor_id == actor.id
                    ).first()
                    if not existing:
                        db.add(MediaActor(
                            media_id=media.id,
                            actor_id=actor.id,
                            character_name=cast.get('character'),
                            cast_order=i
                        ))

                # Add directors
                for crew in credits.get('crew', []):
                    if crew.get('job') == 'Director':
                        director = db.query(Director).filter(Director.tmdb_id == crew['id']).first()
                        if not director:
                            director = Director(
                                name=crew['name'],
                                tmdb_id=crew['id'],
                                photo_path=tmdb_client.get_profile_url(crew.get('profile_path'))
                            )
                            db.add(director)
                            db.flush()

                        existing = db.query(MediaDirector).filter(
                            MediaDirector.media_id == media.id,
                            MediaDirector.director_id == director.id
                        ).first()
                        if not existing:
                            db.add(MediaDirector(media_id=media.id, director_id=director.id))

                db.commit()

        # Complete
        media.status = "completed"
        media.processing_progress = 100
        media.processing_step = None
        db.commit()

        return {"status": "success", "media_id": media_id}

    except Exception as e:
        print(f"Processing error: {e}")
        if media:
            media.status = "error"
            media.error_message = str(e)
            db.commit()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
