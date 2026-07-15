from pydantic import BaseModel, Field, computed_field
from typing import Optional
from datetime import datetime


class InventoryBase(BaseModel):
    warehouse_qty: int = 0
    in_transit_qty: int = 0
    allocated_qty: int = 0
    reorder_level: int = 10
    shelf: Optional[str] = None
    bin: Optional[str] = None


class InventoryUpdate(BaseModel):
    warehouse_qty: Optional[int] = None
    in_transit_qty: Optional[int] = None
    allocated_qty: Optional[int] = None
    reorder_level: Optional[int] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None


# Minimal Product representation for nested serialization without circular imports
class ProductSimple(BaseModel):
    id: str
    sku: str
    name: str

    class Config:
        from_attributes = True


class InventoryResponse(InventoryBase):
    id: str
    product_id: str
    product: ProductSimple

    class Config:
        from_attributes = True

    @computed_field
    @property
    def virtual_qty(self) -> int:
        return self.warehouse_qty + self.in_transit_qty - self.allocated_qty


class StockLogBase(BaseModel):
    product_id: str
    log_type: str
    quantity: int
    reference: Optional[str] = None


class StockLogCreate(StockLogBase):
    pass


class StockLogResponse(StockLogBase):
    id: str
    created_at: datetime
    product: ProductSimple

    class Config:
        from_attributes = True
