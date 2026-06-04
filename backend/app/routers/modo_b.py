"""
Router: /api/v1/modo-b

Tenant delivery-mode toggle. Switches between:
- consulting: ALQUIMIA team delivers outputs (default)
- self_service: municipality drives the platform autonomously (Modo B)

Stored as a TenantCapability row with module_id="modo_b".
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/modo-b", tags=["modo-b"])
logger = logging.getLogger(__name__)

MODO_B_MODULE_ID = "modo_b"


class ModoBStatus(BaseModel):
    tenant_id: str
    modo: str           # "consulting" | "self_service"
    activo: bool
    updated_at: Optional[str] = None


class ModoBToggleRequest(BaseModel):
    modo: str           # "consulting" | "self_service"


@router.get("/{tenant_id}", response_model=ModoBStatus)
async def get_modo_b(
    tenant_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current delivery mode for a tenant."""
    if db is None:
        return ModoBStatus(tenant_id=tenant_id, modo="consulting", activo=False)

    try:
        from app.models.admin_tenant import TenantCapability
        cap = (
            db.query(TenantCapability)
            .filter(
                TenantCapability.tenant_id == tenant_id,
                TenantCapability.module_id == MODO_B_MODULE_ID,
            )
            .first()
        )
        if cap:
            modo = cap.metadata_json.get("modo", "consulting") if cap.metadata_json else "consulting"
            return ModoBStatus(
                tenant_id=tenant_id,
                modo=modo,
                activo=cap.active,
                updated_at=cap.created_at.isoformat() if cap.created_at else None,
            )
    except Exception as exc:
        logger.warning("modo_b_get_failed: %s", exc)

    return ModoBStatus(tenant_id=tenant_id, modo="consulting", activo=False)


@router.patch("/{tenant_id}", response_model=ModoBStatus)
async def set_modo_b(
    tenant_id: str,
    body: ModoBToggleRequest,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle delivery mode for a tenant."""
    if body.modo not in ("consulting", "self_service"):
        raise HTTPException(status_code=422, detail="modo must be 'consulting' or 'self_service'")

    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        from app.models.admin_tenant import AdminTenant, TenantCapability
        tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        cap = (
            db.query(TenantCapability)
            .filter(
                TenantCapability.tenant_id == tenant_id,
                TenantCapability.module_id == MODO_B_MODULE_ID,
            )
            .first()
        )

        new_active = body.modo == "self_service"
        if cap:
            cap.active = new_active
            cap.metadata_json = {"modo": body.modo}
        else:
            cap = TenantCapability(
                tenant_id=tenant_id,
                module_id=MODO_B_MODULE_ID,
                active=new_active,
                source="tenant_self",
                metadata_json={"modo": body.modo},
            )
            db.add(cap)

        db.commit()
        db.refresh(cap)
        logger.info("modo_b_set tenant=%s modo=%s actor=%s", tenant_id, body.modo, user.email)

        return ModoBStatus(
            tenant_id=tenant_id,
            modo=body.modo,
            activo=new_active,
            updated_at=cap.created_at.isoformat() if cap.created_at else None,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("modo_b_set_failed: %s", exc)
        raise HTTPException(status_code=500, detail="Error updating delivery mode")
