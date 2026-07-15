from sqlalchemy import Column, String, Boolean
from database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, default="China", nullable=False)
    currency = Column(String, default="CNY", nullable=False)  # CNY, USD
    is_active = Column(Boolean, default=True, nullable=False)
