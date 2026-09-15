from datetime import timedelta

from app.alerting import active_condition_alert, evaluate_condition, recompute_lot_status
from app.models import Alert, Warehouse, StorageRecord, Lot
from app.rules import Thresholds

THRESHOLDS = Thresholds(ideal_temperature=29.0, ideal_humidity=55.0)  # T[26,32] H[53,57]


def _warehouse(session):
    w = Warehouse(code="e1", name="E1", country="br")
    session.add(w)
    session.flush()
    return w


def test_open_on_out_of_range_sends_email(session, now):
    w = _warehouse(session)
    pending = evaluate_condition(session, w, 40.0, 55.0, THRESHOLDS, now)
    session.flush()
    a = active_condition_alert(session, w.uuid)
    assert a is not None
    assert a.resolved_at is None
    assert len(pending) == 1  # opening email


def test_no_duplicate_while_active(session, now):
    w = _warehouse(session)
    p1 = evaluate_condition(session, w, 40.0, 55.0, THRESHOLDS, now)
    p2 = evaluate_condition(session, w, 41.0, 55.0, THRESHOLDS, now + timedelta(minutes=1))
    session.flush()
    alerts = session.query(Alert).filter_by(warehouse_uuid=w.uuid).all()
    assert len(alerts) == 1
    assert len(p1) == 1 and p2 == []  # single opening, no second email


def test_resolve_on_return_sends_second_email(session, now):
    w = _warehouse(session)
    p1 = evaluate_condition(session, w, 40.0, 55.0, THRESHOLDS, now)
    p2 = evaluate_condition(session, w, 29.0, 55.0, THRESHOLDS, now + timedelta(minutes=5))
    session.flush()
    assert active_condition_alert(session, w.uuid) is None
    a = session.query(Alert).filter_by(warehouse_uuid=w.uuid).one()
    assert a.resolved_at is not None
    assert len(p1) == 1 and len(p2) == 1  # opening then resolution


def test_in_range_never_opens(session, now):
    w = _warehouse(session)
    pending = evaluate_condition(session, w, 29.0, 55.0, THRESHOLDS, now)
    session.flush()
    assert session.query(Alert).count() == 0
    assert pending == []


def test_recompute_status_in_alert(session, now):
    w = _warehouse(session)
    lot = Lot(quantity=10.0, created_at=now)
    session.add(lot)
    session.flush()
    session.add(StorageRecord(lot_uuid=lot.uuid, warehouse_uuid=w.uuid, arrived_at=now))
    session.add(Alert(type="out_of_range", warehouse_uuid=w.uuid, triggered_at=now))
    session.flush()
    recompute_lot_status(session, lot)
    assert lot.status == "in_alert"
