#!/usr/bin/env python3
"""
Barrido nacional — Google Places + DENUE + candidato operador por municipio.

Orden por defecto: SLP (24) → Nuevo León (19) → resto de entidades 01–32.
Reanuda desde data/geo/nacional_sync_progress.json si existe.

Uso:
  export GOOGLE_PLACES_API_KEY=...
  cd backend && python3 scripts/sync_nacional_mexico.py --force
  python3 scripts/sync_nacional_mexico.py --estados 19,24 --force
  python3 scripts/sync_nacional_mexico.py --google-api-key AIza... --force
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_BACKEND = _REPO / "backend"
for p in (_BACKEND, _REPO):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

PROGRESS_PATH = _REPO / "data" / "geo" / "nacional_sync_progress.json"
DEPOT_REPORT_PATH = _REPO / "data" / "geo" / "depot_por_municipio.json"

# Prioridad piloto ZM + SLP primero, luego NL
DEFAULT_ESTADO_ORDER = [
    "24",  # SLP
    "19",  # Nuevo León
    "22",  # QRO
    "14",  # Jalisco / GDL
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "15", "16", "17", "18", "20", "21", "23",
    "25", "26", "27", "28", "29", "30", "31", "32",
]

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger("sync_nacional")


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


def _save_progress(data: dict) -> None:
    PROGRESS_PATH.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    PROGRESS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _build_depot_report(db) -> dict:
    from app.centros_acopio.geo_report import build_depot_report

    return build_depot_report(db)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync geo nacional México")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--estados", type=str, default=None, help="CSV CVE entidad, ej. 19,24")
    parser.add_argument("--google-api-key", type=str, default=None)
    parser.add_argument("--skip-denue", action="store_true")
    parser.add_argument("--denue-only", action="store_true", help="Solo DENUE+perfil, sin Places")
    parser.add_argument("--depot-report-only", action="store_true")
    parser.add_argument("--resume", action="store_true", default=True)
    args = parser.parse_args()

    _load_env()
    if args.google_api_key:
        os.environ["GOOGLE_PLACES_API_KEY"] = args.google_api_key.strip()
        os.environ["MAPS_PLATFORM_API"] = args.google_api_key.strip()

    from app.google.config import resolve_google_places_api_key
    from app.db.session import get_sync_db, is_db_available
    from app.centros_acopio.geo_worker import bootstrap_estado_queue, sync_estado
    from app.centros_acopio.places_sync import sync_estado_places

    if not is_db_available():
        logger.error("DATABASE_URL no disponible")
        return 1

    places_ok = bool(resolve_google_places_api_key())
    if not places_ok and not args.depot_report_only and not args.denue_only:
        logger.error(
            "Sin GOOGLE_PLACES_API_KEY — pase --google-api-key, --denue-only, o configure backend/.env"
        )
        return 2

    estados = DEFAULT_ESTADO_ORDER
    if args.estados:
        estados = [e.strip().zfill(2) for e in args.estados.split(",")]

    progress = {"estados_completados": [], "estados": {}}
    if args.resume and PROGRESS_PATH.is_file():
        try:
            progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    with get_sync_db() as db:
        if db is None:
            return 1

        if args.depot_report_only:
            rep = _build_depot_report(db)
            logger.info("Depot report: %s", DEPOT_REPORT_PATH)
            print(json.dumps(rep["resumen"], ensure_ascii=False, indent=2))
            return 0

        for eid in estados:
            if eid in progress.get("estados_completados", []) and not args.force:
                logger.info("Estado %s ya completado — skip", eid)
                continue

            logger.info("========== ENTIDAD %s ==========", eid)
            bootstrap_estado_queue(db, eid)

            if not args.skip_denue:
                denue_res = sync_estado(db, eid, force=args.force, use_places=False)
                logger.info(
                    "DENUE %s: %d municipios, %d con datos",
                    eid,
                    denue_res["municipios_procesados"],
                    denue_res["municipios_con_datos"],
                )

            places_res = {"skipped": True}
            if not args.denue_only:
                places_res = sync_estado_places(db, eid, force=args.force)
                logger.info(
                    "Places %s: %d POI, %d municipios con datos, errores=%d",
                    eid,
                    places_res.get("total_places_inserted", 0),
                    places_res.get("municipios_con_places", 0),
                    places_res.get("errors", 0),
                )

            progress["estados"][eid] = {
                "places": {
                    "municipios_procesados": places_res.get("municipios_procesados"),
                    "total_places": places_res.get("total_places_inserted", 0),
                    "errors": places_res.get("errors"),
                },
            }
            if eid not in progress.get("estados_completados", []):
                progress.setdefault("estados_completados", []).append(eid)
            _save_progress(progress)

            if not args.denue_only:
                from app.google.quota_guard import check_quota
                if not check_quota(db, "google_places", units=1)["allowed"]:
                    logger.warning("Cuota google_places agotada — deteniendo barrido nacional")
                    break

        logger.info("Generando mapa depósitos por municipio…")
        rep = _build_depot_report(db)
        _save_progress({**progress, "depot_resumen": rep["resumen"]})
        print(json.dumps({
            "ok": True,
            "estados_completados": progress.get("estados_completados"),
            "depot_resumen": rep["resumen"],
            "progress_file": str(PROGRESS_PATH),
            "depot_file": str(DEPOT_REPORT_PATH),
        }, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
