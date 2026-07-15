from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: str = "China"
    currency: str = "CNY"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True
