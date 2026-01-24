from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Media, Genre, MediaGenre, Actor, MediaActor, WatchHistory

router = APIRouter()


@router.get("/general")
async def get_general_stats(db: Session = Depends(get_db)):
    """Get general statistics"""
    # Only count completed media for display stats
    movies = db.query(Media).filter(
        Media.media_type == 'movie',
        Media.status == 'completed'
    ).count()

    series = db.query(Media).filter(
        Media.media_type.in_(['series', 'episode']),
        Media.status == 'completed'
    ).count()

    anime = db.query(Media).filter(
        Media.media_type.in_(['anime', 'anime_series', 'anime_movie']),
        Media.status == 'completed'
    ).count()

    documentaries = db.query(Media).filter(
        Media.media_type == 'documentary',
        Media.status == 'completed'
    ).count()

    total_actors = db.query(Actor).count()
    total_genres = db.query(Genre).count()

    pending = db.query(Media).filter(Media.status == 'pending').count()
    processing = db.query(Media).filter(Media.status == 'processing').count()
    completed = db.query(Media).filter(Media.status == 'completed').count()
    errors = db.query(Media).filter(Media.status == 'error').count()

    # Calculate total size and duration from completed media
    total_size = db.query(func.sum(Media.file_size)).filter(
        Media.status == 'completed'
    ).scalar() or 0

    total_duration = db.query(func.sum(Media.duration)).filter(
        Media.status == 'completed'
    ).scalar() or 0

    # Convert to hours and GB
    total_hours = int(total_duration / 3600) if total_duration else 0
    total_size_gb = total_size / (1024 * 1024 * 1024) if total_size else 0

    return {
        "movies": movies,
        "series": series,
        "anime": anime,
        "documentaries": documentaries,
        "total_hours": total_hours,
        "total_size_gb": total_size_gb,
        "total_actors": total_actors,
        "total_genres": total_genres,
        "pending_media": pending,
        "processing_media": processing,
        "completed_media": completed,
        "error_media": errors,
        # Legacy fields
        "total_media": completed,
        "total_movies": movies,
        "total_series": series,
        "total_size": total_size,
        "total_duration": total_duration
    }


@router.get("/by-genres")
async def get_stats_by_genres(db: Session = Depends(get_db)):
    """Get media count by genre"""
    stats = db.query(
        Genre.name,
        Genre.slug,
        func.count(MediaGenre.id).label('count')
    ).join(MediaGenre).group_by(Genre.id).order_by(func.count(MediaGenre.id).desc()).all()

    return [{"name": s.name, "slug": s.slug, "count": s.count} for s in stats]


@router.get("/by-actors")
async def get_stats_by_actors(db: Session = Depends(get_db)):
    """Get media count by actor"""
    stats = db.query(
        Actor.name,
        Actor.id,
        func.count(MediaActor.id).label('count')
    ).join(MediaActor).group_by(Actor.id).order_by(func.count(MediaActor.id).desc()).limit(20).all()

    return [{"name": s.name, "id": s.id, "count": s.count} for s in stats]


@router.get("/by-year")
async def get_stats_by_year(db: Session = Depends(get_db)):
    """Get media count by year"""
    stats = db.query(
        Media.year,
        func.count(Media.id).label('count')
    ).filter(Media.year != None).group_by(Media.year).order_by(Media.year.desc()).all()

    return [{"year": s.year, "count": s.count} for s in stats]


@router.get("/recent")
async def get_recent_media(limit: int = 10, db: Session = Depends(get_db)):
    """Get recently added media - excludes openings and content without posters"""
    from sqlalchemy import not_, and_

    recent = db.query(Media).filter(
        Media.status == 'completed',
        # Exclude openings
        Media.media_type != 'opening',
        not_(Media.title.ilike('%opening%')),
        not_(Media.filename.ilike('%opening%')),
        # Must have a poster or valid TMDB data
        Media.poster_path != None
    ).order_by(Media.created_at.desc()).limit(limit).all()

    media_list = [
        {
            "id": m.id,
            "title": m.title,
            "year": m.year,
            "media_type": m.media_type,
            "poster_path": m.poster_path,
            "backdrop_path": m.backdrop_path,
            "rating": m.rating,
            "runtime": m.runtime,
            "overview": m.overview,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in recent
    ]

    return {"media": media_list, "total": len(media_list)}
