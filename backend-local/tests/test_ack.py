from datetime import datetime, timezone

from sqlalchemy.orm import sessionmaker

from app.models import Alert, Warehouse, StorageRecord, Lot, Measurement, Product

HEADERS = {"X-API-KEY": "testkey"}


def _now():
    return datetime(2026, 9, 10, tzinfo=timezone.utc)


def _seed(engine):
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w); s.flush()
        s.add(Measurement(uuid="m1", warehouse_uuid=w.uuid, temperature=29.0, humidity=55.0,
                     measured_at=_now(), device_id="d"))
        # lot in stock (non-terminal)
        lot = Lot(uuid="lot-stock", quantity=1.0, created_at=_now())
        s.add(lot); s.flush()
        s.add(StorageRecord(lot_uuid="lot-stock", warehouse_uuid=w.uuid, arrived_at=_now()))
        # open alert (non-terminal) and resolved alert (terminal)
        s.add(Alert(uuid="al-open", type="out_of_range", warehouse_uuid=w.uuid,
                     triggered_at=_now()))
        s.add(Alert(uuid="al-res", type="out_of_range", warehouse_uuid=w.uuid,
                     triggered_at=_now(), resolved_at=_now()))
        s.commit()


def test_ack_deletes_measurement_terminal(client, engine):
    _seed(engine)
    r = client.post("/sync/ack", headers=HEADERS, json={"measurements": ["m1"]})
    assert r.status_code == 200
    S = sessionmaker(bind=engine)
    with S() as s:
        assert s.get(Measurement, "m1") is None  # deleted (terminal)


def test_ack_keeps_lot_in_stock_but_marks(client, engine):
    _seed(engine)
    client.post("/sync/ack", headers=HEADERS, json={"lots": ["lot-stock"]})
    S = sessionmaker(bind=engine)
    with S() as s:
        lot = s.get(Lot, "lot-stock")
        assert lot is not None            # alive (non-terminal)
        assert lot.acked_at is not None   # marked


def test_ack_deletes_resolved_alert_keeps_open(client, engine):
    _seed(engine)
    client.post("/sync/ack", headers=HEADERS, json={"alerts": ["al-open", "al-res"]})
    S = sessionmaker(bind=engine)
    with S() as s:
        assert s.get(Alert, "al-res") is None      # resolved => terminal => deleted
        assert s.get(Alert, "al-open") is not None  # open => alive
        assert s.get(Alert, "al-open").acked_at is not None


def test_ack_deletes_shipped_lot_and_its_history(client, engine):
    # Shipped lot = current storage closed (departed_at set) => terminal.
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w); s.flush()
        prod = Product(uuid="prod-exp", code="cafe-exp", name="Café vert", variety="Arabica")
        s.add(prod)
        s.add(Lot(uuid="lot-exp", quantity=1.0, product_uuid="prod-exp", created_at=_now()))
        s.add(StorageRecord(uuid="hs-exp", lot_uuid="lot-exp", warehouse_uuid=w.uuid,
                                 arrived_at=_now(), departed_at=_now()))
        s.add(Measurement(uuid="m-batch", warehouse_uuid=w.uuid, temperature=29.0, humidity=55.0,
                     measured_at=_now(), device_id="dbatch"))
        s.commit()

    # Ack the shipped lot AND a measurement in the same batch.
    r = client.post("/sync/ack", headers=HEADERS,
                    json={"lots": ["lot-exp"], "measurements": ["m-batch"]})
    assert r.status_code == 200

    S = sessionmaker(bind=engine)
    with S() as s:
        assert s.get(Lot, "lot-exp") is None              # terminal lot deleted
        assert s.get(StorageRecord, "hs-exp") is None  # storage history deleted (cascade)
        assert s.get(Product, "prod-exp") is not None     # product kept (persistent catalog)
        assert s.get(Measurement, "m-batch") is None           # batch not rolled back: measurement purged


def test_ack_marks_product_but_keeps_it(client, engine):
    S = sessionmaker(bind=engine)
    with S() as s:
        s.add(Product(uuid="p-cat", code="cat", name="Café vert"))
        s.commit()
    r = client.post("/sync/ack", headers=HEADERS, json={"products": ["p-cat"]})
    assert r.status_code == 200
    S = sessionmaker(bind=engine)
    with S() as s:
        p = s.get(Product, "p-cat")
        assert p is not None            # catalog kept
        assert p.acked_at is not None   # marked


def test_ack_keeps_in_transit_lot(client, engine):
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w); s.flush()
        # departed (storage closed) but in transit => NOT terminal
        s.add(Lot(uuid="lot-transit", quantity=1.0, in_transit=True, created_at=_now()))
        s.add(StorageRecord(lot_uuid="lot-transit", warehouse_uuid=w.uuid,
                            arrived_at=_now(), departed_at=_now()))
        s.commit()
    client.post("/sync/ack", headers=HEADERS, json={"lots": ["lot-transit"]})
    S = sessionmaker(bind=engine)
    with S() as s:
        assert s.get(Lot, "lot-transit") is not None  # in transit => not purged


def test_ack_unknown_uuid_tolerated(client, engine):
    _seed(engine)
    r = client.post("/sync/ack", headers=HEADERS, json={"measurements": ["unknown"]})
    assert r.status_code == 200


def test_ack_idempotent(client, engine):
    _seed(engine)
    client.post("/sync/ack", headers=HEADERS, json={"measurements": ["m1"]})
    r = client.post("/sync/ack", headers=HEADERS, json={"measurements": ["m1"]})
    assert r.status_code == 200


def test_ack_shipped_lot_with_expiry_alert(client, engine):
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w)
        s.add(Lot(uuid="lot-exp2", quantity=1.0, in_transit=False, created_at=_now()))
        s.flush()  # lot must exist before rows referencing it (bare FK, no relationship)
        s.add(StorageRecord(uuid="hs2", lot_uuid="lot-exp2", warehouse_uuid=w.uuid,
                            arrived_at=_now(), departed_at=_now()))
        s.add(Alert(uuid="al-exp", type="expired_lot", lot_uuid="lot-exp2",
                    warehouse_uuid=w.uuid, triggered_at=_now()))
        s.commit()
    r = client.post("/sync/ack", headers=HEADERS, json={"lots": ["lot-exp2"]})
    assert r.status_code == 200  # no FOREIGN KEY crash
    S = sessionmaker(bind=engine)
    with S() as s:
        assert s.get(Lot, "lot-exp2") is None    # terminal lot purged
        al = s.get(Alert, "al-exp")
        assert al is not None                     # alert kept (ON DELETE SET NULL)
        assert al.lot_uuid is None                # lot link cleared
