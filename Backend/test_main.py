"""
AeroFlow Intelligence — Backend API Tests
Run with: pytest test_main.py -v
"""
import pytest
import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"]   = "test_secret_key_for_testing_only_32chars!!"
os.environ["ENV"]          = "test"

from database import Base, User
from auth     import hash_password, get_db
from main     import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# ── Test DB setup ─────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test.db"
engine      = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestSession()
    if not db.query(User).filter(User.username == "testadmin").first():
        db.add(User(username="testadmin",  hashed_password=hash_password("testpass123"), role="admin"))
        db.add(User(username="testviewer", hashed_password=hash_password("viewpass123"), role="viewer"))
        db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def get_token(username="testadmin", password="testpass123"):
    res = client.post("/api/login", json={"username": username, "password": password})
    return res.json().get("access_token")

# ─────────────────────────────────────────────────────────
# AUTH TESTS
# ─────────────────────────────────────────────────────────

def test_root_endpoint():
    """Root endpoint returns 200"""
    res = client.get("/")
    assert res.status_code == 200
    assert "AeroFlow" in res.json()["message"]

def test_login_success():
    """Valid credentials return JWT token"""
    res = client.post("/api/login", json={"username":"testadmin","password":"testpass123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "admin"

def test_login_wrong_password():
    """Wrong password returns 401"""
    res = client.post("/api/login", json={"username":"testadmin","password":"wrongpassword"})
    assert res.status_code == 401

def test_login_nonexistent_user():
    """Non-existent user returns 401"""
    res = client.post("/api/login", json={"username":"ghost","password":"anything"})
    assert res.status_code == 401

def test_login_returns_role():
    """Login response includes user role"""
    res = client.post("/api/login", json={"username":"testadmin","password":"testpass123"})
    assert res.json()["role"] == "admin"

def test_login_viewer_role():
    """Viewer login returns viewer role"""
    res = client.post("/api/login", json={"username":"testviewer","password":"viewpass123"})
    assert res.status_code == 200
    assert res.json()["role"] == "viewer"

def test_me_endpoint_authenticated():
    """/api/me returns current user info"""
    token = get_token()
    res   = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "testadmin"
    assert res.json()["role"]     == "admin"

def test_me_endpoint_unauthenticated():
    """/api/me without token returns 401"""
    res = client.get("/api/me")
    assert res.status_code == 401

def test_register_requires_admin():
    """Viewer cannot register new users — 403"""
    token = get_token("testviewer", "viewpass123")
    res   = client.post(
        "/api/register",
        json={"username":"newuser","password":"newpass123","role":"viewer"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

def test_register_invalid_role():
    """Invalid role rejected — 422"""
    token = get_token()
    res   = client.post(
        "/api/register",
        json={"username":"newuser2","password":"newpass123","role":"superadmin"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_register_short_password():
    """Password under 8 chars rejected — 422"""
    token = get_token()
    res   = client.post(
        "/api/register",
        json={"username":"newuser3","password":"short","role":"viewer"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_invalid_token_rejected():
    """Tampered token returns 401"""
    res = client.get("/api/live", headers={"Authorization": "Bearer faketoken123"})
    assert res.status_code == 401

# ─────────────────────────────────────────────────────────
# DATA ENDPOINT TESTS
# ─────────────────────────────────────────────────────────

def test_live_endpoint_requires_auth():
    """/api/live without token returns 401"""
    res = client.get("/api/live")
    assert res.status_code == 401

def test_live_endpoint_authenticated():
    """/api/live returns list when authenticated"""
    token = get_token()
    res   = client.get("/api/live", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_alerts_endpoint_requires_auth():
    """/api/alerts without token returns 401"""
    res = client.get("/api/alerts")
    assert res.status_code == 401

def test_alerts_endpoint_authenticated():
    """/api/alerts returns list when authenticated"""
    token = get_token()
    res   = client.get("/api/alerts", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_predictions_endpoint_authenticated():
    """/api/predictions returns list with zone param"""
    token = get_token()
    res   = client.get(
        "/api/predictions",
        params={"zone":"Security Checkpoint"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_history_endpoint_with_params():
    """/api/history accepts zone and hours params"""
    token = get_token()
    res   = client.get(
        "/api/history",
        params={"zone":"Security Checkpoint","hours":24},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_zones_endpoint_authenticated():
    """/api/zones returns list when authenticated"""
    token = get_token()
    res   = client.get("/api/zones", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_security_headers_present():
    """Response includes all security headers"""
    res = client.get("/")
    assert res.headers.get("x-frame-options")        == "DENY"
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-xss-protection")       == "1; mode=block"