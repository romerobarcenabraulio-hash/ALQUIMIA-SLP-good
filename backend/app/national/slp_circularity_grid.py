"""
Grilla geoestadística *proxy* para mapa de circularidad (Q-025).

Navigator / producto:
- Polígonos NO son AGEB INEGI hasta ingestión del Marco Geoestadístico oficial.
- Coordenadas EPSG:4326 (almacén/intercambio). Cualquier métrica de superficie futura → EPSG:6369 (SLP).
- Claves `cve_geoestadistica_proxy` son determinísticas para UX; no usar como verdad censal.
"""

from __future__ import annotations

import hashlib
import math
from typing import Any, Dict, List, Tuple

from app.legal.repository import MUNICIPIO_NOMBRES
from app.national.rsu_demographics_seed import demo_tuple

# BBOX aproximados (WGS84) para rejilla demo por municipio ZM SLP — sustituir por AGEB MGN.
_BBOX_MUN_SLP: Dict[str, Tuple[float, float, float, float]] = {
    # min_lat, min_lng, max_lat, max_lng
    "slp": (22.048, -101.085, 22.272, -100.798),
    "sol": (22.118, -101.015, 22.292, -100.798),
    "csp": (21.958, -100.958, 22.078, -100.752),
    "vip": (22.118, -100.928, 22.248, -100.795),
}

# Filas × columnas por municipio ( densidad visual educativa )
_GRID_DIMS: Dict[str, Tuple[int, int]] = {
    "slp": (7, 8),
    "sol": (6, 7),
    "csp": (3, 3),
    "vip": (4, 5),
}

# Prefijo estado + clave municipal geoestadística (referencia INEGI usada solo como etiqueta; semillas CVE debt aplican).
_CLAVE_MUN_LABEL: Dict[str, str] = {
    "slp": "24028",
    "sol": "24027",
    "csp": "24007",
    # Sector modelo catálogo ALQUIMIA; CVE municipal oficial pendiente Navigator/deuda catálogo.
    "vip": "24998",
}


def _pct_pair(proxy_key: str) -> Tuple[float, float]:
    h = hashlib.sha256(proxy_key.encode()).hexdigest()
    h0 = int(h[:8], 16)
    h1 = int(h[8:16], 16)
    actual = 22.0 + (h0 % 5200) / 200.0  # ~22–48
    bump = 6.0 + (h1 % 1800) / 100.0  # ~6–24
    projected = min(94.0, actual + bump)
    return round(actual, 2), round(projected, 2)


def _cell_polygon(
    min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> Dict[str, Any]:
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [min_lng, min_lat],
                [max_lng, min_lat],
                [max_lng, max_lat],
                [min_lng, max_lat],
                [min_lng, min_lat],
            ]
        ],
    }


def build_slp_zm_circularity_grid_features(
    zm_municipios: List[str],
) -> List[Dict[str, Any]]:
    """Genera FeatureCollection-friendly list para Mapbox (features con Polygon + properties)."""
    features: List[Dict[str, Any]] = []
    cell_global = 0
    for mun in zm_municipios:
        mid = mun.lower()
        bbox = _BBOX_MUN_SLP.get(mid)
        dims = _GRID_DIMS.get(mid)
        if bbox is None or dims is None:
            continue
        min_lat, min_lng, max_lat, max_lng = bbox
        rows, cols = dims
        lat_step = (max_lat - min_lat) / rows
        lng_step = (max_lng - min_lng) / cols
        clave_mun = _CLAVE_MUN_LABEL.get(mid, "24999")
        nombre = MUNICIPIO_NOMBRES.get(mid, mid.upper())
        demo = demo_tuple(mid)

        for ri in range(rows):
            for ci in range(cols):
                c_min_lat = min_lat + ri * lat_step
                c_max_lat = c_min_lat + lat_step
                c_min_lng = min_lng + ci * lng_step
                c_max_lng = c_min_lng + lng_step
                proxy_cve = f"24{clave_mun}PROXY{cell_global:04d}"
                cell_global += 1
                actual, projected = _pct_pair(proxy_cve)
                props: Dict[str, Any] = {
                    "cve_geoestadistica_proxy": proxy_cve,
                    "municipio_id": mid,
                    "nombre_municipio": nombre,
                    "zm_id": "SLP",
                    "jurisdiction_scope": "MetropolitanZone",
                    "circularity_actual_pct": actual,
                    "circularity_projected_pct": projected,
                    "circularity_delta_pct": round(projected - actual, 2),
                    "poblacion_municipio_aprox": demo[0] if demo else None,
                }
                features.append(
                    {
                        "type": "Feature",
                        "geometry": _cell_polygon(c_min_lat, c_min_lng, c_max_lat, c_max_lng),
                        "properties": props,
                    }
                )
    return features


def feature_centroid_lat_lng(feature: Dict[str, Any]) -> Tuple[float, float]:
    """Centroide simple del primer anillo (grilla rectangular)."""
    coords = feature["geometry"]["coordinates"][0]
    lats = [p[1] for p in coords[:-1]]
    lngs = [p[0] for p in coords[:-1]]
    return sum(lats) / len(lats), sum(lngs) / len(lngs)


def sort_features_nearest_city(features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Orden estable para tests: por ángulo desde centro ZM (~22.15, -100.95)."""
    cx, cy = 22.15, -100.95

    def key(f: Dict[str, Any]) -> Tuple[float, float]:
        lat, lng = feature_centroid_lat_lng(f)
        ang = math.atan2(lat - cx, lng - cy)
        return (ang, f["properties"]["cve_geoestadistica_proxy"])

    return sorted(features, key=key)
