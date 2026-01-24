from sqlalchemy import Column, Integer, String, Text, Float, Date, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tmdb_id = Column(Integer, unique=True)
    photo_path = Column(Text)
    biography = Column(Text)
    birth_date = Column(Date)
    birth_place = Column(String(255))
    popularity = Column(Float, default=0)
    external_url = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    media_actors = relationship("MediaActor", back_populates="actor")
