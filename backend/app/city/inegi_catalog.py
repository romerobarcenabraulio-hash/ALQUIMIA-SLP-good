"""
Catálogo territorial México — 32 entidades + municipios vía INEGI Gaia (CVE oficial).

Navigator: almacenamiento EPSG:4326; aquí solo metadatos administrativos (CVEgeo).
"""
from __future__ import annotations

import logging
import json
from functools import lru_cache
from typing import Any

import httpx

from app.repo_paths import repo_root
from app.city.municipios_mx import (
    GEN_KG_HAB_MODEL,
    MunicipioMxRow,
    get_municipio_mx_by_clave,
)

logger = logging.getLogger(__name__)

INEGI_MGEM_URL = "https://gaia.inegi.org.mx/wscatgeo/v2/mgem/{estado_id}"

# CVE entidad INEGI → nombre oficial
ESTADOS_MX: tuple[tuple[str, str], ...] = (
    ("01", "Aguascalientes"),
    ("02", "Baja California"),
    ("03", "Baja California Sur"),
    ("04", "Campeche"),
    ("05", "Coahuila de Zaragoza"),
    ("06", "Colima"),
    ("07", "Chiapas"),
    ("08", "Chihuahua"),
    ("09", "Ciudad de México"),
    ("10", "Durango"),
    ("11", "Guanajuato"),
    ("12", "Guerrero"),
    ("13", "Hidalgo"),
    ("14", "Jalisco"),
    ("15", "México"),
    ("16", "Michoacán de Ocampo"),
    ("17", "Morelos"),
    ("18", "Nayarit"),
    ("19", "Nuevo León"),
    ("20", "Oaxaca"),
    ("21", "Puebla"),
    ("22", "Querétaro"),
    ("23", "Quintana Roo"),
    ("24", "San Luis Potosí"),
    ("25", "Sinaloa"),
    ("26", "Sonora"),
    ("27", "Tabasco"),
    ("28", "Tamaulipas"),
    ("29", "Tlaxcala"),
    ("30", "Veracruz de Ignacio de la Llave"),
    ("31", "Yucatán"),
    ("32", "Zacatecas"),
)

# Estados con ZM simulador pre-calibrada (semilla ALQUIMIA)
_ZM_BY_ESTADO: dict[str, str] = {
    "24": "SLP",
    "22": "QRO",
    "19": "MTY",
    "14": "GDL",
}

_municipios_cache: dict[str, list[MunicipioMxRow]] = {}


def list_estados_completos() -> list[tuple[str, str]]:
    return list(ESTADOS_MX)


def zm_for_estado(estado_id: str) -> str:
    eid = estado_id.strip().zfill(2)
    return _ZM_BY_ESTADO.get(eid, f"EDO{eid}")


def municipio_simulator_id_from_cve(clave_inegi: str) -> str:
    cve = clave_inegi.strip().zfill(5)
    seed = get_municipio_mx_by_clave(cve)
    if seed:
        return seed.municipio_simulator_id
    return f"m{cve}"


def _rsu_ton_dia(poblacion: int) -> float:
    return round(poblacion * GEN_KG_HAB_MODEL / 1000.0, 4)


def _row_from_inegi_item(item: dict[str, Any], estado_nombre: str) -> MunicipioMxRow:
    cvegeo = str(item.get("cvegeo", "")).zfill(5)
    estado_id = str(item.get("cve_ent", cvegeo[:2])).zfill(2)
    try:
        poblacion = int(str(item.get("pob_total", "0")).replace(",", "") or "0")
    except ValueError:
        poblacion = 50_000
    if poblacion <= 0:
        poblacion = 50_000
    seed = get_municipio_mx_by_clave(cvegeo)
    if seed:
        return seed
    return MunicipioMxRow(
        clave_inegi=cvegeo,
        nombre=str(item.get("nomgeo", "Municipio")),
        estado_nombre=estado_nombre,
        estado_id=estado_id,
        poblacion=poblacion,
        generacion_rsu_dia=_rsu_ton_dia(poblacion),
        zm_simulator_id=zm_for_estado(estado_id),
        municipio_simulator_id=municipio_simulator_id_from_cve(cvegeo),
        datos_estimados=True,
    )


def _rows_from_geo_manifest(estado_id: str, estado_nombre: str) -> list[MunicipioMxRow]:
    manifest_path = repo_root() / "data" / "geo" / "centros_acopio" / "coverage_manifest.json"
    if not manifest_path.is_file():
        return []
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Coverage manifest no disponible para estado %s: %s", estado_id, exc)
        return []

    rows: list[MunicipioMxRow] = []
    municipios = payload.get("municipios", {})
    if not isinstance(municipios, dict):
        return rows
    for cve, item in municipios.items():
        if not isinstance(item, dict):
            continue
        cvegeo = str(item.get("clave_inegi") or cve).zfill(5)
        if cvegeo[:2] != estado_id:
            continue
        seed = get_municipio_mx_by_clave(cvegeo)
        if seed:
            rows.append(seed)
            continue
        rows.append(
            MunicipioMxRow(
                clave_inegi=cvegeo,
                nombre=str(item.get("municipio") or "Municipio"),
                estado_nombre=str(item.get("estado") or estado_nombre),
                estado_id=estado_id,
                poblacion=50_000,
                generacion_rsu_dia=_rsu_ton_dia(50_000),
                zm_simulator_id=zm_for_estado(estado_id),
                municipio_simulator_id=municipio_simulator_id_from_cve(cvegeo),
                datos_estimados=True,
            )
        )
    return rows


def fetch_municipios_inegi(estado_id: str) -> list[MunicipioMxRow]:
    """Consulta INEGI Gaia por entidad; cache en memoria por proceso."""
    eid = estado_id.strip().zfill(2)
    if eid in _municipios_cache:
        return _municipios_cache[eid]

    estado_nombre = dict(ESTADOS_MX).get(eid, f"Entidad {eid}")
    rows: list[MunicipioMxRow] = []
    try:
        url = INEGI_MGEM_URL.format(estado_id=eid)
        with httpx.Client(timeout=25.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            payload = resp.json()
        datos = payload.get("datos") if isinstance(payload, dict) else None
        if isinstance(datos, list):
            for item in datos:
                if isinstance(item, dict):
                    rows.append(_row_from_inegi_item(item, estado_nombre))
    except Exception as exc:
        logger.warning("INEGI Gaia no disponible para estado %s: %s", eid, exc)

    manifest_rows = _rows_from_geo_manifest(eid, estado_nombre)
    if len(rows) < len(manifest_rows):
        merged = {r.clave_inegi: r for r in manifest_rows}
        merged.update({r.clave_inegi: r for r in rows})
        rows = list(merged.values())

    if not rows:
        from app.city.municipios_mx import list_municipios_mx
        rows = list_municipios_mx(eid)

    rows.sort(key=lambda r: r.nombre)
    _municipios_cache[eid] = rows
    return rows


@lru_cache(maxsize=512)
def get_municipio_by_clave_resolved(clave_inegi: str) -> MunicipioMxRow | None:
    cve = clave_inegi.strip().zfill(5)
    seed = get_municipio_mx_by_clave(cve)
    if seed:
        return seed
    estado_id = cve[:2]
    for row in fetch_municipios_inegi(estado_id):
        if row.clave_inegi == cve:
            return row
    return None
