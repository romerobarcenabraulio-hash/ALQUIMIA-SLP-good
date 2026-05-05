"""Contratos Fase 13.1: infraestructura y centros de acopio."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class CollectionCenterType(BaseModel):
    id: Literal["P", "M", "G"]
    nombre: str
    capacidad_ton_dia: float
    superficie_m2: float
    capex_mxn: float
    opex_mensual_mxn: float
    empleos_directos: int
    materiales_aceptados: list[str]
    fuente: str
    confianza: Literal["alta", "media", "estimada"]
    warnings: list[str] = Field(default_factory=list)


class CollectionCenterSite(BaseModel):
    id: str
    municipio_id: str
    zona_id: str
    tipo_id: Literal["P", "M", "G"]
    fase_inicio: int
    mes_inicio: int
    capacidad_ton_dia: float
    materiales_aceptados: list[str]
    recicladoras_destino: list[str]
    restricciones_suelo: list[str]
    estado: Literal["propuesto", "validacion_suelo", "aprobado", "operando"]
    lat: Optional[float] = None
    lng: Optional[float] = None


class CalculoBrechaPlan(BaseModel):
    formula: str
    fuente_capturable: str
    fuente_capacidad: str
    unidad: str
    explicacion: str
    incertidumbre: str


class InfrastructurePlanRequest(BaseModel):
    municipio_id: str
    zona_ids: list[str]
    rsu_capturable_ton_dia: float
    horizonte_años: int
    mix_centros: dict[str, int]


class InfrastructurePlanResponse(BaseModel):
    status: Literal["ready", "warning", "blocked"]
    municipio_id: Optional[str]
    centros: list[CollectionCenterSite]
    capacidad_instalada_ton_dia: float
    rsu_capturable_ton_dia: float
    brecha_ton_dia: float
    capacidad_por_material: dict[str, float]
    calculo_brecha: CalculoBrechaPlan
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_action: str
