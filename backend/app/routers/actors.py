from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..database import get_db
from ..models import Actor, MediaActor, Media

router = APIRouter()


@router.get("")
async def get_actors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all actors with media count"""
    query = db.query(
        Actor,
        func.count(MediaActor.id).label('media_count')
    ).outerjoin(MediaActor).group_by(Actor.id)

    if search:
        query = query.filter(Actor.name.ilike(f"%{search}%"))

    query = query.having(func.count(MediaActor.id) > 0)
    total = query.count()

    actors = query.order_by(func.count(MediaActor.id).desc()).offset(skip).limit(limit).all()

    return {
        "actors": [
            {
                "id": a.Actor.id,
                "name": a.Actor.name,
                "photo_path": a.Actor.photo_path,
                "tmdb_id": a.Actor.tmdb_id,
                "popularity": a.Actor.popularity,
                "media_count": a.media_count
            }
            for a in actors
        ],
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{actor_id}")
async def get_actor(actor_id: int, db: Session = Depends(get_db)):
    """Get actor by ID with filmography"""
    actor = db.query(Actor).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")

    # Get filmography
    filmography = db.query(Media, MediaActor.character_name).join(
        MediaActor
    ).filter(
        MediaActor.actor_id == actor_id,
        Media.status == 'completed'
    ).order_by(Media.year.desc()).all()

    return {
        "id": actor.id,
        "name": actor.name,
        "tmdb_id": actor.tmdb_id,
        "photo_path": actor.photo_path,
        "biography": actor.biography,
        "birth_date": actor.birth_date.isoformat() if actor.birth_date else None,
        "birth_place": actor.birth_place,
        "popularity": actor.popularity,
        "filmography": [
            {
                "id": m.Media.id,
                "title": m.Media.title,
                "year": m.Media.year,
                "media_type": m.Media.media_type,
                "poster_path": m.Media.poster_path,
                "character": m.character_name
            }
            for m in filmography
        ]
    }
