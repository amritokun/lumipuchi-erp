import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.user import User, UserRole

# Set up test database (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_procurement.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    # Clean and re-create tables before every test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def get_auth_headers(email: str = "finance@lumipuchi.in", role: str = "finance") -> dict:
    # Helper to register, login and get headers
    client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": "securepassword",
            "name": "Auth User",
            "role": role
        }
    )
    login_response = client.post(
        "/auth/login",
        data={"username": email, "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_and_list_suppliers():
    headers = get_auth_headers()
    
    # Create supplier
    response = client.post(
        "/suppliers",
        headers=headers,
        json={
            "name": "Hangzhou Sourcing Ltd",
            "contact_name": "Lee",
            "email": "lee@hangzhou.cn",
            "phone": "+86123456",
            "address": "12 Main St, Hangzhou",
            "country": "China",
            "currency": "CNY"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Hangzhou Sourcing Ltd"
    assert data["currency"] == "CNY"
    
    # List suppliers
    list_response = client.get("/suppliers", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["name"] == "Hangzhou Sourcing Ltd"

def test_forex_seeding_and_update():
    headers = get_auth_headers()
    
    # Trigger seeding via listing
    response = client.get("/forex", headers=headers)
    assert response.status_code == 200
    rates = response.json()
    assert len(rates) >= 5 # seeded CNY, USD, HKD, EUR, JPY
    
    # Get specific rate
    cny_rate = client.get("/forex/CNY", headers=headers).json()
    assert cny_rate["rate"] == 11.5
    
    # Update rate
    update_response = client.put(
        "/forex/CNY",
        headers=headers,
        json={"rate": 11.8, "is_locked": True}
    )
    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["rate"] == 11.8
    assert updated_data["is_locked"] is True

def test_create_purchase_order_landed_cost_calculations():
    headers = get_auth_headers()
    
    # 1. Create supplier
    supplier = client.post(
        "/suppliers",
        headers=headers,
        json={"name": "Yiwu Toys Co", "currency": "CNY"}
    ).json()
    
    # 2. Create Purchase Order with 2 items
    # Total units = 300 (100 SKU-A + 200 SKU-B)
    # Item A: 100 * CNY 10 = CNY 1000
    # Item B: 200 * CNY 20 = CNY 4000
    # Total foreign cost = CNY 5000
    # Exchange rate = 11.5 -> Raw INR value = INR 57,500 (Item A: 11,500, Item B: 46,000)
    # Customs Duty = 20%
    # Shared shipping expenses = INR 5000 (freight) + INR 1000 (other) = INR 6000
    # Expected unit landed costs:
    # Item A: Raw INR 115 + Duty 23 (115 * 0.20) + allocated share (11,500 / 57,500 * 6,000 / 100 = 12) = INR 150
    # Item B: Raw INR 230 + Duty 46 (230 * 0.20) + allocated share (46,000 / 57,500 * 6,000 / 200 = 24) = INR 300
    po_response = client.post(
        "/purchase-orders",
        headers=headers,
        json={
            "po_number": "PO-2026-001",
            "supplier_id": supplier["id"],
            "currency": "CNY",
            "exchange_rate": 11.5,
            "customs_duty_percent": 20.0,
            "international_freight": 5000.0,
            "other_charges": 1000.0,
            "items": [
                {"sku": "SKU-A", "name": "Item A", "quantity": 100, "unit_cost_foreign": 10.0},
                {"sku": "SKU-B", "name": "Item B", "quantity": 200, "unit_cost_foreign": 20.0}
            ]
        }
    )
    assert po_response.status_code == 201
    po_data = po_response.json()
    assert po_data["total_landed_cost_inr"] == (150 * 100) + (300 * 200) # 15000 + 60000 = 75000
    
    # Check items
    items = po_data["items"]
    item_a = next(i for i in items if i["sku"] == "SKU-A")
    item_b = next(i for i in items if i["sku"] == "SKU-B")
    
    assert item_a["landed_cost_inr_per_unit"] == 150.0
    assert item_b["landed_cost_inr_per_unit"] == 300.0
