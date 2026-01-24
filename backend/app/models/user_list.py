from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class UserList(Base):
    __tablename__ = "user_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    is_system = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    items = relationship("ListItem", back_populates="user_list", cascade="all, delete-orphan")


class ListItem(Base):
    __tablename__ = "list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey('user_lists.id', ondelete='CASCADE'))
    media_id = Column(Integer, ForeignKey('media.id', ondelete='CASCADE'))
    added_at = Column(TIMESTAMP, server_default=func.now())

    user_list = relationship("UserList", back_populates="items")
