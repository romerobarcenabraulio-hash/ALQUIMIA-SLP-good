#!/usr/bin/env python3
"""HERMES Fase 6: seed inicial de perfiles municipales por tenant."""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if str(REPO / "backend") not in sys.path:
    sys.path.insert(0, str(REPO / "backend"))

TENANTS = {
    "slp-capital": ("San Luis Potosí", "San Luis Potosí", "slp-capital", "24028"),
    "monterrey": ("Monterrey", "Nuevo León", "monterrey", "19039"),
    "guanajuato-capital": ("Guanajuato", "Guanajuato", "guanajuato-capital", "11015"),
}


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


def main() -> int:
    load_env()
    from app.admin.municipal_profile_seed_data import TENANT_PROFILE_SEEDS
    from app.routers.admin import _default_capabilities, _profile_mode
    from app.db.session import create_all_tables, get_sync_db, is_db_available
    from app.models.admin_tenant import (
        AdminTenant,
        TenantAuditLog,
        TenantCapability,
        TenantGate,
        TenantMunicipalProfile,
        TenantState,
    )

    if not is_db_available():
        print(json.dumps({"ok": False, "error": "DATABASE_URL no disponible"}, ensure_ascii=False, indent=2))
        return 1
    create_all_tables()
    now = datetime.now(timezone.utc)
    seeded = []
    with get_sync_db() as db:
        if db is None:
            print(json.dumps({"ok": False, "error": "db session unavailable"}, ensure_ascii=False, indent=2))
            return 1
        for tenant_id, (nombre, estado, municipio_id, inegi) in TENANTS.items():
            tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
            if tenant is None:
                tenant = AdminTenant(
                    id=tenant_id,
                    nombre=nombre,
                    estado_mx=estado,
                    municipio_id=municipio_id,
                    inegi_clave=inegi,
                    tier_comercial="diagnostico",
                    activo=True,
                )
                db.add(tenant)
                db.flush()
                db.add(TenantState(tenant_id=tenant_id, current_stage="validation", transition_mode="manual_only"))
                for gate_id in ("G1", "G2", "G3", "G4", "G5"):
                    db.add(TenantGate(tenant_id=tenant_id, gate_id=gate_id))
                for module_id in _default_capabilities("diagnostico", "validation"):
                    db.add(TenantCapability(tenant_id=tenant_id, module_id=module_id, active=True, source="fase6_seed"))
            else:
                tenant.nombre = nombre
                tenant.estado_mx = estado
                tenant.municipio_id = municipio_id
                tenant.inegi_clave = inegi
                tenant.tier_comercial = "diagnostico"
                tenant.activo = True

            payload = TENANT_PROFILE_SEEDS[tenant_id]
            mode = _profile_mode(payload)
            profile = db.query(TenantMunicipalProfile).filter(TenantMunicipalProfile.tenant_id == tenant_id).first()
            if profile is None:
                profile = TenantMunicipalProfile(tenant_id=tenant_id)
                db.add(profile)
            profile.antecedentes = payload["antecedentes"]
            profile.mapa_social = payload["mapa_social"]
            profile.organigrama_servicio = payload["organigrama_servicio"]
            profile.provenance_status = payload["provenance_status"]
            profile.mode = mode
            profile.updated_by = "fase6_seed"
            profile.updated_at = now
            db.add(TenantAuditLog(
                tenant_id=tenant_id,
                actor="fase6_seed",
                action="tenant_municipal_profile_seeded",
                payload={
                    "mode": mode,
                    "actors_count": len(payload["mapa_social"].get("actores", [])),
                    "municipio_zm_separated": True,
                    "official_without_source": False,
                },
            ))
            seeded.append({"tenant_id": tenant_id, "mode": mode, "actors_count": len(payload["mapa_social"].get("actores", []))})
    print(json.dumps({"ok": True, "seeded": seeded}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
