from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings


@event.listens_for(Engine, "connect")
def _set_sqlite_wal(dbapi_conn, _):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA foreign_keys=ON")
    # Each component (MQTT thread, API, scheduler) opens its own connection:
    # WAL allows N readers + 1 writer, busy_timeout absorbs write contention.
    cur.execute("PRAGMA busy_timeout=5000")
    cur.close()


def make_engine():
    url = get_settings().database_url
    return create_engine(url, connect_args={"check_same_thread": False})


engine = None
SessionLocal = None


def init_db():
    global engine, SessionLocal
    from app.models import Base

    engine = make_engine()
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal


def get_session():
    assert SessionLocal is not None, "init_db() not called"
    with SessionLocal() as s:
        yield s
