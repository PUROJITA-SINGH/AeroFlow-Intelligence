"""
AeroFlow Intelligence — Auth Unit Tests
Run with: pytest test_auth.py -v
"""
import pytest
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["SECRET_KEY"]   = "test_secret_key_for_auth_tests_only_!!"

from auth import (
    hash_password,
    verify_password,
    create_access_token,
)
from jose import jwt

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM  = "HS256"

# ─────────────────────────────────────────────────────────
# PASSWORD TESTS
# ─────────────────────────────────────────────────────────

def test_hash_password_returns_string():
    """hash_password returns a non-empty string"""
    hashed = hash_password("mypassword123")
    assert isinstance(hashed, str)
    assert len(hashed) > 0

def test_hash_password_not_plaintext():
    """Hashed password is not the same as plaintext"""
    plain  = "mypassword123"
    hashed = hash_password(plain)
    assert hashed != plain

def test_verify_password_correct():
    """verify_password returns True for correct password"""
    plain  = "correctpassword"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True

def test_verify_password_wrong():
    """verify_password returns False for wrong password"""
    hashed = hash_password("correctpassword")
    assert verify_password("wrongpassword", hashed) is False

def test_hash_same_password_different_results():
    """Same password hashed twice gives different hashes (bcrypt salt)"""
    hashed1 = hash_password("samepassword")
    hashed2 = hash_password("samepassword")
    assert hashed1 != hashed2

# ─────────────────────────────────────────────────────────
# JWT TOKEN TESTS
# ─────────────────────────────────────────────────────────

def test_create_access_token_returns_string():
    """create_access_token returns a string"""
    token = create_access_token({"sub": "testuser"})
    assert isinstance(token, str)
    assert len(token) > 0

def test_access_token_contains_username():
    """Token payload contains the username"""
    token   = create_access_token({"sub": "testuser", "role": "admin"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"]  == "testuser"
    assert payload["role"] == "admin"

def test_access_token_has_expiry():
    """Token payload contains expiry field"""
    token   = create_access_token({"sub": "testuser"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload

def test_token_invalid_secret_rejected():
    """Token signed with wrong secret is rejected"""
    token = create_access_token({"sub": "testuser"})
    with pytest.raises(Exception):
        jwt.decode(token, "wrong_secret", algorithms=[ALGORITHM])