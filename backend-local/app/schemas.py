from datetime import datetime

from pydantic import BaseModel, Field


class ProductIn(BaseModel):
    code: str
    name: str
    description: str = ""
    variety: str | None = None


class ProductOut(BaseModel):
    uuid: str
    code: str
    name: str
    description: str
    variety: str | None


class ExploitationIn(BaseModel):
    name: str


class ExploitationOut(BaseModel):
    uuid: str
    name: str
    country: str


class LotIn(BaseModel):
    quantity: float = Field(gt=0)
    warehouse_code: str = Field(min_length=1, max_length=100)
    product_uuid: str
    label: str | None = Field(default=None, max_length=100)
    arrived_at: datetime | None = None
    exploitation_uuid: str | None = None
    constituted_at: datetime | None = None


class DepartIn(BaseModel):
    # True = final exit (shipped out of the circuit); False = transfer to another warehouse.
    shipment: bool = False


class ArrivalIn(BaseModel):
    warehouse_code: str


class LotOut(BaseModel):
    uuid: str
    label: str | None
    quantity: float
    status: str
    in_transit: bool
    warehouse_uuid: str | None
    arrived_at: datetime | None
    departed_at: datetime | None


class AckIn(BaseModel):
    lots: list[str] = []
    measurements: list[str] = []
    alerts: list[str] = []
    products: list[str] = []
    exploitations: list[str] = []
