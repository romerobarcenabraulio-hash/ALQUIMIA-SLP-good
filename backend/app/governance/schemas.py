"""Contratos Fase 20: gobernanza, calidad y riesgo."""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class RiesgoNivel(str, Enum):
    critico = "critico"
    alto = "alto"
    medio = "medio"
    bajo = "bajo"


class RiesgoIdentificado(BaseModel):
    id: str
    descripcion: str
    nivel: RiesgoNivel
    modulo_origen: str
    mitigacion: str
    estado: Literal["abierto", "mitigado", "aceptado"]


class MetricaCalidad(BaseModel):
    nombre: str
    valor_actual: float
    umbral_minimo: float
    unidad: str
    cumple: bool
    fuente: str


class DoDItem(BaseModel):
    criterio: str
    cumplido: bool
    evidencia: str


class GovernanceRequest(BaseModel):
    municipio_id: str
    total_tests_passing: int
    tsc_clean: bool
    has_rate_limiting: bool
    has_security_headers: bool
    has_health_endpoint: bool
    has_access_control: bool
    cobertura_modulos: int


class GovernanceResponse(BaseModel):
    status: Literal["aprobado", "observaciones", "bloqueado"]
    municipio_id: str
    score_gobernanza: float
    metricas: list[MetricaCalidad] = Field(default_factory=list)
    riesgos: list[RiesgoIdentificado] = Field(default_factory=list)
    dod: list[DoDItem] = Field(default_factory=list)
    resumen: str
    blockers: list[str] = Field(default_factory=list)
