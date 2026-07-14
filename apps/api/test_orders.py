import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.user import User, UserRole

# Set up test database (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_orders.db"
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
            "name": "Owner Op",
            "role": role
        }
    )
    login_response = client.post(
        "/auth/login",
        data={"username": email, "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_order_reserves_inventory():
    headers = get_auth_headers()
    
    # 1. Create supplier and product
    supplier = client.post("/suppliers", headers=headers, json={"name": "Yiwu Toys D", "currency": "CNY"}).json()
    prod = client.post(
        "/products",
        headers=headers,
        json={
            "sku": "SKU-TOY-D",
            "name": "Teddy Bear D",
            "supplier_id": supplier["id"]
        }
    ).json()

    # Pre-add 100 units to warehouse
    client.put(
        f"/inventory/{prod['id']}?reference=Initial Count",
        headers=headers,
        json={"warehouse_qty": 100}
    )

    # 2. Create Order (status: pending)
    # 10 units of SKU-TOY-D at 150 INR each = 1500 INR selling price
    order_res = client.post(
        "/orders",
        headers=headers,
        json={
            "channel_order_id": "AZ-ORDER-999",
            "channel_name": "Amazon Easy Ship",
            "customer_name": "Rohan Sharma",
            "status": "pending",
            "selling_price": 1500.0,
            "items": [
                {"product_id": prod["id"], "sku": "SKU-TOY-D", "quantity": 10, "unit_price": 150.0}
            ]
        }
    )
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["channel_order_id"] == "AZ-ORDER-999"
    assert order["payout_amount"] > 0
    assert order["profit_margin"] > 0

    # Verify inventory reservation:
    # allocated_qty = 10, warehouse_qty = 100, virtual_qty = 90
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 100
    assert inv["allocated_qty"] == 10
    assert inv["virtual_qty"] == 90

    # 3. Transition order status to "shipped"
    update_res = client.put(
        f"/orders/{order['id']}",
        headers=headers,
        json={"status": "shipped"}
    )
    assert update_res.status_code == 200

    # Verify physical stock is deducted:
    # warehouse_qty = 90, allocated_qty = 0, virtual_qty = 90
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 90
    assert inv["allocated_qty"] == 0
    assert inv["virtual_qty"] == 90

    # Check stock log registered the shipped deduction (-10)
    logs = client.get("/inventory/logs", headers=headers).json()
    assert any(log["log_type"] == "stock_out" and log["quantity"] == -10 and "Order Shipped" in log["reference"] for log in logs)

def test_order_return_restocking():
    headers = get_auth_headers()
    
    # 1. Create supplier, product and order
    supplier = client.post("/suppliers", headers=headers, json={"name": "Yiwu Toys E", "currency": "CNY"}).json()
    prod = client.post(
        "/products",
        headers=headers,
        json={
            "sku": "SKU-TOY-E",
            "name": "Teddy Bear E",
            "supplier_id": supplier["id"]
        }
    ).json()

    # Pre-add 50 units
    client.put(f"/inventory/{prod['id']}", headers=headers, json={"warehouse_qty": 50})

    # Place order and transition to shipped (warehouse: 45)
    order = client.post(
        "/orders",
        headers=headers,
        json={
            "channel_order_id": "AZ-ORDER-888",
            "channel_name": "Meesho",
            "status": "pending",
            "selling_price": 500.0,
            "items": [
                {"product_id": prod["id"], "sku": "SKU-TOY-E", "quantity": 5, "unit_price": 100.0}
            ]
        }
    ).json()
    client.put(f"/orders/{order['id']}", headers=headers, json={"status": "shipped"})

    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 45

    # 2. File a return request for 2 returned units with status "restocked"
    return_res = client.post(
        "/returns",
        headers=headers,
        json={
            "order_id": order["id"],
            "product_id": prod["id"],
            "sku": "SKU-TOY-E",
            "quantity": 2,
            "reason": "customer_return",
            "status": "restocked",
            "refund_amount": 200.0
        }
    )
    assert return_res.status_code == 201
    
    # Verify warehouse_qty increased to 47
    inv = client.get(f"/inventory/{prod['id']}", headers=headers).json()
    assert inv["warehouse_qty"] == 47

    # Check logs
    logs = client.get("/inventory/logs", headers=headers).json()
    assert any(log["log_type"] == "stock_in" and log["quantity"] == 2 and "Return Restocked" in log["reference"] for log in logs)
