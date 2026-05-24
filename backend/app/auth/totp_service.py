"""TOTP — setup, activación y verificación."""
from __future__ import annotations

import base64
import hashlib

import pyotp
from cryptography.fernet import Fernet, InvalidToken


def _fernet(secret_key: str) -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(secret_key.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_totp_secret(secret_key: str, totp_secret: str) -> str:
    return _fernet(secret_key).encrypt(totp_secret.encode("utf-8")).decode("utf-8")


def decrypt_totp_secret(secret_key: str, encrypted: str) -> str:
    try:
        return _fernet(secret_key).decrypt(encrypted.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("TOTP secret inválido") from exc


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def totp_provisioning_uri(secret: str, email: str, issuer: str = "ALQUIMIA") -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)


def verify_totp_code(secret: str, code: str) -> bool:
    if not code or not code.strip().isdigit():
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code.strip(), valid_window=1)
