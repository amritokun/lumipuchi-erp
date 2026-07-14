import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.returns import OrderReturn
from models.product import Product
from models.inventory import Inventory, StockLog
from schemas.returns import OrderReturnCreate, OrderReturnResponse, OrderReturnUpdate
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/returns",
    tags=["returns"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE]))

def handle_return_restock(product_id: str, quantity: int, order_id: str, db: Session):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if prod and prod.inventory:
        inv = prod.inventory
        inv.warehouse_qty += quantity
        
        # Log stock restock movement
        db_log = StockLog(
            id=str(uuid.uuid4()),
            product_id=product_id,
            log_type="stock_in",
            quantity=quantity,
            reference=f"Return Restocked: {order_id}"
        )
        db.add(db_log)

@router.post("", response_model=OrderReturnResponse, status_code=status.HTTP_201_CREATED)
def create_return(return_in: OrderReturnCreate, db: Session = Depends(get_db), _=allow_write):
    # Verify product exists
    prod = db.query(Product).filter(Product.id == return_in.product_id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not found"
        )
        
    return_id = str(uuid.uuid4())
    db_return = OrderReturn(
        id=return_id,
        order_id=return_in.order_id,
        product_id=return_in.product_id,
        sku=return_in.sku,
        quantity=return_in.quantity,
        reason=return_in.reason,
        status=return_in.status,
        refund_amount=return_in.refund_amount
    )
    
    db.add(db_return)
    db.commit()
    
    # If restocked immediately
    if return_in.status == "restocked":
        handle_return_restock(return_in.product_id, return_in.quantity, return_in.order_id, db)
        db.commit()
        
    db.refresh(db_return)
    return db_return

@router.get("", response_model=List[OrderReturnResponse])
def list_returns(db: Session = Depends(get_db), _=allow_read):
    return db.query(OrderReturn).all()

@router.put("/{return_id}", response_model=OrderReturnResponse)
def update_return(
    return_id: str,
    return_in: OrderReturnUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    ret = db.query(OrderReturn).filter(OrderReturn.id == return_id).first()
    if not ret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )
        
    old_status = ret.status
    new_status = return_in.status
    
    for field, value in return_in.dict(exclude_unset=True).items():
        setattr(ret, field, value)
        
    db.commit()
    
    # Check if transitioning to restocked
    if new_status == "restocked" and old_status != "restocked":
        handle_return_restock(ret.product_id, ret.quantity, ret.order_id, db)
        db.commit()
        
    db.refresh(ret)
    return ret
