"""Contratos de Fase 12.2: implementacion espacio-tiempo."""
from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TerritorialPlanStatus(str, Enum):
    ready = "ready"
    warning = "warning"
    blocked = "blocked"


class ZoneStatus(str, Enum):
    propuesta = "propuesta"
    condicionada = "condicionada"
    bloqueada = "bloqueada"


class ImplementationSource(BaseModel):
    source_id: str
    name: str
    organization: str
    source_type: str
    confidence: float = Field(..., ge=0, le=1)
    explanation: str


class TerritorialCalculationAnnexItem(BaseModel):
    calculation_name: str
    formula: str
    inputs: dict[str, float | int | str]
    result: float
    unit: str
    source: ImplementationSource
    explanation: str


class TerritorialPlanRequest(BaseModel):
    city_id: str
    municipios: list[str]
    horizon_years: int = Field(..., ge=1, le=10)
    start_month: int = Field(default=1, ge=1, le=12)
    current_capture_pct: float = Field(default=0, ge=0, le=100)
    target_capture_pct: float = Field(..., ge=0, le=100)
    rsu_total_ton_day: float = Field(..., ge=0)
    available_capacity_ton_day: float = Field(..., ge=0)
    source: Optional[ImplementationSource] = None


class PilotColony(BaseModel):
    name: str
    municipio_id: str
    official_status: Literal["propuesta_no_oficial"] = "propuesta_no_oficial"
    reason: str


class TerritorialZone(BaseModel):
    zone_id: str
    zone_number: int
    municipio_id: str
    colonias: list[PilotColony]
    start_month: int
    end_month: int
    start_quarter: str
    phase_label: str
    target_capture_pct: float
    estimated_capture_ton_day: float
    status: ZoneStatus
    territorial_reason: str
    help_text: str


class TerritorialImplementationPlan(BaseModel):
    status: TerritorialPlanStatus
    city_id: str
    geography_scope: Literal["city_zm"] = "city_zm"
    legal_scope_note: str
    horizon_years: int
    start_month: int
    target_capture_pct: float
    rsu_scope: Literal["rsu_municipal"] = "rsu_municipal"
    zones: list[TerritorialZone]
    timeline_help_text: str
    decision_help_text: str
    calculation_annex: list[TerritorialCalculationAnnexItem]
    source: ImplementationSource
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str
