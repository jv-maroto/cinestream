from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import Media, WatchHistory

router = APIRouter()


class WatchProgressUpdate(BaseModel):
    position: float  # Current position in seconds
    duration: float  # Total duration of media


@router.get("/continue-watching")
async def get_continue_watching(limit: int = 10, db: Session = Depends(get_db)):
    """Get media that was partially watched (for 'Continue Watching' section)"""
    # Get most recent watch history entries that are not completed
    # Group by media_id to avoid duplicates
    from sqlalchemy import func

    subquery = db.query(
        WatchHistory.media_id,
        func.max(WatchHistory.watched_at).label('last_watched')
    ).filter(
        WatchHistory.completed == False,
        WatchHistory.progress_percent > 5,  # At least 5% watched
        WatchHistory.progress_percent < 90  # Less than 90% (not completed)
    ).group_by(WatchHistory.media_id).subquery()

    # Get the actual watch history entries with media info
    results = db.query(WatchHistory, Media).join(
        subquery,
        (WatchHistory.media_id == subquery.c.media_id) &
        (WatchHistory.watched_at == subquery.c.last_watched)
    ).join(Media).filter(
        Media.status == 'completed'
    ).order_by(desc(WatchHistory.watched_at)).limit(limit).all()

    return [{
        "id": wh.id,
        "media_id": media.id,
        "title": media.title,
        "poster_path": media.poster_path,
        "backdrop_path": media.backdrop_path,
        "media_type": media.media_type,
        "tmdb_id": media.tmdb_id,
        "duration": media.duration,
        "watch_position": wh.watch_position,
        "progress_percent": wh.progress_percent,
        "watched_at": wh.watched_at.isoformat() if wh.watched_at else None,
        "season_number": media.season_number,
        "episode_number": media.episode_number,
        "episode_title": media.episode_title,
    } for wh, media in results]


@router.get("/recently-watched")
async def get_recently_watched(limit: int = 20, db: Session = Depends(get_db)):
    """Get recently watched media (completed or not)"""
    from sqlalchemy import func

    subquery = db.query(
        WatchHistory.media_id,
        func.max(WatchHistory.watched_at).label('last_watched')
    ).group_by(WatchHistory.media_id).subquery()

    results = db.query(WatchHistory, Media).join(
        subquery,
        (WatchHistory.media_id == subquery.c.media_id) &
        (WatchHistory.watched_at == subquery.c.last_watched)
    ).join(Media).filter(
        Media.status == 'completed'
    ).order_by(desc(WatchHistory.watched_at)).limit(limit).all()

    return [{
        "id": wh.id,
        "media_id": media.id,
        "title": media.title,
        "poster_path": media.poster_path,
        "backdrop_path": media.backdrop_path,
        "media_type": media.media_type,
        "tmdb_id": media.tmdb_id,
        "duration": media.duration,
        "watch_position": wh.watch_position,
        "progress_percent": wh.progress_percent,
        "completed": wh.completed,
        "watched_at": wh.watched_at.isoformat() if wh.watched_at else None,
    } for wh, media in results]


@router.post("/{media_id}")
async def record_watch(media_id: int, db: Session = Depends(get_db)):
    """Record that media was started to watch"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Check if there's an existing incomplete watch session
    existing = db.query(WatchHistory).filter(
        WatchHistory.media_id == media_id,
        WatchHistory.completed == False
    ).order_by(desc(WatchHistory.watched_at)).first()

    if existing:
        # Update the existing session
        from datetime import datetime
        existing.watched_at = datetime.utcnow()
        db.commit()
        return {"message": "Watch session updated", "id": existing.id}

    # Create new watch history entry
    watch = WatchHistory(
        media_id=media_id,
        watch_position=0,
        progress_percent=0,
        completed=False
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)

    return {"message": "Watch started", "id": watch.id}


@router.put("/{media_id}/progress")
async def update_watch_progress(
    media_id: int,
    progress: WatchProgressUpdate,
    db: Session = Depends(get_db)
):
    """Update watch progress for a media"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Calculate progress percentage
    progress_percent = (progress.position / progress.duration * 100) if progress.duration > 0 else 0
    completed = progress_percent >= 90  # Mark as completed if watched 90%+

    # Find or create watch history entry
    watch = db.query(WatchHistory).filter(
        WatchHistory.media_id == media_id,
        WatchHistory.completed == False
    ).order_by(desc(WatchHistory.watched_at)).first()

    if watch:
        watch.watch_position = progress.position
        watch.progress_percent = progress_percent
        watch.completed = completed
        from datetime import datetime
        watch.watched_at = datetime.utcnow()
    else:
        watch = WatchHistory(
            media_id=media_id,
            watch_position=progress.position,
            progress_percent=progress_percent,
            completed=completed
        )
        db.add(watch)

    db.commit()

    return {
        "message": "Progress updated",
        "position": progress.position,
        "progress_percent": progress_percent,
        "completed": completed
    }


@router.get("/{media_id}/progress")
async def get_watch_progress(media_id: int, db: Session = Depends(get_db)):
    """Get the last watch position for a media"""
    watch = db.query(WatchHistory).filter(
        WatchHistory.media_id == media_id
    ).order_by(desc(WatchHistory.watched_at)).first()

    if not watch:
        return {
            "media_id": media_id,
            "position": 0,
            "progress_percent": 0,
            "completed": False
        }

    return {
        "media_id": media_id,
        "position": watch.watch_position or 0,
        "progress_percent": watch.progress_percent or 0,
        "completed": watch.completed
    }
