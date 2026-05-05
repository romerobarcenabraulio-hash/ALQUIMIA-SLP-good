"""Contratos Fase 21: checklist de lanzamiento reproducible."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ChecklistItemEstado(str, Enum):
    ok = "ok"
    advertencia = "advertencia"
    fallo = "fallo"


class ChecklistItem(BaseModel):
    id: str
    categoria: str
    descripcion: str
    comando_verificacion: str
    estado: ChecklistItemEstado
    detalle: str


class LaunchChecklistResponse(BaseModel):
    status: Literal["listo", "advertencias", "bloqueado"]
    score_lanzamiento: float
    items: list[ChecklistItem]
    blockers: list[str] = Field(default_factory=list)
    resumen: str
    version: str = "21.0"
