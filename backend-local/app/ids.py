import uuid

from app.config import UUID_NAMESPACE


def warehouse_uuid(country: str, code: str) -> uuid.UUID:
    return uuid.uuid5(UUID_NAMESPACE, f"{country}/{code}")


def measurement_uuid(device_id: str, measured_at_iso: str) -> uuid.UUID:
    return uuid.uuid5(UUID_NAMESPACE, f"{device_id}|{measured_at_iso}")
