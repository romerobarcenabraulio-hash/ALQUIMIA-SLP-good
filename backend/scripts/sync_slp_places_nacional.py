#!/usr/bin/env python3
"""
Barrido San Luis Potosí (estado 24) — Google Places + DENUE → Neon + JSON.

Requiere en backend/.env:
  DATABASE_URL, GOOGLE_PLACES_API_KEY o MAPS_PLATFORM_API
Opcional: INEGI_DENUE_TOKEN, GEOCODING_API
"""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("sync_slp")


def _load_env() -> None:
    env_path = _REPO / "backend" / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main() -> int:
    _load_env()
    from app.google.config import resolve_google_places_api_key
    from app.db.session import get_sync_db, is_db_available
    from app.centros_acopio.geo_worker import bootstrap_queue, seed_json_to_db, sync_estado

    if not is_db_available():
        logger.error("DATABASE_URL no disponible — instala psycopg2 y configura Neon")
        return 1

    places_ok = bool(resolve_google_places_api_key())
    if not places_ok:
        logger.error(
            "Sin GOOGLE_PLACES_API_KEY ni MAPS_PLATFORM_API en backend/.env — "
            "no se puede llamar Google Places. Agrega la clave y vuelve a ejecutar."
        )
        return 2

    force = "--force" in sys.argv
    with get_sync_db() as db:
        if db is None:
            return 1
        logger.info("Seed JSON git → Neon")
        seed_json_to_db(db)
        from app.centros_acopio.geo_worker import bootstrap_estado_queue

        logger.info("Bootstrap cola SLP (solo faltantes)")
        bootstrap_estado_queue(db, "24")
        logger.info("Iniciando barrido SLP (59 municipios) DENUE + Places — force=%s", force)
        result = sync_estado(db, "24", force=force, use_places=True)
        out = _REPO / "data" / "geo" / "centros_acopio" / "slp_places_sync_report.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info(
            "Completado: %d municipios, %d con datos — reporte %s",
            result["municipios_procesados"],
            result["municipios_con_datos"],
            out,
        )
        print(json.dumps({
            "ok": True,
            "municipios_procesados": result["municipios_procesados"],
            "municipios_con_datos": result["municipios_con_datos"],
            "report": str(out),
        }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
