from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class OrderReturn(Base):
    __tablename__ = "order_returns"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    sku = Column(String, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)  # customer_return, damaged, wrong_item, etc.
    status = Column(
        String, default="initiated", nullable=False
    )  # initiated, received, restocked, lost, damaged
    refund_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="returns")
    product = relationship("Product")
