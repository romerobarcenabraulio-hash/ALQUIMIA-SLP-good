"""Tests — cuentas, TOTP y contraseñas."""
import pyotp
import pytest
from fastapi.testclient import TestClient

from app.auth.crypto_password import hash_password, verify_password
from app.auth.totp_service import (
    encrypt_totp_secret,
    decrypt_totp_secret,
    generate_totp_secret,
    verify_totp_code,
)
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_password_hash_roundtrip():
    encoded = hash_password("MiClaveSegura2025!")
    assert verify_password("MiClaveSegura2025!", encoded)
    assert not verify_password("wrong", encoded)


def test_totp_encrypt_and_verify():
    secret_key = "test-secret-key-for-fernet"
    secret = generate_totp_secret()
    enc = encrypt_totp_secret(secret_key, secret)
    plain = decrypt_totp_secret(secret_key, enc)
    code = pyotp.TOTP(plain).now()
    assert verify_totp_code(plain, code)


def test_auth_status_endpoint(client):
    res = client.get("/auth/status")
    assert res.status_code == 200
    body = res.json()
    assert "registration_enabled" in body
    assert "email_provider" in body
