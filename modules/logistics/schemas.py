"""Contratos compartidos HERMES — plan, peso, KPI, daily_summary."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Literal


Semaforo = Literal["VERDE", "AMARILLO", "ROJO"]


@dataclass
class RouteStop:
    colonia: str
    municipio_id: str
    tipo_vivienda: Literal["vertical", "casa"] = "casa"
    viviendas_estimadas: int = 0
    min_servicio: float = 15.0
    lat: float | None = None
    lon: float | None = None


@dataclass
class RouteLeg:
    from_label: str
    to_label: str
    distance_km: float
    duration_min: float
    encoded_polyline: str | None = None


@dataclass
class DailyRoutePlan:
    municipio_id: str
    zm_id: str | None
    fecha: date
    depot_label: str
    stops: list[RouteStop]
    legs: list[RouteLeg] = field(default_factory=list)
    km_totales: float = 0.0
    duracion_min_totales: float = 0.0
    fuente: str = "heuristic_territorial"
    google_available: bool = False
    advertencias: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "municipio_id": self.municipio_id,
            "zm_id": self.zm_id,
            "fecha": self.fecha.isoformat(),
            "depot_label": self.depot_label,
            "stops": [
                {
                    "colonia": s.colonia,
                    "municipio_id": s.municipio_id,
                    "tipo_vivienda": s.tipo_vivienda,
                    "viviendas_estimadas": s.viviendas_estimadas,
                    "min_servicio": s.min_servicio,
                    "lat": s.lat,
                    "lon": s.lon,
                }
                for s in self.stops
            ],
            "legs": [
                {
                    "from_label": l.from_label,
                    "to_label": l.to_label,
                    "distance_km": l.distance_km,
                    "duration_min": l.duration_min,
                    "encoded_polyline": l.encoded_polyline,
                }
                for l in self.legs
            ],
            "km_totales": self.km_totales,
            "duracion_min_totales": self.duracion_min_totales,
            "fuente": self.fuente,
            "google_available": self.google_available,
            "advertencias": self.advertencias,
        }


@dataclass
class WeightEvent:
    municipio_id: str
    fecha: date
    fraccion: str
    toneladas: float
    pureza_pct: float | None = None
    source: str = "synthetic_phase_0_1"
    recorded_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "municipio_id": self.municipio_id,
            "fecha": self.fecha.isoformat(),
            "fraccion": self.fraccion,
            "toneladas": self.toneladas,
            "pureza_pct": self.pureza_pct,
            "source": self.source,
            "recorded_at": self.recorded_at.isoformat(),
        }


@dataclass
class DailySummary:
    date: str
    municipio_id: str
    zm_id: str | None
    tonelaje_por_fraccion: dict[str, float]
    costo_logistico_mxn: float
    km_totales: float
    emisiones_co2e_kg: float
    pureza_promedio: dict[str, float]
    semaforo: Semaforo
    incidentes: list[str]
    meta_tonelaje_dia: float
    utilizacion_flota_pct: float
    on_time_arrivals_pct: float
    merma_logistica_pct: float
    fuente: str = "hermes_kpi_calculator"
    fase_producto: str = "0-1"

    def to_event_payload(self) -> dict[str, Any]:
        return {
            "date": self.date,
            "municipio_id": self.municipio_id,
            "zm_id": self.zm_id,
            "tonelaje_por_fraccion": self.tonelaje_por_fraccion,
            "costo_logistico": self.costo_logistico_mxn,
            "km_totales": self.km_totales,
            "emisiones_co2e": self.emisiones_co2e_kg,
            "pureza_promedio": self.pureza_promedio,
            "semaforo": self.semaforo,
            "incidentes": self.incidentes,
            "meta_tonelaje_dia": self.meta_tonelaje_dia,
            "utilizacion_flota_pct": self.utilizacion_flota_pct,
            "on_time_arrivals_pct": self.on_time_arrivals_pct,
            "merma_logistica_pct": self.merma_logistica_pct,
            "fuente": self.fuente,
            "fase_producto": self.fase_producto,
            "topic": "alquimia/events/logistics/daily_summary",
        }
