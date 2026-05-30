from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.auth.crypto_password import hash_password, verify_password
from app.auth.email_service import send_verification_email
from app.auth.onboarding_catalog import (
    SEGMENTS,
    VALID_SEGMENTS,
    is_valid_service,
    service_requires_reglamento,
)
from app.auth.onboarding_trigger import schedule_kickoff
from app.auth.phone_utils import mask_phone, normalize_phone_mx
from app.auth.sms_service import generate_sms_code, send_sms_code
from app.auth.totp_service import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_totp_secret,
    totp_provisioning_uri,
    verify_totp_code,
)
from app.auth.user_service import (
    apply_onboarding_profile,
    clear_login_failures,
    consume_email_verification,
    consume_sms_code,
    count_recent_sms_sends,
    create_user,
    get_user_by_email,
    get_user_by_id,
    is_account_locked,
    issue_email_verification,
    issue_sms_code,
    log_access,
    record_failed_login_db,
)
from app.config import settings
from app.db.session import get_db, get_sync_db

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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
    telefono: str
    cargo: str = ""
    dependencia: str = ""
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

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str) -> str:
        if len(value) < 12:
            raise ValueError("La contraseña debe tener al menos 12 caracteres")
        return value

    @field_validator("telefono")
    @classmethod
    def _phone_shape(cls, value: str) -> str:
        if not normalize_phone_mx(value):
            raise ValueError("Teléfono inválido — usa 10 dígitos móviles de México")
        return value


class VerifyEmailRequest(BaseModel):
    token: str


class SetupTokenRequest(BaseModel):
    setup_token: str


class OnboardingProfileRequest(BaseModel):
    setup_token: str
    client_segment: Literal["politica_publica", "empresarial"]
    service_interest: str
    cargo: str | None = None
    dependencia: str | None = None
    organizacion: str | None = None
    municipio_nombre: str | None = None
    estado_mx: str | None = None
    clave_inegi: str | None = None
    municipio_id: str | None = None
    zm: str = "SLP"


class SmsSendRequest(BaseModel):
    setup_token: str
    purpose: Literal["onboarding"] = "onboarding"


class SmsVerifyRequest(BaseModel):
    setup_token: str
    sms_code: str


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
    client_segment: str | None = None
    service_interest: str | None = None
    municipio_id: str | None = None
    municipio_nombre: str | None = None
    estado_mx: str | None = None
    reglamento_uploaded: bool = False
    onboarding_completed: bool = False


