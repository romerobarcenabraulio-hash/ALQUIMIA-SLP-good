"""Contratos Fase 13.5: hoja de ruta ejecutiva municipal."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class AccionHorizonte(str, Enum):
    dias_30 = "30_dias"
    dias_60 = "60_dias"
    dias_90 = "90_dias"


class NivelPrioridad(str, Enum):
    critica = "critica"
    alta = "alta"
    media = "media"


class AccionEjecutiva(BaseModel):
    horizonte: AccionHorizonte
    titulo: str
    descripcion: str
    responsable_sugerido: str
    kpi_exito: str
    fuente_diagnostico: str
    prioridad: NivelPrioridad
    costo_estimado_mxn: float | None = None


class RoadmapMunicipalRequest(BaseModel):
    municipio_id: str
    generacion_ton_dia: float
    tasa_circularidad_actual_pct: float
    brecha_infraestructura_ton_dia: float = 0.0
    tiene_macrogeneradores: bool = False
    tiene_residuos_regulados: bool = False
    corrientes_criticas: list[str] = Field(default_factory=list)
    estado_legal: str = "sin_gate"


class RoadmapMunicipalResponse(BaseModel):
    status: Literal["ready", "warning", "blocked"]
    blockers: list[str] = Field(default_factory=list)
    acciones: list[AccionEjecutiva] = Field(default_factory=list)
    resumen_ejecutivo: str
    kpi_meta_90_dias: dict[str, str] = Field(default_factory=dict)
    advertencias: list[str] = Field(default_factory=list)
