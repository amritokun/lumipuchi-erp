import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.user import User, UserRole

# Set up test database (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_inventory.db"
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

def get_auth_headers(email: str = "owner@lumipuchi.in", role: str = "owner") -> dict:
    client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": "securepassword",
            "name": "Warehouse Op",
            "role": role
        }
    )
    login_response = client.post(
        "/auth/login",
        data={"username": email, "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_product_initializes_inventory():
    headers = get_auth_headers(email="owner1@lumipuchi.in")
    
    # 1. Create supplier
    supplier = client.post(
        "/suppliers",
        headers=headers,
        json={"name": "Shenzhen Electrics A", "currency": "USD"}
    ).json()

    # 2. Create product
    response = client.post(
        "/products",
        headers=headers,
        json={
            "sku": "SKU-HEADPHONE",
            "name": "Wireless Noise Cancelling Headphones",
            "brand": "LumiSound",
            "category": "Electronics",
            "supplier_id": supplier["id"],
            "supplier_sku": "SZ-H10",
            "gst_percent": 18.0,
            "weight": 0.25,
            "reorder_level": 15,
            "shelf": "Shelf A",
            "bin": "Bin 3"
        }
    )
    assert response.status_code == 201
    prod_data = response.json()
    assert prod_data["sku"] == "SKU-HEADPHONE"
    
    # 3. Check inventory record created automatically
    inv_response = client.get(f"/inventory/{prod_data['id']}", headers=headers)
    assert inv_response.status_code == 200
    inv_data = inv_response.json()
    assert inv_data["warehouse_qty"] == 0
    assert inv_data["in_transit_qty"] == 0
    assert inv_data["virtual_qty"] == 0
    assert inv_data["reorder_level"] == 15
    assert inv_data["shelf"] == "Shelf A"
    assert inv_data["bin"] == "Bin 3"

def test_manual_inventory_adjustment_creates_logs():
    headers = get_auth_headers(email="owner2@lumipuchi.in")
    
    # 1. Create supplier and product
    supplier = client.post("/suppliers", headers=headers, json={"name": "Shenzhen Electrics B"}).json()
    prod = client.post(
        "/products",
        headers=headers,
        json={
            "sku": "SKU-MOUSE",
            "name": "Ergonomic Office Mouse",
            "supplier_id": supplier["id"]
        }
    ).json()

    # 2. Adjust inventory manually (+50 units)
    adjust_response = client.put(
        f"/inventory/{prod['id']}?reference=Initial Count Adjustment",
        headers=headers,
        json={"warehouse_qty": 50}
    )
    assert adjust_response.status_code == 200
    inv_data = adjust_response.json()
    assert inv_data["warehouse_qty"] == 50
    assert inv_data["virtual_qty"] == 50

    # 3. Check logs
    logs_response = client.get("/inventory/logs", headers=headers)
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert len(logs) == 1
    assert logs[0]["log_type"] == "stock_in"
    assert logs[0]["quantity"] == 50
    assert logs[0]["reference"] == "Initial Count Adjustment"

def test_po_status_transition_updates_inventory():
    headers = get_auth_headers(email="owner3@lumipuchi.in")
    
    # 1. Create supplier and product
    supplier = client.post("/suppliers", headers=headers, json={"name": "Yiwu Toys C", "currency": "CNY"}).json()
    prod = client.post(
        "/products",
        headers=headers,
        json={
            "sku": "SKU-TOY",
            "name": "Teddy Bear Medium",
            "supplier_id": supplier["id"]
        }
    ).json()

    # 2. Create Purchase Order (status: draft) with 100 units
    po = client.post(
        "/purchase-orders",
        headers=headers,
        json={
            "po_number": "PO-TOY-001",
            "supplier_id": supplier["id"],
            "currency": "CNY",
            "exchange_rate": 11.5,
            "items": [
                {"sku": "SKU-TOY", "name": "Teddy Bear Medium", "quantity": 100, "unit_cost_foreign": 5.0}
            ]
        }
    ).json()

    # Verify inventory is still 0
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 0
    assert inv["in_transit_qty"] == 0

    # 3. Transition PO to "shipped"
    update_shipped = client.put(
        f"/purchase-orders/{po['id']}",
        headers=headers,
        json={"status": "shipped"}
    )
    assert update_shipped.status_code == 200
    
    # Verify in_transit_qty is now 100
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 0
    assert inv["in_transit_qty"] == 100
    assert inv["virtual_qty"] == 100

    # 4. Transition PO to "delivered"
    update_delivered = client.put(
        f"/purchase-orders/{po['id']}",
        headers=headers,
        json={"status": "delivered"}
    )
    assert update_delivered.status_code == 200

    # Verify in_transit_qty is 0 and warehouse_qty is 100
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 100
    assert inv["in_transit_qty"] == 0
    assert inv["virtual_qty"] == 100

    # 5. Check stock log was created for PO delivery
    logs = client.get("/inventory/logs", headers=headers).json()
    assert any(log["log_type"] == "stock_in" and log["quantity"] == 100 and "PO Received" in log["reference"] for log in logs)
