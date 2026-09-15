from datetime import timezone

from app.models import Alert, Warehouse, Lot, mark_unacked


def test_create_and_query(session, now):
    w = Warehouse(code="entrepot-sao-paulo", name="São Paulo", country="br")
    session.add(w)
    session.flush()
    assert w.uuid is not None

    lot = Lot(quantity=100.0, product_uuid=None, acked_at=now)
    session.add(lot)
    session.flush()
    assert lot.status == "compliant"


def test_mark_unacked_resets(session, now):
    a = Alert(type="out_of_range", triggered_at=now, acked_at=now)
    session.add(a)
    session.flush()
    mark_unacked(a)
    assert a.acked_at is None


def test_utcdatetime_normalizes_non_utc_offset(session):
    from datetime import datetime, timezone, timedelta
    from app.models import Measurement, Warehouse
    w = Warehouse(code="e", name="e", country="br")
    session.add(w); session.flush()
    aware = datetime(2026, 9, 10, 14, 0, tzinfo=timezone(timedelta(hours=-3)))  # 17:00Z
    session.add(Measurement(uuid="m", warehouse_uuid=w.uuid, temperature=1.0,
                            humidity=1.0, measured_at=aware, device_id="d"))
    session.commit()
    session.expire_all()
    m = session.get(Measurement, "m")
    assert m.measured_at == datetime(2026, 9, 10, 17, 0, tzinfo=timezone.utc)
