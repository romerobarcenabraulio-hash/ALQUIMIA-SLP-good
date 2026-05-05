"""Contratos de Fase 12.1: educacion ciudadana y calculadora domestica."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PropertyType(str, Enum):
    casa = "casa"
    edificio = "edificio"
    condominio = "condominio"
    residencial = "residencial"


class EducationStatus(str, Enum):
    ready = "ready"
    blocked = "blocked"
    warning = "warning"


class DataSource(BaseModel):
    source_id: str
    name: str
    organization: str
    source_type: str
    unit: str
    confidence: float = Field(..., ge=0, le=1)
    explanation: str


class CalculationAnnexItem(BaseModel):
    calculation_name: str
    formula: str
    inputs: dict[str, float | str]
    result: float
    unit: str
    source: DataSource
    explanation: str


class HouseholdEducationRequest(BaseModel):
    property_type: PropertyType
    household_members: Optional[int] = Field(default=None, ge=1, le=20)
    days: int = Field(default=7, ge=1, le=31)
    generation_kg_per_person_day: Optional[float] = Field(default=None, gt=0, le=3)
    source: Optional[DataSource] = None


class WasteSeparationCategory(BaseModel):
    key: str
    label: str
    examples: list[str]
    container_guidance: str
    why_it_matters: str
    share_pct: float = Field(..., ge=0, le=1)
    estimated_kg_period: float
    help_text: str


class HouseholdRecommendation(BaseModel):
    property_type: PropertyType
    title: str
    what_to_separate: list[str]
    where_to_place: list[str]
    why: str
    not_legal_obligation: str


class DomesticEducationResult(BaseModel):
    status: EducationStatus
    property_type: PropertyType
    household_members: Optional[int]
    days: int
    total_generation_kg: Optional[float]
    unit: str = "kg/periodo"
    source: Optional[DataSource]
    confidence: float
    categories: list[WasteSeparationCategory]
    recommendation: Optional[HouseholdRecommendation]
    result_help_text: str
    chart_help_text: str
    calculation_annex: list[CalculationAnnexItem]
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str
    residuos_scope: str = "rsu_municipal_domestico"
