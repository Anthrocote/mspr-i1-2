from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import require_api_key
from app.db import get_session
from app.models import Alert, Exploitation, Lot, Measurement, Product
from app.schemas import AckIn

router = APIRouter(prefix="/sync", dependencies=[Depends(require_api_key)])


def _iso(dt):
    return dt.isoformat() if dt else None


def serialize_product(p: Product) -> dict:
    return {
        "uuid": p.uuid,
        "name": p.name,
        "description": p.description,
        "variety": p.variety,
    }


def serialize_exploitation(e: Exploitation) -> dict:
    return {
        "uuid": e.uuid,
        "name": e.name,
        "country": e.country,
    }


def serialize_lot(lot: Lot) -> dict:
    storage = lot.latest_storage()
    return {
        "uuid": lot.uuid,
        "label": lot.label,
        "quantity": lot.quantity,
        "status": lot.status,  # compliant | in_alert | expired
        "in_transit": lot.in_transit,
        "warehouse_uuid": storage.warehouse_uuid if storage else None,
        "product_uuid": lot.product_uuid,  # product synced separately, linked by uuid
        "exploitation_uuid": lot.exploitation_uuid,  # exploitation synced separately
        "constituted_at": _iso(lot.constituted_at),
        "arrived_at": _iso(storage.arrived_at) if storage else None,
        "departed_at": _iso(storage.departed_at) if storage else None,
    }


def serialize_measurement(m: Measurement) -> dict:
    return {
        "uuid": m.uuid,
        "warehouse_uuid": m.warehouse_uuid,
        "temperature": m.temperature,
        "humidity": m.humidity,
        "measured_at": _iso(m.measured_at),
    }


def serialize_alert(a: Alert) -> dict:
    return {
        "uuid": a.uuid,
        "type": a.type,
        "warehouse_uuid": a.warehouse_uuid,
        "lot_uuid": a.lot_uuid,
        "triggered_at": _iso(a.triggered_at),
        "resolved_at": _iso(a.resolved_at),
    }


@router.get("/products")
def sync_products(session=Depends(get_session)):
    ps = session.scalars(select(Product).where(Product.acked_at.is_(None)))
    return [serialize_product(p) for p in ps]


@router.get("/exploitations")
def sync_exploitations(session=Depends(get_session)):
    es = session.scalars(select(Exploitation).where(Exploitation.acked_at.is_(None)))
    return [serialize_exploitation(e) for e in es]


@router.get("/lots")
def sync_lots(session=Depends(get_session)):
    lots = session.scalars(select(Lot).where(Lot.acked_at.is_(None)))
    return [serialize_lot(l) for l in lots]


@router.get("/measurements")
def sync_measurements(session=Depends(get_session)):
    ms = session.scalars(select(Measurement).where(Measurement.acked_at.is_(None)))
    return [serialize_measurement(m) for m in ms]


@router.get("/alerts")
def sync_alerts(session=Depends(get_session)):
    al = session.scalars(select(Alert).where(Alert.acked_at.is_(None)))
    return [serialize_alert(a) for a in al]


def _is_lot_terminal(lot: Lot) -> bool:
    # Shipped: no open storage AND not merely in transit between two warehouses.
    return lot.current_storage() is None and not lot.in_transit


@router.post("/ack")
def sync_ack(payload: AckIn, session=Depends(get_session)):
    now = datetime.now(timezone.utc)

    for uuid in payload.measurements:
        m = session.get(Measurement, uuid)
        if m is None:
            continue
        session.delete(m)  # measurement is always terminal

    for uuid in payload.lots:
        lot = session.get(Lot, uuid)
        if lot is None:
            continue
        lot.acked_at = now
        if _is_lot_terminal(lot):
            # cascade also deletes its storage history; the product stays (it is
            # persistent catalog data shared across lots, not per-lot buffer).
            session.delete(lot)

    for uuid in payload.alerts:
        a = session.get(Alert, uuid)
        if a is None:
            continue
        a.acked_at = now
        if a.resolved_at is not None:
            session.delete(a)

    for uuid in payload.products:
        p = session.get(Product, uuid)
        if p is None:
            continue
        p.acked_at = now  # catalog reference data: marked, never deleted

    for uuid in payload.exploitations:
        e = session.get(Exploitation, uuid)
        if e is None:
            continue
        e.acked_at = now  # catalog reference data: marked, never deleted

    session.commit()
    return {"status": "ok"}
