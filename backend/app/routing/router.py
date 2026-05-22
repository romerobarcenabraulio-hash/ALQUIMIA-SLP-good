"""
Router: /api/v1/routing

Ruteo logístico vía INEGI SAKBÉ (Red Nacional de Caminos).
Solo backend — el token nunca sale al navegador.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.config import resolve_inegi_ruteo_token
from app.routing.inegi_client import (
    InegiRuteoNotConfigured,
    InegiRuteoError,
    buscar_destino,
    parse_route_result,
    ruta_entre_coordenadas,
)
from app.routing.schemas import (
    RouteLeg,
    RoutePlanRequest,
    RoutePlanResponse,
    RouteProfile,
    RouteSegmentRequest,
    RouteSegmentResponse,
    SakbeLineSnap,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
async def routing_status():
    """Indica si el token SAKBÉ está configurado (sin llamar a INEGI)."""
    key = resolve_inegi_ruteo_token()
    return {
        "configured": bool(key),
        "provider": "inegi_sakbe_v3.1",
        "register_url": "https://gaia.inegi.org.mx/sakbe_v3.1/genera_token.jsp",
        "docs_url": "https://www.inegi.org.mx/servicios/Ruteo/Default.html",
        "attribution": "API de Ruteo INEGI — Red Nacional de Caminos",
    }


@router.post("/destinos/search")
async def search_destinos(q: str, num: int = 10, entidad: str | None = None):
    try:
        rows = await buscar_destino(q, num=min(num, 25), entidad_hint=entidad)
        return {"query": q, "results": rows, "source": "inegi_sakbe"}
    except InegiRuteoNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except InegiRuteoError as exc:
        raise HTTPException(502, str(exc))


@router.post("/segment", response_model=RouteSegmentResponse)
async def route_segment(req: RouteSegmentRequest):
    """Un tramo origen→destino por coordenadas (línea-a-línea en red INEGI)."""
    try:
        raw = await ruta_entre_coordenadas(
            req.origin.lat,
            req.origin.lon,
            req.destination.lat,
            req.destination.lon,
            profile=req.profile,
            vehicle_type=req.vehicle_type,
            extra_axles=req.extra_axles,
        )
        parsed = parse_route_result(raw)
        return RouteSegmentResponse(
            profile=req.profile,
            origin_snap=SakbeLineSnap(**parsed["origin_snap"]) if parsed.get("origin_snap") else None,
            destination_snap=SakbeLineSnap(**parsed["destination_snap"]) if parsed.get("destination_snap") else None,
            **{k: v for k, v in parsed.items() if k not in ("origin_snap", "destination_snap")},
        )
    except InegiRuteoNotConfigured as exc:
        raise HTTPException(503, str(exc))
    except InegiRuteoError as exc:
        logger.warning("SAKBÉ segment error: %s", exc)
        raise HTTPException(502, str(exc))


@router.post("/plan", response_model=RoutePlanResponse)
async def route_plan(req: RoutePlanRequest):
    """
    Plan secuencial depot → paradas [→ depot].
    Para VRP multi-camión completo, fase posterior (OR-Tools + SAKBÉ por arista).
    """
    points = [req.depot, *req.stops]
    if req.return_to_depot and len(req.stops) > 0:
        points.append(req.depot)

    legs: list[RouteLeg] = []
    total_km = 0.0
    total_min = 0.0
    total_peaje = 0.0
    failed = False

    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        try:
            raw = await ruta_entre_coordenadas(
                a.lat, a.lon, b.lat, b.lon,
                profile=req.profile,
                vehicle_type=req.vehicle_type,
            )
            parsed = parse_route_result(raw)
            seg = RouteSegmentResponse(profile=req.profile, **parsed)
            legs.append(RouteLeg(
                from_label=a.label or f"P{i}",
                to_label=b.label or f"P{i + 1}",
                segment=seg,
            ))
            total_km += parsed.get("distance_km") or 0.0
            total_min += parsed.get("duration_min") or 0.0
            total_peaje += parsed.get("toll_cost_mxn") or 0.0
        except (InegiRuteoNotConfigured, InegiRuteoError) as exc:
            failed = True
            if isinstance(exc, InegiRuteoNotConfigured):
                raise HTTPException(503, str(exc))
            logger.warning("SAKBÉ plan leg %s→%s: %s", i, i + 1, exc)

    if not legs:
        raise HTTPException(502, "No se pudo calcular ningún tramo de ruta")

    source = "partial" if failed else "inegi_sakbe"
    return RoutePlanResponse(
        municipio_id=req.municipio_id.lower(),
        zm=req.zm,
        legs=legs,
        total_distance_km=round(total_km, 2),
        total_duration_min=round(total_min, 1),
        total_toll_cost_mxn=round(total_peaje, 2),
        source=source,
    )
