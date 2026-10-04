"""
CentroAcopioRepository — DB-first (Neon) con fallback in-memory + seed JSON git.

Operaciones:
  get(centro_id)                → CentroAcopio | None
  list_centros(...)             → List[CentroAcopio]
  upsert(centro)                → CentroAcopio
  delete(centro_id)             → bool
  sync_from_places(zm)          → int
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioTipo,
)
from app.centros_acopio import file_store, geo_db
from app.db.session import get_sync_db, is_db_available

logger = logging.getLogger(__name__)

_store: Dict[str, CentroAcopio] = {}
_persisted_loaded = False
_db_seeded = False


def _load_persisted_once() -> None:
    global _persisted_loaded
    if _persisted_loaded:
        return
    for centro in file_store.load_all_persisted():
        _store[centro.centro_id] = centro
    _persisted_loaded = True
    logger.info("CentroAcopio persistidos: %d registros en store.", len(_store))


# Antes había aquí un _seed_demo() con 6 centros FICTICIOS (teléfonos tipo
# 818-555-0100) declarados como fuente "denue"/"places_api", verificado=True y
# score 0.8-0.9. Se servían en producción como reales y _ensure_db_seed los
# copiaba a Postgres. Eliminado (REGLAS §6: nunca inventar). Los centros reales
# vienen de file_store (sync DENUE persistido) y de la BD.
_load_persisted_once()


def _ensure_db_seed() -> None:
    global _db_seeded
    if _db_seeded or not is_db_available():
        return
    with get_sync_db() as db:
        if db is None:
            return
        from app.models.geo import GeoCentroAcopio

        count = db.query(GeoCentroAcopio).count()
        if count == 0:
            from app.centros_acopio.geo_worker import seed_json_to_db

            seed_json_to_db(db)
            for c in _store.values():
                geo_db.upsert_centro(db, c)
            db.commit()
        _db_seeded = True


def get(centro_id: str) -> Optional[CentroAcopio]:
    _ensure_db_seed()
    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                row = geo_db.get_centro(db, centro_id)
                if row:
                    return row
    return _store.get(centro_id)


def list_centros(
    zm: Optional[str] = None,
    municipio: Optional[str] = None,
    clave_inegi: Optional[str] = None,
    material: Optional[CentroAcopioMaterial] = None,
    acepta_empresa: Optional[bool] = None,
    verificado_only: bool = False,
    incluir_operador: bool = True,
    solo_operador: bool = False,
) -> List[CentroAcopio]:
    _load_persisted_once()
    _ensure_db_seed()

    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                db_rows = geo_db.list_centros_db(
                    db,
                    zm=zm,
                    municipio=municipio,
                    clave_inegi=clave_inegi,
                    material=material,
                    acepta_empresa=acepta_empresa,
                    verificado_only=verificado_only,
                    incluir_operador=incluir_operador,
                    solo_operador=solo_operador,
                )
                if db_rows or clave_inegi:
                    return db_rows

    results = list(_store.values())
    if clave_inegi:
        cve = clave_inegi.zfill(5)
        results = [c for c in results if (c.clave_inegi or "").zfill(5) == cve]
    if zm:
        results = [c for c in results if c.zm and c.zm.upper() == zm.upper()]
    if municipio:
        results = [c for c in results if municipio.lower() in c.municipio.lower()]
    if solo_operador:
        results = [c for c in results if c.es_operador_principal]
    elif not incluir_operador:
        results = [c for c in results if not c.es_operador_principal]
    if material:
        results = [c for c in results if material in c.materiales]
    if acepta_empresa is not None:
        results = [c for c in results if c.acepta_empresa == acepta_empresa]
    if verificado_only:
        results = [c for c in results if c.verificado]
    results.sort(
        key=lambda c: (c.es_operador_principal, c.verificado, c.score_confianza),
        reverse=True,
    )
    return results


def upsert(centro: CentroAcopio) -> CentroAcopio:
    centro.updated_at = datetime.now(timezone.utc)
    _store[centro.centro_id] = centro
    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                geo_db.upsert_centro(db, centro)
                db.commit()
    return centro


def delete(centro_id: str) -> bool:
    found = centro_id in _store
    if found:
        del _store[centro_id]
    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                from app.models.geo import GeoCentroAcopio

                db.query(GeoCentroAcopio).filter(GeoCentroAcopio.centro_id == centro_id).delete()
                db.commit()
                return True
    return found


def count() -> int:
    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                from app.models.geo import GeoCentroAcopio

                return db.query(GeoCentroAcopio).count()
    return len(_store)


def coverage_stats() -> dict:
    if is_db_available():
        with get_sync_db() as db:
            if db is not None:
                return geo_db.coverage_stats(db)
    summary = file_store.coverage_summary()
    manifest = summary.get("manifest", {})
    totales = manifest.get("totales", {})
    catalogados = totales.get("municipios_catalogados", 0)
    con_datos = totales.get("con_datos", 0)
    return {
        "municipios_catalogados": catalogados,
        "municipios_synced": con_datos,
        "municipios_sin_datos": totales.get("sin_datos", 0),
        "municipios_pending": max(0, catalogados - con_datos),
        "geo_coverage_pct": round(con_datos / catalogados * 100, 2) if catalogados else 0.0,
        "centros_total": len(_store),
        "municipios_con_operador_verificado": 0,
        "municipios_con_operador_candidato": 0,
        "source": "file_manifest",
    }


async def sync_from_places(zm: str, api_key: str) -> int:
    try:
        import httpx
    except ImportError:
        logger.warning("httpx no disponible — Places sync cancelado.")
        return 0

    queries = [
        f"centro de reciclaje {zm}",
        f"punto verde {zm}",
        f"chatarrería {zm}",
        f"recicladora {zm}",
    ]

    synced = 0
    async with httpx.AsyncClient(timeout=10.0) as client:
        for query in queries:
            try:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params={"query": query, "language": "es", "key": api_key},
                )
                if resp.status_code != 200:
                    continue
                data = resp.json()
                for place in data.get("results", [])[:5]:
                    centro_id = f"places-{place.get('place_id', str(uuid.uuid4())[:8])}"
                    location = place.get("geometry", {}).get("location", {})
                    centro = CentroAcopio(
                        centro_id=centro_id,
                        nombre=place.get("name", "Sin nombre"),
                        tipo=_infer_tipo(place.get("types", [])),
                        direccion=place.get("formatted_address", ""),
                        municipio=_extract_municipio(place.get("formatted_address", "")),
                        estado="",
                        zm=zm.upper(),
                        lat=location.get("lat"),
                        lon=location.get("lng"),
                        materiales=[],
                        fuente="places_api",
                        verificado=False,
                        score_confianza=0.65,
                    )
                    upsert(centro)
                    synced += 1
            except Exception as exc:
                logger.warning("Places sync error for '%s': %s", query, exc)

    logger.info("Places sync: %d centros sincronizados para ZM=%s", synced, zm)
    return synced


def _infer_tipo(types: List[str]) -> CentroAcopioTipo:
    joined = " ".join(types).lower()
    if "establishment" in joined and "store" in joined:
        return CentroAcopioTipo.empresa_recicladora
    return CentroAcopioTipo.otro


def _extract_municipio(address: str) -> str:
    parts = [p.strip() for p in address.split(",")]
    if len(parts) >= 3:
        return parts[-3] if len(parts) >= 3 else parts[-2]
    return address.split(",")[0] if "," in address else address
