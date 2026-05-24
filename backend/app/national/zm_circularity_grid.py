"""
Grilla geoestadística *proxy* por ZM para mapa de circularidad (Q-025).

Navigator / producto:
- Polígonos NO son AGEB INEGI hasta ingestión MGN.
- Almacén EPSG:4326; métricas territoriales futuras → EPSG:6369 (ZM MX centro-norte).
- `cve_geoestadistica_proxy` es etiqueta determinística UX, no clave censal.
"""

from __future__ import annotations

import hashlib
import math
from typing import Any, Dict, List, Tuple

from app.implementation.territorial import PROPOSED_COLONIES
from app.legal.repository import MUNICIPIO_NOMBRES
from app.national.catalog import ESTADOS, get_zm
from app.national.rsu_demographics_seed import demo_tuple


def _colonia_label_for_cell(municipio_id: str, cell_index: int) -> str:
    """Etiqueta UX por colonia piloto — no clave censal INEGI."""
    colonias = PROPOSED_COLONIES.get(municipio_id.lower(), [])
    if not colonias:
        return "Colonia piloto por validar"
    return colonias[cell_index % len(colonias)]


def _pct_pair(proxy_key: str) -> Tuple[float, float]:
    h = hashlib.sha256(proxy_key.encode()).hexdigest()
    h0 = int(h[:8], 16)
    h1 = int(h[8:16], 16)
    actual = 22.0 + (h0 % 5200) / 200.0
    bump = 6.0 + (h1 % 1800) / 100.0
    projected = min(94.0, actual + bump)
    return round(actual, 2), round(projected, 2)


def _mun_clave_proxy(estado_id: str, municipio_id: str) -> str:
    """Cinco dígitos determinísticos (no CVE INEGI oficial)."""
    h = int(hashlib.sha256(f"{estado_id}:{municipio_id}".encode()).hexdigest()[:8], 16)
    return f"{10000 + (h % 89999):05d}"


def _grid_dims_for_pop(population: int) -> Tuple[int, int]:
    scale = math.sqrt(max(population, 5_000) / 120_000)
    n = max(2, min(8, int(3 + scale * 6)))
    return n, n


def _bbox_around_centroid(lat0: float, lng0: float, population: int) -> Tuple[float, float, float, float]:
    scale = math.sqrt(max(population, 8_000) / 90_000)
    scale = min(scale, 3.0)
    lat_half = 0.016 + 0.038 * scale
    cos_lat = max(math.cos(math.radians(lat0)), 0.32)
    lng_half = lat_half / cos_lat * 1.06
    return lat0 - lat_half, lng0 - lng_half, lat0 + lat_half, lng0 + lng_half


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


def zm_reference_point(municipios: List[str]) -> Tuple[float, float]:
    pts: List[Tuple[float, float]] = []
    for m in municipios:
        d = demo_tuple(m.lower())
        if d:
            pts.append((d[1], d[2]))
    if not pts:
        return 22.5, -102.0
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def build_zm_circularity_grid_features(zm_id: str, municipios: List[str]) -> List[Dict[str, Any]]:
    """Polígonos proxy por municipio con semilla población/centroide (todas las ZM catálogo)."""
    zm = get_zm(zm_id.upper())
    if zm is None:
        return []
    estado_pr = zm.estado_principal
    ed = ESTADOS.get(estado_pr)
    if ed is None:
        return []
    estado_id = ed.estado_id
    zmu = zm_id.upper()

    features: List[Dict[str, Any]] = []
    cell_global = 0

    for mun in municipios:
        mid = mun.lower()
        demo = demo_tuple(mid)
        if demo is None:
            continue
        pop, lat0, lng0 = demo
        min_lat, min_lng, max_lat, max_lng = _bbox_around_centroid(lat0, lng0, pop)
        rows, cols = _grid_dims_for_pop(pop)
        lat_step = (max_lat - min_lat) / rows
        lng_step = (max_lng - min_lng) / cols
        clave_mun = _mun_clave_proxy(estado_id, mid)
        nombre = MUNICIPIO_NOMBRES.get(mid, mid.upper())

        for ri in range(rows):
            for ci in range(cols):
                c_min_lat = min_lat + ri * lat_step
                c_max_lat = c_min_lat + lat_step
                c_min_lng = min_lng + ci * lng_step
                c_max_lng = c_min_lng + lng_step
                proxy_cve = f"{estado_id}{clave_mun}PROXY{zmu}{cell_global:05d}"
                cell_global += 1
                actual, projected = _pct_pair(proxy_cve)
                props: Dict[str, Any] = {
                    "cve_geoestadistica_proxy": proxy_cve,
                    "municipio_id": mid,
                    "nombre_municipio": nombre,
                    "zm_id": zmu,
                    "jurisdiction_scope": "MetropolitanZone",
                    "circularity_actual_pct": actual,
                    "circularity_projected_pct": projected,
                    "circularity_delta_pct": round(projected - actual, 2),
                    "poblacion_municipio_aprox": pop,
                    "colonia_label": _colonia_label_for_cell(mid, cell_global),
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
    coords = feature["geometry"]["coordinates"][0]
    lats = [p[1] for p in coords[:-1]]
    lngs = [p[0] for p in coords[:-1]]
    return sum(lats) / len(lats), sum(lngs) / len(lngs)


def sort_features_nearest_ref(
    features: List[Dict[str, Any]], ref_lat: float, ref_lng: float
) -> List[Dict[str, Any]]:
    def key(f: Dict[str, Any]) -> Tuple[float, str]:
        lat, lng = feature_centroid_lat_lng(f)
        ang = math.atan2(lat - ref_lat, lng - ref_lng)
        return (ang, f["properties"]["cve_geoestadistica_proxy"])

    return sorted(features, key=key)
