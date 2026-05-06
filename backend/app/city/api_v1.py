"""Rutas /api/v1/* para catálogo municipal (Q-009)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.city.municipios_mx import list_estados_distinct, list_municipios_mx
from app.city.schemas import EstadoMxOption, MunicipioMxApi

router = APIRouter()


def _to_api(row) -> MunicipioMxApi:
    return MunicipioMxApi(
        clave_inegi=row.clave_inegi,
        nombre=row.nombre,
        estado=row.estado_nombre,
        estado_id=row.estado_id,
        poblacion=row.poblacion,
        generacion_rsu_dia=row.generacion_rsu_dia,
        zm_simulator_id=row.zm_simulator_id,
        municipio_simulator_id=row.municipio_simulator_id,
        datos_estimados=row.datos_estimados,
    )


@router.get("/cities", response_model=list[MunicipioMxApi])
async def get_cities(
    estado_id: str | None = Query(
        None,
        description="Filtrar por CVE entidad INEGI (2 dígitos), ej. 22=Querétaro",
    ),
) -> list[MunicipioMxApi]:
    """Catálogo municipal para selector Estado → Municipio (subconjunto semilla)."""
    return [_to_api(r) for r in list_municipios_mx(estado_id)]


@router.get("/cities/estados", response_model=list[EstadoMxOption])
async def get_estados_mx() -> list[EstadoMxOption]:
    """Entidades presentes en el catálogo semilla."""
    return [EstadoMxOption(estado_id=eid, nombre=enom) for eid, enom in list_estados_distinct()]
