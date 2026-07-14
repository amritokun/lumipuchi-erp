import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models.forex import ForexRate
from schemas.forex import ForexRateResponse, ForexRateUpdate, ForexRateCreate
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/forex",
    tags=["forex"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE]))

# Helper to seed default rates if they do not exist
def seed_default_rates(db: Session):
    defaults = [
        {"from_currency": "CNY", "rate": 11.5},
        {"from_currency": "USD", "rate": 83.5},
        {"from_currency": "HKD", "rate": 10.7},
        {"from_currency": "EUR", "rate": 90.2},
        {"from_currency": "JPY", "rate": 0.55},
    ]
    for item in defaults:
        existing = db.query(ForexRate).filter(ForexRate.from_currency == item["from_currency"]).first()
        if not existing:
            db_rate = ForexRate(
                id=str(uuid.uuid4()),
                from_currency=item["from_currency"],
                to_currency="INR",
                rate=item["rate"],
                is_locked=False,
                updated_at=datetime.utcnow()
            )
            db.add(db_rate)
    db.commit()

@router.get("", response_model=List[ForexRateResponse])
def get_all_rates(db: Session = Depends(get_db), _=allow_read):
    seed_default_rates(db)
    return db.query(ForexRate).all()

@router.get("/{currency}", response_model=ForexRateResponse)
def get_rate(currency: str, db: Session = Depends(get_db), _=allow_read):
    rate_info = db.query(ForexRate).filter(ForexRate.from_currency == currency.upper()).first()
    if not rate_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exchange rate for {currency.upper()} not found"
        )
    return rate_info

@router.put("/{currency}", response_model=ForexRateResponse)
def update_rate(
    currency: str,
    rate_in: ForexRateUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    rate_info = db.query(ForexRate).filter(ForexRate.from_currency == currency.upper()).first()
    if not rate_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exchange rate for {currency.upper()} not found"
        )
        
    for field, value in rate_in.dict(exclude_unset=True).items():
        setattr(rate_info, field, value)
        
    db.commit()
    db.refresh(rate_info)
    return rate_info
