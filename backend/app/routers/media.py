from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import os
import mimetypes
import subprocess
import shutil

from ..database import get_db
from ..models import Media, Genre, MediaGenre, Actor, MediaActor, Director
from ..config import settings
from ..workers.tasks import process_media_task, scan_media_task

router = APIRouter()

# Browser-native formats that don't need transcoding
NATIVE_VIDEO_FORMATS = {'.mp4', '.webm', '.m4v'}

def is_ffmpeg_available():
    """Check if FFmpeg is available on the system"""
    return shutil.which('ffmpeg') is not None


def get_video_mime_type(filename: str) -> str:
    """Get MIME type for video file"""
    ext = os.path.splitext(filename)[1].lower()
    mime_types = {
        '.mp4': 'video/mp4',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.webm': 'video/webm',
        '.m4v': 'video/x-m4v',
        '.flv': 'video/x-flv',
    }
    return mime_types.get(ext, 'video/mp4')


@router.post("/cleanup-missing")
async def cleanup_missing_files(db: Session = Depends(get_db)):
    """Remove all media records where the file no longer exists on disk"""
    all_media = db.query(Media).all()

    deleted = []
    for item in all_media:
        if not os.path.exists(item.path):
            # Delete related records first
            db.query(MediaGenre).filter(MediaGenre.media_id == item.id).delete()
            db.query(MediaActor).filter(MediaActor.media_id == item.id).delete()

            deleted.append({
                "id": item.id,
                "title": item.title,
                "path": item.path
            })
            db.delete(item)

    db.commit()

    return {
        "message": f"Cleaned up {len(deleted)} missing media files",
        "deleted_count": len(deleted),
        "deleted": deleted
    }


@router.post("/assign-tmdb/{media_id}")
async def assign_tmdb_to_media(
    media_id: int,
    tmdb_id: int = Query(..., description="TMDB ID to assign"),
    is_tv: bool = Query(False, description="True if it's a TV show, False for movie"),
    db: Session = Depends(get_db)
):
    """
    Manually assign a TMDB ID to a media item and fetch its metadata.
    Useful for files with bad names that can't be auto-detected.
    """
    from ..services.tmdb_client import tmdb_client

    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Fetch TMDB data
    if is_tv:
        tmdb_data = tmdb_client.get_tv_details(tmdb_id)
    else:
        tmdb_data = tmdb_client.get_movie_details(tmdb_id)

    if not tmdb_data:
        raise HTTPException(status_code=404, detail="TMDB ID not found")

    # Update media with TMDB data
    media.tmdb_id = tmdb_data.get('id')
    media.imdb_id = tmdb_data.get('imdb_id')
    media.title = tmdb_data.get('title') or tmdb_data.get('name')
    media.original_title = tmdb_data.get('original_title') or tmdb_data.get('original_name')
    media.overview = tmdb_data.get('overview')
    media.tagline = tmdb_data.get('tagline')
    media.rating = tmdb_data.get('vote_average')
    media.vote_count = tmdb_data.get('vote_count')
    media.popularity = tmdb_data.get('popularity')
    media.runtime = tmdb_data.get('runtime')
    media.language = tmdb_data.get('original_language')

    if tmdb_data.get('poster_path'):
        media.poster_path = tmdb_client.get_poster_url(tmdb_data['poster_path'])
    if tmdb_data.get('backdrop_path'):
        media.backdrop_path = tmdb_client.get_backdrop_url(tmdb_data['backdrop_path'])

    release = tmdb_data.get('release_date') or tmdb_data.get('first_air_date')
    if release and len(release) >= 4:
        media.year = int(release[:4])

    # Check if anime (Japanese animation)
    genres = tmdb_data.get('genres', [])
    genre_ids = [g.get('id') for g in genres]
    is_animation = 16 in genre_ids
    origin_country = tmdb_data.get('origin_country', [])
    original_language = tmdb_data.get('original_language', '')
    is_japanese = 'JP' in origin_country or original_language == 'ja'
    is_anime = is_animation and is_japanese

    # Update media type
    if is_anime:
        if is_tv:
            media.media_type = 'anime_series' if media.episode_number else 'anime'
        else:
            media.media_type = 'anime_movie'
    elif is_tv:
        media.media_type = 'episode' if media.episode_number else 'series'
    else:
        media.media_type = 'movie'

    # Add genres
    for genre_data in tmdb_data.get('genres', []):
        genre_slug = genre_data['name'].lower().replace(' ', '-')
        genre = db.query(Genre).filter(Genre.slug == genre_slug).first()
        if not genre:
            genre = Genre(name=genre_data['name'], slug=genre_slug, tmdb_id=genre_data['id'])
            db.add(genre)
            db.commit()
            db.refresh(genre)

        existing = db.query(MediaGenre).filter(
            MediaGenre.media_id == media.id,
            MediaGenre.genre_id == genre.id
        ).first()
        if not existing:
            db.add(MediaGenre(media_id=media.id, genre_id=genre.id))

    db.commit()
    db.refresh(media)

    return {
        "message": f"TMDB data assigned successfully",
        "media_id": media.id,
        "tmdb_id": media.tmdb_id,
        "title": media.title,
        "media_type": media.media_type,
        "poster_path": media.poster_path
    }


