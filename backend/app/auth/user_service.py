"""Operaciones de cuenta en PostgreSQL."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.auth.crypto_password import hash_password
from app.models.user_account import AccessLog, EmailVerificationToken, UserAccount


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
    telefono: str | None,
    cargo: str,
    dependencia: str,
    municipio_nombre: str | None,
    estado_mx: str | None,
    zm: str,
) -> UserAccount:
    user = UserAccount(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        nombre=nombre.strip(),
        apellido_paterno=apellido_paterno.strip(),
        apellido_materno=apellido_materno.strip() if apellido_materno else None,
        telefono=telefono.strip() if telefono else None,
        cargo=cargo.strip(),
        dependencia=dependencia.strip(),
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
