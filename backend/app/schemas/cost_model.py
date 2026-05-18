"""
Modelos de costo trazables para el motor financiero de ALQUIMIA (Wave 0).

Filosofia: cada numero tiene fuente. El sistema siempre precarga un valor;
el humano puede corregirlo con su realidad local; el sistema sabe cual es cual.
"""
from __future__ import annotations

import hashlib
import json
from datetime import date
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, computed_field


class NegotiationScheme(str, Enum):
    """Esquema de distribucion de CAPEX/OPEX entre actores."""

    municipal_directo = "municipal_directo"
    concesion_total = "concesion_total"
    mixto_condominio = "mixto_condominio"


class CostSourceType(str, Enum):
    """Clasificacion de confianza del dato de costo."""

    estimado_mercado = "estimado_mercado"    # Investigador encontro precio en web
    supuesto_editable = "supuesto_editable"  # Benchmark regional, sin dato local
    dato_usuario = "dato_usuario"            # Humano corrigio el precargado
    fuente_verificada = "fuente_verificada"  # Cotizacion/contrato subido por usuario
    pendiente_fuente = "pendiente_fuente"    # Sin dato alguno


class CostLineItem(BaseModel):
    """
    Una linea de costo (CAPEX u OPEX) con valor precargado + override humano opcional.

    monto_efectivo = monto_usuario si el humano lo corrigio, sino monto_precargado.
    Guardar ambos permite auditar el delta entre mercado y realidad local.
    """

    concepto: str = Field(..., description="Identificador legible, ej: 'terreno_CA_P'")
    cantidad: float = Field(1.0, ge=0, description="Cuantas unidades (m2, vehiculos, etc.)")
    unidad: str = Field("ud", description="Unidad de medida: m2, vehiculo, persona-mes, ...")
    precio_unitario_mxn: float = Field(..., ge=0, description="Precio por unidad en MXN")
    monto_precargado: float = Field(..., ge=0, description="cantidad * precio_unitario (precargado)")
    monto_usuario: Optional[float] = Field(
        None, ge=0,
        description="Si no es None, este valor reemplaza monto_precargado como monto efectivo"
    )
    fuente_precarga: str = Field(..., description="Origen del precargado: fuente o benchmark")
    fuente_usuario: Optional[str] = Field(None, description="Cotizacion, contrato, etc.")
    clasificacion: CostSourceType = CostSourceType.supuesto_editable
    actor_responsable: str = Field("municipio", description="municipio | concesionario | compartido")
    periodicidad: str = Field("unico", description="unico (CAPEX) | mensual | anual (OPEX)")
    fecha_obtencion: date = Field(default_factory=date.today)
    caducidad_dias: int = Field(90, description="Dias antes de marcar como expirado")
    notas: str = ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def monto_efectivo(self) -> float:
        """Valor que el motor usa: usuario tiene prioridad sobre precargado."""
        if self.monto_usuario is not None:
            return float(self.monto_usuario)
        return float(self.monto_precargado)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def tiene_override_usuario(self) -> bool:
        return self.monto_usuario is not None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def delta_vs_mercado(self) -> Optional[float]:
        """Diferencia entre dato_usuario y precargado. None si no hay override."""
        if self.monto_usuario is None:
            return None
        return self.monto_usuario - self.monto_precargado


class CostModelSummary(BaseModel):
    """
    Resumen del CostModel para incluir en SimulateResponse.
    Desglosa totales por actor y esquema de negociacion.
    """

    zm_activa: str
    negociacion: NegotiationScheme
    items: List[CostLineItem]

    # Totales calculados segun esquema
    total_capex_municipio: float
    total_capex_concesionario: float
    total_opex_mensual_municipio: float
    total_opex_mensual_concesionario: float

    # Metricas de calidad del modelo de datos
    items_precargados: int
    items_editados_usuario: int
    items_verificados: int
    items_pendientes: int
    confianza_costos: float = Field(ge=0.0, le=1.0, description="0-1, sube con dato_usuario y verificado")

    # Inflación real usada para escalar OPEX anualmente
    inflacion_anual_pct: float = Field(
        default=4.0,
        description="Tasa de inflación anual usada para escalar OPEX. "
                    "Fuente: Banxico SIE SP68257 (oficial con token) o snapshot offline.",
    )
    inflacion_fuente: str = Field(
        default="snapshot_offline",
        description="Origen del dato de inflación: 'banxico_oficial', 'banxico_estimado', 'snapshot_offline'",
    )

    # TIR por perspectiva
    tir_municipio: Optional[float] = None
    tir_concesionario: Optional[float] = None


class FinancialRunManifest(BaseModel):
    """
    Huella determinista de cada corrida del motor financiero.
    Garantiza unicidad espacio-tiempo: mismo input -> mismo hash.
    """

    version: str = "cost_model_v1"
    negociacion: NegotiationScheme
    zm_activa: str
    inputs_canonical_json: str = Field(..., description="JSON canonico de los inputs relevantes")
    inputs_sha256: str = Field(..., description="SHA-256 del JSON canonico")
    nota_negociacion: str = ""


# ─── Helpers ─────────────────────────────────────────────────────────────────

def canonical_json(obj: Any) -> str:
    """JSON canonico para hashing determinista."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def build_manifest(
    negociacion: NegotiationScheme,
    zm_activa: str,
    cost_items: List[CostLineItem],
    scenario_extras: Optional[Dict[str, Any]] = None,
) -> FinancialRunManifest:
    """Construye el manifest con hash a partir de los inputs del run."""
    payload: Dict[str, Any] = {
        "negociacion": negociacion.value,
        "zm_activa": zm_activa,
        "items": [
            {
                "concepto": i.concepto,
                "monto_efectivo": round(i.monto_efectivo, 2),
                "actor": i.actor_responsable,
                "periodicidad": i.periodicidad,
                "clasificacion": i.clasificacion.value,
            }
            for i in cost_items
        ],
    }
    if scenario_extras:
        payload["scenario"] = scenario_extras

    cj = canonical_json(payload)
    return FinancialRunManifest(
        negociacion=negociacion,
        zm_activa=zm_activa,
        inputs_canonical_json=cj,
        inputs_sha256=sha256_hex(cj),
        nota_negociacion={
            NegotiationScheme.municipal_directo: "Municipio invierte y opera 100%",
            NegotiationScheme.concesion_total: "Concesionario invierte y opera; municipio recibe canon",
            NegotiationScheme.mixto_condominio: "Municipio aporta terreno/permisos; concesionario infra/operacion",
        }.get(negociacion, ""),
    )
