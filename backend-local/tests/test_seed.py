from datetime import datetime, timezone

from app.models import Lot
from app.seed import seed_if_empty


def test_seed_creates_lots_including_expired(session):
    seed_if_empty(session)
    session.commit()
    lots = session.query(Lot).all()
    assert len(lots) >= 2
    now = datetime.now(timezone.utc)
    ages = [(now - l.current_storage().arrived_at).days for l in lots
            if l.current_storage()]
    assert any(age > 365 for age in ages)  # one expired lot for the demo


def test_seed_idempotent(session):
    seed_if_empty(session)
    session.commit()
    n = session.query(Lot).count()
    seed_if_empty(session)
    session.commit()
    assert session.query(Lot).count() == n


def test_seed_reruns_after_lots_purged(session):
    seed_if_empty(session)
    session.commit()
    for lot in session.query(Lot).all():
        session.delete(lot)
    session.commit()
    seed_if_empty(session)  # must not violate product.code unique
    session.commit()
    assert session.query(Lot).count() >= 2