@router.post("/bulk-assign-series")
async def bulk_assign_series_tmdb(
    search_title: str = Query(..., description="Title to search for in database"),
    tmdb_id: int = Query(..., description="TMDB TV series ID to assign to all matches"),
    db: Session = Depends(get_db)
):
    """
    Assign a TMDB TV series ID to multiple episodes with similar titles.
    Useful for series like 'Bns-T01x01' which should be 'Bones'.
    """
    from ..services.tmdb_client import tmdb_client

    # Find all media matching the search
    matching = db.query(Media).filter(
        Media.title.ilike(f"%{search_title}%")
    ).all()

    if not matching:
        raise HTTPException(status_code=404, detail=f"No media found matching '{search_title}'")

    # Fetch TMDB data once
    tmdb_data = tmdb_client.get_tv_details(tmdb_id)
    if not tmdb_data:
        raise HTTPException(status_code=404, detail="TMDB ID not found")

    updated = []
    series_title = tmdb_data.get('name')

    for media in matching:
        media.tmdb_id = tmdb_data.get('id')
        media.title = series_title
        media.original_title = tmdb_data.get('original_name')
        media.overview = tmdb_data.get('overview')
        media.rating = tmdb_data.get('vote_average')
        media.vote_count = tmdb_data.get('vote_count')
        media.language = tmdb_data.get('original_language')

        if tmdb_data.get('poster_path'):
            media.poster_path = tmdb_client.get_poster_url(tmdb_data['poster_path'])
        if tmdb_data.get('backdrop_path'):
            media.backdrop_path = tmdb_client.get_backdrop_url(tmdb_data['backdrop_path'])

        release = tmdb_data.get('first_air_date')
        if release and len(release) >= 4:
            media.year = int(release[:4])

        # Check if anime
        genres = tmdb_data.get('genres', [])
        genre_ids = [g.get('id') for g in genres]
        is_animation = 16 in genre_ids
        origin_country = tmdb_data.get('origin_country', [])
        original_language = tmdb_data.get('original_language', '')
        is_japanese = 'JP' in origin_country or original_language == 'ja'

        if is_animation and is_japanese:
            media.media_type = 'anime_series'
        else:
            media.media_type = 'episode'

        updated.append({"id": media.id, "filename": media.filename})

    db.commit()

    return {
        "message": f"Updated {len(updated)} media items with TMDB data for '{series_title}'",
        "tmdb_id": tmdb_id,
        "series_title": series_title,
        "updated_count": len(updated),
        "updated": updated[:20]  # Limit to first 20 in response
    }


