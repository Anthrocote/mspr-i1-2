import json

from app.ingest import handle_message
from app.models import Measurement
from app.rules import Thresholds

THRESHOLDS = Thresholds(ideal_temperature=29.0, ideal_humidity=55.0)


def _payload():
    return json.dumps({
        "temperature": 29.0, "humidite": 55.0,
        "mesure_le": "2026-09-10T02:15:00Z", "device_id": "uno-br-01",
    }).encode()


def test_ingest_persists_measurement(session, sender, now):
    handle_message(session, "br", "futurekawa/br/entrepot-sao-paulo/mesures",
                   _payload(), THRESHOLDS, sender, lambda: now)
    session.flush()
    assert session.query(Measurement).count() == 1


def test_ingest_dedup_idempotent(session, sender, now):
    topic = "futurekawa/br/entrepot-sao-paulo/mesures"
    handle_message(session, "br", topic, _payload(), THRESHOLDS, sender, lambda: now)
    handle_message(session, "br", topic, _payload(), THRESHOLDS, sender, lambda: now)
    session.flush()
    assert session.query(Measurement).count() == 1


def test_ingest_persists_despite_email_failure(session, now):
    from app.models import Measurement

    class BrokenSender:
        def send(self, subject, body):
            raise ConnectionRefusedError("smtp down")

    handle_message(session, "br", "futurekawa/br/wh/mesures",
                   json.dumps({"temperature": 45.0, "humidite": 55.0,
                               "mesure_le": "2026-09-10T02:15:00Z",
                               "device_id": "d1"}).encode(),
                   THRESHOLDS, BrokenSender(), lambda: now)
    session.expire_all()
    assert session.query(Measurement).count() == 1  # persisted despite email failure


def test_replay_after_purge_is_ignored(session, sender, now):
    from app.models import Alert, Measurement
    payload = json.dumps({"temperature": 45.0, "humidite": 55.0,
                          "mesure_le": "2026-09-10T02:15:00Z", "device_id": "d1"}).encode()
    handle_message(session, "br", "futurekawa/br/wh/mesures", payload, THRESHOLDS, sender,
                   lambda: now)
    session.query(Measurement).delete()  # simulate ack purge of the measurement row
    session.commit()
    alerts_before = session.query(Alert).count()
    handle_message(session, "br", "futurekawa/br/wh/mesures", payload, THRESHOLDS, sender,
                   lambda: now)
    session.expire_all()
    assert session.query(Measurement).count() == 0        # replay ignored (watermark)
    assert session.query(Alert).count() == alerts_before  # no phantom alert
