from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.api.deps import require_api_key
from app.db import get_session
from app.models import Product
from app.schemas import ProductIn, ProductOut

router = APIRouter(dependencies=[Depends(require_api_key)])


def _serialize(product: Product) -> ProductOut:
    return ProductOut(uuid=product.uuid, code=product.code, name=product.name,
                      description=product.description, variety=product.variety)


@router.post("/products", status_code=201, response_model=ProductOut)
def create_product(payload: ProductIn, session=Depends(get_session)):
    if session.query(Product).filter_by(code=payload.code).one_or_none() is not None:
        raise HTTPException(409, "Product code already exists")
    product = Product(code=payload.code, name=payload.name,
                      description=payload.description, variety=payload.variety)
    session.add(product)
    session.commit()
    session.refresh(product)
    return _serialize(product)


@router.get("/products", response_model=list[ProductOut])
def list_products(session=Depends(get_session)):
    return [_serialize(p) for p in session.scalars(select(Product))]
