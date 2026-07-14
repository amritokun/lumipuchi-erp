from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String, default="draft", nullable=False) # draft, ordered, shipped, customs, delivered, cancelled
    issue_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    currency = Column(String, default="CNY", nullable=False) # CNY, USD
    exchange_rate = Column(Float, nullable=False)
    
    # Landed Cost Shared Expenses
    china_domestic_shipping = Column(Float, default=0.0, nullable=False)
    international_freight = Column(Float, default=0.0, nullable=False)
    customs_duty_percent = Column(Float, default=0.0, nullable=False)
    clearing_charges = Column(Float, default=0.0, nullable=False)
    insurance = Column(Float, default=0.0, nullable=False)
    other_charges = Column(Float, default=0.0, nullable=False)
    
    total_landed_cost_inr = Column(Float, default=0.0, nullable=False)

    # Relationships
    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String, primary_key=True, index=True)
    purchase_order_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False)
    sku = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost_foreign = Column(Float, nullable=False)
    landed_cost_inr_per_unit = Column(Float, default=0.0, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
