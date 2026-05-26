"""Worker nacional — bootstrap ~2469 CVE + sync_batch DENUE."""
from __future__ import annotations

import logging
import os
import time
from typing import Any

from sqlalchemy.orm import Session

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioRolInstalacion,
    CentroAcopioTipo,
)
from app.centros_acopio import file_store, geo_db
from app.centros_acopio.nacional_sync import denue_establecimiento_to_centro
from app.city.inegi_catalog import ESTADOS_MX, fetch_municipios_inegi, get_municipio_by_clave_resolved
from app.data.adapters.denue import DenueAdapter

logger = logging.getLogger(__name__)

RATE_LIMIT_S = float(os.getenv("GEO_SYNC_RATE_LIMIT_S", "0.3"))


def _operador_from_denue(est: dict, *, cve: str, zm: str, estado: str) -> CentroAcopio:
    centro = denue_establecimiento_to_centro(est, clave_inegi=cve, zm=zm, estado=estado)
    centro.centro_id = f"op-cand-{est.get('id', cve)}"
    centro.tipo = CentroAcopioTipo.centro_municipal
    centro.rol_instalacion = CentroAcopioRolInstalacion.bodega_operador
    centro.es_operador_principal = True
    centro.verificado = False
    centro.score_confianza = min(0.55, centro.score_confianza)
    centro.fuente = "denue_candidato_operador"
    centro.notas = f"Candidato operador SCIAN 562111 · {centro.notas or ''}"[:280]
    return centro


def _load_perfil_operadores(cve: str) -> list[CentroAcopio]:
    centros = file_store.load_operadores(cve)
    for c in centros:
        c.fuente = "perfil_municipal"
        c.clave_inegi = cve
    return centros


def bootstrap_queue(db: Session) -> int:
    """Encola todos los municipios INEGI con status pending."""
    count = 0
    for estado_id, estado_nombre in ESTADOS_MX:
        rows = fetch_municipios_inegi(estado_id)
        for row in rows:
            cve = row.clave_inegi.zfill(5)
            existing = geo_db.get_sync_row(db, cve)
            if existing:
                continue
            geo_db.upsert_sync_row(
                db,
                clave_inegi=cve,
                municipio=row.nombre,
                estado=row.estado_nombre or estado_nombre,
                estado_id=estado_id,
                status="pending",
                total_centros=0,
                total_candidatos_operador=0,
                fuente=None,
            )
            count += 1
    db.commit()
    logger.info("Geo bootstrap: %d municipios encolados", count)
    return count


def sync_municipio(db: Session, clave_inegi: str, *, force: bool = False) -> dict[str, Any]:
    """Sincroniza un CVE: DENUE acopio + candidatos 562111 + override perfil."""
    cve = clave_inegi.zfill(5)
    row = get_municipio_by_clave_resolved(cve)
    if not row:
        geo_db.upsert_sync_row(
            db,
            clave_inegi=cve,
            municipio="Desconocido",
            estado="",
            estado_id=cve[:2],
            status="error",
            total_centros=0,
            total_candidatos_operador=0,
            fuente="denue",
            error_message="Municipio no resuelto en catálogo INEGI",
        )
        db.commit()
        return {"clave_inegi": cve, "error": "Municipio no resuelto"}

    sync_row = geo_db.get_sync_row(db, cve)
    if sync_row and sync_row.status == "synced" and not force:
        return {
            "clave_inegi": cve,
            "skipped": True,
            "total_centros": sync_row.total_centros,
        }

    adapter = DenueAdapter()
    result = adapter.get_centros_acopio_municipio(cve)
    establecimientos = result.get("establecimientos", [])

    centros: list[CentroAcopio] = []
    candidatos: list[CentroAcopio] = []
    for est in establecimientos:
        if not est.get("lat") or not est.get("lon"):
            continue
        scian = str(est.get("actividad_scian", ""))
        if scian == "562111":
            candidatos.append(
                _operador_from_denue(est, cve=cve, zm=row.zm_simulator_id, estado=row.estado_nombre)
            )
        else:
            centros.append(
                denue_establecimiento_to_centro(
                    est, clave_inegi=cve, zm=row.zm_simulator_id, estado=row.estado_nombre
                )
            )

    geo_db.upsert_centros_bulk(db, centros, cve)
    geo_db.replace_operadores_for_cve(db, candidatos, cve)

    perfil = _load_perfil_operadores(cve)
    for op in perfil:
        geo_db.upsert_centro(db, op)

    total = len(centros) + len(candidatos) + len(perfil)
    status = "synced" if total > 0 else "sin_datos"
    geo_db.upsert_sync_row(
        db,
        clave_inegi=cve,
        municipio=row.nombre,
        estado=row.estado_nombre,
        estado_id=row.estado_id,
        status=status,
        total_centros=len(centros),
        total_candidatos_operador=len(candidatos),
        fuente="denue",
        error_message=None,
    )

    file_store.save_municipio_centros(
        cve, centros, municipio=row.nombre, estado=row.estado_nombre, fuente="denue",
    )
    db.commit()
    return {
        "clave_inegi": cve,
        "municipio": row.nombre,
        "synced": len(centros),
        "candidatos_operador": len(candidatos),
        "perfil_operador": len(perfil),
        "total": total,
        "status": status,
    }


def sync_batch(db: Session, *, batch_size: int | None = None) -> dict[str, Any]:
    """Procesa hasta batch_size municipios pending."""
    from app.models.geo import GeoMunicipioSync

    size = batch_size or int(os.getenv("GEO_SYNC_BATCH_SIZE", "50"))
    pending = (
        db.query(GeoMunicipioSync)
        .filter(GeoMunicipioSync.status == "pending")
        .order_by(GeoMunicipioSync.clave_inegi)
        .limit(size)
        .all()
    )
    if not pending:
        bootstrap_queue(db)
        pending = (
            db.query(GeoMunicipioSync)
            .filter(GeoMunicipioSync.status == "pending")
            .order_by(GeoMunicipioSync.clave_inegi)
            .limit(size)
            .all()
        )

    results = []
    for row in pending:
        r = sync_municipio(db, row.clave_inegi)
        results.append(r)
        time.sleep(RATE_LIMIT_S)

    return {
        "processed": len(results),
        "batch_size": size,
        "results": results,
    }


def ensure_municipio_geo(db: Session, clave_inegi: str) -> dict[str, Any]:
    """Lazy sync — solo si pending o sin filas."""
    cve = clave_inegi.zfill(5)
    sync_row = geo_db.get_sync_row(db, cve)
    centros = geo_db.list_centros_db(db, clave_inegi=cve)
    if sync_row and sync_row.status in {"synced", "sin_datos"} and centros:
        return {"clave_inegi": cve, "lazy": False, "status": sync_row.status}
    if sync_row and sync_row.status == "pending":
        return sync_municipio(db, cve)
    if not sync_row:
        bootstrap_queue(db)
    return sync_municipio(db, cve)


def seed_json_to_db(db: Session) -> int:
    """One-shot: migra JSON git → Neon."""
    count = 0
    for centro in file_store.load_all_persisted():
        geo_db.upsert_centro(db, centro)
        count += 1
    db.commit()
    logger.info("Seed JSON → DB: %d centros", count)
    return count
