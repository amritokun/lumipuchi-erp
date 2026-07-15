from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from schemas.supplier import SupplierResponse


class PurchaseOrderItemBase(BaseModel):
    sku: str
    name: str
    quantity: int = Field(..., gt=0)
    unit_cost_foreign: float = Field(..., gt=0)


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: str
    purchase_order_id: str
    landed_cost_inr_per_unit: float

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    po_number: str
    supplier_id: str
    status: str = "draft"
    currency: str = "CNY"
    exchange_rate: float

    china_domestic_shipping: float = 0.0
    international_freight: float = 0.0
    customs_duty_percent: float = 0.0
    clearing_charges: float = 0.0
    insurance: float = 0.0
    other_charges: float = 0.0


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    exchange_rate: Optional[float] = None
    china_domestic_shipping: Optional[float] = None
    international_freight: Optional[float] = None
    customs_duty_percent: Optional[float] = None
    clearing_charges: Optional[float] = None
    insurance: Optional[float] = None
    other_charges: Optional[float] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: str
    issue_date: datetime
    total_landed_cost_inr: float
    items: List[PurchaseOrderItemResponse]
    supplier: SupplierResponse

    class Config:
        from_attributes = True
