from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    tmdb_id = Column(Integer, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    media_genres = relationship("MediaGenre", back_populates="genre")
