HEADERS = {"X-API-KEY": "testkey"}


def _create(client):
    puid = client.post("/products", headers=HEADERS, json={
        "code": "cafe-arabica", "name": "Café vert", "description": "Grade A",
        "variety": "Arabica"}).json()["uuid"]
    return client.post("/lots", headers=HEADERS, json={
        "quantity": 100.0, "warehouse_code": "entrepot-sao-paulo",
        "product_uuid": puid,
        "arrived_at": "2026-09-10T00:00:00Z"}).json()


def test_sync_lots_shape(client):
    _create(client)
    r = client.get("/sync/lots", headers=HEADERS)
    assert r.status_code == 200
    item = r.json()[0]
    assert set(item) == {"uuid", "label", "quantity", "status", "in_transit",
                         "warehouse_uuid", "product_uuid", "arrived_at", "departed_at"}
    assert item["product_uuid"]  # linked by uuid, product synced separately
    assert item["status"] in {"compliant", "in_alert", "expired"}


def test_sync_products_shape(client):
    _create(client)  # creates a product in the catalog
    r = client.get("/sync/products", headers=HEADERS)
    assert r.status_code == 200
    item = r.json()[0]
    assert set(item) == {"uuid", "name", "description", "variety"}


def test_sync_lots_uses_in_alert_status(client):
    # status is never 'alerte' (head office value = in_alert)
    _create(client)
    for item in client.get("/sync/lots", headers=HEADERS).json():
        assert item["status"] != "alerte"


def test_sync_measurements_shape_no_device_id(client, engine):
    from sqlalchemy.orm import sessionmaker
    from app.models import Warehouse, Measurement
    from datetime import datetime, timezone
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w); s.flush()
        s.add(Measurement(uuid="m1", warehouse_uuid=w.uuid, temperature=29.0, humidity=55.0,
                     measured_at=datetime(2026, 9, 10, tzinfo=timezone.utc), device_id="d"))
        s.commit()
    r = client.get("/sync/measurements", headers=HEADERS)
    item = r.json()[0]
    assert set(item) == {"uuid", "warehouse_uuid", "temperature", "humidity", "measured_at"}


def test_sync_only_unacked(client, engine):
    from sqlalchemy.orm import sessionmaker
    from app.models import Warehouse, Measurement
    from datetime import datetime, timezone
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br")
        s.add(w); s.flush()
        s.add(Measurement(uuid="m1", warehouse_uuid=w.uuid, temperature=29.0, humidity=55.0,
                     measured_at=datetime(2026, 9, 10, tzinfo=timezone.utc), device_id="d",
                     acked_at=datetime(2026, 9, 10, tzinfo=timezone.utc)))
        s.commit()
    assert client.get("/sync/measurements", headers=HEADERS).json() == []


def test_sync_alerts_shape(client, engine):
    from datetime import datetime, timezone
    from sqlalchemy.orm import sessionmaker
    from app.models import Alert, Warehouse
    S = sessionmaker(bind=engine)
    with S() as s:
        w = Warehouse(code="e", name="e", country="br"); s.add(w); s.flush()
        s.add(Alert(uuid="a1", type="out_of_range", warehouse_uuid=w.uuid,
                    triggered_at=datetime(2026, 9, 10, tzinfo=timezone.utc)))
        s.commit()
    item = client.get("/sync/alerts", headers=HEADERS).json()[0]
    assert set(item) == {"uuid", "type", "warehouse_uuid", "lot_uuid",
                         "triggered_at", "resolved_at"}
