from datetime import timedelta

from app.alerting import check_expired_lots
from app.models import Alert, Warehouse, StorageRecord, Lot


def _lot(session, arrived_at, now):
    w = Warehouse(code="e1", name="E1", country="br")
    session.add(w)
    lot = Lot(quantity=10.0, created_at=now)
    session.add(lot)
    session.flush()
    session.add(StorageRecord(lot_uuid=lot.uuid, warehouse_uuid=w.uuid,
                                   arrived_at=arrived_at))
    session.flush()
    return lot


def test_expiry_creates_alert_and_email(session, now):
    lot = _lot(session, now - timedelta(days=400), now)
    pending = check_expired_lots(session, now)
    session.flush()
    assert session.query(Alert).filter_by(type="expired_lot").count() == 1
    assert lot.status == "expired"
    assert len(pending) == 1


def test_fresh_lot_no_alert(session, now):
    _lot(session, now - timedelta(days=10), now)
    check_expired_lots(session, now)
    assert session.query(Alert).count() == 0


def test_expiry_not_duplicated(session, now):
    _lot(session, now - timedelta(days=400), now)
    check_expired_lots(session, now)
    check_expired_lots(session, now)
    session.flush()
    assert session.query(Alert).filter_by(type="expired_lot").count() == 1


def test_transfer_does_not_reset_expiry(session, now):
    w1 = Warehouse(code="w1", name="a", country="br")
    w2 = Warehouse(code="w2", name="b", country="br")
    session.add_all([w1, w2])
    lot = Lot(quantity=1.0, created_at=now - timedelta(days=700))
    session.add(lot); session.flush()
    session.add(StorageRecord(lot_uuid=lot.uuid, warehouse_uuid=w1.uuid,
                              arrived_at=now - timedelta(days=700),
                              departed_at=now - timedelta(days=10)))
    session.add(StorageRecord(lot_uuid=lot.uuid, warehouse_uuid=w2.uuid,
                              arrived_at=now - timedelta(days=10)))
    session.flush()
    check_expired_lots(session, now)
    session.flush()
    assert session.query(Alert).filter_by(type="expired_lot").count() == 1


def test_expired_lot_in_transit_no_crash(session, now):
    # Regression: an expired lot in transit has no current storage; the email body
    # must use first_arrival(), not current.arrived_at.
    w = Warehouse(code="w1", name="a", country="br")
    session.add(w)
    lot = Lot(quantity=1.0, in_transit=True, created_at=now - timedelta(days=400))
    session.add(lot); session.flush()
    session.add(StorageRecord(lot_uuid=lot.uuid, warehouse_uuid=w.uuid,
                              arrived_at=now - timedelta(days=400),
                              departed_at=now - timedelta(days=1)))
    session.flush()
    pending = check_expired_lots(session, now)  # must not raise
    session.flush()
    assert session.query(Alert).filter_by(type="expired_lot").count() == 1
    assert len(pending) == 1
