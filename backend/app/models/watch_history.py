from sqlalchemy import Column, Integer, Float, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    watched_at = Column(TIMESTAMP, server_default=func.now())
    watch_duration = Column(Float)  # Total time watched in this session
    watch_position = Column(Float, default=0)  # Current position in seconds (for resume)
    progress_percent = Column(Float, default=0)  # Progress percentage 0-100
    completed = Column(Boolean, default=False)  # True if watched > 90%

    media = relationship("Media", back_populates="watch_history")
