"""Resolución unificada de depósito logístico por CVE INEGI."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Literal

from sqlalchemy.orm import Session

from app.centros_acopio import geo_db
from app.city.municipios_mx import MUNICIPIOS_MX
from app.city.inegi_catalog import get_municipio_by_clave_resolved
from app.db.session import get_sync_db, is_db_available
from app.google.config import resolve_geocoding_api_key
from app.google.quota_guard import check_quota, record_usage

logger = logging.getLogger(__name__)

ConfianzaDepot = Literal["verificado", "candidato", "denue", "fallback"]


def clave_inegi_for_municipio(municipio_id: str) -> str | None:
    mid = municipio_id.strip().lower()
    for row in MUNICIPIOS_MX:
        if row.municipio_simulator_id == mid:
            return row.clave_inegi
    return None


def resolve_depot(
    clave_inegi: str,
    *,
    zm: str | None = None,
    db: Session | None = None,
) -> dict[str, Any]:
    """
    Prioridad:
    1. operador verificado
    2. operador candidato (score ≤ 0.55)
    3. centro_acopio DENUE mejor score
    4. geocode fallback
    """
    cve = clave_inegi.zfill(5)
    if db is None and is_db_available():
        with get_sync_db() as session:
            if session is not None:
                return resolve_depot(clave_inegi, zm=zm, db=session)

    if db is not None:
        centros = geo_db.list_centros_db(db, clave_inegi=cve, incluir_operador=True)
    else:
        from app.centros_acopio import repository as repo

        centros = repo.list_centros(clave_inegi=cve, incluir_operador=True)

    operadores = [c for c in centros if c.es_operador_principal]
    verificados = [c for c in operadores if c.verificado and c.lat is not None and c.lon is not None]
    if verificados:
        best = max(verificados, key=lambda c: c.score_confianza)
        return _pack(best, confianza="verificado")

    candidatos = [
        c
        for c in operadores
        if not c.verificado
        and c.lat is not None
        and c.lon is not None
        and (
            c.fuente == "perfil_municipal"
            or c.score_confianza <= 0.55
            # Un operador principal no verificado con coordenadas es candidato
            # válido (perfil DENUE/Places de confianza media) antes que el fallback.
            or c.es_operador_principal
        )
    ]
    if candidatos:
        best = max(candidatos, key=lambda c: c.score_confianza)
        return _pack(
            best,
            confianza="candidato",
            advertencia="Operador no verificado — candidato DENUE/Places; validar en campo.",
        )

    denue = [
        c for c in centros
        if not c.es_operador_principal
        and c.fuente == "denue"
        and c.lat is not None
        and c.lon is not None
    ]
    if denue:
        best = max(denue, key=lambda c: c.score_confianza)
        return _pack(
            best,
            confianza="denue",
            advertencia="Depósito inferido del catálogo DENUE; no es bodega del concesionario.",
        )

    row = get_municipio_by_clave_resolved(cve)
    municipio = row.nombre if row else cve
    estado = row.estado_nombre if row else ""
    return _geocode_fallback(municipio, estado, cve, zm, db)


def _pack(centro, *, confianza: ConfianzaDepot, advertencia: str | None = None) -> dict[str, Any]:
    return {
        "lat": centro.lat,
        "lon": centro.lon,
        "label": centro.nombre,
        "centro_id": centro.centro_id,
        "fuente": centro.fuente,
        "confianza": confianza,
        "advertencia": advertencia,
        "clave_inegi": centro.clave_inegi,
        "zm": centro.zm,
    }


def _geocode_fallback(
    municipio: str,
    estado: str,
    cve: str,
    zm: str | None,
    db: Session | None,
) -> dict[str, Any]:
    query = f"Centro de acopio, {municipio}, {estado}, México"
    lat, lon = 22.15, -100.98
    label = f"Centro de acopio {municipio}"
    advertencia = "Sin datos geo — coordenadas por geocoding genérico o centroide default."

    if resolve_geocoding_api_key():
        quota = check_quota(db, "google_geocoding")
        if quota["allowed"]:
            try:
                from app.google.geocoding_client import geocode_address, normalize_geocode_result

                async def _run():
                    rows = await geocode_address(query)
                    return normalize_geocode_result(rows[0]) if rows else None

                result = asyncio.run(_run())
                if result and result.get("lat") is not None:
                    lat = float(result["lat"])
                    lon = float(result["lon"])
                    label = result.get("formatted_address") or label
                    record_usage(db, "google_geocoding")
            except Exception as exc:
                logger.warning("Geocode fallback falló %s: %s", cve, exc)
                advertencia = f"Geocoding falló: {exc}"
        else:
            advertencia = "Cuota geocoding agotada — usando centroide default."

    return {
        "lat": lat,
        "lon": lon,
        "label": label,
        "centro_id": None,
        "fuente": "geocode_fallback",
        "confianza": "fallback",
        "advertencia": advertencia,
        "clave_inegi": cve,
        "zm": zm,
    }


def resolve_depot_for_municipio(municipio_id: str, *, zm: str | None = None, db: Session | None = None) -> dict[str, Any]:
    cve = clave_inegi_for_municipio(municipio_id)
    if not cve:
        return _geocode_fallback(municipio_id, "", municipio_id, zm, db)
    return resolve_depot(cve, zm=zm, db=db)
