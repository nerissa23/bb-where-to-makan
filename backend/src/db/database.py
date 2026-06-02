import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/db/bb.db")

# If developers use an async sqlite url in env (sqlite+aiosqlite), convert to sync for SQLAlchemy engine used here
if DATABASE_URL.startswith("sqlite+aiosqlite"):
    sync_url = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
else:
    sync_url = DATABASE_URL

connect_args = {"check_same_thread": False} if sync_url.startswith("sqlite") else {}

engine = create_engine(sync_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def init_db():
    # Import models here to ensure they are registered on Base before create_all
    try:
        from backend.src.models import group as _g  # noqa: F401
    except Exception:
        # fallback if imported differently during tests
        pass
    Base.metadata.create_all(bind=engine)
