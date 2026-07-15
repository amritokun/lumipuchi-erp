import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.user import User, UserRole

# Set up test database (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_pricing.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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


def get_auth_headers(
    email: str = "finance@lumipuchi.in", role: str = "finance"
) -> dict:
    client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": "securepassword",
            "name": "Finance Op",
            "role": role,
        },
    )
    login_response = client.post(
        "/auth/login", data={"username": email, "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_templates_seeding_and_creation():
    headers = get_auth_headers()

    # 1. List templates (triggers seeding)
    response = client.get("/pricing/templates", headers=headers)
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 4  # Amazon Easy Ship, Amazon FBA, Flipkart, Meesho

    amazon_es = next(t for t in templates if t["channel_name"] == "Amazon Easy Ship")
    assert amazon_es["referral_fee_percent"] == 12.0
    assert amazon_es["fixed_closing_fee"] == 40.0
    assert amazon_es["weight_handling_fee"] == 65.0

    # 2. Create custom template
    custom_res = client.post(
        "/pricing/templates",
        headers=headers,
        json={
            "channel_name": "My Custom Marketplace",
            "referral_fee_percent": 8.0,
            "fixed_closing_fee": 20.0,
            "weight_handling_fee": 45.0,
            "other_fees": 5.0,
        },
    )
    assert custom_res.status_code == 201
    custom_data = custom_res.json()
    assert custom_data["channel_name"] == "My Custom Marketplace"


def test_pricing_calculation_with_manual_overrides():
    headers = get_auth_headers()

    # Target selling price = 1000
    # Landed Cost = 300
    # GST = 18% -> GST amount = 1000 * 18/118 = 152.542
    # Referral Fee = 10% = 100
    # Closing = 30
    # Weight = 40
    # Other = 0
    # Total Fees = 170
    # Net Payout = 1000 - 170 - 152.542 = 677.458
    # Net Margin Amount = 677.458 - 300 = 377.458
    # Margin % = 37.7458%
    response = client.post(
        "/pricing/calculate",
        headers=headers,
        json={
            "selling_price": 1000.0,
            "landed_cost": 300.0,
            "gst_percent": 18.0,
            "referral_fee_percent": 10.0,
            "fixed_closing_fee": 30.0,
            "weight_handling_fee": 40.0,
            "other_fees": 0.0,
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["referral_fee"] == 100.0
    assert data["total_fees"] == 170.0
    assert abs(data["gst_amount"] - 152.54) < 0.1
    assert abs(data["net_payout"] - 677.46) < 0.1
    assert abs(data["net_margin_amount"] - 377.46) < 0.1
    assert abs(data["net_margin_percent"] - 37.75) < 0.1


def test_pricing_calculation_with_template():
    headers = get_auth_headers()

    # 1. Trigger seeding
    templates = client.get("/pricing/templates", headers=headers).json()
    meesho_t = next(t for t in templates if t["channel_name"] == "Meesho")

    # Target SP = 500, Landed Cost = 150, GST = 12%
    # Meesho template: referral 2%, closing 0, weight 50, other 0
    # Referral Fee = 500 * 2% = 10
    # Total Fees = 10 + 50 = 60
    # GST Outward = 500 * 12/112 = 53.57
    # Net Payout = 500 - 60 - 53.57 = 386.43
    # Net Margin = 386.43 - 150 = 236.43
    response = client.post(
        "/pricing/calculate",
        headers=headers,
        json={
            "selling_price": 500.0,
            "landed_cost": 150.0,
            "gst_percent": 12.0,
            "template_id": meesho_t["id"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["referral_fee"] == 10.0
    assert data["total_fees"] == 60.0
    assert abs(data["gst_amount"] - 53.57) < 0.1
    assert abs(data["net_payout"] - 386.43) < 0.1
    assert abs(data["net_margin_amount"] - 236.43) < 0.1
