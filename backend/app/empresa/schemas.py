"""Esquemas Q-017 — Perfil de Generación Estimada RSU (estimación voluntaria)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

DISCLAIMER_VOLUNTARIA = (
    "[ESTIMACIÓN VOLUNTARIA — no oficial, no sustituye COA SEMARNAT ni obligaciones de reporte federal]"
)

MSG_GRAN_GENERADOR = (
    "Tu volumen estimado podría sujetarte a obligaciones COA SEMARNAT. "
    "Consulta a un especialista en residuos de manejo especial."
)


class GiroScian(BaseModel):
    """Catálogo sectorial para cálculo ilustrativo (no constituye inspección ni obligación federal)."""

    giro_codigo: str = Field(..., description="Clasificación sectorial 6 dígitos (SCIAN 2018)")
    sector: str
    subsector: str
    descripcion: str
    factor_generacion_kg_por_unidad: float = Field(
        ...,
        ge=0,
        description="Kg RSU estimados por unidad de producción anual declarada",
    )
    unidad_produccion: str
    composicion_tipica: dict[str, float]
    fuente: str = Field(default="SEMARNAT DBGIR 2020 [ESTIMADO]")

    @field_validator("giro_codigo")
    @classmethod
    def _six_digits(cls, v: str) -> str:
        v = v.strip()
        if len(v) != 6 or not v.isdigit():
            raise ValueError("giro_codigo debe ser exactamente 6 dígitos")
        return v

    @field_validator("composicion_tipica")
    @classmethod
    def _comp_sums_one(cls, v: dict[str, float]) -> dict[str, float]:
        s = sum(float(x) for x in v.values())
        if abs(s - 1.0) > 0.02:
            raise ValueError("composicion_tipica debe sumar 1.0")
        return v


class DeclaracionGeneracionRSUCreate(BaseModel):
    empresa_nombre: str = Field(..., min_length=1)
    rfc: str | None = None
    municipio_id: str = Field(..., min_length=1)
    zm: str = Field(..., min_length=1)
    giro_scian: str = Field(..., description="Código 6 dígitos")
    produccion_anual: float = Field(..., gt=0)
    composicion_materiales: dict[str, float] | None = None
    frecuencia_recoleccion_req: (
        Literal["diaria", "2x_semana", "semanal", "quincenal"] | None
    ) = None
    tiene_plan_manejo: bool = False
    notas: str | None = None

    @field_validator("giro_scian")
    @classmethod
    def _normalize_giro(cls, v: str) -> str:
        v = v.strip()
        if len(v) != 6 or not v.isdigit():
            raise ValueError("giro_scian debe ser 6 dígitos")
        return v


class DeclaracionGeneracionRSU(BaseModel):
    declaracion_id: str
    empresa_nombre: str
    rfc: str | None
    municipio_id: str
    zm: str
    giro_scian: str
    produccion_anual: float
    unidad_produccion: str
    generacion_estimada: dict[str, float]
    generacion_total_ton_anio: float
    frecuencia_recoleccion_req: Literal["diaria", "2x_semana", "semanal", "quincenal"]
    tiene_plan_manejo: bool
    es_posible_gran_generador: bool
    advertencia_gran_generador: str
    fuente_tipo: Literal["declaracion_voluntaria"] = "declaracion_voluntaria"
    disclaimer_voluntaria: str = Field(default=DISCLAIMER_VOLUNTARIA)
    notas: str | None = None
    fecha_declaracion: str
    status: Literal["borrador", "confirmada"]
    sector_catalogo: str = ""
    descripcion_giro: str = ""
