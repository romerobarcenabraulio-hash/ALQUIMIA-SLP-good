"""Esquemas BIOS — LCA, activos y ciclo financiero."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class LcaFactor(BaseModel):
    fraccion: str
    co2e_evitado_ton: float = Field(..., description="t CO2e evitadas por tonelada de material")
    fuente: str
    referencia: str
    anio_referencia: int
    unidad: str = "tCO2e/t"
    notas: str | None = None


class LcaFactorsCatalog(BaseModel):
    version: str = "1.0"
    actualizado: str
    agente: str = "BIOS"
    metodologia: str = "ISO 14040/14044 — impacto evitado vs. producción virgen"
    factores: list[LcaFactor]


class Co2eByFraction(BaseModel):
    fraccion: str
    toneladas: float
    co2e_ton: float
    factor_aplicado: float
    fuente_factor: str


class Co2eReport(BaseModel):
    periodo: str
    generado_en: str
    fuente_tonelaje: str
    tonelaje_total: float
    co2e_total_ton: float
    por_fraccion: list[Co2eByFraction]
    hermes_disponible: bool
    notas: list[str] = Field(default_factory=list)


class AssetRecord(BaseModel):
    asset_id: str
    categoria: str
    nombre: str
    fecha_adquisicion: date | None = None
    vida_util_anios: float
    rul_estimada_anios: float | None = None
    estado: str = "activo"
    costo_capex_mxn: float | None = None
    notas: str | None = None


class AssetInventory(BaseModel):
    version: str = "1.0"
    actualizado: str
    referencia_vida_util: dict[str, float]
    assets: list[AssetRecord] = Field(default_factory=list)


class FinancialLifecycleResult(BaseModel):
    modelo: str = "Modelo_BASED.xlsx"
    horizonte_anios: int = 10
    wacc_pct: float
    supuestos: dict[str, Any]
    vpn_mxn: float
    tir_pct: float
    payback_meses: float
    payback_descontado_meses: float
    valor_terminal_mxn: float
    vpn_con_terminal_mxn: float
    capex_total_mxn: float
    co2e_horizonte_ton: float
    generado_en: str


class SensitivityPoint(BaseModel):
    variable: str
    base: float
    delta_pct: float
    vpn_mxn: float
    tir_pct: float
    delta_vpn_pct: float


class SensitivityReport(BaseModel):
    generado_en: str
    variables: list[str]
    base_vpn_mxn: float
    base_tir_pct: float
    escenarios: list[SensitivityPoint]
