"""Contratos AURUM — costos, indicadores, eventos AC."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, Literal


Semaforo = Literal["VERDE", "AMARILLO", "ROJO"]
CostCategory = Literal["CAPEX", "OPEX", "NO_CALIDAD"]
Periodicidad = Literal["unico", "mensual", "quincenal", "diario", "por_evento"]


def _d(value: str | int | float | Decimal) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


@dataclass(frozen=True)
class CostLine:
    concepto: str
    categoria: CostCategory
    monto_mxn: Decimal
    unidad: str = "ud"
    cantidad: Decimal = Decimal("1")
    periodicidad: Periodicidad = "unico"
    actor_responsable: str = "municipio"
    fuente: str = "aurum_baseline"
    componente: str | None = None
    notas: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "concepto": self.concepto,
            "categoria": self.categoria,
            "monto_mxn": str(self.monto_mxn),
            "unidad": self.unidad,
            "cantidad": str(self.cantidad),
            "periodicidad": self.periodicidad,
            "actor_responsable": self.actor_responsable,
            "fuente": self.fuente,
            "componente": self.componente,
            "notas": self.notas,
        }


@dataclass(frozen=True)
class NonQualityCosts:
    merma_logistica: Decimal
    rechazo_contaminacion: Decimal
    tiempo_muerto_flota: Decimal
    costo_relleno_evitable: Decimal

    @property
    def total(self) -> Decimal:
        return (
            self.merma_logistica
            + self.rechazo_contaminacion
            + self.tiempo_muerto_flota
            + self.costo_relleno_evitable
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "merma_logistica": str(self.merma_logistica),
            "rechazo_contaminacion": str(self.rechazo_contaminacion),
            "tiempo_muerto_flota": str(self.tiempo_muerto_flota),
            "costo_relleno_evitable": str(self.costo_relleno_evitable),
            "total": str(self.total),
        }


@dataclass(frozen=True)
class CostStructure:
    capex_lines: tuple[CostLine, ...]
    opex_lines: tuple[CostLine, ...]
    no_calidad: NonQualityCosts
    municipio_id: str
    fecha: date
    supuesto_base: str

    @property
    def capex_total(self) -> Decimal:
        return sum((line.monto_mxn for line in self.capex_lines), Decimal("0"))

    @property
    def opex_mensual_total(self) -> Decimal:
        return sum((line.monto_mxn for line in self.opex_lines), Decimal("0"))

    def to_dict(self) -> dict[str, Any]:
        return {
            "municipio_id": self.municipio_id,
            "fecha": self.fecha.isoformat(),
            "supuesto_base": self.supuesto_base,
            "capex_total_mxn": str(self.capex_total),
            "opex_mensual_total_mxn": str(self.opex_mensual_total),
            "capex_lines": [line.to_dict() for line in self.capex_lines],
            "opex_lines": [line.to_dict() for line in self.opex_lines],
            "no_calidad": self.no_calidad.to_dict(),
        }


@dataclass(frozen=True)
class HermesDailyFeed:
    date: str
    municipio_id: str
    costo_logistico: Decimal
    km_totales: Decimal
    tonelaje_total: Decimal
    merma_logistica_pct: Decimal
    fuente: str
    incidentes: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "date": self.date,
            "municipio_id": self.municipio_id,
            "costo_logistico": str(self.costo_logistico),
            "km_totales": str(self.km_totales),
            "tonelaje_total": str(self.tonelaje_total),
            "merma_logistica_pct": str(self.merma_logistica_pct),
            "fuente": self.fuente,
            "incidentes": list(self.incidentes),
        }


@dataclass(frozen=True)
class EfficiencyIndicators:
    costo_por_tonelada: Decimal
    costo_por_vivienda: Decimal
    payback_simple_anios: Decimal
    costo_no_calidad_pct: Decimal
    semaforo_costo_ton: Semaforo
    alerta_roja_no_calidad: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "costo_por_tonelada_mxn": str(self.costo_por_tonelada),
            "costo_por_vivienda_mxn": str(self.costo_por_vivienda),
            "payback_simple_anios": str(self.payback_simple_anios),
            "costo_no_calidad_pct": str(self.costo_no_calidad_pct),
            "semaforo_costo_ton": self.semaforo_costo_ton,
            "alerta_roja_no_calidad": self.alerta_roja_no_calidad,
        }


@dataclass(frozen=True)
class AcUpdatePayload:
    """Evento alquimia/events/planning/ac_update → KRONOS."""
    fecha: str
    municipio_id: str
    ac_total_mxn: Decimal
    ac_por_categoria: dict[str, Decimal]
    fuente: str
    hermes_dias_consumidos: int
    supuesto_base: str
    indicadores: EfficiencyIndicators

    def to_event_payload(self) -> dict[str, Any]:
        return {
            "fecha": self.fecha,
            "municipio_id": self.municipio_id,
            "ac_total_mxn": str(self.ac_total_mxn),
            "ac_por_categoria": {k: str(v) for k, v in self.ac_por_categoria.items()},
            "fuente": self.fuente,
            "hermes_dias_consumidos": self.hermes_dias_consumidos,
            "supuesto_base": self.supuesto_base,
            "indicadores": self.indicadores.to_dict(),
            "topic": "alquimia/events/planning/ac_update",
        }
