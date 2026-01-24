from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional

from ..database import get_db
from ..models import Media, Genre, MediaGenre, Actor, MediaActor

router = APIRouter()


@router.get("")
async def get_documentaries_grouped(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get documentaries grouped by tmdb_id - groups documentary series episodes"""

    # Group by tmdb_id to ensure all episodes with same tmdb_id are grouped
    tmdb_query = db.query(
        func.max(Media.title).label('title'),
        Media.tmdb_id,
        func.count(Media.id).label('episode_count'),
        func.min(Media.id).label('first_episode_id'),
        func.max(Media.poster_path).label('poster_path'),
        func.max(Media.backdrop_path).label('backdrop_path'),
        func.max(Media.overview).label('overview'),
        func.max(Media.rating).label('rating'),
        func.max(Media.year).label('year'),
        func.max(Media.vote_count).label('vote_count'),
        func.sum(Media.duration).label('total_duration')
    ).filter(
        Media.media_type == 'documentary',
        Media.status == 'completed',
        Media.tmdb_id.isnot(None),
        Media.poster_path.isnot(None)
    )

    if search:
        tmdb_query = tmdb_query.filter(Media.title.ilike(f"%{search}%"))

    if genre:
        genre_obj = db.query(Genre).filter(Genre.slug == genre).first()
        if genre_obj:
            tmdb_query = tmdb_query.join(MediaGenre).filter(MediaGenre.genre_id == genre_obj.id)

    # Group by tmdb_id
    grouped_query = tmdb_query.group_by(Media.tmdb_id)

    total = grouped_query.count()
    skip = (page - 1) * limit

    docs_list = grouped_query.order_by(func.max(Media.title)).offset(skip).limit(limit).all()

    result = []
    for d in docs_list:
        # Get genres for this documentary
        first_ep = db.query(Media).filter(Media.id == d.first_episode_id).first()
        genres = []
        if first_ep:
            genres = db.query(Genre).join(MediaGenre).filter(
                MediaGenre.media_id == first_ep.id
            ).all()

        result.append({
            "title": d.title,
            "tmdb_id": d.tmdb_id,
            "episode_count": d.episode_count,
            "poster_path": d.poster_path,
            "backdrop_path": d.backdrop_path,
            "overview": d.overview,
            "rating": d.rating,
            "year": d.year,
            "vote_count": d.vote_count,
            "total_duration": d.total_duration,
            "first_episode_id": d.first_episode_id,
            "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
            "media_type": "documentary"
        })

    return {
        "documentaries": result,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/by-tmdb/{tmdb_id}")
async def get_documentary_by_tmdb(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    """Get all episodes of a documentary series by TMDB ID"""

    episodes = db.query(Media).filter(
        Media.tmdb_id == tmdb_id,
        Media.media_type == 'documentary',
        Media.status == 'completed'
    ).order_by(Media.season_number, Media.episode_number).all()

    if not episodes:
        raise HTTPException(status_code=404, detail="Documentary not found")

    # Get info from episode with most data
    main_episode = max(episodes, key=lambda x: (
        1 if x.poster_path else 0,
        1 if x.overview else 0,
        x.rating or 0
    ))

    # Get genres and actors
    genres = db.query(Genre).join(MediaGenre).filter(
        MediaGenre.media_id == main_episode.id
    ).all()

    actors = db.query(Actor).join(MediaActor).filter(
        MediaActor.media_id == main_episode.id
    ).order_by(MediaActor.cast_order).limit(10).all()

    # Create episode list
    episode_list = [{
        "id": ep.id,
        "episode_number": ep.episode_number or idx + 1,
        "episode_title": ep.episode_title or ep.filename,
        "overview": ep.overview,
        "duration": ep.duration,
        "thumbnail_path": ep.thumbnail_path,
        "rating": ep.rating,
        "filename": ep.filename
    } for idx, ep in enumerate(episodes)]

    total_duration = sum(ep.duration or 0 for ep in episodes)

    return {
        "title": main_episode.title,
        "tmdb_id": main_episode.tmdb_id,
        "imdb_id": main_episode.imdb_id,
        "poster_path": main_episode.poster_path,
        "backdrop_path": main_episode.backdrop_path,
        "overview": main_episode.overview,
        "rating": main_episode.rating,
        "vote_count": main_episode.vote_count,
        "year": main_episode.year,
        "language": main_episode.language,
        "total_episodes": len(episodes),
        "total_duration": total_duration,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
        "actors": [{"id": a.id, "name": a.name, "photo_path": a.photo_path} for a in actors],
        "episodes": episode_list
    }
