#!/usr/bin/env python3
"""AUDITOR Fase 6: evidencia binaria de perfiles municipales por tenant."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[2]
if str(REPO / "backend") not in sys.path:
    sys.path.insert(0, str(REPO / "backend"))


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


def has_source_or_pending(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, dict):
        if value.get("fuente") or value.get("evidencia_fuente") or value.get("estado") == "pendiente_verificacion":
            return True
        return all(has_source_or_pending(item) for item in value.values())
    if isinstance(value, list):
        return all(has_source_or_pending(item) for item in value)
    return True


def main() -> int:
    load_env()
    from app.db.session import get_sync_db, is_db_available
    from app.models.admin_tenant import AdminTenant, TenantMunicipalProfile, TenantState

    if not is_db_available():
        print(json.dumps({"ok": False, "error": "DATABASE_URL no disponible"}, ensure_ascii=False, indent=2))
        return 1

    expected = ["slp-capital", "monterrey", "guanajuato-capital"]
    evidence: dict[str, Any] = {"ok": True, "tenants": {}, "checks": {}}
    with get_sync_db() as db:
        if db is None:
            print(json.dumps({"ok": False, "error": "db session unavailable"}, ensure_ascii=False, indent=2))
            return 1
        for tenant_id in expected:
            tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
            state = db.query(TenantState).filter(TenantState.tenant_id == tenant_id).first()
            profile = db.query(TenantMunicipalProfile).filter(TenantMunicipalProfile.tenant_id == tenant_id).first()
            if tenant is None or state is None or profile is None:
                evidence["ok"] = False
                evidence["tenants"][tenant_id] = {"exists": False}
                continue
            antecedentes = profile.antecedentes or {}
            mapa_social = profile.mapa_social or {}
            organigrama = profile.organigrama_servicio or {}
            cabildo = antecedentes.get("cabildo") or {}
            actors = mapa_social.get("actores") or []
            evidence["tenants"][tenant_id] = {
                "exists": True,
                "municipio": tenant.nombre,
                "estado": tenant.estado_mx,
                "current_stage": state.current_stage,
                "mode": profile.mode,
                "actors_count": len(actors),
                "sindicos_count": len(cabildo.get("sindicos") or []),
                "regidores_count": len(cabildo.get("regidores") or []),
                "comisiones_count": len(cabildo.get("comisiones_permanentes") or []),
                "roles_count": len(organigrama.get("roles_operativos") or []),
                "turnos_count": len(organigrama.get("turnos") or []),
                "horarios_count": len(organigrama.get("horarios") or []),
                "municipio_scope": mapa_social.get("municipio_scope"),
                "zm_scope_copied": bool(mapa_social.get("zm_scope_copied")),
                "official_without_source": not has_source_or_pending({
                    "antecedentes": antecedentes,
                    "mapa_social": mapa_social,
                    "organigrama_servicio": organigrama,
                }),
            }

    slp = evidence["tenants"].get("slp-capital") or {}
    monterrey = evidence["tenants"].get("monterrey") or {}
    guanajuato = evidence["tenants"].get("guanajuato-capital") or {}
    checks = {
        "slp_stage_validation": slp.get("current_stage") == "validation",
        "slp_operation_or_pending_complete": slp.get("mode") == "operacion",
        "slp_cabildo_has_sindicos_regidores_comisiones": slp.get("sindicos_count", 0) >= 1 and slp.get("regidores_count", 0) >= 15 and slp.get("comisiones_count", 0) >= 1,
        "slp_actors_min_15": slp.get("actors_count", 0) >= 15,
        "slp_organigrama_has_roles_turnos_horarios": slp.get("roles_count", 0) > 0 and slp.get("turnos_count", 0) > 0 and slp.get("horarios_count", 0) > 0,
        "monterrey_basic_or_pending": monterrey.get("mode") == "carga_inicial",
        "guanajuato_basic_or_pending": guanajuato.get("mode") == "carga_inicial",
        "no_official_without_source": not any((tenant or {}).get("official_without_source") for tenant in evidence["tenants"].values()),
        "municipio_zm_not_mixed": all(not (tenant or {}).get("zm_scope_copied") for tenant in evidence["tenants"].values()),
    }
    evidence["checks"] = checks
    evidence["ok"] = evidence["ok"] and all(checks.values())
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0 if evidence["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
