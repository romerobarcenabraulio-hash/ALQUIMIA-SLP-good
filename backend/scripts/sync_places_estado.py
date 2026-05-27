#!/usr/bin/env python3
"""Sincroniza centros de acopio vía Google Places para todos los municipios de un estado."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))

# Cargar .env del backend si existe
_env = _REPO / "backend" / ".env"
if _env.is_file():
    for line in _env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            import os
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Google Places sync por estado INEGI")
    parser.add_argument("--estado", default="24", help="CVE entidad (24=SLP)")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--denue-first", action="store_true", help="DENUE+Places por municipio")
    args = parser.parse_args()

    from app.db.session import get_sync_db, is_db_available
    from app.centros_acopio.places_sync import sync_estado_places
    from app.centros_acopio.geo_worker import sync_municipio

    if not is_db_available():
        print("ERROR: DATABASE_URL no configurado", file=sys.stderr)
        return 1

    with get_sync_db() as db:
        if db is None:
            print("ERROR: sesión DB", file=sys.stderr)
            return 1

        if args.denue_first:
            from app.city.inegi_catalog import fetch_municipios_inegi
            munis = fetch_municipios_inegi(args.estado)
            if args.limit:
                munis = munis[: args.limit]
            for i, m in enumerate(munis):
                print(f"[DENUE+Places {i+1}/{len(munis)}] {m.clave_inegi} {m.nombre}")
                sync_municipio(db, m.clave_inegi, force=args.force)

        result = sync_estado_places(db, args.estado, force=args.force, limit=args.limit)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
