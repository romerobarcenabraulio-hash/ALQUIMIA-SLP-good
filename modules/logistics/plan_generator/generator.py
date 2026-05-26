"""Generador de plan diario de rutas residenciales por colonia (Fase 0-1)."""
from __future__ import annotations

import math
from datetime import date
from typing import Callable, Sequence

from modules.logistics.schemas import DailyRoutePlan, RouteLeg, RouteStop

DEFAULT_COLONIAS: dict[str, list[str]] = {
    "slp": ["Centro", "Tangamanga", "Industrial Aviacion"],
    "sol": ["Centro Soledad", "San Felipe", "Hogares Ferrocarrileros"],
    "qro": ["Centro Historico", "Juriquilla", "Epigmenio Gonzalez"],
}

COLONIA_CENTROIDS: dict[str, tuple[float, float]] = {
    "Centro": (22.1499, -100.9792),
    "Tangamanga": (22.1345, -101.0210),
    "Industrial Aviacion": (22.1680, -100.9520),
    "Centro Soledad": (22.1875, -100.9360),
    "San Felipe": (22.1520, -100.9080),
    "Hogares Ferrocarrileros": (22.1750, -100.9250),
    "Centro Historico": (20.5888, -100.3899),
    "Juriquilla": (20.7230, -100.4500),
    "Epigmenio Gonzalez": (20.6150, -100.4200),
}

RouteComputeFn = Callable[[float, float, float, float], dict]


def _resolve_depot(municipio_id: str, zm_id: str | None) -> tuple[str, float, float]:
    try:
        from app.logistics.depot_resolver import resolve_depot_for_municipio

        depot = resolve_depot_for_municipio(municipio_id, zm=zm_id)
        label = depot.get("label") or f"Centro de acopio {municipio_id.upper()}"
        lat = float(depot.get("lat") or 22.15)
        lon = float(depot.get("lon") or -100.98)
        return label, lat, lon
    except Exception:
        return f"Centro de acopio {municipio_id.upper()}", 22.15, -100.98


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 2)


def _estimate_duration_min(distance_km: float, urban_factor: float = 2.2) -> float:
    speed = 25.0 / urban_factor
    return round(max(5.0, (distance_km / speed) * 60), 1)


def _resolve_coords(colonia: str) -> tuple[float, float]:
    return COLONIA_CENTROIDS.get(colonia, (22.15, -100.98))


def generate_daily_plan(
    municipio_id: str,
    *,
    colonias: Sequence[str] | None = None,
    zm_id: str | None = None,
    fecha: date | None = None,
    route_compute: RouteComputeFn | None = None,
) -> DailyRoutePlan:
    plan_date = fecha or date.today()
    stops_names = list(colonias or DEFAULT_COLONIAS.get(municipio_id, ["Centro"]))
    depot, depot_lat, depot_lon = _resolve_depot(municipio_id, zm_id)
    depot_coords = (depot_lat, depot_lon)

    stops: list[RouteStop] = []
    for idx, colonia in enumerate(stops_names):
        lat, lon = _resolve_coords(colonia)
        stops.append(
            RouteStop(
                colonia=colonia,
                municipio_id=municipio_id,
                tipo_vivienda="vertical" if idx == 0 else "casa",
                viviendas_estimadas=120 if idx == 0 else 80,
                min_servicio=18.0 if idx == 0 else 12.0,
                lat=lat,
                lon=lon,
            )
        )

    legs: list[RouteLeg] = []
    km_total = 0.0
    min_total = 0.0
    google_used = False
    advertencias: list[str] = []

    path: list[tuple[str, float, float]] = [(depot, *depot_coords)]
    for s in stops:
        path.append((s.colonia, s.lat or 0.0, s.lon or 0.0))
    path.append((depot, *depot_coords))

    for i in range(len(path) - 1):
        from_label, lat_o, lon_o = path[i]
        to_label, lat_d, lon_d = path[i + 1]
        dist_km: float
        dur_min: float
        polyline: str | None = None

        if route_compute is not None:
            try:
                result = route_compute(lat_o, lon_o, lat_d, lon_d)
                dist_km = float(result.get("distance_km") or _haversine_km(lat_o, lon_o, lat_d, lon_d))
                dur_min = float(result.get("duration_min") or _estimate_duration_min(dist_km))
                polyline = result.get("encoded_polyline")
                google_used = True
            except Exception as exc:  # noqa: BLE001
                advertencias.append(f"Google Routes falló {from_label}→{to_label}: {exc}")
                dist_km = _haversine_km(lat_o, lon_o, lat_d, lon_d) * 1.35
                dur_min = _estimate_duration_min(dist_km)
        else:
            dist_km = _haversine_km(lat_o, lon_o, lat_d, lon_d) * 1.35
            dur_min = _estimate_duration_min(dist_km)

        legs.append(
            RouteLeg(
                from_label=from_label,
                to_label=to_label,
                distance_km=dist_km,
                duration_min=dur_min,
                encoded_polyline=polyline,
            )
        )
        km_total += dist_km
        min_total += dur_min

    for s in stops:
        min_total += s.min_servicio

    fuente = "google_routes" if google_used else "heuristic_territorial"
    if not stops:
        advertencias.append("Sin colonias en plan — tonelaje y KPI en cero.")

    return DailyRoutePlan(
        municipio_id=municipio_id,
        zm_id=zm_id,
        fecha=plan_date,
        depot_label=depot,
        stops=stops,
        legs=legs,
        km_totales=round(km_total, 2),
        duracion_min_totales=round(min_total, 1),
        fuente=fuente,
        google_available=google_used,
        advertencias=advertencias,
    )
