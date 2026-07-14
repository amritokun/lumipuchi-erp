import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.order import Order, OrderItem
from models.product import Product
from models.inventory import Inventory, StockLog
from models.pricing import ChannelFeeTemplate
from models.purchase_order import PurchaseOrder, PurchaseOrderItem
from schemas.order import OrderCreate, OrderResponse, OrderUpdate
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE]))

# Helper to find latest landed cost for a SKU
def get_latest_landed_cost(sku: str, unit_price: float, db: Session) -> float:
    # Query delivered PO items
    latest_item = db.query(PurchaseOrderItem)\
        .join(PurchaseOrder)\
        .filter(PurchaseOrderItem.sku == sku)\
        .filter(PurchaseOrder.status == "delivered")\
        .order_by(PurchaseOrder.issue_date.desc())\
        .first()
        
    if latest_item and latest_item.landed_cost_inr_per_unit > 0:
        return latest_item.landed_cost_inr_per_unit
        
    # Fallback to 30% of selling price
    return unit_price * 0.30

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db), _=allow_write):
    # Verify order number uniqueness
    existing = db.query(Order).filter(Order.channel_order_id == order_in.channel_order_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order with this channel ID already exists"
        )
        
    # Get fee template
    template = db.query(ChannelFeeTemplate).filter(ChannelFeeTemplate.channel_name == order_in.channel_name).first()
    referral_pct = template.referral_fee_percent if template else 12.0
    closing_fee = template.fixed_closing_fee if template else 30.0
    weight_fee = template.weight_handling_fee if template else 55.0
    other_fees = template.other_fees if template else 0.0

    # Calculate payout and profit margin
    total_selling_price = order_in.selling_price
    referral_fee = total_selling_price * (referral_pct / 100.0)
    total_channel_fees = referral_fee + closing_fee + weight_fee + other_fees
    
    # GST inclusive payout
    gst_percent = 18.0 # default outward GST
    gst_amount = total_selling_price * (gst_percent / (100.0 + gst_percent))
    
    payout_amount = total_selling_price - total_channel_fees - gst_amount
    
    # Calculate Landed Cost Sum
    total_landed_cost = 0.0
    for item in order_in.items:
        # Pre-verify product exists
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID {item.product_id} not found"
            )
        lc_unit = get_latest_landed_cost(item.sku, item.unit_price, db)
        total_landed_cost += lc_unit * item.quantity

    profit_margin = payout_amount - total_landed_cost

    order_id = str(uuid.uuid4())
    db_order = Order(
        id=order_id,
        channel_order_id=order_in.channel_order_id,
        channel_name=order_in.channel_name,
        customer_name=order_in.customer_name,
        status=order_in.status,
        selling_price=total_selling_price,
        payout_amount=payout_amount,
        profit_margin=profit_margin
    )

    # Save Items and Allocate/Reserve Stock
    for item in order_in.items:
        db_item = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order_id,
            product_id=item.product_id,
            sku=item.sku,
            quantity=item.quantity,
            unit_price=item.unit_price
        )
        db_order.items.append(db_item)

        # Inventory reservation
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod and prod.inventory:
            # Increment allocated qty to reserve stock
            prod.inventory.allocated_qty += item.quantity

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("", response_model=List[OrderResponse])
def list_orders(db: Session = Depends(get_db), _=allow_read):
    return db.query(Order).all()

@router.put("/{order_id}", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    old_status = order.status
    new_status = order_in.status
    
    if new_status and old_status != new_status:
        # Perform inventory adjustments
        for item in order.items:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if not prod or not prod.inventory:
                continue
                
            inv = prod.inventory
            
            # 1. Undo old status allocations if needed
            if old_status == "pending":
                # Release pending allocation
                inv.allocated_qty = max(0, inv.allocated_qty - item.quantity)
            elif old_status == "shipped" or old_status == "delivered":
                # Add back physical stock if reversed
                inv.warehouse_qty += item.quantity
                db_log = StockLog(
                    id=str(uuid.uuid4()),
                    product_id=prod.id,
                    log_type="stock_in",
                    quantity=item.quantity,
                    reference=f"Order Reversed: {order.channel_order_id}"
                )
                db.add(db_log)

            # 2. Apply new status changes
            if new_status == "pending":
                inv.allocated_qty += item.quantity
            elif new_status == "shipped" or new_status == "delivered":
                # Deduct physical stock
                inv.warehouse_qty = max(0, inv.warehouse_qty - item.quantity)
                db_log = StockLog(
                    id=str(uuid.uuid4()),
                    product_id=prod.id,
                    log_type="stock_out",
                    quantity=-item.quantity,
                    reference=f"Order Shipped: {order.channel_order_id}"
                )
                db.add(db_log)
            elif new_status == "cancelled":
                # Reservation is already released, no physical stock change needed
                pass

        order.status = new_status
        db.commit()

    db.refresh(order)
    return order
