from sqlalchemy import Column, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    catalogue_id = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    variant = Column(String, nullable=True)
    color = Column(String, nullable=True)
    
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    supplier_sku = Column(String, nullable=True)
    hsn = Column(String, nullable=True)
    gst_percent = Column(Float, default=18.0, nullable=False) # standard GST is 18%
    
    weight = Column(Float, default=0.0, nullable=False) # in kg
    dimensions = Column(String, nullable=True) # e.g. "10x20x15" in cm
    barcode = Column(String, nullable=True, index=True)
    qrcode = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    supplier = relationship("Supplier")
    inventory = relationship("Inventory", uselist=False, back_populates="product", cascade="all, delete-orphan")
