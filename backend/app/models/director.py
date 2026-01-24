from sqlalchemy import Column, Integer, String, Text, Float, Date, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Director(Base):
    __tablename__ = "directors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tmdb_id = Column(Integer, unique=True)
    photo_path = Column(Text)
    biography = Column(Text)
    birth_date = Column(Date)
    popularity = Column(Float, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    media_directors = relationship("MediaDirector", back_populates="director")
