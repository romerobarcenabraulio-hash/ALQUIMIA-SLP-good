"""Contratos Fase 12.4: advertencias educativas y alcance municipal de oficialidad."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from app.legal.schemas import LegalSourceValidationStatus


class LegalGatedActionType(str, Enum):
    educational_warning = "educational_warning"
    inspection = "inspection"
    proposed_sanction = "proposed_sanction"
    due_process = "due_process"
    definitive_document = "definitive_document"


class LegalGatedActionStatus(str, Enum):
    ready = "ready"
    warning = "warning"
    blocked = "blocked"


class LegalGatedScope(str, Enum):
    municipio = "municipio"
    city_zm = "city_zm"


class WasteScope(str, Enum):
    rsu_municipal = "rsu_municipal"
    regulado = "regulado"
    peligroso = "peligroso"
    especial = "especial"


class EducationalWarning(BaseModel):
    warning_id: str
    municipio_id: str
    message: str
    creates_fine: bool = False
    officiality: str = "educativo_no_oficial"
    next_action: str


class GatedInspectionRecord(BaseModel):
    inspection_id: str
    municipio_id: str
    route_or_zone_id: str
    evidence_ids: list[str]
    creates_firm_sanction: bool = False
    officiality: str = "registro_operativo_no_oficial"
    next_action: str


class ProposedSanction(BaseModel):
    proposed_sanction_id: str
    municipio_id: str
    legal_basis_article_id: str
    evidence_ids: list[str]
    status: str = "propuesta_pendiente_debido_proceso"
    is_firm: bool = False
    officiality: str = "propuesta_no_oficial"
    next_action: str


class DueProcessGate(BaseModel):
    municipio_id: str
    legal_validation_status: LegalSourceValidationStatus
    legal_source_municipio_id: Optional[str] = None
    can_issue_educational_warning: bool
    can_register_inspection: bool
    can_propose_sanction: bool
    can_create_definitive_document: bool = False
    blockers: list[str] = Field(default_factory=list)
    next_action: str


class LegalGatedActionRequest(BaseModel):
    action_type: LegalGatedActionType
    municipio_id: Optional[str] = None
    geography_scope: LegalGatedScope = LegalGatedScope.municipio
    route_or_zone_id: Optional[str] = None
    evidence_ids: list[str] = Field(default_factory=list)
    legal_source_municipio_id: Optional[str] = None
    legal_validation_status: Optional[LegalSourceValidationStatus] = None
    legal_basis_article_id: Optional[str] = None
    waste_scope: WasteScope = WasteScope.rsu_municipal
    competent_validation_explicit: bool = False


class LegalGatedActionResponse(BaseModel):
    status: LegalGatedActionStatus
    action_type: LegalGatedActionType
    municipio_id: Optional[str]
    geography_scope: LegalGatedScope
    waste_scope: WasteScope
    educational_warning: Optional[EducationalWarning] = None
    inspection: Optional[GatedInspectionRecord] = None
    proposed_sanction: Optional[ProposedSanction] = None
    due_process_gate: DueProcessGate
    language_help_text: str
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str
