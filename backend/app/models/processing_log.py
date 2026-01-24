from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    step = Column(String(50))
    message = Column(Text)
    level = Column(String(20), default='info')
    created_at = Column(TIMESTAMP, server_default=func.now())

    media = relationship("Media", back_populates="processing_logs")
