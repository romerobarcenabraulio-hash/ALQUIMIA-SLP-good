from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class GooglePlaceKind(str, Enum):
    centro_acopio = "centro_acopio"
    residencial = "residencial"
    generico = "generico"


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    label: Optional[str] = None


class GeocodeForwardRequest(BaseModel):
    address: str
    region: str = "mx"


class GeocodeReverseRequest(BaseModel):
    lat: float
    lon: float


class GeocodeResult(BaseModel):
    formatted_address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    place_id: Optional[str] = None
    components: List[Dict[str, Any]] = Field(default_factory=list)
    source: Literal["google_geocoding"] = "google_geocoding"


class PlaceSearchRequest(BaseModel):
    query: str
    place_kind: GooglePlaceKind = GooglePlaceKind.generico
    lat: Optional[float] = None
    lon: Optional[float] = None
    radius_m: int = Field(15000, ge=500, le=50000)


class PlaceCandidate(BaseModel):
    place_id: str
    name: str
    formatted_address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    types: List[str] = Field(default_factory=list)
    source: Literal["google_places"] = "google_places"


class RouteSegmentRequest(BaseModel):
    origin: GeoPoint
    destination: GeoPoint
    vehicle_type: str = "DRIVE"


class RouteSegmentResponse(BaseModel):
    distance_km: Optional[float] = None
    duration_min: Optional[float] = None
    encoded_polyline: Optional[str] = None
    source: Literal["google_routes"] = "google_routes"
    attribution: str = "Google Maps Platform — Routes API"


class RoutePlanRequest(BaseModel):
    municipio_id: str
    zm: str
    depot: GeoPoint
    stops: List[GeoPoint] = Field(..., min_length=1, max_length=50)
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
    source: Literal["google_routes", "partial"] = "google_routes"
