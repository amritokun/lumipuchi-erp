import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.product import Product
from models.inventory import Inventory
from models.supplier import Supplier
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE]))

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), _=allow_write):
    # Verify supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == product_in.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier not found"
        )
        
    # Verify SKU uniqueness
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product SKU already exists"
        )
        
    product_id = str(uuid.uuid4())
    db_product = Product(
        id=product_id,
        sku=product_in.sku,
        name=product_in.name,
        catalogue_id=product_in.catalogue_id,
        brand=product_in.brand,
        description=product_in.description,
        category=product_in.category,
        variant=product_in.variant,
        color=product_in.color,
        supplier_id=product_in.supplier_id,
        supplier_sku=product_in.supplier_sku,
        hsn=product_in.hsn,
        gst_percent=product_in.gst_percent,
        weight=product_in.weight,
        dimensions=product_in.dimensions,
        barcode=product_in.barcode,
        qrcode=product_in.qrcode,
        is_active=True
    )
    
    # Initialize Inventory record for product
    db_inventory = Inventory(
        id=str(uuid.uuid4()),
        product_id=product_id,
        warehouse_qty=0,
        in_transit_qty=0,
        allocated_qty=0,
        reorder_level=product_in.reorder_level,
        shelf=product_in.shelf,
        bin=product_in.bin
    )
    db_product.inventory = db_inventory
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db), _=allow_read):
    return db.query(Product).all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db), _=allow_read):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    _=allow_write
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    for field, value in product_in.dict(exclude_unset=True).items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    return product
