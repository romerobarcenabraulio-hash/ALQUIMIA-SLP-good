"""Contratos Fase 13.4: flujos de residuos y cierre de ciclo."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class WasteDestination(str, Enum):
    reciclaje = "reciclaje"
    compostaje = "compostaje"
    relleno_sanitario = "relleno_sanitario"
    disposicion_irregular = "disposicion_irregular"
    incineracion = "incineracion"


class FlujoCorriente(BaseModel):
    nombre: str
    toneladas_dia: float
    destino: WasteDestination
    porcentaje_del_total: float
    es_recuperable: bool
    advertencia: str | None = None


class BrechaCircularidad(BaseModel):
    toneladas_recuperables_perdidas: float
    porcentaje_recuperable_no_capturado: float
    oportunidad_ingreso_estimado_mxn: float
    formula: str
    fuente_factor: str


class DiagnosticoCircularidadRequest(BaseModel):
    municipio_id: str
    generacion_total_ton_dia: float
    mix_corrientes: dict[str, float]
    infraestructura_actual: list[str] = Field(default_factory=list)
    tasa_recuperacion_actual_pct: float = 0.0


class DiagnosticoCircularidadResponse(BaseModel):
    status: Literal["ready", "warning", "blocked"]
    blockers: list[str] = Field(default_factory=list)
    flujos: list[FlujoCorriente]
    brecha: BrechaCircularidad
    tasa_circularidad_actual_pct: float
    tasa_circularidad_potencial_pct: float
    acciones_prioritarias: list[str]
    advertencias: list[str] = Field(default_factory=list)
