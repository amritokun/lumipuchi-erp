from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class OrderItemBase(BaseModel):
    product_id: str
    sku: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0.0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    channel_order_id: str
    channel_name: str
    customer_name: Optional[str] = None
    status: str = "pending"
    selling_price: float


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[str] = None


class OrderResponse(OrderBase):
    id: str
    payout_amount: float
    profit_margin: float
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
