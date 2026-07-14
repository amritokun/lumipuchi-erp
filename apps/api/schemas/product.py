from pydantic import BaseModel, Field
from typing import Optional
from schemas.supplier import SupplierResponse

class ProductBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    catalogue_id: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    variant: Optional[str] = None
    color: Optional[str] = None
    supplier_id: str
    supplier_sku: Optional[str] = None
    hsn: Optional[str] = None
    gst_percent: float = 18.0
    weight: float = 0.0
    dimensions: Optional[str] = None
    barcode: Optional[str] = None
    qrcode: Optional[str] = None

class ProductCreate(ProductBase):
    reorder_level: int = 10
    shelf: Optional[str] = None
    bin: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    variant: Optional[str] = None
    color: Optional[str] = None
    supplier_sku: Optional[str] = None
    gst_percent: Optional[float] = None
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    barcode: Optional[str] = None
    qrcode: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    is_active: bool
    supplier: SupplierResponse

    class Config:
        from_attributes = True
