from sqlalchemy import Column, String, Float, Boolean
from database import Base


class ChannelFeeTemplate(Base):
    __tablename__ = "channel_fee_templates"

    id = Column(String, primary_key=True, index=True)
    channel_name = Column(
        String, unique=True, index=True, nullable=False
    )  # e.g. "Amazon Easy Ship", "Amazon FBA", "Flipkart", "Meesho"
    referral_fee_percent = Column(Float, default=0.0, nullable=False)
    fixed_closing_fee = Column(Float, default=0.0, nullable=False)
    weight_handling_fee = Column(Float, default=0.0, nullable=False)
    other_fees = Column(Float, default=0.0, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
