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
    assert "sms_provider" in body
    assert "email_ready" in body


def test_onboarding_options_endpoint(client):
    res = client.get("/auth/onboarding/options")
    assert res.status_code == 200
    body = res.json()
    assert "politica_publica" in body["segments"]
    assert "empresarial" in body["segments"]


def test_service_requires_reglamento():
    from app.auth.onboarding_catalog import service_requires_reglamento

    assert service_requires_reglamento("politica_publica", "reforma_rsu")
    assert not service_requires_reglamento("politica_publica", "capacitacion_institucional")
    assert not service_requires_reglamento("empresarial", "consultoria_esg")


def test_phone_normalize_mx():
    from app.auth.phone_utils import normalize_phone_mx, mask_phone

    assert normalize_phone_mx("4441234567") == "+524441234567"
    assert mask_phone("+524441234567").endswith("67")


def test_temporary_admin_email_keeps_admin_role_through_onboarding():
    from app.auth.user_service import apply_onboarding_profile, create_user, is_temporary_admin_email

    class DummyDb:
        def __init__(self):
            self.user = None

        def add(self, user):
            self.user = user

        def flush(self):
            return None

    db = DummyDb()
    assert is_temporary_admin_email(" Romero.Barcena.Braulio@Gmail.com ")

    user = create_user(
        db,
        email="romero.barcena.braulio@gmail.com",
        password="MiClaveSegura2025!",
        nombre="Braulio",
        apellido_paterno="Romero",
        apellido_materno=None,
        telefono="4441234567",
        zm="SLP",
    )
    assert user.rol == "admin"

    apply_onboarding_profile(
        db,
        user,
        client_segment="politica_publica",
        service_interest="reforma_rsu",
        cargo="",
        dependencia="",
        organizacion=None,
        municipio_nombre="San Luis Potosi",
        estado_mx="San Luis Potosi",
        municipio_id="slp",
        clave_inegi="24028",
        zm="SLP",
    )
    assert user.rol == "admin"
