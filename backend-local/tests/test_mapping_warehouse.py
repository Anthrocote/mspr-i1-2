import json

from app.ids import warehouse_uuid
from app.ingest import handle_message
from app.models import Warehouse, Measurement
from app.rules import Thresholds

THRESHOLDS = Thresholds(ideal_temperature=29.0, ideal_humidity=55.0)


def test_unknown_warehouse_autocreated_with_stable_uuid(session, sender, now):
    handle_message(session, "br", "futurekawa/br/entrepot-neuf/mesures",
                   json.dumps({"temperature": 29.0, "humidite": 55.0,
                               "mesure_le": "2026-09-10T02:15:00Z",
                               "device_id": "d1"}).encode(),
                   THRESHOLDS, sender, lambda: now)
    session.flush()
    w = session.query(Warehouse).filter_by(code="entrepot-neuf").one()
    assert w.uuid == str(warehouse_uuid("br", "entrepot-neuf"))
    m = session.query(Measurement).one()
    assert m.warehouse_uuid == w.uuid
