"""Contratos Fase 13.3: portal empresarial e institucional."""
from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional, Tuple

from pydantic import BaseModel, Field


class OrganizationActivityType(str, Enum):
    hotel = "hotel"
    hospital = "hospital"
    empresa = "empresa"
    industria_ligera = "industria_ligera"
    universidad = "universidad"
    club_deportivo = "club_deportivo"
    estadio = "estadio"
    centro_comercial = "centro_comercial"
    zona_turistica = "zona_turistica"
    espacio_publico = "espacio_publico"


class WasteStreamProfile(BaseModel):
    material: str
    estimacion_ton_dia: float
    es_rsu: bool
    requiere_proveedor_autorizado: bool
    norma_aplicable: Optional[str] = None
    advertencia: str


class ContainerPlacementPlan(BaseModel):
    zona_interna: str
    tipo_contenedor: str
    cantidad: int
    frecuencia_recoleccion: str
    nota: str


class Action30_60_90(BaseModel):
    plazo: Literal["30_dias", "60_dias", "90_dias"]
    accion: str
    responsable: str
    recursos_requeridos: str
    impacto_esperado: str


class CalculoGeneracionOrg(BaseModel):
    formula: str
    fuente_factor: str
    unidad: str
    incertidumbre_rango: Tuple[float, float]
    explicacion: str


class OrganizationalCircularityRequest(BaseModel):
    organization_id: str
    tipo_actividad: OrganizationActivityType
    municipio_id: str
    nombre: str
    empleados: int
    variables: dict[str, Any] = Field(default_factory=dict)


class OrganizationalCircularityResponse(BaseModel):
    status: Literal["ready", "warning", "blocked"]
    organization_id: str
    tipo_actividad: OrganizationActivityType
    municipio_id: str
    waste_streams: list[WasteStreamProfile]
    container_plan: list[ContainerPlacementPlan]
    acciones_30_60_90: list[Action30_60_90]
    residuos_no_rsu_detectados: list[str] = Field(default_factory=list)
    advertencia_residuos_no_rsu: str = ""
    proveedor_ambiental_requerido: bool = False
    calculo_generacion: CalculoGeneracionOrg
    blockers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    next_action: str
