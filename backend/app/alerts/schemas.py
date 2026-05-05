"""Contratos Fase 13.9: alertas y notificaciones inteligentes."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class AlertaNivel(str, Enum):
    critica = "critica"
    alta = "alta"
    media = "media"
    info = "info"


class AlertaTipo(str, Enum):
    brecha_infraestructura = "brecha_infraestructura"
    tasa_circularidad_baja = "tasa_circularidad_baja"
    residuos_regulados = "residuos_regulados"
    legal_gate_pendiente = "legal_gate_pendiente"
    macrogenerador_sin_padron = "macrogenerador_sin_padron"
    score_bajo = "score_bajo"
    sin_recuperacion = "sin_recuperacion"


class Alerta(BaseModel):
    tipo: AlertaTipo
    nivel: AlertaNivel
    titulo: str
    mensaje: str
    accion_sugerida: str
    modulo_origen: str


class AlertasRequest(BaseModel):
    municipio_id: str
    tasa_circularidad_pct: float = Field(ge=0, le=100)
    brecha_infraestructura_ton_dia: float = Field(default=0.0, ge=0)
    score_circularidad: float = Field(default=0.0, ge=0, le=100)
    tiene_residuos_regulados: bool = False
    estado_legal: str = "sin_gate"
    num_macrogeneradores_sin_padron: int = Field(default=0, ge=0)


class AlertasResponse(BaseModel):
    status: Literal["ready", "blocked"]
    blockers: list[str] = Field(default_factory=list)
    municipio_id: str
    alertas: list[Alerta] = Field(default_factory=list)
    total_criticas: int
    total_alertas: int
    resumen: str
