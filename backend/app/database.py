from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from backend.app.models import entities  # noqa: F401
    Base.metadata.create_all(bind=engine)

def get_db():
    # Ensure tables exist
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
