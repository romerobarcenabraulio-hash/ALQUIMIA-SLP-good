"""Helpers de acceso por rol para endpoints sensibles."""
from __future__ import annotations

from starlette.requests import Request

from app.access.schemas import ContextoAcceso, RolAcceso

_ROL_ORDER = {
    RolAcceso.publico: 0,
    RolAcceso.tecnico: 1,
    RolAcceso.auditor: 2,
    RolAcceso.admin: 3,
}


def get_access_context(request: Request) -> ContextoAcceso:
    header = (request.headers.get("X-Alquimia-Role") or "").strip().lower()
    try:
        rol = RolAcceso(header) if header else RolAcceso.publico
    except ValueError:
        rol = RolAcceso.publico

    return ContextoAcceso(
        user_id=request.headers.get("X-Alquimia-User", "anon"),
        rol=rol,
        municipio_id=request.headers.get("X-Alquimia-Municipio"),
    )


def verify_rol(context: ContextoAcceso, required: RolAcceso) -> bool:
    return _ROL_ORDER[context.rol] >= _ROL_ORDER[required]
