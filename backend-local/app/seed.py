from datetime import datetime, timedelta, timezone

from app.config import get_settings
from app.ingest import get_or_create_warehouse
from app.models import StorageRecord, Lot, Product


def _get_or_create_product(session, code, **kw) -> Product:
    # Products are persistent catalog data (never purged by ack); a re-seed after the
    # demo lots were shipped must reuse them, not violate the unique code.
    product = session.query(Product).filter_by(code=code).one_or_none()
    if product is None:
        product = Product(code=code, **kw)
        session.add(product)
    return product


def seed_if_empty(session) -> None:
    if session.query(Lot).count() > 0:
        return

    now = datetime.now(timezone.utc)
    country = get_settings().country
    warehouse = get_or_create_warehouse(session, country, "entrepot-sao-paulo")

    arabica = _get_or_create_product(session, "cafe-vert-arabica", name="Café vert",
                                     description="Grade A", variety="Arabica")
    robusta = _get_or_create_product(session, "cafe-vert-robusta", name="Café vert",
                                     description="Grade B", variety="Robusta")

    # Language-neutral batch codes: the demo dataset is shown in the trilingual
    # documentation, so labels must not read as one language. Old vs recent is
    # conveyed by the storage duration and status columns, not by the label.
    recent = Lot(label="BR-0512", quantity=500.0, product=arabica, created_at=now)
    old = Lot(label="BR-0407", quantity=300.0, product=robusta, created_at=now)
    session.add_all([recent, old])
    session.flush()

    session.add(StorageRecord(lot=recent, warehouse_uuid=warehouse.uuid,
                                   arrived_at=now - timedelta(days=30)))
    session.add(StorageRecord(lot=old, warehouse_uuid=warehouse.uuid,
                                   arrived_at=now - timedelta(days=400)))
