from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.auth.crypto_password import hash_password, verify_password
from app.auth.email_service import send_verification_email
from app.auth.totp_service import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_totp_secret,
    totp_provisioning_uri,
    verify_totp_code,
)
from app.auth.user_service import (
    consume_email_verification,
    create_user,
    get_user_by_email,
    get_user_by_id,
    issue_email_verification,
    log_access,
)
from app.config import settings
from app.db.session import get_db, get_sync_db

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Demo users (fallback sin PostgreSQL o cuentas legacy)
DEMO_USERS = {
    "demo@alquimia.mx": {
        "id": "1",
        "nombre": "Usuario Demo",
        "email": "demo@alquimia.mx",
        "hashed_password": hash_password("demo2025", bytes.fromhex("00112233445566778899aabbccddeeff")),
        "rol": "analista",
        "zm": "SLP",
    },
    "admin@alquimia.mx": {
        "id": "2",
        "nombre": "Admin Sistema",
        "email": "admin@alquimia.mx",
        "hashed_password": hash_password("admin2025!", bytes.fromhex("ffeeddccbbaa99887766554433221100")),
        "rol": "admin",
        "zm": "ALL",
    },
}

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


class RegisterRequest(BaseModel):
    email: str
    password: str
    nombre: str
    apellido_paterno: str
    apellido_materno: str | None = None
    telefono: str | None = None
    cargo: str
    dependencia: str
    municipio_nombre: str | None = None
    estado_mx: str | None = None
    zm: str = "SLP"

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("email inválido")
        return value


class VerifyEmailRequest(BaseModel):
    token: str


class SetupTokenRequest(BaseModel):
    setup_token: str


class TotpActivateRequest(BaseModel):
    setup_token: str
    totp_code: str


class LoginTotpRequest(BaseModel):
    pending_token: str
    totp_code: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginPendingTotp(BaseModel):
    requires_totp: bool = True
    pending_token: str
    message: str


class UserInfo(BaseModel):
    id: str
    nombre: str
    email: str
    rol: str
    zm: str


