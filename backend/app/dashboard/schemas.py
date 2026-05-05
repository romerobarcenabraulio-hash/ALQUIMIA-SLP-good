"""Contratos Fase 13.7: dashboard de indicadores y KPIs municipales."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class TendenciaSentido(str, Enum):
    mejora = "mejora"
    deterioro = "deterioro"
    estable = "estable"


class KPIIndicador(BaseModel):
    clave: str
    titulo: str
    valor_actual: float
    unidad: str
    meta_90_dias: float
    tendencia: TendenciaSentido
    fuente: str
    formula: str
    alerta: str | None = None


class ResumenEjecutivoDashboard(BaseModel):
    municipio_id: str
    total_residuos_ton_dia: float
    tasa_circularidad_pct: float
    brecha_infraestructura_ton_dia: float
    num_macrogeneradores: int
    num_centros_acopio: int
    estado_legal: str
    score_circularidad: float


class DashboardRequest(BaseModel):
    municipio_id: str
    generacion_ton_dia: float = Field(ge=0)
    tasa_circularidad_actual_pct: float = Field(ge=0, le=100)
    brecha_infraestructura_ton_dia: float = Field(default=0.0, ge=0)
    num_macrogeneradores: int = 0
    num_centros_acopio: int = 0
    estado_legal: str = "sin_gate"
    corrientes_criticas: list[str] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    status: Literal["ready", "warning", "blocked"]
    blockers: list[str] = Field(default_factory=list)
    resumen: ResumenEjecutivoDashboard
    kpis: list[KPIIndicador] = Field(default_factory=list)
    advertencias: list[str] = Field(default_factory=list)
