from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import require_api_key
from app.api.sync import serialize_alert, serialize_measurement
from app.db import get_session
from app.models import Alert, Warehouse, Measurement

router = APIRouter(dependencies=[Depends(require_api_key)])


@router.get("/measurements")
def measurements(warehouse: str | None = None, session=Depends(get_session)):
    stmt = select(Measurement)
    if warehouse is not None:
        w = session.query(Warehouse).filter_by(code=warehouse).one_or_none()
        stmt = stmt.where(Measurement.warehouse_uuid == (w.uuid if w else "none"))
    return [serialize_measurement(m) for m in session.scalars(stmt)]


@router.get("/alerts")
def alerts(session=Depends(get_session)):
    return [serialize_alert(a) for a in session.scalars(select(Alert))]
