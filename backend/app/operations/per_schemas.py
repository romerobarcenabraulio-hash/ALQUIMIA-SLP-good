"""Contratos PER y bitacora operativa para Fase 12.3."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PerPlanStatus(str, Enum):
    ready = "ready"
    warning = "warning"
    blocked = "blocked"


class RouteOperationalStatus(str, Enum):
    programada = "programada"
    en_observacion = "en_observacion"
    bloqueada = "bloqueada"


class LogEventType(str, Enum):
    recoleccion = "recoleccion"
    incidencia_operativa = "incidencia_operativa"
    mantenimiento_unidad = "mantenimiento_unidad"
    comunicacion_vecinal = "comunicacion_vecinal"
    evidencia_ruta = "evidencia_ruta"


class OperationEvidence(BaseModel):
    evidence_id: str
    evidence_type: str
    description: str
    captured_at: str
    captured_by: str
    source: str


class OperationDataSource(BaseModel):
    source_id: str
    name: str
    organization: str
    source_type: str
    confidence: float = Field(..., ge=0, le=1)
    explanation: str


class PerCalculationAnnexItem(BaseModel):
    calculation_name: str
    formula: str
    inputs: dict[str, float | int | str]
    result: float
    unit: str
    source: OperationDataSource
    explanation: str


class PerRouteInput(BaseModel):
    route_id: Optional[str] = None
    municipio_id: Optional[str] = None
    zona_id: Optional[str] = None
    colonias: list[str] = Field(default_factory=list)
    frecuencia: Optional[str] = None
    frecuencia_por_semana: int = Field(default=3, ge=0, le=14)
    camion_unidad: Optional[str] = None
    responsable: Optional[str] = None
    ventana_temporal: Optional[str] = None
    estado_operativo: RouteOperationalStatus = RouteOperationalStatus.programada


class LogEventInput(BaseModel):
    fecha: str
    event_type: LogEventType
    evidencia: list[OperationEvidence] = Field(default_factory=list)
    municipio_id: Optional[str] = None
    route_or_zone_id: Optional[str] = None
    actor_responsable: Optional[str] = None
    accion_siguiente: Optional[str] = None


class PerPlanRequest(BaseModel):
    city_id: str
    periodo_mes: str
    routes: list[PerRouteInput] = Field(default_factory=list)
    log_events: list[LogEventInput] = Field(default_factory=list)
    source: Optional[OperationDataSource] = None


class PerExplanation(BaseModel):
    presion: str
    estado: str
    respuesta: str
    human_explanation: str


class OperationalRoute(BaseModel):
    route_id: str
    municipio_id: str
    zona_id: str
    colonias: list[str]
    frecuencia: str
    frecuencia_por_semana: int
    camion_unidad: str
    responsable: str
    ventana_temporal: str
    estado_operativo: RouteOperationalStatus
    per: PerExplanation
    help_text: str


class OperationalLogEvent(BaseModel):
    event_id: str
    fecha: str
    event_type: LogEventType
    evidencia: list[OperationEvidence]
    municipio_id: str
    route_or_zone_id: str
    actor_responsable: str
    accion_siguiente: str


class PerOperationsPlan(BaseModel):
    status: PerPlanStatus
    city_id: str
    periodo_mes: str
    rsu_scope: str = "rsu_municipal"
    routes: list[OperationalRoute]
    log_events: list[OperationalLogEvent]
    monthly_visits_estimate: float
    unit: str = "visitas/mes"
    metric_help_text: str
    per_help_text: str
    calculation_annex: list[PerCalculationAnnexItem]
    source: OperationDataSource
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str