class AuthStatusResponse(BaseModel):
    registration_enabled: bool
    email_provider: str


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def _issue_session_tokens(*, email: str, rol: str) -> TokenResponse:
    access = create_token(
        {"sub": email, "rol": rol},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh = create_token(
        {"sub": email, "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _user_display_name(user) -> str:
    parts = [user.nombre, user.apellido_paterno]
    if user.apellido_materno:
        parts.append(user.apellido_materno)
    return " ".join(p for p in parts if p)


def _user_info_from_db(user) -> UserInfo:
    return UserInfo(
        id=user.id,
        nombre=_user_display_name(user),
        email=user.email,
        rol=user.rol,
        zm=user.zm,
    )


def _check_rate_limit(email: str) -> None:
    now = datetime.utcnow().timestamp()
    attempts = login_attempts.get(email, [])
    attempts = [t for t in attempts if now - t < 900]
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera 15 minutos.")


def _record_failed_login(email: str) -> None:
    now = datetime.utcnow().timestamp()
    attempts = login_attempts.get(email, [])
    attempts = [t for t in attempts if now - t < 900]
    login_attempts[email] = attempts + [now]


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInfo:
    payload = verify_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if email in DEMO_USERS:
        u = DEMO_USERS[email]
        return UserInfo(id=str(u["id"]), nombre=u["nombre"], email=u["email"], rol=u["rol"], zm=u["zm"])

    with get_sync_db() as db:
        if db is not None:
            user = get_user_by_email(db, email)
            if user and user.activo:
                return _user_info_from_db(user)

    raise HTTPException(status_code=401, detail="Usuario no encontrado")


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status():
    return AuthStatusResponse(
        registration_enabled=settings.REGISTRATION_ENABLED,
        email_provider=settings.EMAIL_PROVIDER,
    )


@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not settings.REGISTRATION_ENABLED:
        raise HTTPException(status_code=403, detail="Registro deshabilitado")
    if db is None:
        raise HTTPException(status_code=503, detail="Registro requiere PostgreSQL")

    if req.email in DEMO_USERS or get_user_by_email(db, req.email):
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo")

    user = create_user(
        db,
        email=req.email,
        password=req.password,
        nombre=req.nombre,
        apellido_paterno=req.apellido_paterno,
        apellido_materno=req.apellido_materno,
        telefono=req.telefono,
        cargo=req.cargo,
        dependencia=req.dependencia,
        municipio_nombre=req.municipio_nombre,
        estado_mx=req.estado_mx,
        zm=req.zm,
    )
    raw = issue_email_verification(db, user)
    verify_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/verify-email?token={raw}"
    await send_verification_email(to_email=user.email, verify_url=verify_url, nombre=user.nombre)
    log_access(db, event="register", user=user)
    return {
        "message": "Revisa tu correo para confirmar la cuenta y configurar TOTP.",
        "email": user.email,
    }


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Verificación requiere PostgreSQL")
    user = consume_email_verification(db, req.token)
    if not user:
        raise HTTPException(status_code=400, detail="Enlace inválido o expirado")
    setup_token = create_token(
        {"sub": user.id, "type": "setup", "email": user.email},
        timedelta(minutes=30),
    )
    log_access(db, event="email_verified", user=user)
    return {
        "setup_token": setup_token,
        "email": user.email,
        "message": "Correo confirmado. Configura tu código TOTP.",
    }


@router.post("/totp/setup")
async def totp_setup(req: SetupTokenRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="TOTP requiere PostgreSQL")
    payload = verify_token(req.setup_token)
    if payload.get("type") != "setup":
        raise HTTPException(status_code=400, detail="Token de configuración inválido")
    user = get_user_by_id(db, payload.get("sub", ""))
    if not user or not user.email_verified_at:
        raise HTTPException(status_code=400, detail="Cuenta no verificada")
    secret = generate_totp_secret()
    user.totp_secret_enc = encrypt_totp_secret(settings.SECRET_KEY, secret)
    db.flush()
    uri = totp_provisioning_uri(secret, user.email)
    return {"otpauth_uri": uri, "secret_preview": f"{secret[:4]}…{secret[-4:]}"}


@router.post("/totp/activate", response_model=TokenResponse)
async def totp_activate(req: TotpActivateRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="TOTP requiere PostgreSQL")
    payload = verify_token(req.setup_token)
    if payload.get("type") != "setup":
        raise HTTPException(status_code=400, detail="Token de configuración inválido")
    user = get_user_by_id(db, payload.get("sub", ""))
    if not user or not user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="Configura TOTP primero")
    secret = decrypt_totp_secret(settings.SECRET_KEY, user.totp_secret_enc)
    if not verify_totp_code(secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Código TOTP incorrecto")
    user.totp_enabled = True
    user.last_login_at = datetime.utcnow()
    log_access(db, event="totp_activated", user=user)
    return _issue_session_tokens(email=user.email, rol=user.rol)


@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request.email)

    demo = DEMO_USERS.get(request.email)
    if demo and verify_password(request.password, demo["hashed_password"]):
        login_attempts[request.email] = []
        logger.info("Login demo exitoso: %s", request.email)
        return _issue_session_tokens(email=demo["email"], rol=demo["rol"])

    if db is not None:
        user = get_user_by_email(db, request.email)
        if user and user.activo and verify_password(request.password, user.hashed_password):
            if not user.email_verified_at:
                raise HTTPException(status_code=403, detail="Confirma tu correo antes de ingresar")
            login_attempts[request.email] = []
            if user.totp_enabled and user.totp_secret_enc:
                pending = create_token(
                    {"sub": user.id, "type": "pending_login", "email": user.email},
                    timedelta(minutes=5),
                )
                log_access(db, event="login_pending_totp", user=user)
                return LoginPendingTotp(
                    pending_token=pending,
                    message="Ingresa el código de tu autenticador.",
                )
            user.last_login_at = datetime.utcnow()
            log_access(db, event="login", user=user)
            logger.info("Login exitoso: %s", user.email)
            return _issue_session_tokens(email=user.email, rol=user.rol)

    _record_failed_login(request.email)
    raise HTTPException(status_code=401, detail="Credenciales inválidas")


@router.post("/login/totp", response_model=TokenResponse)
async def login_totp(req: LoginTotpRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="TOTP requiere PostgreSQL")
    payload = verify_token(req.pending_token)
    if payload.get("type") != "pending_login":
        raise HTTPException(status_code=400, detail="Sesión TOTP inválida")
    user = get_user_by_id(db, payload.get("sub", ""))
    if not user or not user.totp_enabled or not user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="Cuenta sin TOTP activo")
    secret = decrypt_totp_secret(settings.SECRET_KEY, user.totp_secret_enc)
    if not verify_totp_code(secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Código TOTP incorrecto")
    user.last_login_at = datetime.utcnow()
    log_access(db, event="login_totp", user=user)
    return _issue_session_tokens(email=user.email, rol=user.rol)


@router.get("/me", response_model=UserInfo)
async def me(current_user: UserInfo = Depends(get_current_user)):
    return current_user


@router.post("/refresh")
async def refresh_token(refresh: str):
    payload = verify_token(refresh)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresh inválido")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if email in DEMO_USERS:
        return {"access_token": create_token(
            {"sub": email, "rol": DEMO_USERS[email]["rol"]},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        ), "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Usuario no encontrado")
