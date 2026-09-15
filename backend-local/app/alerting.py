import logging
from datetime import datetime

from sqlalchemy import select

from app.models import Alert, StorageRecord, Lot, Warehouse, mark_unacked
from app.rules import Thresholds

logger = logging.getLogger(__name__)


Notification = tuple[str, str]  # (subject, body)


def send_pending(sender, pending: list[Notification]) -> None:
    # Sent by callers AFTER the DB commit, off the write transaction: a hung/slow SMTP
    # must not hold the SQLite write lock. A delivery failure is logged, never raised.
    for subject, body in pending:
        try:
            sender.send(subject, body)
        except Exception:
            logger.exception("Alert email delivery failed: %s", subject)


def active_condition_alert(session, warehouse_uuid: str) -> Alert | None:
    stmt = select(Alert).where(
        Alert.warehouse_uuid == warehouse_uuid,
        Alert.type == "out_of_range",
        Alert.resolved_at.is_(None),
    )
    return session.scalars(stmt).first()


def _lots_in_warehouse(session, warehouse_uuid: str) -> list[Lot]:
    stmt = (
        select(Lot)
        .join(StorageRecord, StorageRecord.lot_uuid == Lot.uuid)
        .where(
            StorageRecord.warehouse_uuid == warehouse_uuid,
            StorageRecord.departed_at.is_(None),
        )
    )
    return list(session.scalars(stmt))


def evaluate_condition(session, warehouse: Warehouse, temperature: float,
                       humidity: float, thresholds: Thresholds,
                       now: datetime) -> list[Notification]:
    out_of_range = thresholds.is_out_of_range(temperature, humidity)
    active = active_condition_alert(session, warehouse.uuid)
    pending: list[Notification] = []

    if out_of_range and active is None:
        alert = Alert(type="out_of_range", warehouse_uuid=warehouse.uuid,
                        triggered_at=now)
        session.add(alert)
        session.flush()
        pending.append((
            f"[FutureKawa] Alerte conditions — {warehouse.name}",
            f"Conditions de stockage hors plage détectées le {now.isoformat()}.\n"
            f"Température : {temperature} °C, humidité : {humidity} %.\n"
            f"Conditions idéales : {thresholds.ideal_temperature} °C ±{thresholds.temp_tolerance} °C, "
            f"{thresholds.ideal_humidity} % ±{thresholds.humidity_tolerance} %.",
        ))
        for lot in _lots_in_warehouse(session, warehouse.uuid):
            recompute_lot_status(session, lot)

    elif not out_of_range and active is not None:
        active.resolved_at = now
        mark_unacked(active)
        session.flush()
        pending.append((
            f"[FutureKawa] Retour à la normale — {warehouse.name}",
            f"Conditions revenues dans la plage le {now.isoformat()}.\n"
            f"Température : {temperature} °C, humidité : {humidity} %.",
        ))
        for lot in _lots_in_warehouse(session, warehouse.uuid):
            recompute_lot_status(session, lot)

    return pending


def recompute_lot_status(session, lot: Lot) -> None:
    expiry_alert = session.scalars(
        select(Alert).where(Alert.lot_uuid == lot.uuid,
                             Alert.type == "expired_lot",
                             Alert.resolved_at.is_(None))
    ).first()
    if expiry_alert is not None:
        new_status = "expired"
    else:
        current = lot.current_storage()
        has_active_condition = (
            current is not None
            and active_condition_alert(session, current.warehouse_uuid) is not None
        )
        new_status = "in_alert" if has_active_condition else "compliant"

    if lot.status != new_status:
        lot.status = new_status
        mark_unacked(lot)


def resolve_expiry_alerts(session, lot: Lot, now: datetime) -> None:
    # When a lot leaves the circuit its expired_lot alert is moot: resolve it (so it
    # propagates and is purged) instead of leaving an immortal orphan behind.
    alerts = session.scalars(
        select(Alert).where(Alert.lot_uuid == lot.uuid,
                            Alert.type == "expired_lot",
                            Alert.resolved_at.is_(None))
    ).all()
    for alert in alerts:
        alert.resolved_at = now
        mark_unacked(alert)


def check_expired_lots(session, now: datetime, max_age_days: int = 365) -> list[Notification]:
    from app.rules import is_expired

    pending: list[Notification] = []
    for lot in session.scalars(select(Lot)):
        current = lot.current_storage()
        # Skip lots that left the circuit (shipped): no open storage and not in transit.
        if current is None and not lot.in_transit:
            continue
        if not is_expired(lot.first_arrival(), now, max_age_days):
            continue
        existing = session.scalars(
            select(Alert).where(Alert.lot_uuid == lot.uuid,
                                 Alert.type == "expired_lot",
                                 Alert.resolved_at.is_(None))
        ).first()
        if existing is not None:
            continue
        alert = Alert(type="expired_lot", lot_uuid=lot.uuid,
                        warehouse_uuid=current.warehouse_uuid if current else None,
                        triggered_at=now)
        session.add(alert)
        session.flush()
        recompute_lot_status(session, lot)
        # first_arrival(), not current.arrived_at: an expired lot in transit has no
        # current storage.
        pending.append((
            f"[FutureKawa] Lot périmé — {lot.uuid}",
            f"Le lot {lot.uuid} dépasse {max_age_days} jours de stockage "
            f"(arrivé le {lot.first_arrival().isoformat()}).\n"
            f"Statut mis à jour : périmé.",
        ))
    return pending
