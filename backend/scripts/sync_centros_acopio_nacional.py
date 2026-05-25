#!/usr/bin/env python3
"""
Sincroniza catálogo nacional de centros de acopio (INEGI DENUE) por municipio o entidad.

Uso:
  python backend/scripts/sync_centros_acopio_nacional.py --cve 24028
  python backend/scripts/sync_centros_acopio_nacional.py --estado 24 --limit 5
  python backend/scripts/sync_centros_acopio_nacional.py --estado 24 --force

Requiere INEGI_DENUE_TOKEN en entorno (o usa catálogo offline piloto SLP).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Raíz monorepo en PYTHONPATH
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT / "backend"))

from app.centros_acopio import nacional_sync  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync centros de acopio DENUE — México")
    parser.add_argument("--cve", help="CVE INEGI municipal (5 dígitos)")
    parser.add_argument("--estado", help="CVE entidad INEGI (2 dígitos)")
    parser.add_argument("--force", action="store_true", help="Re-sincronizar aunque exista archivo")
    parser.add_argument("--limit", type=int, default=None, help="Máx municipios por entidad")
    args = parser.parse_args()

    if not args.cve and not args.estado:
        parser.error("Indique --cve o --estado")

    if args.cve:
        result = nacional_sync.sync_municipio_denue(args.cve, force=args.force)
    else:
        result = nacional_sync.sync_estado_denue(
            args.estado, force=args.force, limit=args.limit,
        )

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
