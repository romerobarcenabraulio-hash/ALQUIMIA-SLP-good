#!/usr/bin/env python3
"""KRONOS Fase 4: upsert canonico del tenant SLP Capital."""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO / "backend") not in sys.path:
    sys.path.insert(0, str(REPO / "backend"))

TENANT_ID = "slp-capital"
MUNICIPIO_NOMBRE = "San Luis Potosí"
ESTADO_MX = "San Luis Potosí"
INEGI_CLAVE = "24028"
CURRENT_STAGE = "validation"
TIER_COMERCIAL = "diagnostico"
GATE_IDS = ("G1", "G2", "G3", "G4", "G5")


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


def load_registry() -> dict:
    return json.loads((REPO / "docs" / "architecture" / "capability_registry.json").read_text(encoding="utf-8"))


def validation_capabilities(registry: dict) -> list[str]:
    return [
        module["module_id"]
        for module in registry.get("modules", [])
        if module.get("default_active") is True
        and module.get("min_tier", "diagnostico") == "diagnostico"
        and CURRENT_STAGE in module.get("platforms", [])
    ]


def pending_data(registry: dict) -> list[dict]:
    known = {
        "social_diagnostico": ("carga_inicial", "Datos sociodemograficos pendientes de carga/cotejo municipal."),
        "mapeo_actores": ("carga_inicial", "Actores locales pendientes de carga nominal por municipio."),
        "organigrama_diagnostico": ("carga_inicial", "Matriz de autoridad requiere validacion municipal."),
        "organigrama": ("en_construccion", "Modulo de organigrama operativo preservado para etapa planning."),
    }
    rows = []
    for module in registry.get("modules", []):
        module_id = module["module_id"]
        if module_id in known:
            status, note = known[module_id]
            rows.append({
                "module_id": module_id,
                "status": status,
                "note": note,
                "no_inventar": True,
            })
    return rows


def upsert_tenant(db, capabilities: list[str], actor: str) -> dict:
    from app.models.admin_tenant import (
        AdminTenant,
        TenantAuditLog,
        TenantCapability,
        TenantGate,
        TenantState,
    )

    now = datetime.now(timezone.utc)
    tenant = db.query(AdminTenant).filter(AdminTenant.id == TENANT_ID).first()
    created = tenant is None
    if tenant is None:
        tenant = AdminTenant(
            id=TENANT_ID,
            nombre=MUNICIPIO_NOMBRE,
            estado_mx=ESTADO_MX,
            municipio_id=TENANT_ID,
            inegi_clave=INEGI_CLAVE,
            tier_comercial=TIER_COMERCIAL,
            activo=True,
        )
        db.add(tenant)
        db.flush()
    else:
        tenant.nombre = MUNICIPIO_NOMBRE
        tenant.estado_mx = ESTADO_MX
        tenant.municipio_id = TENANT_ID
        tenant.inegi_clave = INEGI_CLAVE
        tenant.tier_comercial = TIER_COMERCIAL
        tenant.activo = True
        tenant.updated_at = now

    state = db.query(TenantState).filter(TenantState.tenant_id == TENANT_ID).first()
    if state is None:
        db.add(TenantState(tenant_id=TENANT_ID, current_stage=CURRENT_STAGE, transition_mode="manual_only"))
    else:
        state.current_stage = CURRENT_STAGE
        state.transition_mode = "manual_only"
        state.fecha_cambio_stage = now
        state.notas = "Fase 4: migrado a arquitectura por etapa como piloto SLP en validation."

    existing_gates = {gate.gate_id: gate for gate in db.query(TenantGate).filter(TenantGate.tenant_id == TENANT_ID).all()}
    for gate_id in GATE_IDS:
        gate = existing_gates.get(gate_id)
        if gate is None:
            db.add(TenantGate(tenant_id=TENANT_ID, gate_id=gate_id))
        elif gate.status not in {"cerrado", "en_revision", "fallido"}:
            gate.status = "no_iniciado"

    for cap in db.query(TenantCapability).filter(TenantCapability.tenant_id == TENANT_ID).all():
        db.delete(cap)
    db.flush()
    for module_id in capabilities:
        db.add(
            TenantCapability(
                tenant_id=TENANT_ID,
                module_id=module_id,
                active=True,
                source="phase4_slp_registry_validation",
                metadata_json={"current_stage": CURRENT_STAGE, "tenant": TENANT_ID},
            )
        )

    db.add(
        TenantAuditLog(
            tenant_id=TENANT_ID,
            actor=actor,
            action="slp_phase4_migrated_to_validation",
            payload={
                "created": created,
                "current_stage": CURRENT_STAGE,
                "tier_comercial": TIER_COMERCIAL,
                "capabilities_count": len(capabilities),
                "automatic_stage_transition": False,
                "legacy_modules_deleted": False,
                "municipio_scope": "municipio",
                "zm_scope_copied": False,
            },
            created_at=now,
        )
    )
    db.flush()
    return {"created": created, "capabilities_count": len(capabilities)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--actor", default="phase4-migration")
    parser.add_argument("--evidence-dir", default="docs/migration/phase4")
    args = parser.parse_args()

    load_env()
    from app.db.session import create_all_tables, get_sync_db, is_db_available

    if not is_db_available():
        print(json.dumps({"ok": False, "error": "DATABASE_URL no disponible"}, ensure_ascii=False, indent=2))
        return 1
    create_all_tables()
    registry = load_registry()
    capabilities = validation_capabilities(registry)
    evidence_dir = REPO / args.evidence_dir
    evidence_dir.mkdir(parents=True, exist_ok=True)

    with get_sync_db() as db:
        if db is None:
            print(json.dumps({"ok": False, "error": "db session unavailable"}, ensure_ascii=False, indent=2))
            return 1
        result = upsert_tenant(db, capabilities, args.actor)

    evidence = {
        "schema": "alquimia.slp.phase4.migration.v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "tenant": {
            "tenant_id": TENANT_ID,
            "municipio": MUNICIPIO_NOMBRE,
            "estado": ESTADO_MX,
            "inegi_clave": INEGI_CLAVE,
            "current_stage": CURRENT_STAGE,
            "tier_comercial": TIER_COMERCIAL,
        },
        "capabilities_active": capabilities,
        "pending_data": pending_data(registry),
        "preservation": {
            "legacy_modules_deleted": False,
            "execution_modules_preserved_in_code": True,
            "execution_modules_hidden_while_validation": True,
            "municipio_zm_separated": True,
            "officiality_guard": "datos faltantes se registran como pendiente; no se inventan oficiales",
        },
        "db_result": result,
    }
    evidence_path = evidence_dir / "slp-capital-migration-evidence.json"
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": True, "evidence": evidence_path.relative_to(REPO).as_posix(), **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
