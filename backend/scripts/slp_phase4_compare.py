#!/usr/bin/env python3
"""AUDITOR Fase 4: comparacion pre/post y gate de aceptacion."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO / "backend") not in sys.path:
    sys.path.insert(0, str(REPO / "backend"))

TENANT_ID = "slp-capital"
VALIDATION_STAGE = "validation"
FUTURE_STAGES = ("planning", "execution")


def load_env() -> None:
    env_path = REPO / "backend" / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_registry() -> dict:
    return json.loads((REPO / "docs" / "architecture" / "capability_registry.json").read_text(encoding="utf-8"))


def compare_manifest(manifest_path: Path) -> dict:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    changed = []
    missing = []
    for entry in manifest.get("files", []):
        path = REPO / entry["path"]
        if not path.exists():
            missing.append(entry["path"])
            continue
        current_sha = sha256_file(path)
        if current_sha != entry["sha256"]:
            changed.append({"path": entry["path"], "before": entry["sha256"], "after": current_sha})
    return {
        "backup_manifest": manifest_path.relative_to(REPO).as_posix(),
        "files_checked": len(manifest.get("files", [])),
        "changed": changed,
        "missing": missing,
        "critical_buckets": manifest.get("critical_buckets", {}),
    }


def tenant_report() -> dict:
    load_env()
    from app.admin.tenant_state import TenantStateError, assert_can_access_stage
    from app.db.session import get_sync_db, is_db_available
    from app.models.admin_tenant import AdminTenant
    from sqlalchemy.orm import selectinload

    if not is_db_available():
        return {"ok": False, "error": "DATABASE_URL no disponible"}
    with get_sync_db() as db:
        tenant = (
            db.query(AdminTenant)
            .options(
                selectinload(AdminTenant.state),
                selectinload(AdminTenant.capabilities),
                selectinload(AdminTenant.gates),
                selectinload(AdminTenant.audit_log),
            )
            .filter(AdminTenant.id == TENANT_ID)
            .first()
        )
        if tenant is None:
            return {"ok": False, "error": "tenant slp-capital no existe"}
        allowed = {}
        for stage in (VALIDATION_STAGE, *FUTURE_STAGES):
            try:
                assert_can_access_stage(tenant.state.current_stage, stage)
                allowed[stage] = {"status": "allowed", "http_equivalent": 200}
            except TenantStateError as exc:
                allowed[stage] = {"status": "denied", "http_equivalent": 403, "detail": str(exc)}
        return {
            "ok": True,
            "tenant_id": tenant.id,
            "municipio": tenant.nombre,
            "estado": tenant.estado_mx,
            "current_stage": tenant.state.current_stage,
            "canonical_client_path": "/v" if tenant.state.current_stage == VALIDATION_STAGE else None,
            "tier_comercial": tenant.tier_comercial,
            "capabilities_active": sorted(cap.module_id for cap in tenant.capabilities if cap.active),
            "gates": {gate.gate_id: gate.status for gate in tenant.gates},
            "access": allowed,
            "audit_actions": [log.action for log in tenant.audit_log],
        }


def visibility_report(active_capabilities: list[str]) -> dict:
    registry = load_registry()
    active = set(active_capabilities)
    validation_visible = []
    future_stage_hidden = []
    future_stage_modules = []
    execution_hidden = []
    execution_modules = []
    for module in registry.get("modules", []):
        module_id = module["module_id"]
        platforms = module.get("platforms", [])
        if VALIDATION_STAGE in platforms and module_id in active:
            validation_visible.append(module_id)
        if VALIDATION_STAGE not in platforms:
            future_stage_modules.append(module_id)
            if module_id not in active:
                future_stage_hidden.append(module_id)
        if module.get("editable_in") == "execution":
            execution_modules.append(module_id)
            if module_id not in active:
                execution_hidden.append(module_id)
    return {
        "validation_visible": sorted(validation_visible),
        "future_stage_modules_hidden_for_slp_validation": sorted(future_stage_hidden),
        "future_stage_hidden_ok": sorted(future_stage_modules) == sorted(future_stage_hidden),
        "execution_modules_preserved_in_registry": sorted(execution_modules),
        "execution_modules_hidden_for_slp_validation": sorted(execution_hidden),
        "execution_hidden_ok": sorted(execution_modules) == sorted(execution_hidden),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--out", default="docs/migration/phase4/slp-phase4-comparison-report.json")
    args = parser.parse_args()

    manifest_path = (REPO / args.manifest).resolve()
    if not manifest_path.is_file():
        print(json.dumps({"ok": False, "error": f"manifest not found: {manifest_path}"}, ensure_ascii=False, indent=2))
        return 1

    file_report = compare_manifest(manifest_path)
    tenant = tenant_report()
    visibility = visibility_report(tenant.get("capabilities_active", []) if tenant.get("ok") else [])
    differences = {
        "changed_files": file_report["changed"],
        "missing_files": file_report["missing"],
    }
    ok = (
        tenant.get("ok") is True
        and tenant.get("current_stage") == VALIDATION_STAGE
        and tenant.get("access", {}).get("validation", {}).get("status") == "allowed"
        and tenant.get("canonical_client_path") == "/v"
        and tenant.get("access", {}).get("planning", {}).get("status") == "denied"
        and tenant.get("access", {}).get("execution", {}).get("status") == "denied"
        and visibility.get("future_stage_hidden_ok") is True
        and visibility.get("execution_hidden_ok") is True
        and not file_report["changed"]
        and not file_report["missing"]
    )

    report = {
        "schema": "alquimia.slp.phase4.comparison.v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ok": ok,
        "tenant": tenant,
        "visibility": visibility,
        "pre_post_data_integrity": file_report,
        "differences": differences,
        "auditor_statement": (
            "cero perdida detectada por hash en buckets criticos"
            if ok else
            "diferencias o bloqueo detectado; revisar reporte"
        ),
    }
    out = REPO / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": ok, "report": out.relative_to(REPO).as_posix(), "differences": differences}, ensure_ascii=False, indent=2))
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
