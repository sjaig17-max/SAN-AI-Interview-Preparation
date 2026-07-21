import os
import sys
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# Determine database URL with automatic SQLite fallback
db_url = settings.DATABASE_URL
is_sqlite = False

# Try connecting to PostgreSQL. If it fails, fall back to SQLite in development
if settings.ENVIRONMENT == "development":
    try:
        temp_engine = create_engine(db_url, connect_args={"connect_timeout": 2})
        with temp_engine.connect() as conn:
            pass
        temp_engine.dispose()
    except Exception:
        # Fallback to local SQLite file in the backend root directory
        # Isolate pytest environment using a dedicated test database
        is_testing = "pytest" in sys.modules or os.getenv("TESTING") == "True"
        db_filename = "test_san_ai.db" if is_testing else "san_ai.db"
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), db_filename)
        db_url = f"sqlite:///{db_path}"
        is_sqlite = True

# Create database engine
if is_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency injection helper that yields a SQLAlchemy database session.
    Automatically closes the session after request lifecycle ends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
