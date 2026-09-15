from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.alerting import recompute_lot_status, resolve_expiry_alerts
from app.api.deps import require_api_key
from app.db import get_session
from app.ingest import get_or_create_warehouse
from app.models import StorageRecord, Lot, Product, mark_unacked
from app.schemas import ArrivalIn, DepartIn, LotIn, LotOut

router = APIRouter(dependencies=[Depends(require_api_key)])


def _now():
    return datetime.now(timezone.utc)


def _serialize(lot: Lot) -> LotOut:
    storage = lot.latest_storage()
    return LotOut(
        uuid=lot.uuid, label=lot.label, quantity=lot.quantity, status=lot.status,
        in_transit=lot.in_transit,
        warehouse_uuid=storage.warehouse_uuid if storage else None,
        arrived_at=storage.arrived_at if storage else None,
        departed_at=storage.departed_at if storage else None,
    )


@router.post("/lots", status_code=201, response_model=LotOut)
def create_lot(payload: LotIn, session=Depends(get_session)):
    product = session.get(Product, payload.product_uuid)
    if product is None:
        raise HTTPException(404, "Product not found")
    lot = Lot(label=payload.label, quantity=payload.quantity,
              product=product, created_at=_now())
    session.add(lot)
    w = get_or_create_warehouse(session, get_country(), payload.warehouse_code)
    session.add(StorageRecord(lot=lot, warehouse_uuid=w.uuid,
                                   arrived_at=payload.arrived_at or _now()))
    session.flush()
    recompute_lot_status(session, lot)
    session.commit()
    session.refresh(lot)
    return _serialize(lot)


@router.get("/lots", response_model=list[LotOut])
def list_lots(session=Depends(get_session)):
    lots = session.scalars(select(Lot)).all()
    out = [_serialize(l) for l in lots]
    out.sort(key=lambda l: (l.arrived_at is None, l.arrived_at))
    return out


@router.get("/lots/{uuid}", response_model=LotOut)
def get_lot(uuid: str, session=Depends(get_session)):
    lot = session.get(Lot, uuid)
    if lot is None:
        raise HTTPException(404, "Lot not found")
    return _serialize(lot)


@router.post("/lots/{uuid}/depart", response_model=LotOut)
def depart_lot(uuid: str, payload: DepartIn = DepartIn(), session=Depends(get_session)):
    """Lot leaves its current warehouse. A transfer puts it in transit (arrival declared
    later); a shipment (`shipment=true`) is a final exit and makes the lot terminal."""
    lot = session.get(Lot, uuid)
    if lot is None:
        raise HTTPException(404, "Lot not found")
    current = lot.current_storage()
    if current is None:
        raise HTTPException(409, "Lot not in stock (already departed)")
    current.departed_at = _now()
    lot.in_transit = not payload.shipment
    if payload.shipment:
        resolve_expiry_alerts(session, lot, _now())
    mark_unacked(lot)
    recompute_lot_status(session, lot)
    session.commit()
    session.refresh(lot)
    return _serialize(lot)


@router.post("/lots/{uuid}/arrive", response_model=LotOut)
def arrive_lot(uuid: str, payload: ArrivalIn, session=Depends(get_session)):
    """Complete a transfer: open a storage record at the destination warehouse."""
    lot = session.get(Lot, uuid)
    if lot is None:
        raise HTTPException(404, "Lot not found")
    if not lot.in_transit:
        raise HTTPException(409, "Lot is not in transit")
    w = get_or_create_warehouse(session, get_country(), payload.warehouse_code)
    session.add(StorageRecord(lot=lot, warehouse_uuid=w.uuid, arrived_at=_now()))
    lot.in_transit = False
    mark_unacked(lot)
    session.flush()
    recompute_lot_status(session, lot)
    session.commit()
    session.refresh(lot)
    return _serialize(lot)


def get_country() -> str:
    from app.config import get_settings
    return get_settings().country
