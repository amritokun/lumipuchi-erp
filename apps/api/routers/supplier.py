import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.supplier import Supplier
from schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from auth import get_current_user, RoleChecker
from models.user import UserRole

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

# Shared dependencies
allow_read = Depends(get_current_user)
allow_write = Depends(RoleChecker([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE]))


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier_in: SupplierCreate, db: Session = Depends(get_db), _=allow_write
):
    # Verify name uniqueness
    existing = db.query(Supplier).filter(Supplier.name == supplier_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this name already exists",
        )

    db_supplier = Supplier(
        id=str(uuid.uuid4()),
        name=supplier_in.name,
        contact_name=supplier_in.contact_name,
        email=supplier_in.email,
        phone=supplier_in.phone,
        address=supplier_in.address,
        country=supplier_in.country,
        currency=supplier_in.currency,
        is_active=True,
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("", response_model=List[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), _=allow_read):
    return db.query(Supplier).all()


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, db: Session = Depends(get_db), _=allow_read):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found"
        )
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    _=allow_write,
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found"
        )

    for field, value in supplier_in.dict(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier
