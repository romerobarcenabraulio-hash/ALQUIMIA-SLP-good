"""
Sincronización de centros de acopio vía Google Places API por municipio (CVE INEGI).

Navigator: Places identifica POIs públicos; no sustituye DENUE ni validación de campo.
Complementa DENUE + perfil operador; fuente=places_api, verificado=false, score≤0.65.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from sqlalchemy.orm import Session

from app.agents.schemas import CentroAcopio, CentroAcopioMaterial, CentroAcopioRolInstalacion, CentroAcopioTipo
from app.centros_acopio import file_store, geo_db
from app.city.inegi_catalog import fetch_municipios_inegi, get_municipio_by_clave_resolved
from app.city.municipios_mx import MunicipioMxRow
from app.google.config import resolve_geocoding_api_key, resolve_google_places_api_key
from app.google.places_client import GooglePlacesNotConfigured, place_to_candidate, search_places
from app.google.quota_guard import check_quota, record_usage
from app.google.schemas import GooglePlaceKind

logger = logging.getLogger(__name__)

PLACES_QUERIES_EXTRA = [
    "acopio de residuos {ctx}",
    "compra de chatarra {ctx}",
    "reciclaje de plástico {ctx}",
    "centro de acopio de basura {ctx}",
]

# Candidatos bodega/patio del concesionario (no verificado hasta perfil POLIS)
OPERADOR_PLACES_QUERIES = [
    "bodega recolección basura {ctx}",
    "patio camiones basura {ctx}",
    "empresa recolección residuos {ctx}",
    "servicios sanitarios limpia {ctx}",
    "transferencia residuos sólidos {ctx}",
]

RATE_LIMIT_S = float(__import__("os").getenv("PLACES_SYNC_RATE_LIMIT_S", "0.4"))
PER_MUNICIPIO_LIMIT = int(__import__("os").getenv("PLACES_PER_MUNICIPIO_LIMIT", "20"))


def _infer_tipo_from_places(types: list[str]) -> CentroAcopioTipo:
    joined = " ".join(types).lower()
    if "point_of_interest" in joined and ("store" in joined or "establishment" in joined):
        return CentroAcopioTipo.empresa_recicladora
    if "locality" in joined:
        return CentroAcopioTipo.otro
    return CentroAcopioTipo.otro


async def _geocode_municipio_center(nombre: str, estado: str) -> tuple[float | None, float | None]:
    if not resolve_geocoding_api_key():
        return None, None
    try:
        from app.google.geocoding_client import geocode_address, normalize_geocode_result

        q = f"{nombre}, {estado}, México"
        rows = await geocode_address(q)
        if rows:
            norm = normalize_geocode_result(rows[0])
            return norm.get("lat"), norm.get("lon")
    except Exception as exc:
        logger.debug("Geocode municipio %s: %s", nombre, exc)
    return None, None


def _place_row_to_centro(
    row: dict[str, Any],
    *,
    muni: MunicipioMxRow,
) -> CentroAcopio | None:
    lat, lon = row.get("lat"), row.get("lon")
    if lat is None or lon is None:
        return None
    place_id = row.get("place_id") or ""
    if not place_id:
        return None
    name = str(row.get("name") or "Sin nombre")
    return CentroAcopio(
        centro_id=f"places-{place_id}",
        nombre=name,
        tipo=_infer_tipo_from_places(row.get("types") or []),
        direccion=str(row.get("formatted_address") or ""),
        municipio=muni.nombre,
        estado=muni.estado_nombre,
        clave_inegi=muni.clave_inegi.zfill(5),
        zm=muni.zm_simulator_id,
        lat=float(lat),
        lon=float(lon),
        materiales=[CentroAcopioMaterial.otro],
        acepta_publico=True,
        acepta_empresa=False,
        rol_instalacion=CentroAcopioRolInstalacion.centro_acopio,
        fuente="places_api",
        verificado=False,
        score_confianza=0.62,
        notas="Google Places API — validar SCIAN y materiales en campo.",
        place_id=place_id,
    )


async def fetch_places_for_municipio(
    muni: MunicipioMxRow,
    *,
    db: Session | None = None,
) -> list[CentroAcopio]:
    if not resolve_google_places_api_key():
        raise GooglePlacesNotConfigured("GOOGLE_PLACES_API_KEY o MAPS_PLATFORM_API requerido")

    quota = check_quota(db, "google_places", units=4)
    if not quota["allowed"]:
        logger.warning("Cuota Places agotada — omitiendo %s", muni.clave_inegi)
        return []

    ctx = f"{muni.nombre}, {muni.estado_nombre}, México"
    lat, lon = await _geocode_municipio_center(muni.nombre, muni.estado_nombre)
    if lat is not None:
        record_usage(db, "google_geocoding", units=1)

    seen: set[str] = set()
    centros: list[CentroAcopio] = []

    async def _collect(query_ctx: str, limit: int) -> None:
        nonlocal centros
        rows = await search_places(
            query_ctx,
            place_kind=GooglePlaceKind.centro_acopio,
            context=query_ctx,
            lat=lat,
            lon=lon,
            radius_m=25000,
            limit=limit,
        )
        record_usage(db, "google_places", units=1)
        for raw in rows:
            cand = place_to_candidate(raw)
            pid = cand.get("place_id")
            if not pid or pid in seen:
                continue
            seen.add(pid)
            centro = _place_row_to_centro(cand, muni=muni)
            if centro:
                centros.append(centro)
            if len(centros) >= PER_MUNICIPIO_LIMIT:
                return

    await _collect(ctx, 8)

    for tpl in PLACES_QUERIES_EXTRA:
        if len(centros) >= PER_MUNICIPIO_LIMIT:
            break
        qctx = tpl.format(ctx=ctx)
        try:
            rows = await search_places(
                qctx,
                place_kind=GooglePlaceKind.generico,
                context=ctx,
                lat=lat,
                lon=lon,
                radius_m=25000,
                limit=5,
            )
            record_usage(db, "google_places", units=1)
            for raw in rows:
                cand = place_to_candidate(raw)
                pid = cand.get("place_id")
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                centro = _place_row_to_centro(cand, muni=muni)
                if centro:
                    centros.append(centro)
        except Exception as exc:
            logger.debug("Places extra query %s: %s", qctx[:40], exc)
        await asyncio.sleep(0.15)

    return centros[:PER_MUNICIPIO_LIMIT]


def _place_row_to_operador_candidato(
    row: dict[str, Any],
    *,
    muni: MunicipioMxRow,
) -> CentroAcopio | None:
    centro = _place_row_to_centro(row, muni=muni)
    if not centro:
        return None
    centro.centro_id = f"op-places-{row.get('place_id', centro.centro_id)}"
    centro.tipo = CentroAcopioTipo.bodega_concesionario
    centro.rol_instalacion = CentroAcopioRolInstalacion.bodega_operador
    centro.es_operador_principal = True
    centro.verificado = False
    centro.score_confianza = 0.50
    centro.fuente = "places_candidato_operador"
    centro.acepta_publico = False
    centro.acepta_empresa = True
    centro.notas = "Candidato operador vía Google Places — validar contrato municipal."
    return centro


async def fetch_operador_candidatos_places(
    muni: MunicipioMxRow,
    *,
    db: Session | None = None,
) -> list[CentroAcopio]:
    """Busca bodega/patio del concesionario; no sustituye perfil verificado."""
    if not resolve_google_places_api_key():
        return []
    if not check_quota(db, "google_places", units=2)["allowed"]:
        return []

    ctx = f"{muni.nombre}, {muni.estado_nombre}, México"
    lat, lon = await _geocode_municipio_center(muni.nombre, muni.estado_nombre)
    seen: set[str] = set()
    out: list[CentroAcopio] = []

    for tpl in OPERADOR_PLACES_QUERIES:
        if len(out) >= 3:
            break
        qctx = tpl.format(ctx=ctx)
        try:
            rows = await search_places(
                qctx,
                place_kind=GooglePlaceKind.generico,
                context=ctx,
                lat=lat,
                lon=lon,
                radius_m=30000,
                limit=3,
            )
            record_usage(db, "google_places", units=1)
            for raw in rows:
                cand = place_to_candidate(raw)
                pid = cand.get("place_id")
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                op = _place_row_to_operador_candidato(cand, muni=muni)
                if op:
                    out.append(op)
        except Exception as exc:
            logger.debug("Operador Places %s: %s", qctx[:40], exc)
        await asyncio.sleep(0.12)
    return out


def replace_places_for_cve(db: Session, centros: list[CentroAcopio], clave_inegi: str) -> int:
    """Reemplaza solo filas places_api del CVE; preserva DENUE y perfil."""
    from app.models.geo import GeoCentroAcopio

    cve = clave_inegi.zfill(5)
    db.query(GeoCentroAcopio).filter(
        GeoCentroAcopio.clave_inegi == cve,
        GeoCentroAcopio.fuente == "places_api",
        GeoCentroAcopio.es_operador_principal.is_(False),
    ).delete(synchronize_session=False)
    for c in centros:
        geo_db.upsert_centro(db, c)
    db.flush()
    return len(centros)


async def sync_municipio_places_async(
    db: Session,
    clave_inegi: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    cve = clave_inegi.zfill(5)
    muni = get_municipio_by_clave_resolved(cve)
    if not muni:
        return {"clave_inegi": cve, "error": "Municipio no resuelto"}

    sync_row = geo_db.get_sync_row(db, cve)
    if sync_row and sync_row.fuente and "places" in sync_row.fuente and not force:
        existing = geo_db.list_centros_db(db, clave_inegi=cve)
        places_count = sum(1 for c in existing if c.fuente == "places_api")
        if places_count > 0:
            return {
                "clave_inegi": cve,
                "skipped": True,
                "places_total": places_count,
            }

    operadores: list[CentroAcopio] = []
    try:
        centros = await fetch_places_for_municipio(muni, db=db)
        operadores = await fetch_operador_candidatos_places(muni, db=db)
    except GooglePlacesNotConfigured as exc:
        return {"clave_inegi": cve, "error": str(exc)}

    n = replace_places_for_cve(db, centros, cve)
    if operadores:
        geo_db.replace_operadores_for_cve(db, operadores, cve)
        n += len(operadores)

    denue_count = len([c for c in geo_db.list_centros_db(db, clave_inegi=cve) if c.fuente == "denue"])
    total = geo_db.list_centros_db(db, clave_inegi=cve)
    status = "synced" if len(total) > 0 else "sin_datos"
    fuente = "denue+places" if denue_count and n else ("places_api" if n else "denue")

    geo_db.upsert_sync_row(
        db,
        clave_inegi=cve,
        municipio=muni.nombre,
        estado=muni.estado_nombre,
        estado_id=muni.estado_id,
        status=status,
        total_centros=len([c for c in total if not c.es_operador_principal]),
        total_candidatos_operador=len([c for c in total if c.es_operador_principal]),
        fuente=fuente,
        error_message=None,
    )

    merged_file = [c for c in total if c.fuente in {"denue", "places_api"}]
    file_store.save_municipio_centros(
        cve,
        merged_file,
        municipio=muni.nombre,
        estado=muni.estado_nombre,
        fuente=fuente,
    )
    db.commit()
    return {
        "clave_inegi": cve,
        "municipio": muni.nombre,
        "places_synced": n,
        "operador_candidatos_places": len(operadores) if operadores else 0,
        "denue_centros": denue_count,
        "total_centros": len(total),
        "status": status,
        "fuente": fuente,
    }


def sync_municipio_places(db: Session, clave_inegi: str, *, force: bool = False) -> dict[str, Any]:
    return asyncio.run(sync_municipio_places_async(db, clave_inegi, force=force))


def sync_estado_places(
    db: Session,
    estado_id: str,
    *,
    force: bool = False,
    limit: int | None = None,
    skip_cve: set[str] | None = None,
) -> dict[str, Any]:
    """Sincroniza Google Places para todos los municipios de una entidad."""
    eid = estado_id.strip().zfill(2)
    municipios = fetch_municipios_inegi(eid)
    if limit is not None:
        municipios = municipios[: max(0, limit)]

    skip = skip_cve or set()
    results: list[dict[str, Any]] = []
    total_places = 0
    errors = 0

    for i, muni in enumerate(municipios):
        cve = muni.clave_inegi.zfill(5)
        if cve in skip:
            continue
        logger.info("[%d/%d] Places %s (%s)", i + 1, len(municipios), muni.nombre, cve)
        try:
            r = sync_municipio_places(db, cve, force=force)
            total_places += r.get("places_synced", 0)
            results.append(r)
        except Exception as exc:
            errors += 1
            results.append({"clave_inegi": cve, "error": str(exc)})
            logger.exception("Places sync falló %s", cve)
        time.sleep(RATE_LIMIT_S)

    con_datos = sum(1 for r in results if (r.get("places_synced") or 0) > 0 or r.get("total_centros", 0) > 0)
    return {
        "estado_id": eid,
        "municipios_procesados": len(results),
        "municipios_con_places": con_datos,
        "total_places_inserted": total_places,
        "errors": errors,
        "detalle": results,
    }
