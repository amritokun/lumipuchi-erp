from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"), unique=True, nullable=False)
    warehouse_qty = Column(Integer, default=0, nullable=False)
    in_transit_qty = Column(Integer, default=0, nullable=False)
    allocated_qty = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    shelf = Column(String, nullable=True)
    bin = Column(String, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="inventory")

class StockLog(Base):
    __tablename__ = "stock_logs"

    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    log_type = Column(String, nullable=False) # stock_in, stock_out, reserved, returned, damaged, adjustment
    quantity = Column(Integer, nullable=False) # quantity change
    reference = Column(String, nullable=True) # e.g. PO number, manual, order id
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product")
