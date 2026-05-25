"""
Persistencia en disco de centros de acopio y cobertura nacional por CVE INEGI.

Estructura monorepo:
  data/geo/centros_acopio/municipios/{cve}.json
  data/geo/centros_acopio/coverage_manifest.json
  data/geo/operadores_logisticos/{cve}.json
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.agents.schemas import CentroAcopio
from app.repo_paths import repo_root

logger = logging.getLogger(__name__)

GEO_ROOT = repo_root() / "data" / "geo"
MUNICIPIOS_DIR = GEO_ROOT / "centros_acopio" / "municipios"
OPERADORES_DIR = GEO_ROOT / "operadores_logisticos"
MANIFEST_PATH = GEO_ROOT / "centros_acopio" / "coverage_manifest.json"


def _ensure_dirs() -> None:
    MUNICIPIOS_DIR.mkdir(parents=True, exist_ok=True)
    OPERADORES_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_manifest() -> dict[str, Any]:
    _ensure_dirs()
    if not MANIFEST_PATH.exists():
        return {
            "version": "1.0.0",
            "updated_at": _now_iso(),
            "municipios": {},
            "totales": {"municipios_catalogados": 0, "con_datos": 0, "sin_datos": 0},
        }
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Manifest corrupto, reiniciando: %s", exc)
        return {"version": "1.0.0", "updated_at": _now_iso(), "municipios": {}, "totales": {}}


def save_manifest(manifest: dict[str, Any]) -> None:
    _ensure_dirs()
    municipios = manifest.get("municipios", {})
    con_datos = sum(1 for m in municipios.values() if (m.get("total_centros") or 0) > 0)
    sin_datos = sum(1 for m in municipios.values() if (m.get("total_centros") or 0) == 0)
    manifest["updated_at"] = _now_iso()
    manifest["totales"] = {
        "municipios_catalogados": len(municipios),
        "con_datos": con_datos,
        "sin_datos": sin_datos,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def update_manifest_entry(
    clave_inegi: str,
    *,
    municipio: str,
    estado: str,
    total_centros: int,
    fuente: str,
    status: str,
) -> dict[str, Any]:
    manifest = load_manifest()
    municipios = manifest.setdefault("municipios", {})
    municipios[clave_inegi.zfill(5)] = {
        "clave_inegi": clave_inegi.zfill(5),
        "municipio": municipio,
        "estado": estado,
        "total_centros": total_centros,
        "fuente": fuente,
        "status": status,
        "synced_at": _now_iso(),
    }
    save_manifest(manifest)
    return manifest


def municipio_file(clave_inegi: str) -> Path:
    return MUNICIPIOS_DIR / f"{clave_inegi.zfill(5)}.json"


def operador_file(clave_inegi: str) -> Path:
    return OPERADORES_DIR / f"{clave_inegi.zfill(5)}.json"


def load_municipio_centros(clave_inegi: str) -> list[CentroAcopio]:
    path = municipio_file(clave_inegi)
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows = payload.get("centros", payload if isinstance(payload, list) else [])
        return [CentroAcopio.model_validate(row) for row in rows]
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        logger.warning("No se pudo leer %s: %s", path, exc)
        return []


def save_municipio_centros(
    clave_inegi: str,
    centros: list[CentroAcopio],
    *,
    municipio: str,
    estado: str,
    fuente: str,
) -> None:
    _ensure_dirs()
    cve = clave_inegi.zfill(5)
    payload = {
        "clave_inegi": cve,
        "municipio": municipio,
        "estado": estado,
        "fuente": fuente,
        "updated_at": _now_iso(),
        "centros": [c.model_dump(mode="json") for c in centros],
    }
    municipio_file(cve).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    status = "con_datos" if centros else "sin_datos"
    update_manifest_entry(
        cve,
        municipio=municipio,
        estado=estado,
        total_centros=len(centros),
        fuente=fuente,
        status=status,
    )


def load_operadores(clave_inegi: str) -> list[CentroAcopio]:
    path = operador_file(clave_inegi)
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows = payload.get("instalaciones", [])
        return [CentroAcopio.model_validate(row) for row in rows]
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        logger.warning("No se pudo leer operadores %s: %s", path, exc)
        return []


def load_all_persisted() -> list[CentroAcopio]:
    _ensure_dirs()
    seen: set[str] = set()
    out: list[CentroAcopio] = []
    for directory in (MUNICIPIOS_DIR, OPERADORES_DIR):
        for path in sorted(directory.glob("*.json")):
            cve = path.stem
            loader = load_operadores if directory == OPERADORES_DIR else load_municipio_centros
            for centro in loader(cve):
                if centro.centro_id in seen:
                    continue
                seen.add(centro.centro_id)
                out.append(centro)
    return out


def coverage_summary() -> dict[str, Any]:
    manifest = load_manifest()
    return {
        "manifest": manifest,
        "geo_root": str(GEO_ROOT),
    }
