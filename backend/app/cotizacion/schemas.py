"""
Contratos Pydantic para el módulo de Cotizaciones Municipales.

POST /api/v1/cotizaciones/            → guardar cotización generada en frontend
GET  /api/v1/cotizaciones/{municipio_id}        → última cotización del municipio
GET  /api/v1/cotizaciones/{municipio_id}/history → historial de versiones
PUT  /api/v1/cotizaciones/{id}/notas  → añadir notas (agente/consultor)
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Submodelos ────────────────────────────────────────────────────────────────

class MixCAsSchema(BaseModel):
    P: int = 0
    M: int = 0
    G: int = 0


class RecicladoraSchema(BaseModel):
    giro: str
    nombre: str
    justificacion: str
    capex_mxn: float
    opex_mes_mxn: float
    tir_pct: float
    payback_meses: int
    empleos: int


class ResumenFinancieroSchema(BaseModel):
    capex_total_mxn: float
    opex_mes_mxn: float
    ebitda_mes_mxn: float
    empleos_directos: int
    co2e_anual_ton: float
    tir_estimada_pct: float
    payback_meses: int


class JustificacionSchema(BaseModel):
    texto_ejecutivo: str
    factores_favorables: list[str]
    restricciones: list[str]
    supuestos_clave: list[str]


# ── Request ───────────────────────────────────────────────────────────────────

class CotizacionCreateRequest(BaseModel):
    """
    Payload enviado desde el frontend al guardar una cotización.
    Coincide exactamente con CotizacionRecomendada de recommendationEngine.ts.
    """
    id: str = Field(description="UUID generado en el cliente (idempotency key)")
    version: int = Field(default=1, ge=1)
    generado_por: str = Field(default="sistema")  # sistema | agente | consultor

    municipio_id: str
    municipio_nombre: str
    zm: str
    poblacion: float
    generacion_rsu_ton_dia: float
    pct_captura_meta: float
    ton_captura_meta: float
    horizonte_anos: int
    precios_json: dict

    fase_recomendada: int
    fase_nombre: str
    mix_cas: MixCAsSchema
    capacidad_ton_dia: float
    cobertura_meta_pct: float
    recicladoras: list[RecicladoraSchema] = Field(default_factory=list)

    resumen: ResumenFinancieroSchema
    score_viabilidad: int = Field(ge=0, le=100)
    clasificacion_viabilidad: str  # viable | condicionada | requiere_subsidio

    justificacion: JustificacionSchema
    resultado_completo_json: Optional[dict] = None
    notas: Optional[str] = None


# ── Response ──────────────────────────────────────────────────────────────────

class CotizacionResponse(BaseModel):
    id: str
    municipio_id: str
    municipio_nombre: str
    zm: str
    version: int
    generado_por: str
    generado_en: datetime

    poblacion: float
    generacion_rsu_ton_dia: float
    pct_captura_meta: float
    ton_captura_meta: float
    horizonte_anos: int

    fase_recomendada: int
    fase_nombre: str
    mix_cas: MixCAsSchema
    capacidad_ton_dia: float
    cobertura_meta_pct: float
    recicladoras: list[RecicladoraSchema]

    capex_total_mxn: float
    opex_mes_mxn: float
    ebitda_mes_mxn: float
    empleos_directos: int
    co2e_anual_ton: float
    tir_estimada_pct: float
    payback_meses: int

    score_viabilidad: int
    clasificacion_viabilidad: str
    justificacion: JustificacionSchema

    notas: Optional[str] = None

    model_config = {"from_attributes": True}


class CotizacionHistorialResponse(BaseModel):
    municipio_id: str
    total_versiones: int
    versiones: list[CotizacionResponse]


class NotasUpdateRequest(BaseModel):
    notas: str = Field(max_length=4000)
