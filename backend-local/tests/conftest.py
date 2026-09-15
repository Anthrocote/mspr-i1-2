import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base


@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enforce foreign keys in tests like the app does, deterministically (independent
    # of import order): attached before create_all so the StaticPool connection gets it.
    @event.listens_for(eng, "connect")
    def _fk_on(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(eng)
    return eng


@pytest.fixture
def session(engine):
    Session = sessionmaker(bind=engine)
    with Session() as s:
        yield s


@pytest.fixture
def now():
    return datetime(2026, 9, 10, 12, 0, tzinfo=timezone.utc)


class CapturingSender:
    def __init__(self):
        self.sent = []

    def send(self, subject: str, body: str) -> None:
        self.sent.append((subject, body))


@pytest.fixture
def sender():
    return CapturingSender()


@pytest.fixture
def client(engine, monkeypatch):
    from sqlalchemy.orm import sessionmaker
    from fastapi.testclient import TestClient
    import app.db as db
    from app.main import create_app

    db.SessionLocal = sessionmaker(bind=engine)
    monkeypatch.setenv("API_KEY", "testkey")
    from app.config import get_settings
    get_settings.cache_clear()
    app_ = create_app(start_background=False)
    return TestClient(app_)
