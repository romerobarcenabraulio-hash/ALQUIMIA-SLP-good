"""Operaciones de cuenta en PostgreSQL."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.auth.crypto_password import hash_password
from app.models.user_account import AccessLog, EmailVerificationToken, SmsVerificationCode, UserAccount


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get_user_by_email(db: Session, email: str) -> Optional[UserAccount]:
    return db.query(UserAccount).filter(UserAccount.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[UserAccount]:
    return db.query(UserAccount).filter(UserAccount.id == user_id).first()


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    nombre: str,
    apellido_paterno: str,
    apellido_materno: str | None,
    telefono: str,
    cargo: str = "",
    dependencia: str = "",
    municipio_nombre: str | None = None,
    estado_mx: str | None = None,
    zm: str = "SLP",
) -> UserAccount:
    user = UserAccount(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        nombre=nombre.strip(),
        apellido_paterno=apellido_paterno.strip(),
        apellido_materno=apellido_materno.strip() if apellido_materno else None,
        telefono=telefono.strip(),
        cargo=(cargo or "").strip(),
        dependencia=(dependencia or "").strip(),
        municipio_nombre=municipio_nombre.strip() if municipio_nombre else None,
        estado_mx=estado_mx.strip() if estado_mx else None,
        zm=zm.strip().upper() or "SLP",
        rol="funcionario",
    )
    db.add(user)
    db.flush()
    return user


def issue_email_verification(db: Session, user: UserAccount) -> str:
    raw = secrets.token_urlsafe(32)
    row = EmailVerificationToken(
        user_id=user.id,
        token_hash=_hash_token(raw),
        expires_at=_now() + timedelta(hours=24),
    )
    db.add(row)
    db.flush()
    return raw


def consume_email_verification(db: Session, raw_token: str) -> UserAccount | None:
    token_hash = _hash_token(raw_token)
    row = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token_hash == token_hash)
        .first()
    )
    if not row or row.used_at is not None or row.expires_at < _now():
        return None
    user = get_user_by_id(db, row.user_id)
    if not user:
        return None
    row.used_at = _now()
    user.email_verified_at = _now()
    db.flush()
    return user


def apply_onboarding_profile(
    db: Session,
    user: UserAccount,
    *,
    client_segment: str,
    service_interest: str,
    cargo: str | None,
    dependencia: str | None,
    organizacion: str | None,
    municipio_nombre: str | None,
    estado_mx: str | None,
    municipio_id: str | None,
    clave_inegi: str | None,
    zm: str,
) -> UserAccount:
    user.client_segment = client_segment
    user.service_interest = service_interest
    user.cargo = (cargo or "").strip()
    user.dependencia = (dependencia or "").strip()
    user.organizacion = organizacion.strip() if organizacion else None
    user.municipio_nombre = municipio_nombre.strip() if municipio_nombre else None
    user.estado_mx = estado_mx.strip() if estado_mx else None
    user.municipio_id = municipio_id.lower().strip() if municipio_id else None
    user.clave_inegi = clave_inegi.strip() if clave_inegi else None
    user.zm = zm.strip().upper() or "SLP"
    user.rol = "funcionario" if client_segment == "politica_publica" else "cliente"
    db.flush()
    return user


def issue_sms_code(db: Session, user_id: str, purpose: str, code_hash: str, *, ttl_minutes: int = 10) -> SmsVerificationCode:
    row = SmsVerificationCode(
        user_id=user_id,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=_now() + timedelta(minutes=ttl_minutes),
    )
    db.add(row)
    db.flush()
    return row


def count_recent_sms_sends(db: Session, user_id: str, *, hours: int = 1) -> int:
    since = _now() - timedelta(hours=hours)
    return (
        db.query(SmsVerificationCode)
        .filter(SmsVerificationCode.user_id == user_id, SmsVerificationCode.created_at >= since)
        .count()
    )


def consume_sms_code(db: Session, user_id: str, purpose: str, raw_code: str) -> bool:
    rows = (
        db.query(SmsVerificationCode)
        .filter(
            SmsVerificationCode.user_id == user_id,
            SmsVerificationCode.purpose == purpose,
            SmsVerificationCode.used_at.is_(None),
            SmsVerificationCode.expires_at >= _now(),
        )
        .order_by(SmsVerificationCode.created_at.desc())
        .limit(3)
        .all()
    )
    from app.auth.sms_service import verify_sms_code

    for row in rows:
        row.attempts += 1
        if verify_sms_code(raw_code, row.code_hash):
            row.used_at = _now()
            db.flush()
            return True
    db.flush()
    return False


def is_account_locked(user: UserAccount) -> bool:
    return user.locked_until is not None and user.locked_until > _now()


def record_failed_login_db(db: Session, user: UserAccount) -> None:
    from app.config import settings

    user.failed_login_count = (user.failed_login_count or 0) + 1
    if user.failed_login_count >= settings.MAX_FAILED_LOGINS:
        user.locked_until = _now() + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
    db.flush()


def clear_login_failures(db: Session, user: UserAccount) -> None:
    user.failed_login_count = 0
    user.locked_until = None
    db.flush()


def log_access(
    db: Session,
    *,
    event: str,
    user: UserAccount | None = None,
    email: str | None = None,
    ip_hash: str | None = None,
    user_agent: str | None = None,
    path: str | None = None,
) -> None:
    db.add(
        AccessLog(
            user_id=user.id if user else None,
            email=(user.email if user else email),
            event=event,
            ip_hash=ip_hash,
            user_agent=user_agent,
            path=path,
        )
    )
