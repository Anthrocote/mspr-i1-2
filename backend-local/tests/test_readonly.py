HEADERS = {"X-API-KEY": "testkey"}


def test_get_measurements_requires_key(client):
    assert client.get("/measurements").status_code == 401


def test_get_measurements_empty_ok(client):
    r = client.get("/measurements", headers=HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_get_alerts_empty_ok(client):
    r = client.get("/alerts", headers=HEADERS)
    assert r.status_code == 200
    assert r.json() == []


def test_measurements_filtered_by_warehouse(client, engine):
    from datetime import datetime, timezone
    from sqlalchemy.orm import sessionmaker
    from app.models import Measurement, Warehouse
    S = sessionmaker(bind=engine)
    with S() as s:
        a = Warehouse(code="wa", name="a", country="br")
        b = Warehouse(code="wb", name="b", country="br")
        s.add_all([a, b]); s.flush()
        s.add(Measurement(uuid="ma", warehouse_uuid=a.uuid, temperature=1.0, humidity=1.0,
                          measured_at=datetime(2026, 9, 10, tzinfo=timezone.utc), device_id="x"))
        s.add(Measurement(uuid="mb", warehouse_uuid=b.uuid, temperature=1.0, humidity=1.0,
                          measured_at=datetime(2026, 9, 10, tzinfo=timezone.utc), device_id="y"))
        s.commit()
    r = client.get("/measurements?warehouse=wa", headers=HEADERS)
    assert {m["uuid"] for m in r.json()} == {"ma"}
