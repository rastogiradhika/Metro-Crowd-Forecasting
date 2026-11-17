import logging
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings, DEFAULT_DB_PATH

logger = logging.getLogger("metroai.database")

# Ensure SQLAlchemy engine reads DATABASE_URL from config.
# Defaults to SQLite ONLY for local development if env var is missing, but logs a warning.
db_url = settings.DATABASE_URL
if not db_url:
    logger.warning(
        "DATABASE_URL not set in environment or config. Defaulting to local SQLite development database at: %s",
        DEFAULT_DB_PATH
    )
    db_url = f"sqlite:///{DEFAULT_DB_PATH}"
    settings.DATABASE_URL = db_url

# Normalize legacy postgres:// scheme to postgresql:// for SQLAlchemy compatibility (e.g. on Render)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
    settings.DATABASE_URL = db_url

# Configure engine parameters for SQLite (local) vs PostgreSQL (production)
engine_kwargs = {"pool_pre_ping": True}
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(db_url, **engine_kwargs)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request and handles cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
