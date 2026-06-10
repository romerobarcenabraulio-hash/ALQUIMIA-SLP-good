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

from fastapi import Depends

from app.routers.auth import UserInfo, get_current_user


@dataclass
class AuthedUser:
    """Identidad mínima que consumen los routers Phase D."""
    id: str
    rol: str
    email: str
    tenant_id: Optional[str] = None
    municipio_id: Optional[str] = None


def _resolve_tenant_id(info: UserInfo) -> Optional[str]:
    """Resuelve el tenant real (admin_tenants.id) del usuario autenticado.

    Devuelve None si el usuario aún no tiene un municipio completo asignado;
    en ese caso las consultas tenant-scoped quedan vacías (aislamiento seguro)
    en lugar de exponer datos de otro tenant.
    """
    from app.db.session import get_sync_db
    from app.routers.auth import _ensure_consulting_tenant_for_user
    from app.auth.user_service import get_user_by_email

    try:
        with get_sync_db() as db:
            if db is None:
                return None
            user = get_user_by_email(db, info.email)
            if user is None:
                return None
            return _ensure_consulting_tenant_for_user(db, user)
    except Exception:
        return None


async def current_user(info: UserInfo = Depends(get_current_user)) -> AuthedUser:
    """Dependencia FastAPI: valida JWT y adjunta el tenant real del usuario."""
    return AuthedUser(
        id=info.id,
        rol=info.rol,
        email=info.email,
        tenant_id=_resolve_tenant_id(info),
        municipio_id=info.municipio_id,
    )
