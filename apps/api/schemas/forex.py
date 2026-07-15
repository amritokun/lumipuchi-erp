from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ForexRateBase(BaseModel):
    from_currency: str
    to_currency: str = "INR"
    rate: float


class ForexRateCreate(ForexRateBase):
    pass


class ForexRateUpdate(BaseModel):
    rate: Optional[float] = None
    is_locked: Optional[bool] = None
    manual_override_rate: Optional[float] = None


class ForexRateResponse(ForexRateBase):
    id: str
    is_locked: bool
    manual_override_rate: Optional[float]
    updated_at: datetime

    class Config:
        from_attributes = True
