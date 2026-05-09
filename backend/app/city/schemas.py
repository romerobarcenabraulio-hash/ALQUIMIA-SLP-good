from __future__ import annotations

from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.city.catalog_debt import CATALOG_SIMULATION_EPOCH
from app.data.schemas import DataProvenance

# NAVIGATOR §5 — vocabulario canonico de alcance jurisdiccional (ingles, producto).
# `legal_scope="municipio"` (espanol, dominio legal) equivale a Municipality en filas municipales.
JurisdictionScope = Literal["Municipality", "MetropolitanZone"]


class PortalEntry(str, Enum):
    city_plan = "city_plan"
    organization = "organization"


class UserAudienceMode(str, Enum):
    citizen = "citizen"
    city_team = "city_team"
    organization = "organization"


class DecisionModuleStatus(str, Enum):
    ready = "ready"
    blocked = "blocked"


class DecisionModule(BaseModel):
    module_id: str
    label: str
    audience_mode: UserAudienceMode
    decision: str
    evidence: str
    status: DecisionModuleStatus = DecisionModuleStatus.ready
    blocker: Optional[str] = None
    next_action: str


JourneyStep = DecisionModule


class MunicipioContext(BaseModel):
    municipio_id: str
    nombre: str
    estado: str
    legal_scope: Literal["municipio"] = "municipio"
    jurisdiction_scope: Literal["Municipality"] = "Municipality"


class CityOption(BaseModel):
    city_id: str
    nombre: str
    estado_principal: str
    municipios: List[MunicipioContext]


class MunicipioMxApi(BaseModel):
    """Municipio para selector Estado → Municipio (Q-009)."""

    clave_inegi: str = Field(..., description="CVE INEGI 5 caracteres (entidad+municipio)")
    nombre: str
    estado: str = Field(..., description="Nombre de la entidad federativa")
    estado_id: str = Field(..., description="CVE entidad INEGI (2 dígitos)")
    poblacion: int = Field(..., ge=0)
    generacion_rsu_dia: float = Field(..., ge=0, description="Toneladas RSU/día modelo")
    zm_simulator_id: str = Field(..., description="ID de ZM en simulador ALQUIMIA")
    municipio_simulator_id: str = Field(..., min_length=2, max_length=8)
    datos_estimados: bool = Field(
        default=True,
        description="True si población/RSU son estimaciones; Navigator valida CVE y cifras.",
    )


class EstadoMxOption(BaseModel):
    estado_id: str
    nombre: str


class InegiMunicipalSourceAudit(BaseModel):
    """Auditoría de fuente INEGI por CVE municipal.

    No descarga ni inventa datos: declara qué fuente sostiene el catálogo
    actual y si la API DENUE puede consultarse en esta sesión.
    """

    clave_inegi: str
    municipio: str
    estado_id: str
    estado: str
    census_source: str
    census_source_url: str
    census_status: Literal["xlsx_loaded", "catalog_only", "missing"] = "catalog_only"
    denue_api_url: str
    denue_status: Literal["configured", "blocked_missing_token"] = "blocked_missing_token"
    live_query_performed: bool = False
    warnings: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)
    next_action: str


class CityContext(CityOption):
    geography_scope: Literal["city_zm"] = "city_zm"
    jurisdiction_scope: Literal["MetropolitanZone"] = "MetropolitanZone"
    catalog_simulation_epoch: str = Field(
        default=CATALOG_SIMULATION_EPOCH,
        description="Época simbólica del catálogo semilla hasta anclaje CVE/MGN oficial (Navigator 23.x)",
    )
    legal_notice: str = Field(..., description="Aviso de simulación y alcance municipal vs metropolitano")
    audience_mode: UserAudienceMode
    supported_entries: List[PortalEntry]


class CircularityBaseline(BaseModel):
    city_id: str
    city_name: str
    rsu_scope: Literal["rsu_municipal"] = "rsu_municipal"
    current_circularity_pct: float = Field(..., ge=0, le=100)
    material_recovery_ton_day_est: float = Field(..., ge=0)
    rsu_total_ton_day_est: float = Field(..., ge=0)
    official_status: Literal["estimated_not_official"] = "estimated_not_official"
    confidence: float = Field(..., ge=0, le=1)
    uncertainty_pct_points: float = Field(..., ge=0)
    provenance: DataProvenance
    warnings: List[str]
    interpretation: str

    @model_validator(mode="after")
    def _estimated_baseline_must_warn(self):
        if self.official_status != "estimated_not_official":
            raise ValueError("CircularityBaseline 10.1 solo permite baseline estimada no oficial")
        if not self.warnings:
            raise ValueError("CircularityBaseline estimada requiere warnings visibles")
        if not self.provenance.fuente_nombre.strip() or not self.provenance.fuente_organismo.strip():
            raise ValueError("CircularityBaseline requiere fuente y organismo verificables")
        if self.confidence <= 0 or self.provenance.confianza <= 0:
            raise ValueError("CircularityBaseline requiere confianza mayor a cero")
        if self.provenance.tipo.value == "oficial":
            raise ValueError("Baseline estimada no puede usar provenance tipo oficial")
        return self
