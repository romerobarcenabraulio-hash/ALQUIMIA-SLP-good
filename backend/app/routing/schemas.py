"""Contratos API de ruteo logístico (INEGI SAKBÉ)."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class RouteProfile(str, Enum):
    libre = "libre"
    cuota = "cuota"
    optima = "optima"


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="WGS84 / GRS80 latitud")
    lon: float = Field(..., ge=-180, le=180, description="WGS84 / GRS80 longitud")
    label: Optional[str] = None


class RouteSegmentRequest(BaseModel):
    origin: GeoPoint
    destination: GeoPoint
    profile: RouteProfile = RouteProfile.optima
    vehicle_type: int = Field(
        6,
        ge=0,
        le=12,
        description="INEGI v=: 5=camión 2 ejes, 6=3 ejes (tabla SAKBÉ)",
    )
    extra_axles: int = Field(0, ge=0, le=5)


class SakbeLineSnap(BaseModel):
    id_routing_net: int
    source: int
    target: int
    nombre: Optional[str] = None


class RouteSegmentResponse(BaseModel):
    profile: RouteProfile
    distance_km: Optional[float] = None
    duration_min: Optional[float] = None
    toll_flag: Optional[bool] = None
    toll_cost_mxn: Optional[float] = None
    geometry: Optional[Dict[str, Any]] = None
    warning: Optional[str] = None
    origin_snap: Optional[SakbeLineSnap] = None
    destination_snap: Optional[SakbeLineSnap] = None
    source: Literal["inegi_sakbe", "unavailable"] = "inegi_sakbe"
    attribution: str = "Ruta calculada con API de Ruteo INEGI — Red Nacional de Caminos"


class RoutePlanRequest(BaseModel):
    municipio_id: str
    zm: str
    depot: GeoPoint
    stops: List[GeoPoint] = Field(..., min_length=1, max_length=12)
    profile: RouteProfile = RouteProfile.optima
    vehicle_type: int = 6
    return_to_depot: bool = True


class RouteLeg(BaseModel):
    from_label: str
    to_label: str
    segment: RouteSegmentResponse


class RoutePlanResponse(BaseModel):
    municipio_id: str
    zm: str
    legs: List[RouteLeg]
    total_distance_km: float
    total_duration_min: float
    total_toll_cost_mxn: float
    source: Literal["inegi_sakbe", "partial", "unavailable"] = "inegi_sakbe"
    attribution: str = "Ruta calculada con API de Ruteo INEGI — Red Nacional de Caminos"
