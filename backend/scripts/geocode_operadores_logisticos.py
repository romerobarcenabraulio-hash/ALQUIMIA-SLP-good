#!/usr/bin/env python3
"""CLI — geocodifica operadores_logisticos/*.json vía Google Maps."""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.centros_acopio.geocode_operadores import geocode_operadores  # noqa: E402


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cve", help="CVE INEGI municipal")
    args = parser.parse_args()
    results = await geocode_operadores(args.cve)
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
