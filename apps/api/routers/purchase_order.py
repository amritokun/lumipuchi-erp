import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.purchase_order import PurchaseOrder, PurchaseOrderItem
from models.supplier import Supplier
from models.product import Product
from models.inventory import Inventory, StockLog
from schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderUpdate
from services.landed_cost import calculate_po_landed_costs
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/purchase-orders",
    tags=["purchase-orders"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE]))

def recalculate_po_and_save(po: PurchaseOrder, db: Session):
    # Extract items to pass to services calculator
    items_list = []
    for item in po.items:
        items_list.append({
            "id": item.id,
            "sku": item.sku,
            "name": item.name,
            "quantity": item.quantity,
            "unit_cost_foreign": item.unit_cost_foreign
        })
        
    calculation = calculate_po_landed_costs(
        items=items_list,
        exchange_rate=po.exchange_rate,
        china_domestic_shipping=po.china_domestic_shipping,
        international_freight=po.international_freight,
        customs_duty_percent=po.customs_duty_percent,
        clearing_charges=po.clearing_charges,
        insurance=po.insurance,
        other_charges=po.other_charges
    )
    
    # Update calculated values back to database items
    calculated_items_dict = {item["id"]: item for item in calculation["items"]}
    for db_item in po.items:
        calc_data = calculated_items_dict.get(db_item.id)
        if calc_data:
            db_item.landed_cost_inr_per_unit = calc_data["landed_cost_inr_per_unit"]
            
    po.total_landed_cost_inr = calculation["total_landed_cost_inr"]
    db.commit()

@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(po_in: PurchaseOrderCreate, db: Session = Depends(get_db), _=allow_write):
    # Verify supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == po_in.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier not found"
        )
        
    # Verify PO Number uniqueness
    existing_po = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_in.po_number).first()
    if existing_po:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase Order number already exists"
        )

    # Initialize PO
    po_id = str(uuid.uuid4())
    db_po = PurchaseOrder(
        id=po_id,
        po_number=po_in.po_number,
        supplier_id=po_in.supplier_id,
        status=po_in.status,
        currency=po_in.currency,
        exchange_rate=po_in.exchange_rate,
        china_domestic_shipping=po_in.china_domestic_shipping,
        international_freight=po_in.international_freight,
        customs_duty_percent=po_in.customs_duty_percent,
        clearing_charges=po_in.clearing_charges,
        insurance=po_in.insurance,
        other_charges=po_in.other_charges,
        total_landed_cost_inr=0.0
    )
    
    # Initialize Items
    for item in po_in.items:
        db_item = PurchaseOrderItem(
            id=str(uuid.uuid4()),
            purchase_order_id=po_id,
            sku=item.sku,
            name=item.name,
            quantity=item.quantity,
            unit_cost_foreign=item.unit_cost_foreign,
            landed_cost_inr_per_unit=0.0
        )
        db_po.items.append(db_item)

    db.add(db_po)
    db.commit()
    
    # Recalculate landed costs
    recalculate_po_and_save(db_po, db)
    db.refresh(db_po)
    return db_po

@router.get("", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(db: Session = Depends(get_db), _=allow_read):
    return db.query(PurchaseOrder).all()

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: str, db: Session = Depends(get_db), _=allow_read):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase Order not found"
        )
    return po

def handle_po_status_transition(po: PurchaseOrder, old_status: str, new_status: str, db: Session):
    if old_status == new_status:
        return
        
    for item in po.items:
        # Find product by SKU
        prod = db.query(Product).filter(Product.sku == item.sku).first()
        if not prod or not prod.inventory:
            continue
            
        inv = prod.inventory
        
        # 1. Reverse old status effects
        if old_status == "shipped":
            inv.in_transit_qty = max(0, inv.in_transit_qty - item.quantity)
        elif old_status == "delivered":
            inv.warehouse_qty = max(0, inv.warehouse_qty - item.quantity)
            # Create a reverse log
            db_log = StockLog(
                id=str(uuid.uuid4()),
                product_id=prod.id,
                log_type="stock_out",
                quantity=-item.quantity,
                reference=f"PO Reversed: {po.po_number}"
            )
            db.add(db_log)
            
        # 2. Apply new status effects
        if new_status == "shipped":
            inv.in_transit_qty += item.quantity
        elif new_status == "delivered":
            inv.warehouse_qty += item.quantity
            db_log = StockLog(
                id=str(uuid.uuid4()),
                product_id=prod.id,
                log_type="stock_in",
                quantity=item.quantity,
                reference=f"PO Received: {po.po_number}"
            )
            db.add(db_log)

@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    po_id: str,
    po_in: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase Order not found"
        )
        
    old_status = po.status
    
    for field, value in po_in.dict(exclude_unset=True).items():
        setattr(po, field, value)
        
    db.commit()
    
    # Trigger transition side effects if status changed
    if po_in.status is not None:
        handle_po_status_transition(po, old_status, po_in.status, db)
        db.commit()
    
    # Recalculate with updated inputs
    recalculate_po_and_save(po, db)
    db.refresh(po)
    return po
