from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional

from ..database import get_db
from ..models import Media, Genre, MediaGenre, Actor, MediaActor

router = APIRouter()


@router.get("")
async def get_anime_grouped(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get anime grouped by tmdb_id (preferred) or title - shows only anime with TMDB data"""

    # First, get anime grouped by tmdb_id (for those with TMDB data)
    # This ensures all episodes with same tmdb_id are grouped regardless of title differences
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
        func.sum(Media.duration).label('total_duration'),
        func.count(distinct(Media.season_number)).label('season_count')
    ).filter(
        Media.media_type.in_(['anime', 'anime_series', 'anime_movie']),
        Media.status == 'completed',
        Media.tmdb_id.isnot(None),  # Only those with TMDB data
        Media.poster_path.isnot(None)  # Only those with poster (confirmed TMDB match)
    )

    if search:
        tmdb_query = tmdb_query.filter(Media.title.ilike(f"%{search}%"))

    if genre:
        genre_obj = db.query(Genre).filter(Genre.slug == genre).first()
        if genre_obj:
            tmdb_query = tmdb_query.join(MediaGenre).filter(MediaGenre.genre_id == genre_obj.id)

    # Group by tmdb_id for properly matched anime
    grouped_query = tmdb_query.group_by(Media.tmdb_id)

    total = grouped_query.count()
    skip = (page - 1) * limit

    anime_list = grouped_query.order_by(func.max(Media.title)).offset(skip).limit(limit).all()

    result = []
    for a in anime_list:
        # Get genres for this anime
        first_ep = db.query(Media).filter(Media.id == a.first_episode_id).first()
        genres = []
        if first_ep:
            genres = db.query(Genre).join(MediaGenre).filter(
                MediaGenre.media_id == first_ep.id
            ).all()

        result.append({
            "title": a.title,
            "tmdb_id": a.tmdb_id,
            "episode_count": a.episode_count,
            "season_count": a.season_count,
            "poster_path": a.poster_path,
            "backdrop_path": a.backdrop_path,
            "overview": a.overview,
            "rating": a.rating,
            "year": a.year,
            "vote_count": a.vote_count,
            "total_duration": a.total_duration,
            "first_episode_id": a.first_episode_id,
            "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
            "media_type": "anime"
        })

    return {
        "anime": result,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/by-tmdb/{tmdb_id}")
async def get_anime_by_tmdb(
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    """Get all episodes of an anime by TMDB ID, grouped by season"""

    # Get all episodes with this tmdb_id
    episodes = db.query(Media).filter(
        Media.tmdb_id == tmdb_id,
        Media.media_type.in_(['anime', 'anime_series', 'anime_movie']),
        Media.status == 'completed'
    ).order_by(Media.season_number, Media.episode_number).all()

    if not episodes:
        raise HTTPException(status_code=404, detail="Anime not found")

    # Get anime info from episode with most data
    main_episode = max(episodes, key=lambda x: (
        1 if x.poster_path else 0,
        1 if x.overview else 0,
        x.rating or 0
    ))

    # Get genres and actors from main episode
    genres = db.query(Genre).join(MediaGenre).filter(
        MediaGenre.media_id == main_episode.id
    ).all()

    actors = db.query(Actor).join(MediaActor).filter(
        MediaActor.media_id == main_episode.id
    ).order_by(MediaActor.cast_order).limit(10).all()

    # Group episodes by season
    seasons = {}
    for ep in episodes:
        season_num = ep.season_number or 1
        if season_num not in seasons:
            seasons[season_num] = []

        seasons[season_num].append({
            "id": ep.id,
            "episode_number": ep.episode_number,
            "episode_title": ep.episode_title,
            "overview": ep.overview,
            "duration": ep.duration,
            "thumbnail_path": ep.thumbnail_path,
            "rating": ep.rating,
            "filename": ep.filename
        })

    # Sort episodes within each season
    for season_num in seasons:
        seasons[season_num].sort(key=lambda x: x['episode_number'] or 0)

    # Calculate totals
    total_duration = sum(ep.duration or 0 for ep in episodes)
    total_episodes = len(episodes)

    # Get openings/extras for this anime
    openings = db.query(Media).filter(
        Media.parent_tmdb_id == tmdb_id,
        Media.media_type == 'opening'
    ).all()

    opening_list = [{
        "id": op.id,
        "title": op.title,
        "filename": op.filename,
        "duration": op.duration,
        "thumbnail_path": op.thumbnail_path
    } for op in openings]

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
        "total_episodes": total_episodes,
        "total_seasons": len(seasons),
        "total_duration": total_duration,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
        "actors": [{"id": a.id, "name": a.name, "photo_path": a.photo_path} for a in actors],
        "seasons": {str(k): v for k, v in sorted(seasons.items())},
        "openings": opening_list
    }


@router.get("/by-title/{title}")
async def get_anime_by_title(
    title: str,
    db: Session = Depends(get_db)
):
    """Get all episodes of an anime grouped by season"""

    # Get all episodes with this title
    episodes = db.query(Media).filter(
        Media.title == title,
        Media.media_type.in_(['anime', 'anime_series', 'anime_movie']),
        Media.status == 'completed'
    ).order_by(Media.season_number, Media.episode_number).all()

    if not episodes:
        raise HTTPException(status_code=404, detail="Anime not found")

    # Get anime info from episode with most data
    main_episode = max(episodes, key=lambda x: (
        1 if x.poster_path else 0,
        1 if x.overview else 0,
        x.rating or 0
    ))

    # Get genres and actors from main episode
    genres = db.query(Genre).join(MediaGenre).filter(
        MediaGenre.media_id == main_episode.id
    ).all()

    actors = db.query(Actor).join(MediaActor).filter(
        MediaActor.media_id == main_episode.id
    ).order_by(MediaActor.cast_order).limit(10).all()

    # Group episodes by season
    seasons = {}
    for ep in episodes:
        season_num = ep.season_number or 1
        if season_num not in seasons:
            seasons[season_num] = []

        seasons[season_num].append({
            "id": ep.id,
            "episode_number": ep.episode_number,
            "episode_title": ep.episode_title,
            "overview": ep.overview,
            "duration": ep.duration,
            "thumbnail_path": ep.thumbnail_path,
            "rating": ep.rating,
            "filename": ep.filename
        })

    # Sort episodes within each season
    for season_num in seasons:
        seasons[season_num].sort(key=lambda x: x['episode_number'] or 0)

    # Calculate totals
    total_duration = sum(ep.duration or 0 for ep in episodes)
    total_episodes = len(episodes)

    return {
        "title": title,
        "tmdb_id": main_episode.tmdb_id,
        "imdb_id": main_episode.imdb_id,
        "poster_path": main_episode.poster_path,
        "backdrop_path": main_episode.backdrop_path,
        "overview": main_episode.overview,
        "rating": main_episode.rating,
        "vote_count": main_episode.vote_count,
        "year": main_episode.year,
        "language": main_episode.language,
        "total_episodes": total_episodes,
        "total_seasons": len(seasons),
        "total_duration": total_duration,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in genres],
        "actors": [{"id": a.id, "name": a.name, "photo_path": a.photo_path} for a in actors],
        "seasons": {str(k): v for k, v in sorted(seasons.items())}
    }
