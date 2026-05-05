"""Contratos Fase 13.8: comparador de escenarios municipales."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class EscenarioInput(BaseModel):
    nombre: str
    generacion_ton_dia: float = Field(gt=0)
    tasa_circularidad_pct: float = Field(ge=0, le=100)
    brecha_infraestructura_ton_dia: float = Field(default=0.0, ge=0)
    num_centros_acopio: int = 0
    num_macrogeneradores: int = 0
    estado_legal: str = "sin_gate"


class EscenarioResultado(BaseModel):
    nombre: str
    score_circularidad: float
    tasa_circularidad_pct: float
    brecha_ton_dia: float
    kpi_resumen: dict[str, str]
    es_ganador: bool = False
    diferencia_vs_base: dict[str, float] = Field(default_factory=dict)


class ComparadorRequest(BaseModel):
    municipio_id: str
    escenarios: list[EscenarioInput]


class ComparadorResponse(BaseModel):
    status: Literal["ready", "blocked"]
    blockers: list[str] = Field(default_factory=list)
    municipio_id: str
    escenarios: list[EscenarioResultado] = Field(default_factory=list)
    escenario_ganador: str
    resumen_comparativo: str
    advertencias: list[str] = Field(default_factory=list)
