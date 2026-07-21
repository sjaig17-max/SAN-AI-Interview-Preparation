import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, engine, SessionLocal

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """
    Auto-fixture setting up and wiping clean a test schema lifecycle.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_registration_and_login():
    email = "testcandidate@harvard.edu"
    password = "password123"
    
    # 1. Register User
    reg_payload = {
      "email": email,
      "password": password,
      "full_name": "Test Candidate",
      "phone_number": "+1 555-0199",
      "college": "Harvard",
      "degree": "B.S.",
      "department": "Engineering",
      "current_year": 4,
      "city": "Boston",
      "target_company": "Google",
      "preferred_job_role": "Software Engineer",
      "experience_level": "Entry"
    }
    
    reg_response = client.post("/auth/register", json=reg_payload)
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == email

    # 2. Login User
    login_payload = {
        "email": email,
        "password": password
    }
    login_response = client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # 3. Retrieve Profile details using Access Token
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["full_name"] == "Test Candidate"
    assert me_response.json()["profile"]["preferred_job_role"] == "Software Engineer"
