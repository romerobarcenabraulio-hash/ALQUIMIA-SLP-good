"""FastAPI dependency for tenant context enforcement."""
from __future__ import annotations

from fastapi import Header, HTTPException

from app.db.tenant_isolation import set_tenant_context, clear_tenant_context


async def require_tenant_context(
    x_alquimia_tenant: str = Header(..., alias="X-Alquimia-Tenant"),
) -> str:
    """Set the ORM-level tenant filter for the duration of this request.

    Routers that handle multi-tenant data should declare this as a dependency:
        tenant_id: str = Depends(require_tenant_context)

    The header X-Alquimia-Tenant must contain the tenant UUID.  The JWT bridge
    (POST /auth/clerk-exchange) stamps this header after verifying the Clerk JWT,
    so a forged header would still be rejected at the auth layer.
    """
    if not x_alquimia_tenant or not x_alquimia_tenant.strip():
        raise HTTPException(status_code=400, detail="X-Alquimia-Tenant header required")
    tid = x_alquimia_tenant.strip()
    token = set_tenant_context(tid)
    try:
        yield tid
    finally:
        clear_tenant_context(token)
