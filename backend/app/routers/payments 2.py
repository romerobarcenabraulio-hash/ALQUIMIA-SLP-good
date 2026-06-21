from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from app.routers.auth import UserInfo
from app.routers.admin import require_admin
from app.db.session import get_db
from app.models.payment import (
    PaymentMethod, Subscription, Invoice, Transaction,
    SubscriptionTier, InvoiceStatus, PaymentStatus
)
from app.models.admin_tenant import AdminTenant
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin/payments", tags=["payments"])


# Pydantic models
class PaymentMethodResponse(BaseModel):
    id: str
    method_type: str
    last_four: Optional[str]
    is_default: bool
    is_active: bool


class SubscriptionResponse(BaseModel):
    tenant_id: str
    tier: str
    status: str
    monthly_cost: float
    user_limit: int
    renews_at: str


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    status: str
    amount: float
    currency: str
    issued_at: str
    due_at: str
    paid_at: Optional[str]


class SubscriptionUpdateRequest(BaseModel):
    tier: str
    billing_cycle: str = "monthly"


@router.get("/subscriptions/{tenant_id}")
async def get_subscription(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SubscriptionResponse:
    """Get subscription details for a tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return SubscriptionResponse(
        tenant_id=subscription.tenant_id,
        tier=subscription.tier.value,
        status=subscription.status,
        monthly_cost=subscription.monthly_cost,
        user_limit=subscription.user_limit,
        renews_at=subscription.renews_at.isoformat(),
    )


@router.post("/subscriptions/{tenant_id}/upgrade")
async def upgrade_subscription(
    tenant_id: str,
    request: SubscriptionUpdateRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Upgrade subscription tier for a tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Tier pricing
    tier_pricing = {
        "free": 0.0,
        "starter": 99.0,
        "professional": 299.0,
        "enterprise": 999.0,
    }

    if request.tier not in tier_pricing:
        raise HTTPException(status_code=400, detail="Invalid tier")

    try:
        subscription.tier = SubscriptionTier(request.tier)
        subscription.monthly_cost = tier_pricing[request.tier]
        subscription.billing_cycle = request.billing_cycle
        subscription.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "status": "success",
            "message": f"Subscription upgraded to {request.tier}",
            "monthly_cost": subscription.monthly_cost,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{tenant_id}")
async def get_tenant_invoices(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(10, le=100),
) -> dict:
    """Get invoices for a tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    invoices = (
        db.query(Invoice)
        .filter(Invoice.tenant_id == tenant_id)
        .order_by(Invoice.issued_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "tenant_id": tenant_id,
        "total": len(invoices),
        "invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "status": inv.status.value,
                "amount": inv.amount,
                "currency": inv.currency,
                "issued_at": inv.issued_at.isoformat(),
                "due_at": inv.due_at.isoformat(),
                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
            }
            for inv in invoices
        ],
    }


@router.post("/invoices/{tenant_id}/create")
async def create_invoice(
    tenant_id: str,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Create invoice for monthly subscription."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not subscription or subscription.status != "active":
        raise HTTPException(status_code=400, detail="No active subscription")

    try:
        # Generate invoice number
        invoice_count = (
            db.query(func.count(Invoice.id))
            .filter(Invoice.tenant_id == tenant_id)
            .scalar() or 0
        )
        invoice_number = f"INV-{tenant_id[:8].upper()}-{invoice_count + 1:04d}"

        now = datetime.now(timezone.utc)
        due_date = now + timedelta(days=30)

        invoice = Invoice(
            tenant_id=tenant_id,
            invoice_number=invoice_number,
            status=InvoiceStatus.ISSUED,
            amount=subscription.monthly_cost,
            currency="USD",
            description=f"Monthly subscription - {subscription.tier.value}",
            issued_at=now,
            due_at=due_date,
        )
        db.add(invoice)
        db.commit()

        return {
            "status": "success",
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "amount": invoice.amount,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/billing-summary/{tenant_id}")
async def get_billing_summary(
    tenant_id: str,
    _: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Get billing summary for a tenant."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Calculate metrics
    total_paid = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.tenant_id == tenant_id,
            Transaction.status == PaymentStatus.COMPLETED,
        )
        .scalar() or 0.0
    )

    pending_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.tenant_id == tenant_id,
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE]),
        )
        .scalar() or 0
    )

    return {
        "tenant_id": tenant_id,
        "subscription_tier": subscription.tier.value,
        "monthly_cost": subscription.monthly_cost,
        "billing_cycle": subscription.billing_cycle,
        "renews_at": subscription.renews_at.isoformat(),
        "total_paid": total_paid,
        "pending_invoices": pending_invoices,
    }
