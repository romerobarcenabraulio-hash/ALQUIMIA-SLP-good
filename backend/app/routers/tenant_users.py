"""Tenant user management — list, invite, update role, deactivate."""
from __future__ import annotations

import logging
import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth import require_admin, UserInfo, hash_password
from app.db import get_db
from app.models.user_account import UserAccount
from app.models.admin_tenant import AdminTenant

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/tenants", tags=["tenant-users"])

VALID_ROLES = {"funcionario", "coordinador", "director", "observer", "admin"}


class TenantUserResponse(BaseModel):
    id: str
    email: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    cargo: str
    dependencia: str
    rol: str
    activo: bool
    email_verified: bool
    totp_enabled: bool
    last_login_at: Optional[str]
    created_at: str


class InviteUserRequest(BaseModel):
    email: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    cargo: str = ""
    dependencia: str = ""
    rol: str = "funcionario"


class UpdateUserRoleRequest(BaseModel):
    rol: str


class UpdateUserStatusRequest(BaseModel):
    activo: bool


def _user_to_response(u: UserAccount) -> TenantUserResponse:
    return TenantUserResponse(
        id=u.id,
        email=u.email,
        nombre=u.nombre,
        apellido_paterno=u.apellido_paterno,
        apellido_materno=u.apellido_materno,
        cargo=u.cargo,
        dependencia=u.dependencia,
        rol=u.rol,
        activo=u.activo,
        email_verified=u.email_verified_at is not None,
        totp_enabled=u.totp_enabled,
        last_login_at=u.last_login_at.isoformat() if u.last_login_at else None,
        created_at=u.created_at.isoformat(),
    )


@router.get("/{tenant_id}/users")
async def list_tenant_users(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
    include_inactive: bool = Query(False),
    search: str = Query(""),
) -> dict:
    """List all users belonging to a tenant (by municipio_id)."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    q = db.query(UserAccount).filter(UserAccount.municipio_id == tenant_id)

    if not include_inactive:
        q = q.filter(UserAccount.activo == True)

    if search:
        term = f"%{search.lower()}%"
        from sqlalchemy import or_, func
        q = q.filter(
            or_(
                func.lower(UserAccount.email).like(term),
                func.lower(UserAccount.nombre).like(term),
                func.lower(UserAccount.apellido_paterno).like(term),
                func.lower(UserAccount.cargo).like(term),
            )
        )

    users = q.order_by(UserAccount.created_at.desc()).all()

    return {
        "tenant_id": tenant_id,
        "total": len(users),
        "users": [_user_to_response(u) for u in users],
    }


@router.post("/{tenant_id}/users/invite")
async def invite_user(
    tenant_id: str,
    request: InviteUserRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Create a user account for a tenant with a temporary password."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if request.rol not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {sorted(VALID_ROLES)}")

    existing = db.query(UserAccount).filter(UserAccount.email == request.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Generate a secure temporary password
    alphabet = string.ascii_letters + string.digits + "!@#$"
    temp_password = "".join(secrets.choice(alphabet) for _ in range(16))

    now = datetime.now(timezone.utc)
    user = UserAccount(
        email=request.email.lower().strip(),
        hashed_password=hash_password(temp_password),
        nombre=request.nombre.strip(),
        apellido_paterno=request.apellido_paterno.strip(),
        apellido_materno=(request.apellido_materno or "").strip() or None,
        cargo=request.cargo.strip(),
        dependencia=request.dependencia.strip(),
        rol=request.rol,
        municipio_id=tenant_id,
        activo=True,
    )
    db.add(user)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Admin {admin.email} invited user {request.email} to tenant {tenant_id}")

    # In production, send email with temp_password via email provider
    # For now, return it in the response (admin copies it)
    return {
        "status": "created",
        "user_id": user.id,
        "email": user.email,
        "temp_password": temp_password,
        "message": "User created. Share the temporary password securely — it will not be shown again.",
    }


@router.patch("/{tenant_id}/users/{user_id}/role")
async def update_user_role(
    tenant_id: str,
    user_id: str,
    request: UpdateUserRoleRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Change a user's role within the tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if request.rol not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {sorted(VALID_ROLES)}")

    user = db.query(UserAccount).filter(
        UserAccount.id == user_id,
        UserAccount.municipio_id == tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")

    old_role = user.rol
    user.rol = request.rol
    user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Admin {admin.email} changed user {user.email} role {old_role} → {request.rol}")
    return {"status": "updated", "user_id": user_id, "rol": user.rol}


@router.patch("/{tenant_id}/users/{user_id}/status")
async def update_user_status(
    tenant_id: str,
    user_id: str,
    request: UpdateUserStatusRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Activate or deactivate a user account."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    user = db.query(UserAccount).filter(
        UserAccount.id == user_id,
        UserAccount.municipio_id == tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")

    user.activo = request.activo
    user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    action = "activated" if request.activo else "deactivated"
    logger.info(f"Admin {admin.email} {action} user {user.email} in tenant {tenant_id}")
    return {"status": action, "user_id": user_id, "activo": user.activo}


@router.delete("/{tenant_id}/users/{user_id}")
async def remove_user_from_tenant(
    tenant_id: str,
    user_id: str,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a user from a tenant (deactivates + clears municipio_id)."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    user = db.query(UserAccount).filter(
        UserAccount.id == user_id,
        UserAccount.municipio_id == tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")

    user.activo = False
    user.municipio_id = None
    user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Admin {admin.email} removed user {user.email} from tenant {tenant_id}")
    return {"status": "removed", "user_id": user_id}


@router.get("/{tenant_id}/users/stats")
async def tenant_user_stats(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get user statistics for a tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    from sqlalchemy import func

    users = db.query(UserAccount).filter(UserAccount.municipio_id == tenant_id).all()

    total = len(users)
    active = sum(1 for u in users if u.activo)
    verified = sum(1 for u in users if u.email_verified_at)
    totp_enabled = sum(1 for u in users if u.totp_enabled)

    roles_dist: dict[str, int] = {}
    for u in users:
        roles_dist[u.rol] = roles_dist.get(u.rol, 0) + 1

    return {
        "tenant_id": tenant_id,
        "total_users": total,
        "active_users": active,
        "inactive_users": total - active,
        "email_verified": verified,
        "totp_enabled": totp_enabled,
        "roles_distribution": roles_dist,
    }
