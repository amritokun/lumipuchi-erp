from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    channel_order_id = Column(
        String, unique=True, index=True, nullable=False
    )  # e.g. "AZ-100234"
    channel_name = Column(
        String, nullable=False, index=True
    )  # Amazon Easy Ship, Flipkart, Meesho, etc.
    customer_name = Column(String, nullable=True)
    status = Column(
        String, default="pending", nullable=False
    )  # pending, shipped, delivered, returned, cancelled
    selling_price = Column(Float, nullable=False)  # total listing sale price
    payout_amount = Column(Float, default=0.0, nullable=False)  # calculated net payout
    profit_margin = Column(Float, default=0.0, nullable=False)  # calculated net profit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    returns = relationship(
        "OrderReturn", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    sku = Column(String, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
