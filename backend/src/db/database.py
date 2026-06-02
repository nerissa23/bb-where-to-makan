import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/db/bb.db")

def _normalize_database_url(database_url: str) -> str:
    # SQLAlchemy's sync engine needs a sync driver, so normalize common async or shorthand URLs.
    if database_url.startswith("sqlite+aiosqlite"):
        return database_url.replace("sqlite+aiosqlite", "sqlite", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    return database_url


sync_url = _normalize_database_url(DATABASE_URL)

connect_args = {"check_same_thread": False} if sync_url.startswith("sqlite") else {}

engine = create_engine(sync_url, connect_args=connect_args, pool_pre_ping=not sync_url.startswith("sqlite"))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def init_db():
    # Import models here to ensure they are registered on Base before create_all
    try:
        from backend.src.models import group as _g  # noqa: F401
        from backend.src.models import recommendation as _r  # noqa: F401
    except Exception:
        # fallback if imported differently during tests
        pass
    Base.metadata.create_all(bind=engine)
