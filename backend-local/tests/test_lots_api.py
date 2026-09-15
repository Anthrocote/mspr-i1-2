HEADERS = {"X-API-KEY": "testkey"}


def _make_product(client, code="cafe-arabica"):
    return client.post("/products", headers=HEADERS, json={
        "code": code, "name": "Café vert", "variety": "Arabica"}).json()["uuid"]


def _create_lot(client, warehouse_code="entrepot-sao-paulo",
                arrived_at="2026-09-10T00:00:00Z", product_uuid=None):
    if product_uuid is None:
        product_uuid = _make_product(client)
    return client.post("/lots", headers=HEADERS, json={
        "quantity": 100.0, "warehouse_code": warehouse_code,
        "product_uuid": product_uuid, "arrived_at": arrived_at})


def test_create_lot(client):
    r = _create_lot(client)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "compliant"
    assert body["warehouse_uuid"]


def test_create_lot_unknown_product_404(client):
    r = client.post("/lots", headers=HEADERS, json={
        "quantity": 10.0, "warehouse_code": "e", "product_uuid": "does-not-exist"})
    assert r.status_code == 404


def test_list_lots_sorted_fifo(client):
    puid = _make_product(client)
    client.post("/lots", headers=HEADERS, json={
        "quantity": 5.0, "warehouse_code": "e", "product_uuid": puid,
        "arrived_at": "2026-01-02T00:00:00Z"})
    client.post("/lots", headers=HEADERS, json={
        "quantity": 5.0, "warehouse_code": "e", "product_uuid": puid,
        "arrived_at": "2026-01-01T00:00:00Z"})
    r = client.get("/lots", headers=HEADERS)
    dates = [l["arrived_at"] for l in r.json()]
    assert dates == sorted(dates)  # oldest first


def test_depart_puts_lot_in_transit(client):
    lot = _create_lot(client).json()
    r = client.post(f"/lots/{lot['uuid']}/depart", headers=HEADERS)
    assert r.status_code == 200
    assert r.json()["in_transit"] is True
    assert r.json()["departed_at"] is not None


def test_arrive_completes_transfer(client):
    lot = _create_lot(client).json()
    client.post(f"/lots/{lot['uuid']}/depart", headers=HEADERS)
    r = client.post(f"/lots/{lot['uuid']}/arrive", headers=HEADERS,
                    json={"warehouse_code": "warehouse-b"})
    assert r.status_code == 200
    body = r.json()
    assert body["in_transit"] is False
    assert body["warehouse_uuid"] != lot["warehouse_uuid"]
    assert body["departed_at"] is None  # new open storage at destination


def test_arrive_requires_in_transit(client):
    lot = _create_lot(client).json()
    r = client.post(f"/lots/{lot['uuid']}/arrive", headers=HEADERS,
                    json={"warehouse_code": "warehouse-b"})
    assert r.status_code == 409


def test_depart_shipment_exits_circuit(client):
    lot = _create_lot(client).json()
    r = client.post(f"/lots/{lot['uuid']}/depart", headers=HEADERS, json={"shipment": True})
    assert r.status_code == 200
    body = r.json()
    assert body["departed_at"] is not None
    assert body["in_transit"] is False


def test_create_lot_rejects_nonpositive_quantity(client):
    puid = _make_product(client)
    r = client.post("/lots", headers=HEADERS, json={
        "quantity": -1, "warehouse_code": "e", "product_uuid": puid})
    assert r.status_code == 422


def test_create_lot_rejects_long_label(client):
    puid = _make_product(client)
    r = client.post("/lots", headers=HEADERS, json={
        "quantity": 1, "warehouse_code": "e", "product_uuid": puid, "label": "x" * 101})
    assert r.status_code == 422


def test_create_lot_in_alerting_warehouse_is_in_alert(client, engine):
    from datetime import datetime, timezone
    from sqlalchemy.orm import sessionmaker
    from app.ids import warehouse_uuid
    from app.models import Alert, Warehouse
    wuid = str(warehouse_uuid("br", "wh-alert"))
    S = sessionmaker(bind=engine)
    with S() as s:
        s.add(Warehouse(code="wh-alert", name="x", country="br")); s.flush()
        s.add(Alert(type="out_of_range", warehouse_uuid=wuid,
                    triggered_at=datetime(2026, 9, 10, tzinfo=timezone.utc)))
        s.commit()
    puid = _make_product(client)
    r = client.post("/lots", headers=HEADERS, json={
        "quantity": 1, "warehouse_code": "wh-alert", "product_uuid": puid})
    assert r.status_code == 201
    assert r.json()["status"] == "in_alert"


def test_get_lot_by_uuid(client):
    lot = _create_lot(client).json()
    r = client.get(f"/lots/{lot['uuid']}", headers=HEADERS)
    assert r.status_code == 200
    assert r.json()["uuid"] == lot["uuid"]


def test_get_lot_unknown_404(client):
    assert client.get("/lots/nope", headers=HEADERS).status_code == 404


def test_ship_resolves_expiry_alert(client, engine):
    from datetime import datetime, timezone
    from sqlalchemy.orm import sessionmaker
    from app.models import Alert
    lot = _create_lot(client).json()
    S = sessionmaker(bind=engine)
    with S() as s:
        s.add(Alert(uuid="ea", type="expired_lot", lot_uuid=lot["uuid"],
                    triggered_at=datetime(2026, 9, 10, tzinfo=timezone.utc)))
        s.commit()
    client.post(f"/lots/{lot['uuid']}/depart", headers=HEADERS, json={"shipment": True})
    with S() as s:
        assert s.get(Alert, "ea").resolved_at is not None  # resolved on ship


def test_sync_lots_exposes_in_transit(client):
    lot = _create_lot(client).json()
    client.post(f"/lots/{lot['uuid']}/depart", headers=HEADERS)  # transfer -> in transit
    item = [x for x in client.get("/sync/lots", headers=HEADERS).json()
            if x["uuid"] == lot["uuid"]][0]
    assert item["in_transit"] is True
