import uuid
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, func
from backend.src.db.database import Base


class RecommendationSession(Base):
    __tablename__ = "recommendation_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    cravings = Column(JSON, nullable=False)
    results = Column(JSON, nullable=False)
    status = Column(String, nullable=False, default="ready")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())