#!/usr/bin/env python3
"""Fase 10 operational smoke checks for ALQUIMIA staging/release gates."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
BACKEND = REPO / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def check(name: str, ok: bool, detail: str, severity: str = "P1") -> dict[str, Any]:
    return {
        "name": name,
        "ok": bool(ok),
        "severity_if_failed": severity,
        "detail": detail,
    }


def run_backend_health() -> list[dict[str, Any]]:
    os.environ.setdefault("HEALTH_DEEP_RELAX_AGORA", "1")
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    health = client.get("/health")
    results = [
        check(
            "backend_health",
            health.status_code == 200 and health.json().get("status") == "ok",
            f"GET /health -> {health.status_code}",
            "P0",
        )
    ]
    deep = client.get("/health/deep")
    body = deep.json() if deep.headers.get("content-type", "").startswith("application/json") else {}
    results.append(
        check(
            "backend_deep_health",
            deep.status_code == 200 and body.get("status") == "ok",
            f"GET /health/deep -> {deep.status_code}; status={body.get('status')}",
            "P1",
        )
    )
    return results


def admin_client():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.db.session import get_db
    from app.routers import admin
    from app.routers.auth import UserInfo

    admin._tenants_mem.clear()
    app = FastAPI()
    app.include_router(admin.router, prefix="/admin")

    def _admin_user():
        return UserInfo(
            id="phase10-auditor",
            nombre="Phase 10 Auditor",
            email="auditor@alquimia.mx",
            rol="admin",
            zm="ALL",
        )

    def _no_db():
        yield None

    app.dependency_overrides[admin.require_admin] = _admin_user
    app.dependency_overrides[admin.get_current_user] = _admin_user
    app.dependency_overrides[get_db] = _no_db
    return TestClient(app)


def create_tenant(client, municipio_id: str) -> dict[str, Any]:
    response = client.post(
        "/admin/tenants",
        json={
            "nombre": f"Smoke {municipio_id}",
            "estado_mx": "Smoke",
            "municipio_id": municipio_id,
            "inegi_clave": "00000",
            "tier_comercial": "diagnostico",
            "current_stage": "validation",
        },
    )
    if response.status_code != 201:
        return {"error": response.text, "status_code": response.status_code}
    return response.json()


def close_gate(client, tenant_id: str, gate_id: str) -> None:
    client.post(
        f"/admin/tenants/{tenant_id}/gates/{gate_id}/evidence",
        json={
            "evidencia_url": f"smoke://{tenant_id}/{gate_id}.pdf",
            "evidencia_label": f"Evidencia smoke {gate_id}",
            "decisor_humano": "Phase 10 Auditor",
        },
    )
    client.post(
        f"/admin/tenants/{tenant_id}/gates/{gate_id}/close",
        json={"decisor_humano": "Phase 10 Auditor"},
    )


def transition(client, tenant_id: str, target_stage: str) -> None:
    client.post(
        f"/admin/tenants/{tenant_id}/transition",
        json={
            "target_stage": target_stage,
            "manual_confirmation": True,
            "confirmed_by": "Phase 10 Auditor",
        },
    )


def move_tenant_to_stage(client, tenant: dict[str, Any], target_stage: str) -> dict[str, Any]:
    tenant_id = tenant["id"]
    if target_stage in {"planning", "execution"}:
        close_gate(client, tenant_id, "G1")
        transition(client, tenant_id, "planning")
    if target_stage == "execution":
        close_gate(client, tenant_id, "G2")
        transition(client, tenant_id, "execution")
    return client.get(f"/admin/tenants/{tenant_id}/state").json()


def run_stage_access_smoke() -> list[dict[str, Any]]:
    client = admin_client()
    results: list[dict[str, Any]] = []
    tenants = {
        "validation": create_tenant(client, "smoke-validation"),
        "planning": create_tenant(client, "smoke-planning"),
        "execution": create_tenant(client, "smoke-execution"),
    }
    tenants["planning"] = move_tenant_to_stage(client, tenants["planning"], "planning")
    tenants["execution"] = move_tenant_to_stage(client, tenants["execution"], "execution")

    results.append(
        check(
            "platform0_tenant_crud",
            all(
                (tenant.get("id") or tenant.get("tenant_id"))
                and len(tenant.get("gates", [])) == 5
                and tenant.get("capabilities")
                for tenant in tenants.values()
            ),
            "Create tenant seeds state, G1-G5 and active capabilities",
            "P0",
        )
    )

    expectations = [
        ("validation", "validation", 200, "/v"),
        ("validation", "planning", 403, None),
        ("validation", "execution", 403, None),
        ("planning", "planning", 200, "/p"),
        ("planning", "execution", 403, None),
        ("execution", "execution", 200, "/e"),
    ]
    for tenant_stage, platform_stage, expected_status, expected_path in expectations:
        tenant = tenants[tenant_stage]
        tenant_id = tenant.get("tenant_id") or tenant.get("id")
        response = client.get(f"/admin/tenants/{tenant_id}/platform-access/{platform_stage}")
        ok = response.status_code == expected_status
        detail = f"{tenant_stage} -> {platform_stage}: {response.status_code}"
        if expected_path:
            state = client.get(f"/admin/tenants/{tenant_id}/state")
            body = state.json()
            ok = ok and body.get("state", {}).get("current_stage") == tenant_stage
            detail += f"; canonical route {expected_path}; state={body.get('state', {}).get('current_stage')}"
        results.append(check(f"stage_access_{tenant_stage}_to_{platform_stage}", ok, detail, "P0"))

    blocked = client.post(
        f"/admin/tenants/{tenants['validation']['id']}/gates/G1/close",
        json={"decisor_humano": "Phase 10 Auditor"},
    )
    results.append(
        check(
            "gate_close_requires_evidence",
            blocked.status_code == 400 and "sin evidencia" in blocked.text,
            f"POST close G1 without evidence -> {blocked.status_code}",
            "P0",
        )
    )
    return results


def run_registry_and_frontend_checks() -> list[dict[str, Any]]:
    registry_path = REPO / "docs" / "architecture" / "capability_registry.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    modules = registry.get("modules", [])
    route_files = {
        "/v": REPO / "frontend" / "src" / "app" / "v" / "page.tsx",
        "/p": REPO / "frontend" / "src" / "app" / "p" / "page.tsx",
        "/e": REPO / "frontend" / "src" / "app" / "e" / "page.tsx",
        "/admin": REPO / "frontend" / "src" / "app" / "admin" / "page.tsx",
    }
    visual_files = [
        REPO / "docs" / "architecture" / "phase8_visual_evidence" / name
        for name in (
            "desktop-v-shell.png",
            "desktop-p-shell.png",
            "desktop-e-shell.png",
            "mobile-v-shell.png",
            "mobile-p-shell.png",
            "mobile-e-shell.png",
        )
    ]
    return [
        check(
            "capability_registry_parseable",
            bool(modules) and all("module_id" in module and "platforms" in module for module in modules),
            f"{len(modules)} modules loaded from capability_registry.json",
            "P0",
        ),
        check(
            "frontend_stage_routes_present",
            all(path.is_file() for path in route_files.values()),
            ", ".join(f"{route}:{path.exists()}" for route, path in route_files.items()),
            "P0",
        ),
        check(
            "visual_regression_evidence_present",
            all(path.is_file() and path.stat().st_size > 0 for path in visual_files),
            f"{sum(1 for path in visual_files if path.is_file())}/{len(visual_files)} screenshots present",
            "P2",
        ),
    ]


def run_slp_integrity(manifest: str | None) -> list[dict[str, Any]]:
    if not manifest:
        return [check("slp_integrity", False, "No manifest provided", "P0")]
    command = [
        str(BACKEND / ".venv" / "bin" / "python"),
        str(BACKEND / "scripts" / "slp_phase4_compare.py"),
        "--manifest",
        manifest,
        "--out",
        "docs/migration/phase4/slp-phase10-operational-comparison-report.json",
    ]
    proc = subprocess.run(command, cwd=REPO, text=True, capture_output=True, check=False)
    ok = proc.returncode == 0
    detail = proc.stdout.strip() or proc.stderr.strip() or f"exit={proc.returncode}"
    return [check("slp_pre_post_integrity", ok, detail, "P0")]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--slp-manifest",
        default="backups/phase4-slp/slp-phase4-pre-migration-20260528T034925Z.manifest.json",
        help="Backup manifest used to verify SLP pre/post integrity.",
    )
    parser.add_argument("--skip-slp", action="store_true", help="Skip DB-backed SLP integrity check.")
    parser.add_argument("--json", action="store_true", help="Print only JSON.")
    args = parser.parse_args()

    results: list[dict[str, Any]] = []
    for runner in (run_backend_health, run_stage_access_smoke, run_registry_and_frontend_checks):
        try:
            results.extend(runner())
        except Exception as exc:  # pragma: no cover - operational script
            results.append(check(runner.__name__, False, repr(exc), "P0"))
    if not args.skip_slp:
        results.extend(run_slp_integrity(args.slp_manifest))

    blockers = [result for result in results if not result["ok"] and result["severity_if_failed"] in {"P0", "P1"}]
    payload = {
        "schema": "alquimia.phase10.operational_smoke.v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ok": not blockers,
        "decision": "operate" if not blockers else "block_production",
        "results": results,
        "blockers": blockers,
    }
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    print(text if args.json else text)
    return 0 if payload["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
