from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tmdb_id = Column(Integer, unique=True)
    overview = Column(Text)
    poster_path = Column(Text)
    backdrop_path = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    media_collections = relationship("MediaCollection", back_populates="collection")
