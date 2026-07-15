import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.inventory import Inventory, StockLog
from schemas.inventory import InventoryResponse, InventoryUpdate, StockLogResponse
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(prefix="/inventory", tags=["inventory"])

allow_read = Depends(get_current_user)
allow_write = Depends(
    RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE])
)


@router.get("", response_model=List[InventoryResponse])
def list_inventory(db: Session = Depends(get_db), _=allow_read):
    return db.query(Inventory).all()


@router.get("/logs", response_model=List[StockLogResponse])
def list_stock_logs(db: Session = Depends(get_db), _=allow_read):
    return db.query(StockLog).order_by(StockLog.created_at.desc()).all()


@router.get("/{product_id}", response_model=InventoryResponse)
def get_inventory(product_id: str, db: Session = Depends(get_db), _=allow_read):
    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found"
        )
    return inv


@router.put("/{product_id}", response_model=InventoryResponse)
def adjust_inventory(
    product_id: str,
    inv_update: InventoryUpdate,
    reference: Optional[str] = "Manual Adjustment",
    db: Session = Depends(get_db),
    _=allow_write,
):
    inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found"
        )

    # Calculate change for stock logging if warehouse_qty is adjusted
    if inv_update.warehouse_qty is not None:
        diff = inv_update.warehouse_qty - inv.warehouse_qty
        if diff != 0:
            log_type = "stock_in" if diff > 0 else "stock_out"
            db_log = StockLog(
                id=str(uuid.uuid4()),
                product_id=product_id,
                log_type=log_type,
                quantity=diff,
                reference=reference,
            )
            db.add(db_log)

    # Perform updates
    for field, value in inv_update.dict(exclude_unset=True).items():
        setattr(inv, field, value)

    db.commit()
    db.refresh(inv)
    return inv
