import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.pricing import ChannelFeeTemplate
from schemas.pricing import (
    ChannelFeeTemplateCreate,
    ChannelFeeTemplateUpdate,
    ChannelFeeTemplateResponse,
    PricingCalculationRequest,
    PricingCalculationResponse
)
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/pricing",
    tags=["pricing"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE]))

# Seed default pricing templates if they do not exist
def seed_default_templates(db: Session):
    defaults = [
        {"channel_name": "Amazon Easy Ship", "referral_fee_percent": 12.0, "fixed_closing_fee": 40.0, "weight_handling_fee": 65.0, "other_fees": 0.0, "is_default": True},
        {"channel_name": "Amazon FBA", "referral_fee_percent": 15.0, "fixed_closing_fee": 30.0, "weight_handling_fee": 55.0, "other_fees": 0.0, "is_default": False},
        {"channel_name": "Flipkart", "referral_fee_percent": 10.0, "fixed_closing_fee": 35.0, "weight_handling_fee": 60.0, "other_fees": 0.0, "is_default": False},
        {"channel_name": "Meesho", "referral_fee_percent": 2.0, "fixed_closing_fee": 0.0, "weight_handling_fee": 50.0, "other_fees": 0.0, "is_default": False},
    ]
    for item in defaults:
        existing = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.channel_name == item["channel_name"]).first()
        if not existing:
            db_template = ChannelFeeTemplate(
                id=str(uuid.uuid4()),
                channel_name=item["channel_name"],
                referral_fee_percent=item["referral_fee_percent"],
                fixed_closing_fee=item["fixed_closing_fee"],
                weight_handling_fee=item["weight_handling_fee"],
                other_fees=item["other_fees"],
                is_default=item["is_default"]
            )
            db.add(db_template)
    db.commit()

@router.get("/templates", response_model=List[ChannelFeeTemplateResponse])
def get_all_templates(db: Session = Depends(get_db), _=allow_read):
    seed_default_templates(db)
    return db.query(ChannelFeeTemplate).all()

@router.post("/templates", response_model=ChannelFeeTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_in: ChannelFeeTemplateCreate,
    db: Session = Depends(get_db),
    _=allow_write
):
    existing = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.channel_name == template_in.channel_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template for this channel already exists"
        )
        
    # If this is marked as default, unmark others
    if template_in.is_default:
        db.query(ChannelFeeTemplate).update({ChannelFeeTemplate.is_default: False})
        
    db_template = ChannelFeeTemplate(
        id=str(uuid.uuid4()),
        channel_name=template_in.channel_name,
        referral_fee_percent=template_in.referral_fee_percent,
        fixed_closing_fee=template_in.fixed_closing_fee,
        weight_handling_fee=template_in.weight_handling_fee,
        other_fees=template_in.other_fees,
        is_default=template_in.is_default
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/templates/{template_id}", response_model=ChannelFeeTemplateResponse)
def update_template(
    template_id: str,
    template_in: ChannelFeeTemplateUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    template = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel template not found"
        )
        
    if template_in.is_default:
        db.query(ChannelFeeTemplate).update({ChannelFeeTemplate.is_default: False})

    for field, value in template_in.dict(exclude_unset=True).items():
        setattr(template, field, value)
        
    db.commit()
    db.refresh(template)
    return template

@router.post("/calculate", response_model=PricingCalculationResponse)
def calculate_pricing(
    req: PricingCalculationRequest,
    db: Session = Depends(get_db),
    _=allow_read
):
    # Determine fees rules to apply
    referral_fee_pct = 0.0
    closing_fee = 0.0
    weight_fee = 0.0
    other_fees = 0.0
    
    if req.template_id:
        template = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.id == req.template_id).first()
        if not template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected channel fee template not found"
            )
        referral_fee_pct = template.referral_fee_percent
        closing_fee = template.fixed_closing_fee
        weight_fee = template.weight_handling_fee
        other_fees = template.other_fees
    else:
        # Use overrides or default template
        if (req.referral_fee_percent is not None or 
            req.fixed_closing_fee is not None or 
            req.weight_handling_fee is not None or 
            req.other_fees is not None):
            referral_fee_pct = req.referral_fee_percent or 0.0
            closing_fee = req.fixed_closing_fee or 0.0
            weight_fee = req.weight_handling_fee or 0.0
            other_fees = req.other_fees or 0.0
        else:
            # Fall back to default template
            seed_default_templates(db)
            default_t = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.is_default == True).first()
            if default_t:
                referral_fee_pct = default_t.referral_fee_percent
                closing_fee = default_t.fixed_closing_fee
                weight_fee = default_t.weight_handling_fee
                other_fees = default_t.other_fees

    # Calculate values
    referral_fee = req.selling_price * (referral_fee_pct / 100.0)
    total_fees = referral_fee + closing_fee + weight_fee + other_fees
    
    # Outward GST (tax inclusive)
    gst_amount = req.selling_price * (req.gst_percent / (100.0 + req.gst_percent))
    
    net_payout = req.selling_price - total_fees - gst_amount
    net_margin_amount = net_payout - req.landed_cost
    net_margin_percent = (net_margin_amount / req.selling_price) * 100.0 if req.selling_price > 0 else 0.0
    
    return {
        "selling_price": req.selling_price,
        "landed_cost": req.landed_cost,
        "gst_percent": req.gst_percent,
        "referral_fee": referral_fee,
        "fixed_closing_fee": closing_fee,
        "weight_handling_fee": weight_fee,
        "other_fees": other_fees,
        "total_fees": total_fees,
        "gst_amount": gst_amount,
        "net_payout": net_payout,
        "net_margin_amount": net_margin_amount,
        "net_margin_percent": net_margin_percent
    }
