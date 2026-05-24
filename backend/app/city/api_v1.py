"""Rutas /api/v1/* para catálogo municipal (Q-009) — México completo vía INEGI."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import resolve_inegi_api_token
from app.city.inegi_catalog import (
    fetch_municipios_inegi,
    get_municipio_by_clave_resolved,
    list_estados_completos,
)
from app.city.municipios_mx import get_municipio_mx_by_clave, list_estados_distinct, list_municipios_mx
from app.city.schemas import EstadoMxOption, InegiMunicipalSourceAudit, MunicipioMxApi, MunicipioRegisterRequest
from app.legal.dynamic_municipio import ensure_municipio_registered

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
    """Catálogo municipal INEGI por entidad (tiempo real con caché en proceso)."""
    if not estado_id:
        return [_to_api(r) for r in list_municipios_mx(None)]
    rows = fetch_municipios_inegi(estado_id)
    return [_to_api(r) for r in rows]


@router.get("/cities/estados", response_model=list[EstadoMxOption])
async def get_estados_mx() -> list[EstadoMxOption]:
    """32 entidades federativas (CVE INEGI oficial)."""
    return [EstadoMxOption(estado_id=eid, nombre=enom) for eid, enom in list_estados_completos()]


@router.post("/cities/register", response_model=MunicipioMxApi)
async def register_municipio(body: MunicipioRegisterRequest) -> MunicipioMxApi:
    """
    Registra municipio en repositorio legal + devuelve fila para el simulador.
    Idempotente: re-registrar no duplica.
    """
    mid = ensure_municipio_registered(
        clave_inegi=body.clave_inegi,
        municipio_id=body.municipio_simulator_id,
        nombre=body.nombre,
        estado_id=body.estado_id,
        estado_nombre=body.estado,
    )
    if not mid:
        raise HTTPException(status_code=400, detail="No se pudo registrar el municipio")
    row = get_municipio_by_clave_resolved(body.clave_inegi)
    if row is None:
        from app.city.inegi_catalog import zm_for_estado, municipio_simulator_id_from_cve
        from app.city.municipios_mx import MunicipioMxRow, GEN_KG_HAB_MODEL

        cve = body.clave_inegi.strip().zfill(5)
        pob = 50_000
        row = MunicipioMxRow(
            clave_inegi=cve,
            nombre=body.nombre,
            estado_nombre=body.estado,
            estado_id=body.estado_id.zfill(2),
            poblacion=pob,
            generacion_rsu_dia=round(pob * GEN_KG_HAB_MODEL / 1000.0, 4),
            zm_simulator_id=zm_for_estado(body.estado_id),
            municipio_simulator_id=mid,
            datos_estimados=True,
        )
    return _to_api(row)


@router.get("/cities/{clave_inegi}/inegi-source", response_model=InegiMunicipalSourceAudit)
async def get_inegi_municipal_source(clave_inegi: str) -> InegiMunicipalSourceAudit:
    """Audita fuente INEGI del municipio sin hacer consultas live silenciosas."""
    row = get_municipio_by_clave_resolved(clave_inegi) or get_municipio_mx_by_clave(clave_inegi)
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
        warnings.append(
            "La fila municipal conserva datos_estimados=true; requiere reconciliación contra INEGI/CONAPO antes de uso oficial."
        )

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
