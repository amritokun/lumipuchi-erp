from pydantic import BaseModel, Field
from typing import Optional

class ChannelFeeTemplateBase(BaseModel):
    channel_name: str = Field(..., min_length=2, max_length=100)
    referral_fee_percent: float = 0.0
    fixed_closing_fee: float = 0.0
    weight_handling_fee: float = 0.0
    other_fees: float = 0.0

class ChannelFeeTemplateCreate(ChannelFeeTemplateBase):
    is_default: bool = False

class ChannelFeeTemplateUpdate(BaseModel):
    referral_fee_percent: Optional[float] = None
    fixed_closing_fee: Optional[float] = None
    weight_handling_fee: Optional[float] = None
    other_fees: Optional[float] = None
    is_default: Optional[bool] = None

class ChannelFeeTemplateResponse(ChannelFeeTemplateBase):
    id: str
    is_default: bool

    class Config:
        from_attributes = True

class PricingCalculationRequest(BaseModel):
    selling_price: float = Field(..., gt=0.0)
    landed_cost: float = Field(..., ge=0.0)
    gst_percent: float = 18.0
    template_id: Optional[str] = None # if null, uses default template or manual overrides
    
    # Manual overrides if template is not selected
    referral_fee_percent: Optional[float] = None
    fixed_closing_fee: Optional[float] = None
    weight_handling_fee: Optional[float] = None
    other_fees: Optional[float] = None

class PricingCalculationResponse(BaseModel):
    selling_price: float
    landed_cost: float
    gst_percent: float
    
    # Fee breakdown
    referral_fee: float
    fixed_closing_fee: float
    weight_handling_fee: float
    other_fees: float
    total_fees: float
    gst_amount: float
    
    # Payout results
    net_payout: float # selling_price - total_fees - gst_amount
    net_margin_amount: float # net_payout - landed_cost
    net_margin_percent: float # (net_margin_amount / selling_price) * 100
