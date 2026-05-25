"""
Sincronización nacional de centros de acopio vía INEGI DENUE por CVE municipal.

Navigator: DENUE identifica establecimientos económicos registrados, no acopio informal.
Fuente oficial primaria; Places API como complemento opcional.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioRolInstalacion,
    CentroAcopioTipo,
)
from app.centros_acopio import file_store
from app.city.inegi_catalog import fetch_municipios_inegi, get_municipio_by_clave_resolved
from app.data.adapters.denue import DenueAdapter

logger = logging.getLogger(__name__)

_SCIAN_MATERIALS: dict[str, list[CentroAcopioMaterial]] = {
    "562112": [
        CentroAcopioMaterial.pet,
        CentroAcopioMaterial.carton,
        CentroAcopioMaterial.aluminio,
        CentroAcopioMaterial.otro,
    ],
    "562111": [CentroAcopioMaterial.organico, CentroAcopioMaterial.otro],
    "562119": [CentroAcopioMaterial.otro],
    "381111": [CentroAcopioMaterial.acero, CentroAcopioMaterial.aluminio],
    "381191": [
        CentroAcopioMaterial.pet,
        CentroAcopioMaterial.hdpe,
        CentroAcopioMaterial.carton,
        CentroAcopioMaterial.otro,
    ],
}


def _infer_tipo(scian: str) -> CentroAcopioTipo:
    if scian in {"381111", "381191"}:
        return CentroAcopioTipo.chatarreria
    if scian == "562112":
        return CentroAcopioTipo.empresa_recicladora
    if scian == "562111":
        return CentroAcopioTipo.centro_municipal
    return CentroAcopioTipo.otro


def denue_establecimiento_to_centro(
    est: dict,
    *,
    clave_inegi: str,
    zm: str,
    estado: str,
) -> CentroAcopio:
    scian = str(est.get("actividad_scian", ""))
    materiales = _SCIAN_MATERIALS.get(scian, [CentroAcopioMaterial.otro])
    centro_id = f"denue-{est.get('id', clave_inegi)}"
    return CentroAcopio(
        centro_id=centro_id,
        nombre=str(est.get("nombre", "Establecimiento DENUE")),
        tipo=_infer_tipo(scian),
        direccion=f"{est.get('municipio', '')}, {estado}",
        municipio=str(est.get("municipio", "")),
        estado=estado,
        clave_inegi=clave_inegi.zfill(5),
        zm=zm,
        lat=est.get("lat"),
        lon=est.get("lon"),
        materiales=materiales,
        acepta_publico=False,
        acepta_empresa=True,
        rol_instalacion=CentroAcopioRolInstalacion.centro_acopio,
        fuente="denue",
        verificado=False,
        score_confianza=0.72,
        notas=f"SCIAN {scian} · {est.get('actividad_label', '')}",
    )


def sync_municipio_denue(
    clave_inegi: str,
    *,
    force: bool = False,
) -> dict:
    """
    Consulta DENUE para un municipio y persiste en data/geo/centros_acopio/municipios/.
    Si ya existe archivo y force=False, retorna existente sin re-consultar.
    """
    cve = clave_inegi.zfill(5)
    if not force and file_store.municipio_file(cve).exists():
        existing = file_store.load_municipio_centros(cve)
        return {
            "clave_inegi": cve,
            "synced": 0,
            "total": len(existing),
            "skipped": True,
            "message": "Ya existe catálogo local; use force=true para re-sincronizar.",
        }

    row = get_municipio_by_clave_resolved(cve)
    if not row:
        file_store.save_municipio_centros(
            cve, [], municipio="Desconocido", estado="", fuente="denue",
        )
        return {
            "clave_inegi": cve,
            "synced": 0,
            "total": 0,
            "error": "Municipio no resuelto en catálogo INEGI",
        }

    adapter = DenueAdapter()
    result = adapter.get_centros_acopio_municipio(cve)
    establecimientos = result.get("establecimientos", [])
    centros = [
        denue_establecimiento_to_centro(
            est,
            clave_inegi=cve,
            zm=row.zm_simulator_id,
            estado=row.estado_nombre,
        )
        for est in establecimientos
        if est.get("lat") and est.get("lon")
    ]

    file_store.save_municipio_centros(
        cve,
        centros,
        municipio=row.nombre,
        estado=row.estado_nombre,
        fuente="denue",
    )
    logger.info("DENUE sync %s (%s): %d centros", cve, row.nombre, len(centros))
    return {
        "clave_inegi": cve,
        "municipio": row.nombre,
        "estado": row.estado_nombre,
        "synced": len(centros),
        "total": len(centros),
        "provenance": result.get("provenance"),
    }


def sync_estado_denue(estado_id: str, *, force: bool = False, limit: Optional[int] = None) -> dict:
    """Sincroniza todos los municipios de una entidad federativa."""
    eid = estado_id.strip().zfill(2)
    rows = fetch_municipios_inegi(eid)
    if limit is not None:
        rows = rows[: max(0, limit)]

    results = []
    total_centros = 0
    for row in rows:
        r = sync_municipio_denue(row.clave_inegi, force=force)
        total_centros += r.get("total", 0)
        results.append(r)

    sin_datos = sum(1 for r in results if r.get("total", 0) == 0)
    return {
        "estado_id": eid,
        "municipios_procesados": len(results),
        "total_centros": total_centros,
        "municipios_sin_datos": sin_datos,
        "detalle": results,
    }
