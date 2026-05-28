from __future__ import annotations

import json
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import List
import logging

from app.routers.auth import get_current_user, UserInfo, hash_password, DEMO_USERS
from app.db.session import get_db
from app.admin.tenant_state import (
    TenantStateError,
    assert_can_access_stage,
    validate_manual_transition,
)

router = APIRouter()
logger = logging.getLogger(__name__)

TenantStage = Literal["validation", "planning", "execution", "expansion"]
TierComercial = Literal["diagnostico", "implementacion", "operacion_completa"]
GateStatus = Literal["no_iniciado", "en_revision", "cerrado", "fallido"]

GATE_IDS = ("G1", "G2", "G3", "G4", "G5")
TIER_ORDER = {
    "diagnostico": 1,
    "implementacion": 2,
    "operacion_completa": 3,
}


def require_admin(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admins")
    return user


class CreateUserRequest(BaseModel):
    nombre:   str
    email:    str
    password: str
    rol:      str = "analista"
    zm:       str = "SLP"

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("email inválido")
        return value


class TenantCreateRequest(BaseModel):
    nombre: str
    estado_mx: str
    municipio_id: str
    inegi_clave: str
    tier_comercial: TierComercial = "diagnostico"
    current_stage: TenantStage = "validation"


class TenantUpdateRequest(BaseModel):
    nombre: str | None = None
    estado_mx: str | None = None
    municipio_id: str | None = None
    inegi_clave: str | None = None
    tier_comercial: TierComercial | None = None
    active_capabilities: list[str] | None = None


class GateEvidenceRequest(BaseModel):
    evidencia_url: str
    evidencia_label: str
    decisor_humano: str
    notas: str | None = None


class GateCloseRequest(BaseModel):
    evidencia_url: str | None = None
    evidencia_label: str | None = None
    decisor_humano: str
    notas: str | None = None


class TenantTransitionRequest(BaseModel):
    target_stage: TenantStage
    manual_confirmation: bool
    confirmed_by: str
    notas: str | None = None


class TenantMunicipalProfileRequest(BaseModel):
    antecedentes: dict[str, Any]
    mapa_social: dict[str, Any]
    organigrama_servicio: dict[str, Any]
    provenance_status: str = "pendiente_verificacion"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _load_capability_registry() -> dict[str, Any]:
    path = _repo_root() / "docs" / "architecture" / "capability_registry.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning("capability_registry_load_failed: %s", exc)
        return {"version": "unavailable", "modules": []}


def _default_capabilities(tier: str, stage: str) -> list[str]:
    tier_rank = TIER_ORDER[tier]
    modules = _load_capability_registry().get("modules", [])
    result: list[str] = []
    for module in modules:
        if not module.get("default_active", False):
            continue
        min_tier = module.get("min_tier", "diagnostico")
        if TIER_ORDER.get(min_tier, 99) > tier_rank:
            continue
        if stage not in module.get("platforms", []):
            continue
        result.append(module["module_id"])
    return result


def _default_gates() -> list[dict[str, Any]]:
    return [
        {
            "gate_id": gate_id,
            "status": "no_iniciado",
            "evidencia_url": None,
            "evidencia_label": None,
            "decisor_humano": None,
            "closed_at": None,
            "notas": None,
            "updated_at": _now_iso(),
        }
        for gate_id in GATE_IDS
    ]


def _audit(action: str, actor: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "actor": actor,
        "action": action,
        "payload": payload,
        "created_at": _now_iso(),
    }


def _profile_mode(profile: dict[str, Any]) -> str:
    antecedentes = profile.get("antecedentes") or {}
    mapa_social = profile.get("mapa_social") or {}
    organigrama = profile.get("organigrama_servicio") or {}
    actors = mapa_social.get("actores") if isinstance(mapa_social, dict) else []
    roles = organigrama.get("roles_operativos") if isinstance(organigrama, dict) else []
    turnos = organigrama.get("turnos") if isinstance(organigrama, dict) else []
    horarios = organigrama.get("horarios") if isinstance(organigrama, dict) else []
    required_antecedentes = [
        "presidente_municipal",
        "cabildo",
        "estructura_administrativa",
        "reglamento_de_limpia",
        "concesion_actual",
        "programas_previos",
        "prensa_24_meses",
        "proximo_proceso_electoral",
    ]
    has_required = all(antecedentes.get(key) is not None for key in required_antecedentes)
    if has_required and len(actors or []) >= 15 and roles and turnos and horarios:
        return "operacion"
    return "carga_inicial"


def _empty_profile() -> dict[str, Any]:
    return {
        "mode": "carga_inicial",
        "antecedentes": {},
        "mapa_social": {"actores": []},
        "organigrama_servicio": {"direcciones_relevantes": [], "roles_operativos": [], "turnos": [], "horarios": []},
        "provenance_status": "pendiente_verificacion",
        "updated_by": "system",
        "updated_at": None,
    }


_tenants_mem: dict[str, dict[str, Any]] = {}


def _serialize_mem(tenant: dict[str, Any]) -> dict[str, Any]:
    return deepcopy(tenant)


def _mem_create_tenant(data: TenantCreateRequest, actor: str) -> dict[str, Any]:
    tenant_id = str(uuid.uuid4())
    now = _now_iso()
    capabilities = _default_capabilities(data.tier_comercial, data.current_stage)
    tenant = {
        "id": tenant_id,
        "nombre": data.nombre,
        "estado_mx": data.estado_mx,
        "municipio_id": data.municipio_id,
        "inegi_clave": data.inegi_clave,
        "tier_comercial": data.tier_comercial,
        "activo": True,
        "created_at": now,
        "updated_at": now,
        "state": {
            "tenant_id": tenant_id,
            "current_stage": data.current_stage,
            "fecha_ingreso": now,
            "fecha_cambio_stage": now,
            "transition_mode": "manual_only",
            "notas": None,
        },
        "gates": _default_gates(),
        "capabilities": [{"module_id": module_id, "active": True, "source": "tier_default"} for module_id in capabilities],
        "audit_log": [
            _audit(
                "tenant_created",
                actor,
                {
                    "current_stage": data.current_stage,
                    "tier_comercial": data.tier_comercial,
                    "capabilities_count": len(capabilities),
                    "automatic_stage_transition": False,
                },
            )
        ],
        "municipal_profile": _empty_profile(),
    }
    _tenants_mem[tenant_id] = tenant
    return _serialize_mem(tenant)


def _mem_get_tenant(tenant_id: str) -> dict[str, Any]:
    tenant = _tenants_mem.get(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    return tenant


def _mem_update_tenant(tenant_id: str, data: TenantUpdateRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    patch = data.model_dump(exclude_unset=True)
    active_capabilities = patch.pop("active_capabilities", None)
    for key, value in patch.items():
        tenant[key] = value
    if active_capabilities is not None:
        tenant["capabilities"] = [
            {"module_id": module_id, "active": True, "source": "manual_admin"}
            for module_id in active_capabilities
        ]
    tenant["updated_at"] = _now_iso()
    tenant["audit_log"].append(_audit("tenant_updated", actor, {"fields": sorted(data.model_dump(exclude_unset=True).keys())}))
    return _serialize_mem(tenant)


def _mem_upsert_municipal_profile(tenant_id: str, data: TenantMunicipalProfileRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    payload = data.model_dump()
    mode = _profile_mode(payload)
    profile = {
        **payload,
        "mode": mode,
        "updated_by": actor,
        "updated_at": _now_iso(),
    }
    tenant["municipal_profile"] = profile
    tenant["audit_log"].append(
        _audit(
            "tenant_municipal_profile_updated",
            actor,
            {
                "mode": mode,
                "actors_count": len((payload.get("mapa_social") or {}).get("actores") or []),
                "automatic_stage_transition": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _gate_or_404(tenant: dict[str, Any], gate_id: str) -> dict[str, Any]:
    gate_id = gate_id.upper()
    for gate in tenant["gates"]:
        if gate["gate_id"] == gate_id:
            return gate
    raise HTTPException(status_code=404, detail="Gate no encontrado")


def _mem_register_evidence(tenant_id: str, gate_id: str, data: GateEvidenceRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    gate = _gate_or_404(tenant, gate_id)
    gate.update(
        evidencia_url=data.evidencia_url,
        evidencia_label=data.evidencia_label,
        decisor_humano=data.decisor_humano,
        notas=data.notas,
        status="en_revision" if gate["status"] == "no_iniciado" else gate["status"],
        updated_at=_now_iso(),
    )
    tenant["audit_log"].append(_audit("gate_evidence_registered", actor, {"gate_id": gate["gate_id"], "evidencia_url": data.evidencia_url}))
    return _serialize_mem(tenant)


def _mem_close_gate(tenant_id: str, gate_id: str, data: GateCloseRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    gate = _gate_or_404(tenant, gate_id)
    evidencia_url = data.evidencia_url or gate.get("evidencia_url")
    evidencia_label = data.evidencia_label or gate.get("evidencia_label")
    if not evidencia_url or not evidencia_label:
        raise HTTPException(status_code=400, detail="No se puede cerrar un gate sin evidencia")
    now = _now_iso()
    previous_status = gate["status"]
    gate.update(
        status="cerrado",
        evidencia_url=evidencia_url,
        evidencia_label=evidencia_label,
        decisor_humano=data.decisor_humano,
        notas=data.notas or gate.get("notas"),
        closed_at=now,
        updated_at=now,
    )
    tenant["audit_log"].append(
        _audit(
            "gate_closed_manual",
            actor,
            {
                "gate_id": gate["gate_id"],
                "status_anterior": previous_status,
                "status_nuevo": "cerrado",
                "evidencia_url": evidencia_url,
                "automatic_stage_transition": False,
                "stage_after_close": tenant["state"]["current_stage"],
            },
        )
    )
    return _serialize_mem(tenant)


def _mem_transition_tenant(tenant_id: str, data: TenantTransitionRequest, actor: str) -> dict[str, Any]:
    tenant = _mem_get_tenant(tenant_id)
    current_stage = tenant["state"]["current_stage"]
    try:
        decision = validate_manual_transition(
            current_stage=current_stage,
            target_stage=data.target_stage,
            gates=tenant["gates"],
            capabilities=tenant["capabilities"],
            manual_confirmation=data.manual_confirmation,
        )
    except TenantStateError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    now = _now_iso()
    tenant["state"]["current_stage"] = data.target_stage
    tenant["state"]["fecha_cambio_stage"] = now
    tenant["state"]["notas"] = data.notas
    tenant["audit_log"].append(
        _audit(
            "tenant_stage_transition_manual",
            actor,
            {
                "from_stage": decision.from_stage,
                "to_stage": decision.to_stage,
                "required_gate": decision.required_gate,
                "confirmed_by": data.confirmed_by,
                "manual_confirmation": True,
                "automatic_stage_transition": False,
            },
        )
    )
    return _serialize_mem(tenant)


def _tenant_to_dict(tenant) -> dict[str, Any]:
    return {
        "id": tenant.id,
        "nombre": tenant.nombre,
        "estado_mx": tenant.estado_mx,
        "municipio_id": tenant.municipio_id,
        "inegi_clave": tenant.inegi_clave,
        "tier_comercial": tenant.tier_comercial,
        "activo": tenant.activo,
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None,
        "state": {
            "tenant_id": tenant.state.tenant_id,
            "current_stage": tenant.state.current_stage,
            "fecha_ingreso": tenant.state.fecha_ingreso.isoformat() if tenant.state.fecha_ingreso else None,
            "fecha_cambio_stage": tenant.state.fecha_cambio_stage.isoformat() if tenant.state.fecha_cambio_stage else None,
            "transition_mode": tenant.state.transition_mode,
            "notas": tenant.state.notas,
        } if tenant.state else None,
        "gates": [
            {
                "gate_id": gate.gate_id,
                "status": gate.status,
                "evidencia_url": gate.evidencia_url,
                "evidencia_label": gate.evidencia_label,
                "decisor_humano": gate.decisor_humano,
                "closed_at": gate.closed_at.isoformat() if gate.closed_at else None,
                "notas": gate.notas,
                "updated_at": gate.updated_at.isoformat() if gate.updated_at else None,
            }
            for gate in tenant.gates
        ],
        "capabilities": [
            {"module_id": cap.module_id, "active": cap.active, "source": cap.source}
            for cap in tenant.capabilities
            if cap.active
        ],
        "audit_log": [
            {
                "id": log.id,
                "actor": log.actor,
                "action": log.action,
                "payload": log.payload,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in tenant.audit_log
        ],
        "municipal_profile": {
            "mode": tenant.municipal_profile.mode,
            "antecedentes": tenant.municipal_profile.antecedentes,
            "mapa_social": tenant.municipal_profile.mapa_social,
            "organigrama_servicio": tenant.municipal_profile.organigrama_servicio,
            "provenance_status": tenant.municipal_profile.provenance_status,
            "updated_by": tenant.municipal_profile.updated_by,
            "updated_at": tenant.municipal_profile.updated_at.isoformat() if tenant.municipal_profile.updated_at else None,
        } if tenant.municipal_profile else _empty_profile(),
    }


def _db_create_tenant(db, data: TenantCreateRequest, actor: str) -> dict[str, Any]:
    from app.models.admin_tenant import (
        AdminTenant,
        TenantAuditLog,
        TenantCapability,
        TenantGate,
        TenantState,
    )

    now = datetime.now(timezone.utc)
    capabilities = _default_capabilities(data.tier_comercial, data.current_stage)
    tenant = AdminTenant(
        nombre=data.nombre,
        estado_mx=data.estado_mx,
        municipio_id=data.municipio_id,
        inegi_clave=data.inegi_clave,
        tier_comercial=data.tier_comercial,
    )
    db.add(tenant)
    db.flush()
    db.add(TenantState(tenant_id=tenant.id, current_stage=data.current_stage))
    for gate_id in GATE_IDS:
        db.add(TenantGate(tenant_id=tenant.id, gate_id=gate_id))
    for module_id in capabilities:
        db.add(TenantCapability(tenant_id=tenant.id, module_id=module_id, active=True))
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=actor,
            action="tenant_created",
            payload={
                "current_stage": data.current_stage,
                "tier_comercial": data.tier_comercial,
                "capabilities_count": len(capabilities),
                "automatic_stage_transition": False,
            },
            created_at=now,
        )
    )
    db.flush()
    db.refresh(tenant)
    return _tenant_to_dict(tenant)


@router.get("/users", response_model=List[UserInfo])
async def list_users(_: UserInfo = Depends(require_admin)):
    return [
        UserInfo(id=str(u["id"]), nombre=u["nombre"], email=u["email"], rol=u["rol"], zm=u["zm"])
        for u in DEMO_USERS.values()
    ]


@router.post("/users")
async def create_user(req: CreateUserRequest, _: UserInfo = Depends(require_admin)):
    if req.email in DEMO_USERS:
        raise HTTPException(status_code=409, detail="Usuario ya existe")
    new_id = str(max(int(u["id"]) for u in DEMO_USERS.values()) + 1)
    DEMO_USERS[req.email] = {
        "id": new_id,
        "nombre": req.nombre,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "rol": req.rol,
        "zm": req.zm,
    }
    logger.info(f"Usuario creado: {req.email} por admin")
    return {"ok": True, "id": new_id}


@router.delete("/users/{email}")
async def delete_user(email: str, _: UserInfo = Depends(require_admin)):
    if email not in DEMO_USERS:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if DEMO_USERS[email]["rol"] == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar el admin")
    del DEMO_USERS[email]
    return {"ok": True}


@router.get("/tenants")
async def list_tenants(_: UserInfo = Depends(require_admin), db=Depends(get_db)):
    if db is None:
        return {"tenants": [_serialize_mem(t) for t in _tenants_mem.values()]}

    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant

    tenants = (
        db.query(AdminTenant)
        .options(
            selectinload(AdminTenant.state),
            selectinload(AdminTenant.gates),
            selectinload(AdminTenant.capabilities),
            selectinload(AdminTenant.audit_log),
            selectinload(AdminTenant.municipal_profile),
        )
        .order_by(AdminTenant.created_at.desc())
        .all()
    )
    return {"tenants": [_tenant_to_dict(t) for t in tenants]}


@router.post("/tenants", status_code=201)
async def create_tenant(
    req: TenantCreateRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if req.current_stage != "validation":
        raise HTTPException(status_code=400, detail="Fase 1 solo permite crear tenants en etapa inicial validation")
    actor = user.email
    if db is None:
        return _mem_create_tenant(req, actor)
    return _db_create_tenant(db, req, actor)


def _db_get_tenant(db, tenant_id: str):
    from sqlalchemy.orm import selectinload
    from app.models.admin_tenant import AdminTenant

    tenant = (
        db.query(AdminTenant)
        .options(
            selectinload(AdminTenant.state),
            selectinload(AdminTenant.gates),
            selectinload(AdminTenant.capabilities),
            selectinload(AdminTenant.audit_log),
            selectinload(AdminTenant.municipal_profile),
        )
        .filter(AdminTenant.id == tenant_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    return tenant


@router.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, _: UserInfo = Depends(require_admin), db=Depends(get_db)):
    if db is None:
        return _serialize_mem(_mem_get_tenant(tenant_id))
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/tenants/{tenant_id}/municipal-profile")
async def get_tenant_municipal_profile(
    tenant_id: str,
    db=Depends(get_db),
):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    return {
        "tenant_id": tenant["id"],
        "municipio": tenant["nombre"],
        "estado": tenant["estado_mx"],
        "municipio_id": tenant["municipio_id"],
        "profile": tenant.get("municipal_profile") or _empty_profile(),
    }


@router.patch("/tenants/{tenant_id}/municipal-profile")
async def update_tenant_municipal_profile(
    tenant_id: str,
    req: TenantMunicipalProfileRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_upsert_municipal_profile(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog, TenantMunicipalProfile

    tenant = _db_get_tenant(db, tenant_id)
    payload = req.model_dump()
    mode = _profile_mode(payload)
    now = datetime.now(timezone.utc)
    profile = tenant.municipal_profile
    if profile is None:
        profile = TenantMunicipalProfile(tenant_id=tenant.id)
        db.add(profile)
    profile.antecedentes = payload["antecedentes"]
    profile.mapa_social = payload["mapa_social"]
    profile.organigrama_servicio = payload["organigrama_servicio"]
    profile.provenance_status = payload["provenance_status"]
    profile.mode = mode
    profile.updated_by = user.email
    profile.updated_at = now
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_municipal_profile_updated",
            payload={
                "mode": mode,
                "actors_count": len((payload.get("mapa_social") or {}).get("actores") or []),
                "automatic_stage_transition": False,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.patch("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    req: TenantUpdateRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_update_tenant(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog, TenantCapability

    tenant = _db_get_tenant(db, tenant_id)
    patch = req.model_dump(exclude_unset=True)
    active_capabilities = patch.pop("active_capabilities", None)
    for key, value in patch.items():
        setattr(tenant, key, value)
    if active_capabilities is not None:
        for cap in tenant.capabilities:
            db.delete(cap)
        db.flush()
        for module_id in active_capabilities:
            db.add(TenantCapability(tenant_id=tenant.id, module_id=module_id, active=True, source="manual_admin"))
    tenant.updated_at = datetime.now(timezone.utc)
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_updated",
            payload={"fields": sorted(req.model_dump(exclude_unset=True).keys())},
        )
    )
    db.flush()
    db.refresh(tenant)
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/tenants/{tenant_id}/state")
async def get_tenant_state(tenant_id: str, _: UserInfo = Depends(require_admin), db=Depends(get_db)):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    return {
        "tenant_id": tenant["id"],
        "state": tenant["state"],
        "gates": tenant["gates"],
        "capabilities": tenant["capabilities"],
        "audit_log": tenant["audit_log"],
    }


@router.get("/tenants/{tenant_id}/platform-access/{stage}")
async def check_platform_access(
    tenant_id: str,
    stage: TenantStage,
    _: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    tenant = _serialize_mem(_mem_get_tenant(tenant_id)) if db is None else _tenant_to_dict(_db_get_tenant(db, tenant_id))
    current_stage = tenant["state"]["current_stage"]
    try:
        assert_can_access_stage(current_stage, stage)
    except TenantStateError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return {
        "tenant_id": tenant["id"],
        "current_stage": current_stage,
        "requested_stage": stage,
        "access": "allowed",
    }


@router.post("/tenants/{tenant_id}/gates/{gate_id}/evidence")
async def register_gate_evidence(
    tenant_id: str,
    gate_id: str,
    req: GateEvidenceRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    gate_id = gate_id.upper()
    if gate_id not in GATE_IDS:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    if db is None:
        return _mem_register_evidence(tenant_id, gate_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    gate = next((g for g in tenant.gates if g.gate_id == gate_id), None)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    gate.evidencia_url = req.evidencia_url
    gate.evidencia_label = req.evidencia_label
    gate.decisor_humano = req.decisor_humano
    gate.notas = req.notas
    if gate.status == "no_iniciado":
        gate.status = "en_revision"
    gate.updated_at = datetime.now(timezone.utc)
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="gate_evidence_registered",
            payload={"gate_id": gate_id, "evidencia_url": req.evidencia_url},
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.post("/tenants/{tenant_id}/gates/{gate_id}/close")
async def close_gate_manual(
    tenant_id: str,
    gate_id: str,
    req: GateCloseRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    gate_id = gate_id.upper()
    if gate_id not in GATE_IDS:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    if db is None:
        return _mem_close_gate(tenant_id, gate_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    gate = next((g for g in tenant.gates if g.gate_id == gate_id), None)
    if not gate:
        raise HTTPException(status_code=404, detail="Gate no encontrado")
    evidencia_url = req.evidencia_url or gate.evidencia_url
    evidencia_label = req.evidencia_label or gate.evidencia_label
    if not evidencia_url or not evidencia_label:
        raise HTTPException(status_code=400, detail="No se puede cerrar un gate sin evidencia")
    previous_status = gate.status
    now = datetime.now(timezone.utc)
    gate.status = "cerrado"
    gate.evidencia_url = evidencia_url
    gate.evidencia_label = evidencia_label
    gate.decisor_humano = req.decisor_humano
    gate.notas = req.notas or gate.notas
    gate.closed_at = now
    gate.updated_at = now
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="gate_closed_manual",
            payload={
                "gate_id": gate_id,
                "status_anterior": previous_status,
                "status_nuevo": "cerrado",
                "evidencia_url": evidencia_url,
                "automatic_stage_transition": False,
                "stage_after_close": tenant.state.current_stage,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.post("/tenants/{tenant_id}/transition")
async def transition_tenant_manual(
    tenant_id: str,
    req: TenantTransitionRequest,
    user: UserInfo = Depends(require_admin),
    db=Depends(get_db),
):
    if db is None:
        return _mem_transition_tenant(tenant_id, req, user.email)

    from app.models.admin_tenant import TenantAuditLog

    tenant = _db_get_tenant(db, tenant_id)
    tenant_dict = _tenant_to_dict(tenant)
    current_stage = tenant_dict["state"]["current_stage"]
    try:
        decision = validate_manual_transition(
            current_stage=current_stage,
            target_stage=req.target_stage,
            gates=tenant_dict["gates"],
            capabilities=tenant_dict["capabilities"],
            manual_confirmation=req.manual_confirmation,
        )
    except TenantStateError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    now = datetime.now(timezone.utc)
    tenant.state.current_stage = req.target_stage
    tenant.state.fecha_cambio_stage = now
    tenant.state.notas = req.notas
    db.add(
        TenantAuditLog(
            tenant_id=tenant.id,
            actor=user.email,
            action="tenant_stage_transition_manual",
            payload={
                "from_stage": decision.from_stage,
                "to_stage": decision.to_stage,
                "required_gate": decision.required_gate,
                "confirmed_by": req.confirmed_by,
                "manual_confirmation": True,
                "automatic_stage_transition": False,
            },
        )
    )
    db.flush()
    return _tenant_to_dict(_db_get_tenant(db, tenant_id))


@router.get("/logs")
async def get_logs(_: UserInfo = Depends(require_admin)):
    return [
        {"ts": "2025-04-27 09:14", "usuario": "carlos@slp.gob.mx", "accion": "Generó plan", "zm": "SLP", "estado": "completado"},
        {"ts": "2025-04-26 15:30", "usuario": "maria@qro.gob.mx",  "accion": "Generó plan", "zm": "QRO", "estado": "completado"},
    ]


@router.get("/agentes")
async def get_agentes(_: UserInfo = Depends(require_admin)):
    return [
        {"nombre": a, "estado": "idle", "ultima": "2025-04-27"}
        for a in ["Director", "Arquitecto", "Ghostwriter", "Comparador", "Mapeador", "Validador", "Humanizador"]
    ]
