#!/usr/bin/env python3
"""BIOS Fase 4: backup pre-migracion del piloto SLP.

El backup es deliberadamente conservador: empaca fuentes, datos derivados,
documentos municipales SLP y configuracion/calculos que forman el piloto.
Tambien escribe un manifest con sha256 para comparacion post-migracion.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO / "backend") not in sys.path:
    sys.path.insert(0, str(REPO / "backend"))

BACKUP_INPUTS = [
    "docs/municipalities/SLP",
    "docs/audit",
    "data/planning",
    "data/lifecycle",
    "data/environmental",
    "data/assets",
    "backend/data",
    "frontend/src/store/simulatorStore.ts",
    "frontend/src/lib/calculator.ts",
    "frontend/src/lib/simulator/clientModuleRegistry.ts",
    "frontend/src/lib/chapterConfig.ts",
    "frontend/src/data",
    "fuentes de calculo",
    "Investigacion_Precios_RSU_SLP.xlsx",
    "Tabla_Maestra_Fuentes_CapituloSLP.docx",
    "SLP ( contexto )  /DOCS",
]

CRITICAL_BUCKETS = {
    "bibliografia": [
        "docs/municipalities/SLP",
        "Tabla_Maestra_Fuentes_CapituloSLP.docx",
        "fuentes de calculo/Tabla_Maestra_Fuentes_CapituloSLP.docx",
        "SLP ( contexto )  /DOCS/CAPITULO SAN LUIS POTOSÍ.docx",
        "SLP ( contexto )  /DOCS/CAPITULO SAN LUIS POTOSÍ(1).docx",
    ],
    "calculos_base": [
        "frontend/src/lib/calculator.ts",
        "fuentes de calculo",
        "Investigacion_Precios_RSU_SLP.xlsx",
        "data/lifecycle",
        "data/environmental",
    ],
    "escenarios": [
        "frontend/src/store/simulatorStore.ts",
        "data/planning",
        "SLP ( contexto )  /DOCS/Modelo_BASED.xlsx",
        "SLP ( contexto )  /DOCS/Gantt_RSUSLP.xlsx",
    ],
    "configuraciones": [
        "frontend/src/lib/chapterConfig.ts",
        "frontend/src/lib/simulator/clientModuleRegistry.ts",
        "data/assets",
        "backend/data/state",
    ],
    "fuentes_provenance": [
        "frontend/src/data",
        "backend/data",
        "data/environmental/lca_factors.json",
        "docs/audit",
    ],
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def iter_files(input_path: Path) -> list[Path]:
    if not input_path.exists():
        return []
    if input_path.is_file():
        return [input_path]
    return sorted(p for p in input_path.rglob("*") if p.is_file())


def build_manifest() -> dict:
    files = []
    missing_inputs = []
    seen: set[str] = set()
    for rel in BACKUP_INPUTS:
        root = REPO / rel
        found = iter_files(root)
        if not found:
            missing_inputs.append(rel)
            continue
        for path in found:
            arcname = path.relative_to(REPO).as_posix()
            if arcname in seen:
                continue
            seen.add(arcname)
            files.append({
                "path": arcname,
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            })

    bucket_status = {}
    paths = {entry["path"] for entry in files}
    for bucket, rels in CRITICAL_BUCKETS.items():
        matched = [
            path for path in paths
            if any(path == rel or path.startswith(f"{rel.rstrip('/')}/") for rel in rels)
        ]
        bucket_status[bucket] = {
            "files": len(matched),
            "status": "present" if matched else "missing",
        }

    return {
        "schema": "alquimia.slp.phase4.backup_manifest.v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "repo": str(REPO),
        "tenant_id": "slp-capital",
        "critical_buckets": bucket_status,
        "missing_inputs": missing_inputs,
        "files": files,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="backups/phase4-slp")
    args = parser.parse_args()

    out_dir = REPO / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    manifest = build_manifest()
    manifest_path = out_dir / f"slp-phase4-pre-migration-{stamp}.manifest.json"
    archive_path = out_dir / f"slp-phase4-pre-migration-{stamp}.tgz"

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    with tarfile.open(archive_path, "w:gz") as tar:
        for entry in manifest["files"]:
            tar.add(REPO / entry["path"], arcname=entry["path"])
        tar.add(manifest_path, arcname=manifest_path.relative_to(REPO))

    archive_sha = sha256_file(archive_path)
    summary = {
        "ok": True,
        "archive": archive_path.relative_to(REPO).as_posix(),
        "archive_sha256": archive_sha,
        "manifest": manifest_path.relative_to(REPO).as_posix(),
        "files": len(manifest["files"]),
        "critical_buckets": manifest["critical_buckets"],
        "missing_inputs": manifest["missing_inputs"],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
