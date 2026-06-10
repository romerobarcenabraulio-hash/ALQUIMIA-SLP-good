"""Dependencia de autenticación para routers basados en ORM (Phase D).

Los routers generador, decision_tree y web_scraper fueron escritos esperando
`current_user` y un objeto con `.id`, `.rol` y `.tenant_id`. El resto del
backend autentica con `get_current_user` → `UserInfo` (que expone municipio_id
pero no tenant_id). Este módulo puentea ambos: reutiliza la validación de JWT
ya existente y resuelve el tenant real (UUID de admin_tenants) del usuario.

Sin este puente, los imports `from app.db.security import current_user` fallan
y el backend completo no arranca.

Nota: auth.py NO importa este módulo, así que no hay import circular.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException

from app.routers.auth import UserInfo, get_current_user

# Roles de plataforma que pueden operar sobre cualquier tenant (por diseño).
ADMIN_ROLES = {"admin", "analista", "founder"}


@dataclass
class AuthedUser:
    """Identidad mínima que consumen los routers Phase D."""
    id: str
    rol: str
    email: str
    tenant_id: Optional[str] = None
    municipio_id: Optional[str] = None


def resolve_tenant_id_with_db(info: UserInfo, db) -> Optional[str]:
    """Resuelve el tenant real (admin_tenants.id) del usuario usando una
    sesión de DB existente. None si el usuario no tiene municipio completo."""
    if db is None:
        return None
    from app.routers.auth import _ensure_consulting_tenant_for_user
    from app.auth.user_service import get_user_by_email

    try:
        user = get_user_by_email(db, info.email)
        if user is None:
            return None
        return _ensure_consulting_tenant_for_user(db, user)
    except Exception:
        return None


def _resolve_tenant_id(info: UserInfo) -> Optional[str]:
    """Variante que abre su propia sesión (para dependencias sin db)."""
    from app.db.session import get_sync_db

    try:
        with get_sync_db() as db:
            return resolve_tenant_id_with_db(info, db)
    except Exception:
        return None


def assert_tenant_access(info: UserInfo, tenant_id: str, db) -> None:
    """Verifica que el usuario autenticado puede operar sobre `tenant_id`.

    Los roles de plataforma (admin/analista/founder) pasan siempre. Un usuario
    de municipio solo accede a SU tenant. Lanza 403 en caso contrario.
    Esto cierra las fugas cross-tenant (gap E1).
    """
    if info.rol in ADMIN_ROLES:
        return
    caller_tenant = resolve_tenant_id_with_db(info, db)
    if caller_tenant is not None and caller_tenant == str(tenant_id):
        return
    raise HTTPException(status_code=403, detail="No autorizado para este tenant")


async def current_user(info: UserInfo = Depends(get_current_user)) -> AuthedUser:
    """Dependencia FastAPI: valida JWT y adjunta el tenant real del usuario."""
    return AuthedUser(
        id=info.id,
        rol=info.rol,
        email=info.email,
        tenant_id=_resolve_tenant_id(info),
        municipio_id=info.municipio_id,
    )
