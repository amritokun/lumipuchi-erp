import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from models.user import User, UserRole

# Set up test database (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
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


def test_signup():
    response = client.post(
        "/auth/signup",
        json={
            "email": "test@lumipuchi.in",
            "password": "securepassword123",
            "name": "Test User",
            "role": "owner",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@lumipuchi.in"
    assert data["name"] == "Test User"
    assert data["role"] == "owner"
    assert "id" in data
    assert "hashed_password" not in data


def test_signup_existing_email():
    # Create first user
    client.post(
        "/auth/signup",
        json={
            "email": "test@lumipuchi.in",
            "password": "securepassword123",
            "name": "Test User",
            "role": "owner",
        },
    )

    # Try creating with same email
    response = client.post(
        "/auth/signup",
        json={
            "email": "test@lumipuchi.in",
            "password": "differentpassword",
            "name": "Test User 2",
            "role": "manager",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "A user with this email already exists"


def test_login_success():
    # Create user first
    client.post(
        "/auth/signup",
        json={
            "email": "login@lumipuchi.in",
            "password": "mysecretpassword",
            "name": "Login User",
            "role": "manager",
        },
    )

    # Login
    response = client.post(
        "/auth/login",
        data={"username": "login@lumipuchi.in", "password": "mysecretpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_incorrect_password():
    client.post(
        "/auth/signup",
        json={
            "email": "wrong@lumipuchi.in",
            "password": "secretpassword",
            "name": "Wrong User",
            "role": "viewer",
        },
    )

    response = client.post(
        "/auth/login",
        data={"username": "wrong@lumipuchi.in", "password": "incorrectpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_get_me():
    # Signup and Login to get token
    client.post(
        "/auth/signup",
        json={
            "email": "me@lumipuchi.in",
            "password": "mypassword123",
            "name": "Me User",
            "role": "finance",
        },
    )

    login_response = client.post(
        "/auth/login", data={"username": "me@lumipuchi.in", "password": "mypassword123"}
    )
    token = login_response.json()["access_token"]

    # Fetch profile
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@lumipuchi.in"
    assert data["role"] == "finance"
    assert data["name"] == "Me User"


def test_get_me_unauthorized():
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401
