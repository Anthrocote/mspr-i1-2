import json
from datetime import datetime

from sqlalchemy.exc import IntegrityError

from app.alerting import evaluate_condition, send_pending
from app.ids import measurement_uuid
from app.models import DeviceWatermark, Measurement, Warehouse


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def get_or_create_warehouse(session, country: str, code: str) -> Warehouse:
    w = session.query(Warehouse).filter_by(code=code).one_or_none()
    if w is None:
        w = Warehouse(code=code, name=code, country=country)
        session.add(w)
        session.flush()
    return w


def _parse_topic(topic: str) -> tuple[str, str, str]:
    # futurekawa/{country}/{warehouse}/{kind}
    parts = topic.split("/")
    return parts[1], parts[2], parts[3]


def handle_message(session, country: str, topic: str, payload: bytes,
                   thresholds, sender, now_fn) -> None:
    _, code, kind = _parse_topic(topic)

    if kind == "status":
        w = get_or_create_warehouse(session, country, code)
        w.last_status = payload.decode().strip()
        w.last_status_at = now_fn()
        session.commit()
        return

    if kind != "mesures":
        return

    data = json.loads(payload)
    device_id = data["device_id"]
    measured_at = _parse_iso(data["mesure_le"])

    # Watermark dedup: ignore any sample already processed for this device, even after
    # its measurement row was purged by ack (otherwise a replay reopens a phantom alert).
    watermark = session.get(DeviceWatermark, device_id)
    if watermark is not None and measured_at <= watermark.last_measured_at:
        return

    w = get_or_create_warehouse(session, country, code)
    measurement = Measurement(uuid=str(measurement_uuid(device_id, data["mesure_le"])),
                    warehouse_uuid=w.uuid,
                    temperature=float(data["temperature"]),
                    humidity=float(data["humidite"]),
                    measured_at=measured_at,
                    device_id=device_id)
    session.add(measurement)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        return  # duplicate (device_id, measured_at) still in buffer: idempotent

    if watermark is None:
        session.add(DeviceWatermark(device_id=device_id, last_measured_at=measured_at))
    else:
        watermark.last_measured_at = measured_at

    pending = evaluate_condition(session, w, measurement.temperature, measurement.humidity,
                                 thresholds, now_fn())
    session.commit()
    send_pending(sender, pending)  # after commit: off the SQLite write transaction
