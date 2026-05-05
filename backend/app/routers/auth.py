from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import logging
import hashlib
import hmac
import os

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str, salt: bytes | None = None) -> str:
    """Hash PBKDF2-SHA256 portable, sin dependencia bcrypt en import/runtime."""
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return f"pbkdf2_sha256$210000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, rounds_raw, salt_hex, digest_hex = encoded.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        salt = bytes.fromhex(salt_hex)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(rounds_raw))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False

# Demo users (en prod: PostgreSQL)
DEMO_USERS = {
    "demo@alquimia.mx": {
        "id": 1,
        "nombre": "Usuario Demo",
        "email": "demo@alquimia.mx",
        "hashed_password": hash_password("demo2025", bytes.fromhex("00112233445566778899aabbccddeeff")),
        "rol": "analista",
        "zm": "SLP",
    },
    "admin@alquimia.mx": {
        "id": 2,
        "nombre": "Admin Sistema",
        "email": "admin@alquimia.mx",
        "hashed_password": hash_password("admin2025!", bytes.fromhex("ffeeddccbbaa99887766554433221100")),
        "rol": "admin",
        "zm": "ALL",
    },
}

# Rate limiting simple (en prod: Redis)
login_attempts: dict[str, list[float]] = {}


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("email inválido")
        return value

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class UserInfo(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    zm: str


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInfo:
    payload = verify_token(token)
    email = payload.get("sub")
    if not email or email not in DEMO_USERS:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    u = DEMO_USERS[email]
    return UserInfo(id=u["id"], nombre=u["nombre"], email=u["email"], rol=u["rol"], zm=u["zm"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    # Rate limiting: 5 intentos en 15 min
    now = datetime.utcnow().timestamp()
    attempts = login_attempts.get(request.email, [])
    attempts = [t for t in attempts if now - t < 900]
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera 15 minutos.")

    user = DEMO_USERS.get(request.email)
    if not user or not verify_password(request.password, user["hashed_password"]):
        login_attempts[request.email] = attempts + [now]
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    login_attempts[request.email] = []

    access = create_token(
        {"sub": user["email"], "rol": user["rol"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = create_token(
        {"sub": user["email"], "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    logger.info(f"Login exitoso: {user['email']}")
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserInfo)
async def me(current_user: UserInfo = Depends(get_current_user)):
    return current_user


@router.post("/refresh")
async def refresh_token(refresh: str):
    payload = verify_token(refresh)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresh inválido")
    email = payload.get("sub")
    if not email or email not in DEMO_USERS:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    access = create_token(
        {"sub": email, "rol": DEMO_USERS[email]["rol"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access, "token_type": "bearer"}
