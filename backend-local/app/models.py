import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    TypeDecorator,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class UtcDateTime(TypeDecorator):
    """Force datetimes to be UTC tz-aware. SQLite does not persist the timezone:
    without this type, a value read back would come back naive and break any
    comparison with an aware datetime (and serialize an ISO8601 without offset
    for the head office)."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value, dialect):
        if value is not None and value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value


class Base(DeclarativeBase):
    pass


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Product(Base):
    __tablename__ = "product"
    uuid: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid_str)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, default="")
    variety: Mapped[str | None] = mapped_column(String, nullable=True)
    acked_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True, index=True)


class Warehouse(Base):
    __tablename__ = "warehouse"
    uuid: Mapped[str] = mapped_column(String, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    last_status: Mapped[str | None] = mapped_column(String, nullable=True)
    last_status_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True)

    def __init__(self, **kw):
        from app.ids import warehouse_uuid

        if "uuid" not in kw and "code" in kw and "country" in kw:
            kw["uuid"] = str(warehouse_uuid(kw["country"], kw["code"]))
        super().__init__(**kw)


class Lot(Base):
    __tablename__ = "lot"
    uuid: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid_str)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quantity: Mapped[float] = mapped_column(Float)
    product_uuid: Mapped[str | None] = mapped_column(ForeignKey("product.uuid"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="compliant")
    in_transit: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        UtcDateTime, default=lambda: datetime.now(timezone.utc)
    )
    acked_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True, index=True)

    product: Mapped[Product | None] = relationship()
    storage_records: Mapped[list["StorageRecord"]] = relationship(
        back_populates="lot", cascade="all, delete-orphan"
    )

    __table_args__ = (CheckConstraint("quantity > 0", name="quantity_positive"),)

    def current_storage(self) -> "StorageRecord | None":
        open_records = [s for s in self.storage_records if s.departed_at is None]
        return open_records[0] if open_records else None

    def latest_storage(self) -> "StorageRecord | None":
        # For serialization: open storage if in stock, otherwise the last closed
        # one (shipped lot) — this exposes the exit warehouse and its departed_at.
        if not self.storage_records:
            return None
        open_record = self.current_storage()
        if open_record is not None:
            return open_record
        return max(self.storage_records, key=lambda s: s.arrived_at)

    def first_arrival(self) -> datetime:
        # Expiry is measured from the lot's first entry into storage, not the
        # current warehouse: a transfer must not reset the ageing clock.
        if self.storage_records:
            return min(s.arrived_at for s in self.storage_records)
        return self.created_at


class StorageRecord(Base):
    __tablename__ = "storage_record"
    uuid: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid_str)
    lot_uuid: Mapped[str] = mapped_column(ForeignKey("lot.uuid"))
    warehouse_uuid: Mapped[str] = mapped_column(ForeignKey("warehouse.uuid"))
    arrived_at: Mapped[datetime] = mapped_column(UtcDateTime)
    departed_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True)

    lot: Mapped[Lot] = relationship(back_populates="storage_records")
    warehouse: Mapped[Warehouse] = relationship()


class Measurement(Base):
    __tablename__ = "measurement"
    uuid: Mapped[str] = mapped_column(String, primary_key=True)
    warehouse_uuid: Mapped[str] = mapped_column(ForeignKey("warehouse.uuid"))
    temperature: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    measured_at: Mapped[datetime] = mapped_column(UtcDateTime, index=True)
    device_id: Mapped[str] = mapped_column(String)
    acked_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("device_id", "measured_at", name="uq_device_measurement"),
    )


class Alert(Base):
    __tablename__ = "alert"
    uuid: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid_str)
    type: Mapped[str] = mapped_column(String)
    warehouse_uuid: Mapped[str | None] = mapped_column(ForeignKey("warehouse.uuid"), nullable=True)
    lot_uuid: Mapped[str | None] = mapped_column(
        ForeignKey("lot.uuid", ondelete="SET NULL"), nullable=True
    )
    triggered_at: Mapped[datetime] = mapped_column(UtcDateTime)
    resolved_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True)
    acked_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True, index=True)


class DeviceWatermark(Base):
    # Per-device high-water mark: dedup that survives the ack-purge of measurement rows,
    # so a QoS1 redelivery / gateway replay of an already-processed sample is ignored.
    __tablename__ = "device_watermark"
    device_id: Mapped[str] = mapped_column(String, primary_key=True)
    last_measured_at: Mapped[datetime] = mapped_column(UtcDateTime)


def mark_unacked(obj) -> None:
    """Any business mutation of a Lot/Alert must call this: re-exposes it to the head office."""
    obj.acked_at = None
