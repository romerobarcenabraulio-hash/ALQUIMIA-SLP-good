"""Helpers de rutas operativas."""
from __future__ import annotations

from app.operations.schemas import RoutePlan


def route_capacity_warning(route: RoutePlan) -> str | None:
    if route.capacidad_ton < 1:
        return "Capacidad de camion menor a 1 t: revisar viabilidad operativa."
    if not route.colonias:
        return "Ruta sin colonias: no se puede programar turno defendible."
    return None

