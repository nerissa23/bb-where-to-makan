import uuid
from sqlalchemy import Column, String, JSON
from backend.src.db.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    members = Column(JSON, nullable=False, default=list)
