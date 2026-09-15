from app.ids import warehouse_uuid, measurement_uuid


def test_warehouse_uuid_stable():
    a = warehouse_uuid("br", "entrepot-sao-paulo")
    b = warehouse_uuid("br", "entrepot-sao-paulo")
    assert a == b
    assert str(a) == str(b)


def test_warehouse_uuid_differs_by_code():
    assert warehouse_uuid("br", "a") != warehouse_uuid("br", "b")


def test_measurement_uuid_idempotent():
    a = measurement_uuid("uno-br-01", "2026-09-10T02:15:00Z")
    b = measurement_uuid("uno-br-01", "2026-09-10T02:15:00Z")
    assert a == b
