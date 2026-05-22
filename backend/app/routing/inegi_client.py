"""
Cliente INEGI SAKBÉ v3.1 — API de Ruteo.

Documentación: https://www.inegi.org.mx/servicios/Ruteo/Default.html
Base: https://gaia.inegi.org.mx/sakbe_v3.1/

Coordenadas: GRS80 (EPSG:4326 compatible) en grados decimales.
Distancias reportadas por INEGI en km — no recalcular en 3857 (Navigator).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import resolve_inegi_ruteo_token  # noqa: F401 — re-export for tests
from app.routing.schemas import RouteProfile, SakbeLineSnap

logger = logging.getLogger(__name__)

SAKBE_BASE = "https://gaia.inegi.org.mx/sakbe_v3.1"
DEFAULT_ESCALA = 10000
TIMEOUT_S = 25.0


class InegiRuteoError(Exception):
    pass


class InegiRuteoNotConfigured(InegiRuteoError):
    pass


def _token() -> str:
    key = resolve_inegi_ruteo_token()
    if not key:
        raise InegiRuteoNotConfigured(
            "Configura INEGI_RUTEO_TOKEN (token SAKBÉ 36 caracteres en gaia.inegi.org.mx)"
        )
    return key


def _unwrap_data(payload: Dict[str, Any]) -> Any:
    resp = payload.get("response") or {}
    if resp.get("success") is False:
        raise InegiRuteoError(resp.get("message") or "SAKBÉ respondió con error")
    return payload.get("data")


async def _post(path: str, body: Dict[str, Any]) -> Dict[str, Any]:
    body = {**body, "key": _token(), "type": "json", "proj": "GRS80"}
    url = f"{SAKBE_BASE}/{path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
        r = await client.post(url, data=body)
        r.raise_for_status()
        return r.json()


async def buscar_destino(
    query: str,
    *,
    num: int = 5,
    entidad_hint: Optional[str] = None,
) -> List[Dict[str, Any]]:
    buscar = f"{query}, {entidad_hint}" if entidad_hint else query
    payload = await _post("buscadestino", {"buscar": buscar, "num": num})
    data = _unwrap_data(payload)
    if isinstance(data, list):
        return data
    return data or []


async def buscar_linea_cercana(lat: float, lon: float, *, escala: int = DEFAULT_ESCALA) -> SakbeLineSnap:
    """Encuentra segmento de Red Nacional de Caminos más cercano a un punto."""
    payload = await _post(
        "buscalinea",
        {"x": lon, "y": lat, "escala": escala},
    )
    row = _unwrap_data(payload)
    if not row or not isinstance(row, dict):
        raise InegiRuteoError("buscalinea no devolvió segmento")
    net_id = row.get("id_routing_net") or row.get("id_rounting_net")
    if net_id is None:
        raise InegiRuteoError("buscalinea sin id_routing_net")
    return SakbeLineSnap(
        id_routing_net=int(net_id),
        source=int(row["source"]),
        target=int(row["target"]),
        nombre=row.get("nombre"),
    )


async def calcular_ruta_linea_a_linea(
    origin: SakbeLineSnap,
    destination: SakbeLineSnap,
    *,
    profile: RouteProfile = RouteProfile.optima,
    vehicle_type: int = 6,
    extra_axles: int = 0,
) -> Dict[str, Any]:
    body = {
        "id_i": origin.id_routing_net,
        "source_i": origin.source,
        "target_i": origin.target,
        "id_f": destination.id_routing_net,
        "source_f": destination.source,
        "target_f": destination.target,
        "v": vehicle_type,
        "e": extra_axles,
    }
    payload = await _post(profile.value, body)
    data = _unwrap_data(payload)
    if not isinstance(data, dict):
        raise InegiRuteoError("ruta sin datos")
    return data


async def ruta_entre_coordenadas(
    lat_o: float,
    lon_o: float,
    lat_d: float,
    lon_d: float,
    *,
    profile: RouteProfile = RouteProfile.optima,
    vehicle_type: int = 6,
    extra_axles: int = 0,
) -> Dict[str, Any]:
    """Flujo línea-a-línea: buscalinea en origen y destino, luego optima/libre/cuota."""
    line_o = await buscar_linea_cercana(lat_o, lon_o)
    line_d = await buscar_linea_cercana(lat_d, lon_d)
    route = await calcular_ruta_linea_a_linea(
        line_o,
        line_d,
        profile=profile,
        vehicle_type=vehicle_type,
        extra_axles=extra_axles,
    )
    route["_origin_snap"] = line_o.model_dump()
    route["_destination_snap"] = line_d.model_dump()
    return route


def parse_route_result(raw: Dict[str, Any]) -> Dict[str, Any]:
    peaje = raw.get("peaje")
    return {
        "distance_km": _float(raw.get("long_km")),
        "duration_min": _float(raw.get("tiempo_min")),
        "toll_flag": peaje == "t" if peaje in ("t", "f") else None,
        "toll_cost_mxn": _float(raw.get("costo_caseta")),
        "geometry": raw.get("geojson"),
        "warning": raw.get("advertencia"),
        "origin_snap": raw.get("_origin_snap"),
        "destination_snap": raw.get("_destination_snap"),
    }


def _float(v: Any) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
