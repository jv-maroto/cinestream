from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Genre, MediaGenre

router = APIRouter()


@router.get("")
async def get_genres(db: Session = Depends(get_db)):
    """Get all genres with media count"""
    genres = db.query(
        Genre,
        func.count(MediaGenre.id).label('media_count')
    ).outerjoin(MediaGenre).group_by(Genre.id).order_by(Genre.name).all()

    return {
        "genres": [
            {
                "id": g.Genre.id,
                "name": g.Genre.name,
                "slug": g.Genre.slug,
                "tmdb_id": g.Genre.tmdb_id,
                "media_count": g.media_count
            }
            for g in genres
        ]
    }


@router.get("/{slug}")
async def get_genre(slug: str, db: Session = Depends(get_db)):
    """Get genre by slug"""
    genre = db.query(Genre).filter(Genre.slug == slug).first()
    if not genre:
        return {"error": "Genre not found"}

    media_count = db.query(MediaGenre).filter(MediaGenre.genre_id == genre.id).count()

    return {
        "id": genre.id,
        "name": genre.name,
        "slug": genre.slug,
        "tmdb_id": genre.tmdb_id,
        "media_count": media_count
    }
