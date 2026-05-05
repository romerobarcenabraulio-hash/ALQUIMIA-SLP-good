"""Contratos de control de acceso por rol."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class RolAcceso(str, Enum):
    publico = "publico"
    tecnico = "tecnico"
    auditor = "auditor"
    admin = "admin"


class ContextoAcceso(BaseModel):
    user_id: str
    rol: RolAcceso
    municipio_id: str | None = None