@router.get("")
async def get_media(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    media_type: Optional[str] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all media with filters"""
    query = db.query(Media)

    if search:
        query = query.filter(
            or_(
                Media.title.ilike(f"%{search}%"),
                Media.original_title.ilike(f"%{search}%"),
                Media.filename.ilike(f"%{search}%")
            )
        )

    if genre:
        genre_obj = db.query(Genre).filter(Genre.slug == genre).first()
        if genre_obj:
            query = query.join(MediaGenre).filter(MediaGenre.genre_id == genre_obj.id)

    if media_type and media_type != 'all':
        query = query.filter(Media.media_type == media_type)

    if year:
        query = query.filter(Media.year == year)

    if status and status != 'all':
        query = query.filter(Media.status == status)
    else:
        query = query.filter(Media.status == 'completed')

    total = query.count()
    skip = (page - 1) * limit
    media_items = query.order_by(Media.title).offset(skip).limit(limit).all()

    media_list = []
    for item in media_items:
        # Get genres
        genres = db.query(Genre).join(MediaGenre).filter(
            MediaGenre.media_id == item.id
        ).all()

        # Get actors
        actors = db.query(Actor).join(MediaActor).filter(
            MediaActor.media_id == item.id
        ).order_by(MediaActor.cast_order).limit(5).all()

        media_dict = {
            "id": item.id,
            "path": f"/api/media/{item.id}/stream",
            "filename": item.filename,
            "title": item.title,
            "original_title": item.original_title,
            "year": item.year,
            "media_type": item.media_type,
            "tmdb_id": item.tmdb_id,
            "overview": item.overview,
            "poster_path": item.poster_path,
            "backdrop_path": item.backdrop_path,
            "rating": item.rating,
            "runtime": item.runtime,
            "duration": item.duration,
            "thumbnail_path": item.thumbnail_path,
            "status": item.status,
            "processing_progress": item.processing_progress,
            "processing_step": item.processing_step,
            "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
            "actors": [{"id": a.id, "name": a.name, "photo_path": a.photo_path} for a in actors],
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        media_list.append(media_dict)

    return {
        "media": media_list,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{media_id}")
async def get_media_by_id(media_id: int, db: Session = Depends(get_db)):
    """Get media by ID with full details"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    genres = db.query(Genre).join(MediaGenre).filter(
        MediaGenre.media_id == item.id
    ).all()

    actors = db.query(Actor).join(MediaActor).filter(
        MediaActor.media_id == item.id
    ).order_by(MediaActor.cast_order).all()

    directors = db.query(Director).join(
        Media.directors
    ).filter(Media.id == item.id).all()

    return {
        "id": item.id,
        "path": f"/api/media/{item.id}/stream",
        "filename": item.filename,
        "title": item.title,
        "original_title": item.original_title,
        "year": item.year,
        "media_type": item.media_type,
        "tmdb_id": item.tmdb_id,
        "imdb_id": item.imdb_id,
        "overview": item.overview,
        "tagline": item.tagline,
        "poster_path": item.poster_path,
        "backdrop_path": item.backdrop_path,
        "rating": item.rating,
        "vote_count": item.vote_count,
        "runtime": item.runtime,
        "language": item.language,
        "country": item.country,
        "season_number": item.season_number,
        "episode_number": item.episode_number,
        "episode_title": item.episode_title,
        "duration": item.duration,
        "width": item.width,
        "height": item.height,
        "fps": item.fps,
        "codec": item.codec,
        "audio_codec": item.audio_codec,
        "file_size": item.file_size,
        "thumbnail_path": item.thumbnail_path,
        "status": item.status,
        "processing_progress": item.processing_progress,
        "processing_step": item.processing_step,
        "error_message": item.error_message,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
        "actors": [{"id": a.id, "name": a.name, "photo_path": a.photo_path, "character": ma.character_name}
                   for a, ma in db.query(Actor, MediaActor).join(MediaActor).filter(MediaActor.media_id == item.id).order_by(MediaActor.cast_order).all()],
        "directors": [{"id": d.id, "name": d.name, "photo_path": d.photo_path} for d in directors],
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


@router.get("/{media_id}/stream")
async def stream_media(media_id: int, request: Request, db: Session = Depends(get_db)):
    """Stream media file with Range support for seeking"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    if not os.path.exists(item.path):
        raise HTTPException(status_code=404, detail="File not found")

    file_path = item.path
    file_size = os.path.getsize(file_path)
    mime_type = get_video_mime_type(item.filename)

    # Get Range header
    range_header = request.headers.get("range")

    if range_header:
        # Parse Range header (e.g., "bytes=0-1000")
        range_match = range_header.replace("bytes=", "").split("-")
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if range_match[1] else file_size - 1

        # Ensure valid range
        if start >= file_size:
            raise HTTPException(status_code=416, detail="Range not satisfiable")

        end = min(end, file_size - 1)
        chunk_size = end - start + 1

        def iterfile():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    read_size = min(8192, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": mime_type,
        }

        return StreamingResponse(
            iterfile(),
            status_code=206,
            headers=headers,
            media_type=mime_type
        )
    else:
        # No Range header - return full file
        def iterfile():
            with open(file_path, "rb") as f:
                while chunk := f.read(8192):
                    yield chunk

        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Type": mime_type,
        }

        return StreamingResponse(
            iterfile(),
            headers=headers,
            media_type=mime_type
        )


@router.get("/{media_id}/transcode")
async def transcode_media(media_id: int, request: Request, db: Session = Depends(get_db)):
    """Stream media file with real-time transcoding to MP4 for browser compatibility"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    if not os.path.exists(item.path):
        raise HTTPException(status_code=404, detail="File not found")

    # Check if FFmpeg is available
    if not is_ffmpeg_available():
        raise HTTPException(status_code=500, detail="FFmpeg not available for transcoding")

    file_path = item.path

    # FFmpeg command for real-time transcoding
    # Using fast preset and copy audio when possible
    ffmpeg_cmd = [
        'ffmpeg',
        '-i', file_path,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4',
        '-'
    ]

    def generate():
        process = subprocess.Popen(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            bufsize=8192
        )
        try:
            while True:
                chunk = process.stdout.read(8192)
                if not chunk:
                    break
                yield chunk
        finally:
            process.terminate()
            process.wait()

    return StreamingResponse(
        generate(),
        media_type='video/mp4',
        headers={
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'none',  # Transcoding doesn't support seeking via Range
        }
    )


@router.get("/{media_id}/stream-info")
async def get_stream_info(media_id: int, db: Session = Depends(get_db)):
    """Get streaming info for a media file - whether it needs transcoding"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    ext = os.path.splitext(item.filename)[1].lower()
    needs_transcode = ext not in NATIVE_VIDEO_FORMATS
    ffmpeg_available = is_ffmpeg_available()

    return {
        "media_id": media_id,
        "filename": item.filename,
        "extension": ext,
        "needs_transcode": needs_transcode,
        "can_transcode": ffmpeg_available and needs_transcode,
        "stream_url": f"/api/media/{media_id}/stream",
        "transcode_url": f"/api/media/{media_id}/transcode" if needs_transcode and ffmpeg_available else None,
        "native_playback": not needs_transcode
    }


@router.post("/scan")
async def scan_media(db: Session = Depends(get_db)):
    """Scan media directory and add new files"""
    if not os.path.exists(settings.MEDIA_PATH):
        raise HTTPException(status_code=400, detail="Media path does not exist")

    task = scan_media_task.delay()
    return {"message": "Scan started", "task_id": task.id}


@router.post("/{media_id}/analyze")
async def analyze_media(media_id: int, force: bool = False, db: Session = Depends(get_db)):
    """Analyze specific media with AI"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    if item.status == "processing" and not force:
        raise HTTPException(status_code=400, detail="Media is already being processed")

    item.status = "processing"
    item.processing_progress = 0
    item.error_message = None
    db.commit()

    task = process_media_task.delay(media_id)
    return {"message": "Analysis started", "media_id": media_id, "task_id": task.id}


@router.post("/reprocess-batch")
async def reprocess_batch(
    limit: int = Query(10, ge=1, le=100),
    only_without_info: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Reprocess multiple media without TMDB info"""
    query = db.query(Media).filter(Media.status == "completed")

    if only_without_info:
        query = query.filter(Media.tmdb_id == None)

    items = query.limit(limit).all()

    queued = 0
    for item in items:
        item.status = "pending"
        item.processing_progress = 0
        db.commit()
        process_media_task.delay(item.id)
        queued += 1

    return {"message": f"Queued {queued} media for reprocessing", "queued": queued}


@router.post("/reprocess-all")
async def reprocess_all(db: Session = Depends(get_db)):
    """Reprocess ALL completed media to fetch TMDB data and fix classifications"""
    # Get all completed media without TMDB data
    items_without_tmdb = db.query(Media).filter(
        Media.status == "completed",
        Media.tmdb_id == None
    ).all()

    queued = 0
    for item in items_without_tmdb:
        item.status = "pending"
        item.processing_progress = 0
        item.processing_step = None
        queued += 1

    db.commit()

    # Queue them for processing
    for item in items_without_tmdb:
        process_media_task.delay(item.id)

    return {
        "message": f"Re-processing {queued} media items without TMDB data",
        "queued": queued
    }


@router.post("/{media_id}/assign-tmdb")
async def assign_tmdb(
    media_id: int,
    tmdb_id: int = Query(..., description="TMDB ID to assign"),
    is_tv: bool = Query(False, description="True if TV show, False if movie"),
    db: Session = Depends(get_db)
):
    """Manually assign a TMDB ID to a media item and fetch its data"""
    from ..services.tmdb_client import tmdb_client

    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    # Fetch TMDB data
    if is_tv:
        tmdb_data = tmdb_client.get_tv_details(tmdb_id)
    else:
        tmdb_data = tmdb_client.get_movie_details(tmdb_id)

    if not tmdb_data:
        raise HTTPException(status_code=404, detail="TMDB data not found")

    # Update media with TMDB data
    item.tmdb_id = tmdb_data.get('id')
    item.title = tmdb_data.get('title') or tmdb_data.get('name')
    item.original_title = tmdb_data.get('original_title') or tmdb_data.get('original_name')
    item.overview = tmdb_data.get('overview')
    item.rating = tmdb_data.get('vote_average')
    item.vote_count = tmdb_data.get('vote_count')

    if tmdb_data.get('poster_path'):
        item.poster_path = tmdb_client.get_poster_url(tmdb_data['poster_path'])
    if tmdb_data.get('backdrop_path'):
        item.backdrop_path = tmdb_client.get_backdrop_url(tmdb_data['backdrop_path'])

    release = tmdb_data.get('release_date') or tmdb_data.get('first_air_date')
    if release and len(release) >= 4:
        item.year = int(release[:4])

    db.commit()

    return {"message": f"Assigned TMDB {tmdb_id} to media '{item.title}'", "media_id": media_id}


@router.post("/bulk-assign-tmdb")
async def bulk_assign_tmdb(
    search_pattern: str = Query(..., description="Pattern to match in filename"),
    tmdb_id: int = Query(..., description="TMDB ID to assign"),
    is_tv: bool = Query(True, description="True if TV show"),
    db: Session = Depends(get_db)
):
    """Bulk assign TMDB ID to multiple media items matching a filename pattern"""
    from ..services.tmdb_client import tmdb_client

    # Find all media matching the pattern
    items = db.query(Media).filter(
        Media.filename.ilike(f"%{search_pattern}%"),
        Media.tmdb_id == None
    ).all()

    if not items:
        return {"message": "No matching media found", "updated": 0}

    # Fetch TMDB data
    if is_tv:
        tmdb_data = tmdb_client.get_tv_details(tmdb_id)
    else:
        tmdb_data = tmdb_client.get_movie_details(tmdb_id)

    if not tmdb_data:
        raise HTTPException(status_code=404, detail="TMDB data not found")

    # Update all matching items
    for item in items:
        item.tmdb_id = tmdb_data.get('id')
        item.title = tmdb_data.get('title') or tmdb_data.get('name')
        item.original_title = tmdb_data.get('original_title') or tmdb_data.get('original_name')
        item.overview = tmdb_data.get('overview')
        item.rating = tmdb_data.get('vote_average')
        item.vote_count = tmdb_data.get('vote_count')

        if tmdb_data.get('poster_path'):
            item.poster_path = tmdb_client.get_poster_url(tmdb_data['poster_path'])
        if tmdb_data.get('backdrop_path'):
            item.backdrop_path = tmdb_client.get_backdrop_url(tmdb_data['backdrop_path'])

        release = tmdb_data.get('release_date') or tmdb_data.get('first_air_date')
        if release and len(release) >= 4:
            item.year = int(release[:4])

        # Correct media type
        item.media_type = 'episode' if is_tv else 'movie'

    db.commit()

    return {
        "message": f"Assigned TMDB {tmdb_id} to {len(items)} media items",
        "updated": len(items),
        "title": tmdb_data.get('title') or tmdb_data.get('name')
    }


@router.delete("/{media_id}")
async def delete_media(media_id: int, db: Session = Depends(get_db)):
    """Delete a media record from the database"""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete related records first
    db.query(MediaGenre).filter(MediaGenre.media_id == media_id).delete()
    db.query(MediaActor).filter(MediaActor.media_id == media_id).delete()

    # Delete the media record
    db.delete(item)
    db.commit()

    return {"message": f"Media '{item.title}' deleted successfully", "id": media_id}


@router.post("/reclassify-all")
async def reclassify_all(db: Session = Depends(get_db)):
    """Re-classify all media based on TMDB data to fix anime/series confusion"""
    # Get all completed media with TMDB data
    items = db.query(Media).filter(
        Media.status == "completed",
        Media.tmdb_id != None
    ).all()

    fixed = 0
    for item in items:
        # Check genres for Animation (ID 16)
        genres = db.query(Genre).join(MediaGenre).filter(
            MediaGenre.media_id == item.id
        ).all()

        genre_ids = [g.tmdb_id for g in genres]
        is_animation = 16 in genre_ids

        # Check if Japanese
        is_japanese = item.language == 'ja'
        is_anime = is_animation and is_japanese

        old_type = item.media_type

        # Correct classification
        if is_anime:
            if item.season_number or item.episode_number:
                item.media_type = 'anime_series'
            elif old_type in ['series', 'episode']:
                item.media_type = 'anime'
            elif old_type == 'movie':
                item.media_type = 'anime_movie'
            else:
                item.media_type = 'anime'
        elif not is_anime and old_type in ['anime', 'anime_series', 'anime_movie']:
            # Not Japanese animation, correct to regular type
            if item.season_number or item.episode_number:
                item.media_type = 'episode'
            elif old_type in ['anime_series', 'anime']:
                item.media_type = 'series'
            else:
                item.media_type = 'movie'

        if old_type != item.media_type:
            fixed += 1

    db.commit()

    return {
        "message": f"Re-classified {fixed} media items",
        "fixed": fixed,
        "total_checked": len(items)
    }


@router.post("/remove-duplicates")
async def remove_duplicates(db: Session = Depends(get_db)):
    """Remove duplicate media entries (same path)"""
    from sqlalchemy import func

    # Find duplicate paths
    duplicates = db.query(
        Media.path,
        func.count(Media.id).label('count'),
        func.min(Media.id).label('keep_id')
    ).group_by(Media.path).having(func.count(Media.id) > 1).all()

    deleted = 0
    for dup in duplicates:
        # Delete all but the first entry
        items_to_delete = db.query(Media).filter(
            Media.path == dup.path,
            Media.id != dup.keep_id
        ).all()

        for item in items_to_delete:
            db.query(MediaGenre).filter(MediaGenre.media_id == item.id).delete()
            db.query(MediaActor).filter(MediaActor.media_id == item.id).delete()
            db.delete(item)
            deleted += 1

    db.commit()

    return {
        "message": f"Removed {deleted} duplicate entries",
        "deleted": deleted
    }


@router.post("/force-reprocess-all")
async def force_reprocess_all(db: Session = Depends(get_db)):
    """Force reprocess ALL media to get TMDB data and correct classifications"""
    # Get all completed media
    items = db.query(Media).filter(
        Media.status == "completed"
    ).all()

    queued = 0
    for item in items:
        item.status = "pending"
        item.processing_progress = 0
        item.processing_step = None
        queued += 1

    db.commit()

    # Queue them for processing
    for item in items:
        process_media_task.delay(item.id)

    return {
        "message": f"Force re-processing {queued} media items",
        "queued": queued
    }