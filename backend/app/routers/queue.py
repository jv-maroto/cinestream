from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models import Media

router = APIRouter()


@router.get("/status")
async def get_queue_status(db: Session = Depends(get_db)):
    """Get queue processing status"""
    pending = db.query(Media).filter(Media.status == 'pending').count()
    processing = db.query(Media).filter(Media.status == 'processing').count()
    completed = db.query(Media).filter(Media.status == 'completed').count()
    error = db.query(Media).filter(Media.status == 'error').count()

    # Get currently processing items
    processing_items = db.query(Media).filter(
        Media.status == 'processing'
    ).order_by(desc(Media.updated_at)).limit(10).all()

    # Get recent errors
    recent_errors = db.query(Media).filter(
        Media.status == 'error'
    ).order_by(desc(Media.updated_at)).limit(5).all()

    return {
        "status": "running" if processing > 0 else "idle",
        "pending": pending,
        "processing": processing,
        "completed": completed,
        "error": error,
        # Also include old field names for backwards compatibility
        "pending_tasks": pending,
        "active_tasks": processing,
        "completed_tasks": completed,
        "failed_tasks": error,
        "processing_items": [
            {
                "id": item.id,
                "title": item.title,
                "filename": item.filename,
                "season_number": item.season_number,
                "episode_number": item.episode_number,
                "media_type": item.media_type,
                "processing_step": item.processing_step,
                "processing_progress": item.processing_progress
            }
            for item in processing_items
        ],
        "recent_errors": [
            {
                "id": item.id,
                "title": item.title,
                "filename": item.filename,
                "season_number": item.season_number,
                "episode_number": item.episode_number,
                "error_message": item.error_message
            }
            for item in recent_errors
        ]
    }


@router.post("/reset-stuck")
async def reset_stuck_tasks(db: Session = Depends(get_db)):
    """Reset stuck processing tasks"""
    stuck = db.query(Media).filter(Media.status == 'processing').all()

    count = 0
    for item in stuck:
        item.status = 'pending'
        item.processing_progress = 0
        item.processing_step = None
        count += 1

    db.commit()

    return {"message": f"Reset {count} stuck tasks", "count": count}
