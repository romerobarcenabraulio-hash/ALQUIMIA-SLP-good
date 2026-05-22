"""
Fase 5 — Contratos de Marketplace / Precolocación.

Regla de honestidad (Doctrina §3):
  - Un comprador sin fuente verificada NO puede presentarse como comprador oficial.
  - Un ingreso sin comprador es ingreso_ajustado = 0 o riesgo = "critico".
  - Toda estimación lleva su descuento y advertencia explícita.

Orden de definición:
  Enums (BuyerStatus, FuenteTipoMarket, RiesgoMercado, EstadoColocacion)
  MaterialBuyer
  PlacementAllocation
  PlacementPlan
  MarketSummary
  PlaceRequest
  OpportunityItem
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────────────────────────────

class BuyerStatus(str, Enum):
    verificado             = "verificado"
    estimado               = "estimado"
    manual                 = "manual"
    pendiente_verificacion = "pendiente_verificacion"
    inactivo               = "inactivo"


class FuenteTipoMarket(str, Enum):
    api                    = "api"
    registro_publico       = "registro_publico"
    directorio_empresarial = "directorio_empresarial"
    manual_usuario         = "manual_usuario"
    benchmark              = "benchmark"
    fallback               = "fallback"


class RiesgoMercado(str, Enum):
    bajo    = "bajo"
    medio   = "medio"
    alto    = "alto"
    critico = "critico"


class EstadoColocacion(str, Enum):
    """Estado visual en UI — derivado de pct_colocado y riesgo."""
    colocado               = "colocado"               # 100 % colocado, riesgo <= medio
    parcial                = "parcial"                 # 0 < pct < 100
    sin_mercado            = "sin_mercado"             # 0 % colocado
    requiere_verificacion  = "requiere_verificacion"   # todos benchmark


# ─── MaterialBuyer ────────────────────────────────────────────────────────────

class MaterialBuyer(BaseModel):
    """
    Comprador de un material reciclable.

    Regla: un comprador con fuente_tipo = "benchmark" o "manual_usuario"
    NO puede presentarse como comprador oficial en documentos institucionales.
    El campo 'confianza' y 'status' controlan qué tan defendible es el precio.
    """
    buyer_id:                       str
    nombre:                         str
    material:                       str            # "pet" | "papel" | "aluminio" | ...
    estado:                         str            # estado de la república
    municipio:                      Optional[str]  # None = opera a nivel nacional/regional
    tipo_comprador:                 str            # "reciclador" | "industria" | "compostador" | ...
    capacidad_ton_anio:             float          # capacidad total declarada t/año
    capacidad_disponible_ton_anio:  float          # porción que puede absorber (≤ capacidad_ton_anio)
    precio_min_mxn_kg:              float          # precio mínimo MXN/kg
    precio_max_mxn_kg:              float          # precio máximo MXN/kg
    calidad_requerida:              str            # "basica" | "estandar" | "alta"
    distancia_km:                   Optional[float] = None
    lat:                            Optional[float] = None   # EPSG:4326
    lon:                            Optional[float] = None   # EPSG:4326
    zm_simulator_id:                Optional[str] = None     # SLP | MTY | QRO | GDL
    fuente:                         str            # descripción textual de la fuente
    fuente_tipo:                    FuenteTipoMarket
    confianza:                      float = Field(ge=0.0, le=1.0)
    status:                         BuyerStatus
    last_verified_at:               Optional[str] = None  # ISO-8601 o None

    def precio_medio_mxn_kg(self) -> float:
        return (self.precio_min_mxn_kg + self.precio_max_mxn_kg) / 2.0

    def es_oficial(self) -> bool:
        """Un comprador es oficial solo si está verificado con fuente pública."""
        return (
            self.status == BuyerStatus.verificado
            and self.fuente_tipo in (
                FuenteTipoMarket.registro_publico,
                FuenteTipoMarket.api,
                FuenteTipoMarket.directorio_empresarial,
            )
        )


# ─── PlacementAllocation ──────────────────────────────────────────────────────

class PlacementAllocation(BaseModel):
    """Asignación de volumen a un comprador específico."""
    buyer_id:                str
    nombre_comprador:        str
    material:                str
    volumen_asignado_ton_anio: float
    precio_mxn_kg:           float          # precio negociado (promedio del rango)
    ingreso_estimado_mxn:    float          # volumen_asignado × precio × 1000
    calidad_requerida:       str
    fuente_tipo:             FuenteTipoMarket
    confianza:               float
    riesgo:                  RiesgoMercado


# ─── PlacementPlan ────────────────────────────────────────────────────────────

class PlacementPlan(BaseModel):
    """
    Plan de colocación para un material en una ZM.

    Regla de causalidad:
      volumen_ton_anio → colocado_ton_anio + faltante_ton_anio
      ingreso_potencial_mxn = volumen × precio_promedio × 1000
      ingreso_ajustado_mxn  = ingreso_potencial × (1 − descuento_riesgo)
      Si faltante > 0, ingreso_ajustado < ingreso_potencial.
      Si sin compradores, ingreso_ajustado = 0.
    """
    zm:                      str
    municipios:              List[str]
    material:                str
    volumen_ton_anio:        float          # volumen capturable del año 1
    colocado_ton_anio:       float          # volumen efectivamente asignado
    faltante_ton_anio:       float          # volumen sin comprador
    pct_colocado:            float          # 0–100
    precio_promedio_mxn_kg:  float          # precio ponderado de las asignaciones
    ingreso_potencial_mxn:   float          # sin descuento de riesgo
    ingreso_ajustado_mxn:    float          # con descuento de riesgo aplicado
    descuento_aplicado_pct:  float          # % de descuento total aplicado (0–100)
    riesgo_mercado:          RiesgoMercado
    estado_colocacion:       EstadoColocacion
    allocations:             List[PlacementAllocation] = Field(default_factory=list)
    compradores_considerados: int = 0
    advertencias:            List[str] = Field(default_factory=list)
    provenance:              Dict[str, Any] = Field(default_factory=dict)


# ─── MarketSummary ────────────────────────────────────────────────────────────

class MarketSummary(BaseModel):
    """
    Resumen de colocación para todos los materiales de una ZM.

    Este es el objeto que viaja a AGORA via ScenarioBundle.inputs_usuario["market_summary"].
    No puede inventar compradores. Si un material no tiene comprador, queda en
    total_faltante_ton_anio y el descuento_por_riesgo_mxn sube.
    """
    zm:                       str
    total_volumen_ton_anio:   float
    total_colocado_ton_anio:  float
    total_faltante_ton_anio:  float
    pct_colocado_global:      float           # 0–100
    ingresos_potenciales_mxn: float
    ingresos_ajustados_mxn:   float
    descuento_por_riesgo_mxn: float
    planes_por_material:      Dict[str, PlacementPlan]
    warnings:                 List[str] = Field(default_factory=list)

    def tiene_riesgo_critico(self) -> bool:
        return any(
            p.riesgo_mercado == RiesgoMercado.critico
            for p in self.planes_por_material.values()
        )

    def materiales_sin_mercado(self) -> List[str]:
        return [
            mat for mat, plan in self.planes_por_material.items()
            if plan.pct_colocado == 0
        ]


# ─── PlaceRequest ─────────────────────────────────────────────────────────────

class PlaceRequest(BaseModel):
    """Body de POST /market/place."""
    zm:                 str
    municipios:         List[str] = Field(default_factory=list)
    volumes_ton_anio:   Dict[str, float]   # {"pet": 1200.0, "papel": 800.0, ...}


# ─── OpportunityItem ──────────────────────────────────────────────────────────

class OpportunityItem(BaseModel):
    """Elemento de GET /market/opportunities/{zm}."""
    material:              str
    volumen_ton_anio:      float
    pct_colocado:          float
    ingreso_ajustado_mxn:  float
    riesgo:                RiesgoMercado
    estado_colocacion:     EstadoColocacion
    recomendacion:         str
    compradores_activos:   int
