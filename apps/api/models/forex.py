from sqlalchemy import Column, String, Float, Boolean, DateTime
from datetime import datetime
from database import Base


class ForexRate(Base):
    __tablename__ = "forex_rates"

    id = Column(String, primary_key=True, index=True)
    from_currency = Column(String, nullable=False, index=True)  # CNY, USD, EUR, etc.
    to_currency = Column(String, default="INR", nullable=False, index=True)
    rate = Column(Float, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    manual_override_rate = Column(Float, nullable=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