class AuthStatusResponse(BaseModel):
    registration_enabled: bool
    email_provider: str
    sms_provider: str
    email_ready: bool = False


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def _issue_session_tokens(*, email: str, rol: str, client_segment: str | None = None) -> TokenResponse:
    payload: dict = {"sub": email, "rol": rol}
    if client_segment:
        payload["client_segment"] = client_segment
    access = create_token(payload, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh = create_token({"sub": email, "type": "refresh"}, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
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
        client_segment=user.client_segment,
        service_interest=user.service_interest,
        municipio_id=user.municipio_id,
        municipio_nombre=user.municipio_nombre,
        estado_mx=user.estado_mx,
        reglamento_uploaded=user.reglamento_uploaded_at is not None,
        onboarding_completed=user.onboarding_completed_at is not None,
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


def _resolve_setup_user(db: Session, setup_token: str):
    payload = verify_token(setup_token)
    if payload.get("type") != "setup":
        raise HTTPException(status_code=400, detail="Token de configuración inválido")
    user = get_user_by_id(db, payload.get("sub", ""))
    if not user or not user.email_verified_at:
        raise HTTPException(status_code=400, detail="Cuenta no verificada")
    return user


def _user_phone_e164(user) -> str:
    phone = normalize_phone_mx(user.telefono or "")
    if not phone:
        raise HTTPException(status_code=400, detail="Teléfono no registrado")
    return phone


async def _send_user_sms(db: Session, user, purpose: str) -> tuple[str, str | None]:
    if count_recent_sms_sends(db, user.id) >= settings.SMS_MAX_SENDS_PER_HOUR:
        raise HTTPException(status_code=429, detail="Demasiados SMS enviados. Espera una hora.")
    raw, code_hash = generate_sms_code()
    issue_sms_code(db, user.id, purpose, code_hash)
    phone = _user_phone_e164(user)
    await send_sms_code(to_e164=phone, code=raw, purpose=purpose)
    log_access(db, event=f"sms_sent_{purpose}", user=user)
    provider = (settings.SMS_PROVIDER or "console").lower()
    dev_code = raw if provider == "console" or (provider == "twilio" and not settings.TWILIO_ACCOUNT_SID) else None
    return mask_phone(phone), dev_code


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
    email_ready = settings.EMAIL_PROVIDER == "resend" and bool(settings.RESEND_API_KEY)
    return AuthStatusResponse(
        registration_enabled=settings.REGISTRATION_ENABLED,
        email_provider=settings.EMAIL_PROVIDER,
        sms_provider=settings.SMS_PROVIDER,
        email_ready=email_ready,
    )


@router.get("/onboarding/options")
async def onboarding_options():
    return {"segments": SEGMENTS}


@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not settings.REGISTRATION_ENABLED:
        raise HTTPException(status_code=403, detail="Registro deshabilitado")
    if db is None:
        raise HTTPException(status_code=503, detail="Registro requiere PostgreSQL")

    if req.email in DEMO_USERS or get_user_by_email(db, req.email):
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo")

    phone = normalize_phone_mx(req.telefono)
    user = create_user(
        db,
        email=req.email,
        password=req.password,
        nombre=req.nombre,
        apellido_paterno=req.apellido_paterno,
        apellido_materno=req.apellido_materno,
        telefono=phone or req.telefono,
        cargo=req.cargo,
        dependencia=req.dependencia,
        municipio_nombre=req.municipio_nombre,
        estado_mx=req.estado_mx,
        zm=req.zm,
    )
    raw = issue_email_verification(db, user)
    verify_url = f"{settings.app_public_url()}/verify-email?token={raw}"
    try:
        await send_verification_email(to_email=user.email, verify_url=verify_url, nombre=user.nombre)
    except RuntimeError as exc:
        logger.exception("Fallo envío correo verificación para %s", user.email)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    log_access(db, event="register", user=user)
    response = {
        "message": "Revisa tu correo. Después elegirás tu perfil, verificarás SMS y configurarás TOTP.",
        "email": user.email,
    }
    if settings.EMAIL_PROVIDER == "console" or not settings.RESEND_API_KEY:
        response["verification_url"] = verify_url
    return response


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Verificación requiere PostgreSQL")
    user = consume_email_verification(db, req.token)
    if not user:
        raise HTTPException(status_code=400, detail="Enlace inválido o expirado")
    setup_token = create_token(
        {"sub": user.id, "type": "setup", "email": user.email},
        timedelta(minutes=45),
    )
    log_access(db, event="email_verified", user=user)
    return {
        "setup_token": setup_token,
        "email": user.email,
        "message": "Correo confirmado. Elige tu tipo de cliente y servicio.",
    }


@router.post("/onboarding/profile")
async def onboarding_profile(req: OnboardingProfileRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Onboarding requiere PostgreSQL")
    if req.client_segment not in VALID_SEGMENTS:
        raise HTTPException(status_code=400, detail="Segmento inválido")
    if not is_valid_service(req.client_segment, req.service_interest):
        raise HTTPException(status_code=400, detail="Servicio no válido para el segmento")

    user = _resolve_setup_user(db, req.setup_token)

    if req.client_segment == "politica_publica":
        if not (req.dependencia and req.cargo):
            raise HTTPException(status_code=400, detail="Cargo y dependencia son obligatorios para sector público")
        if not (req.municipio_nombre and req.estado_mx and req.clave_inegi):
            raise HTTPException(status_code=400, detail="Estado y municipio son obligatorios")
    elif not req.organizacion:
        raise HTTPException(status_code=400, detail="Organización es obligatoria para sector empresarial")

    municipio_id = req.municipio_id
    zm = req.zm
    if req.clave_inegi:
        from app.legal.dynamic_municipio import ensure_municipio_registered

        registered = ensure_municipio_registered(
            clave_inegi=req.clave_inegi,
            nombre=req.municipio_nombre,
            estado_id=req.clave_inegi[:2] if len(req.clave_inegi) >= 2 else None,
            estado_nombre=req.estado_mx,
        )
        if registered:
            municipio_id = registered
            from app.city.inegi_catalog import get_municipio_by_clave_resolved

            row = get_municipio_by_clave_resolved(req.clave_inegi)
            if row:
                zm = row.zm_simulator_id

    apply_onboarding_profile(
        db,
        user,
        client_segment=req.client_segment,
        service_interest=req.service_interest,
        cargo=req.cargo,
        dependencia=req.dependencia,
        organizacion=req.organizacion,
        municipio_nombre=req.municipio_nombre,
        estado_mx=req.estado_mx,
        municipio_id=municipio_id,
        clave_inegi=req.clave_inegi,
        zm=zm,
    )
    log_access(db, event="onboarding_profile", user=user)
    needs_pdf = service_requires_reglamento(req.client_segment, req.service_interest)
    return {
        "message": "Perfil guardado. Verifica tu teléfono por SMS.",
        "client_segment": user.client_segment,
        "service_interest": user.service_interest,
        "requires_reglamento_pdf": needs_pdf,
        "municipio_id": user.municipio_id,
    }


@router.post("/sms/send")
async def sms_send(req: SmsSendRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="SMS requiere PostgreSQL")
    user = _resolve_setup_user(db, req.setup_token)
    masked, dev_code = await _send_user_sms(db, user, "onboarding")
    response = {"message": "Código SMS enviado", "phone_masked": masked}
    if dev_code:
        response["dev_sms_code"] = dev_code
    return response


@router.post("/sms/verify")
async def sms_verify(req: SmsVerifyRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="SMS requiere PostgreSQL")
    user = _resolve_setup_user(db, req.setup_token)
    if not consume_sms_code(db, user.id, "onboarding", req.sms_code):
        log_access(db, event="sms_verify_failed", user=user)
        raise HTTPException(status_code=401, detail="Código SMS incorrecto o expirado")
    user.phone_verified_at = datetime.utcnow()
    user.sms_enabled = True
    log_access(db, event="sms_verified", user=user)
    needs_pdf = service_requires_reglamento(user.client_segment or "", user.service_interest or "")
    return {
        "message": "Teléfono verificado.",
        "phone_masked": mask_phone(_user_phone_e164(user)),
        "requires_reglamento_pdf": needs_pdf,
        "next_path": "/onboarding/reglamento" if needs_pdf else "/setup-2fa",
    }


@router.post("/onboarding/upload-reglamento")
async def onboarding_upload_reglamento(
    setup_token: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Sube reglamento municipal durante alta de cuenta — dispara diagnóstico jurídico."""
    if db is None:
        raise HTTPException(status_code=503, detail="Upload requiere PostgreSQL")
    user = _resolve_setup_user(db, setup_token)
    if not user.municipio_id:
        raise HTTPException(status_code=400, detail="Completa estado y municipio en tu perfil")
    if not service_requires_reglamento(user.client_segment or "", user.service_interest or ""):
        raise HTTPException(status_code=400, detail="Tu servicio no requiere reglamento municipal")

    content_type = (file.content_type or "").lower()
    if content_type not in {"application/pdf", "application/octet-stream", "binary/octet-stream"}:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo PDF está vacío.")

    from app.legal.dynamic_municipio import ensure_municipio_registered
    from app.legal.diagnostic import build_diagnostic
    from app.legal.source_ingest import pdf_ingested_for_analysis, upload_municipal_pdf_bytes

    mid = user.municipio_id.lower()
    ensure_municipio_registered(municipio_id=mid, clave_inegi=user.clave_inegi)
    try:
        manifest = upload_municipal_pdf_bytes(mid, content, original_filename=file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if manifest is None:
        raise HTTPException(status_code=404, detail="Municipio no registrado")

    diag = build_diagnostic(mid)
    habilitado = bool(diag and pdf_ingested_for_analysis(manifest) and not diag.agora_bloqueado)
    user.reglamento_uploaded_at = datetime.utcnow()
    log_access(db, event="reglamento_uploaded", user=user)
    return {
        "ok": True,
        "municipio_id": mid,
        "analysis_ready": habilitado,
        "message": (
            "Reglamento registrado. La plataforma iniciará el análisis al activar TOTP."
            if habilitado
            else "PDF registrado; revisión jurídica pendiente."
        ),
    }


@router.post("/totp/setup")
async def totp_setup(req: SetupTokenRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="TOTP requiere PostgreSQL")
    user = _resolve_setup_user(db, req.setup_token)
    if not user.client_segment or not user.service_interest:
        raise HTTPException(status_code=400, detail="Completa tu perfil de cliente primero")
    if not user.phone_verified_at:
        raise HTTPException(status_code=400, detail="Verifica tu teléfono por SMS primero")
    if service_requires_reglamento(user.client_segment or "", user.service_interest or ""):
        if not user.reglamento_uploaded_at:
            raise HTTPException(status_code=400, detail="Sube el PDF del reglamento municipal primero")
    secret = generate_totp_secret()
    user.totp_secret_enc = encrypt_totp_secret(settings.SECRET_KEY, secret)
    db.flush()
    uri = totp_provisioning_uri(secret, user.email)
    return {"otpauth_uri": uri, "secret_preview": f"{secret[:4]}…{secret[-4:]}"}


@router.post("/totp/activate", response_model=TokenResponse)
async def totp_activate(req: TotpActivateRequest, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="TOTP requiere PostgreSQL")
    user = _resolve_setup_user(db, req.setup_token)
    if not user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="Configura TOTP primero")
    secret = decrypt_totp_secret(settings.SECRET_KEY, user.totp_secret_enc)
    if not verify_totp_code(secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Código TOTP incorrecto")
    user.totp_enabled = True
    user.onboarding_completed_at = datetime.utcnow()
    user.last_login_at = datetime.utcnow()
    clear_login_failures(db, user)
    log_access(db, event="totp_activated", user=user)
    if user.reglamento_uploaded_at and user.municipio_id:
        schedule_kickoff(user)
    return _issue_session_tokens(email=user.email, rol=user.rol, client_segment=user.client_segment)


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
        if user and user.activo:
            if is_account_locked(user):
                raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente por intentos fallidos")
            if verify_password(request.password, user.hashed_password):
                if not user.email_verified_at:
                    raise HTTPException(status_code=403, detail="Confirma tu correo antes de ingresar")
                if not user.onboarding_completed_at:
                    raise HTTPException(status_code=403, detail="Completa el registro (perfil, SMS y TOTP)")

                login_attempts[request.email] = []
                clear_login_failures(db, user)

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
                return _issue_session_tokens(email=user.email, rol=user.rol, client_segment=user.client_segment)

            record_failed_login_db(db, user)
            log_access(db, event="login_failed", user=user)

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
        record_failed_login_db(db, user)
        log_access(db, event="login_totp_failed", user=user)
        raise HTTPException(status_code=401, detail="Código TOTP incorrecto")
    user.last_login_at = datetime.utcnow()
    clear_login_failures(db, user)
    log_access(db, event="login_totp", user=user)
    return _issue_session_tokens(email=user.email, rol=user.rol, client_segment=user.client_segment)


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
        return {
            "access_token": create_token(
                {"sub": email, "rol": DEMO_USERS[email]["rol"]},
                timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            ),
            "token_type": "bearer",
        }
    with get_sync_db() as db:
        if db is not None:
            user = get_user_by_email(db, email)
            if user and user.activo:
                return {
                    "access_token": create_token(
                        {"sub": email, "rol": user.rol, "client_segment": user.client_segment},
                        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                    ),
                    "token_type": "bearer",
                }
    raise HTTPException(status_code=401, detail="Usuario no encontrado")
