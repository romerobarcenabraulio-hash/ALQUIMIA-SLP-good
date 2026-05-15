"""Rutas /api/v1/* para catálogo municipal (Q-009)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import resolve_inegi_api_token
from app.city.municipios_mx import get_municipio_mx_by_clave, list_estados_distinct, list_municipios_mx
from app.city.schemas import EstadoMxOption, InegiMunicipalSourceAudit, MunicipioMxApi

router = APIRouter()

INEGI_CENSUS_URL = "https://www.inegi.org.mx/programas/ccpv/2020/"
INEGI_DENUE_DOCS_URL = "https://www.inegi.org.mx/servicios/api_denue.html"


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


@router.get("/cities/{clave_inegi}/inegi-source", response_model=InegiMunicipalSourceAudit)
async def get_inegi_municipal_source(clave_inegi: str) -> InegiMunicipalSourceAudit:
    """Audita fuente INEGI del municipio sin hacer consultas live silenciosas.

    La API DENUE requiere token; si no está configurado, regresamos 200 con
    estado bloqueado de dominio para que la UI muestre acción siguiente.
    """

    row = get_municipio_mx_by_clave(clave_inegi)
    if row is None:
        raise HTTPException(status_code=404, detail="CVE INEGI municipal no existe en el catálogo ALQUIMIA")

    token = resolve_inegi_api_token()
    denue_ready = bool(token)
    blockers = (
        []
        if denue_ready
        else ["INEGI_API_TOKEN (o INEGI_DENUE_TOKEN / DENUE_API_TOKEN) no configurado; no se consulta DENUE en vivo."]
    )
    warnings = [
        "DENUE describe establecimientos; no sustituye Censo de Población y Vivienda ni tabulados de vivienda.",
        "La respuesta declara disponibilidad de fuente; live_query_performed=false porque no se hacen llamadas silenciosas.",
    ]
    if row.datos_estimados:
        warnings.append("La fila municipal conserva datos_estimados=true; requiere reconciliación contra INEGI/CONAPO antes de uso oficial.")

    return InegiMunicipalSourceAudit(
        clave_inegi=row.clave_inegi,
        municipio=row.nombre,
        estado_id=row.estado_id,
        estado=row.estado_nombre,
        census_source="INEGI Censo de Población y Vivienda 2020 / tabulados cargados",
        census_source_url=INEGI_CENSUS_URL,
        census_status="xlsx_loaded" if not row.datos_estimados else "catalog_only",
        denue_api_url=INEGI_DENUE_DOCS_URL,
        denue_status="configured" if denue_ready else "blocked_missing_token",
        live_query_performed=False,
        warnings=warnings,
        blockers=blockers,
        next_action=(
            "Token DENUE configurado; habilitar consulta explícita por usuario antes de traer establecimientos."
            if denue_ready
            else "Configura INEGI_API_TOKEN en el backend (o INEGI_DENUE_TOKEN) y agrega una acción explícita de consulta DENUE por municipio."
        ),
    )
