from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OrderReturnBase(BaseModel):
    order_id: str
    product_id: str
    sku: str
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    status: str = "initiated"
    refund_amount: float = 0.0

class OrderReturnCreate(OrderReturnBase):
    pass

class OrderReturnUpdate(BaseModel):
    status: Optional[str] = None
    refund_amount: Optional[float] = None

class OrderReturnResponse(OrderReturnBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
