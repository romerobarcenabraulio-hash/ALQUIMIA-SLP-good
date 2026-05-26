#!/usr/bin/env python3
"""CLI sync centros acopio nacional — bootstrap o batch DENUE."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))

from app.db.session import get_sync_db, is_db_available
from app.centros_acopio.geo_worker import bootstrap_queue, seed_json_to_db, sync_batch, sync_municipio


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync geo nacional centros acopio")
    parser.add_argument("--bootstrap", action="store_true", help="Encolar ~2469 CVE")
    parser.add_argument("--batch", type=int, default=50, help="Tamaño batch sync")
    parser.add_argument("--cve", type=str, help="Sync un municipio por CVE")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--seed-json", action="store_true", help="Migrar JSON git → Neon")
    args = parser.parse_args()

    if not is_db_available():
        print("ERROR: DATABASE_URL no disponible", file=sys.stderr)
        return 1

    with get_sync_db() as db:
        if db is None:
            print("ERROR: no se pudo abrir sesión DB", file=sys.stderr)
            return 1
        if args.seed_json:
            n = seed_json_to_db(db)
            print(f"Seed JSON: {n} centros")
        if args.bootstrap:
            n = bootstrap_queue(db)
            print(f"Bootstrap: {n} municipios encolados")
        if args.cve:
            r = sync_municipio(db, args.cve, force=args.force)
            print(r)
        elif not args.bootstrap and not args.seed_json:
            r = sync_batch(db, batch_size=args.batch)
            print(r)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
