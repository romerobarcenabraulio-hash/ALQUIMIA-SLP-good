"""Stripe webhook handler and payment intent endpoints."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import require_admin, UserInfo
from app.db import get_db
from app.models.payment import (
    Subscription, Invoice, Transaction, PaymentMethod,
    PaymentStatus, InvoiceStatus, SubscriptionTier,
)
from app.models.admin_tenant import AdminTenant

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

TIER_PRICING = {
    "free": 0.0,
    "starter": 99.0,
    "professional": 299.0,
    "enterprise": 999.0,
}

# Stripe Price IDs — set these in Render env or Stripe dashboard
TIER_PRICE_IDS = {
    "starter": None,       # e.g. price_xxx from Stripe dashboard
    "professional": None,
    "enterprise": None,
}


def _get_stripe():
    """Lazy-load stripe with helpful error if not configured."""
    try:
        import stripe as _stripe
        from app.config import settings
        if not settings.SECRET_KEY_STRIPE:
            raise ValueError("SECRET_KEY_STRIPE not configured")
        _stripe.api_key = settings.SECRET_KEY_STRIPE
        return _stripe
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe SDK not installed")
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


class CreateCheckoutRequest(BaseModel):
    tier: str
    billing_cycle: str = "monthly"
    success_url: str
    cancel_url: str


class CreatePortalRequest(BaseModel):
    return_url: str


@router.get("/config")
async def get_stripe_config() -> dict:
    """Return public Stripe key for frontend Stripe.js initialization."""
    from app.config import settings
    if not settings.PUBLIC_STRIPE_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    return {"publishable_key": settings.PUBLIC_STRIPE_KEY}


@router.post("/checkout/{tenant_id}")
async def create_checkout_session(
    tenant_id: str,
    request: CreateCheckoutRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Create a Stripe Checkout session to upgrade subscription."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    tenant = db.query(AdminTenant).filter(AdminTenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if request.tier not in TIER_PRICING:
        raise HTTPException(status_code=400, detail="Invalid tier")

    stripe = _get_stripe()

    try:
        # Determine interval
        interval = "year" if request.billing_cycle == "annual" else "month"
        unit_amount = int(TIER_PRICING[request.tier] * 100)  # cents
        if request.billing_cycle == "annual":
            unit_amount = int(unit_amount * 12 * 0.9)  # 10% annual discount

        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"ALQUIMIA {request.tier.title()} Plan",
                        "description": f"Municipal circular economy platform - {request.tier} tier",
                    },
                    "recurring": {"interval": interval},
                    "unit_amount": unit_amount,
                },
                "quantity": 1,
            }],
            success_url=request.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            metadata={
                "tenant_id": tenant_id,
                "tier": request.tier,
                "billing_cycle": request.billing_cycle,
            },
            client_reference_id=tenant_id,
        )

        return {"checkout_url": session.url, "session_id": session.id}

    except Exception as e:
        logger.error(f"Stripe checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail="Payment session creation failed")


@router.post("/portal/{tenant_id}")
async def create_billing_portal(
    tenant_id: str,
    request: CreatePortalRequest,
    admin: UserInfo = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Create Stripe Customer Portal session for billing management."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")

    # Get Stripe customer ID from payment method
    payment_method = (
        db.query(PaymentMethod)
        .filter(PaymentMethod.tenant_id == tenant_id, PaymentMethod.is_active == True)
        .first()
    )
    if not payment_method:
        raise HTTPException(status_code=404, detail="No payment method on file")

    stripe = _get_stripe()

    try:
        # Extract customer ID from provider metadata
        customer_id = payment_method.metadata.get("stripe_customer_id")
        if not customer_id:
            raise HTTPException(status_code=400, detail="No Stripe customer linked")

        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=request.return_url,
        )
        return {"portal_url": portal.url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe portal creation failed: {e}")
        raise HTTPException(status_code=500, detail="Portal session creation failed")


@router.post("/webhooks")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
) -> dict:
    """Handle Stripe webhook events (checkout, subscription, invoice)."""
    from app.config import settings

    payload = await request.body()

    stripe = _get_stripe()

    # Verify webhook signature
    if settings.STRIPE_WEBHOOK_SECRET and stripe_signature:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Dev mode: parse without verification
        import json
        event = json.loads(payload)
        logger.warning("Stripe webhook received without signature verification")

    event_type = event.get("type") if isinstance(event, dict) else event.type

    try:
        if event_type == "checkout.session.completed":
            await _handle_checkout_completed(event, db)
        elif event_type == "invoice.payment_succeeded":
            await _handle_invoice_paid(event, db)
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_failed(event, db)
        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_cancelled(event, db)
        else:
            logger.info(f"Unhandled Stripe event: {event_type}")

        return {"received": True}

    except Exception as e:
        logger.error(f"Webhook handler error for {event_type}: {e}")
        # Return 200 to prevent Stripe retrying for handler errors
        return {"received": True, "error": str(e)}


async def _handle_checkout_completed(event: dict, db: Session) -> None:
    """Provision subscription after successful checkout."""
    if db is None:
        return

    session_obj = event.get("data", {}).get("object", {})
    tenant_id = session_obj.get("metadata", {}).get("tenant_id")
    tier = session_obj.get("metadata", {}).get("tier")
    billing_cycle = session_obj.get("metadata", {}).get("billing_cycle", "monthly")
    customer_id = session_obj.get("customer")
    subscription_id = session_obj.get("subscription")

    if not tenant_id or not tier:
        logger.warning("Checkout completed without tenant_id or tier metadata")
        return

    now = datetime.now(timezone.utc)

    # Update or create subscription
    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if subscription:
        subscription.tier = SubscriptionTier(tier)
        subscription.status = "active"
        subscription.billing_cycle = billing_cycle
        subscription.monthly_cost = TIER_PRICING.get(tier, 0.0)
        subscription.renews_at = now + (timedelta(days=365) if billing_cycle == "annual" else timedelta(days=30))
        subscription.updated_at = now
    else:
        subscription = Subscription(
            tenant_id=tenant_id,
            tier=SubscriptionTier(tier),
            status="active",
            billing_cycle=billing_cycle,
            monthly_cost=TIER_PRICING.get(tier, 0.0),
            started_at=now,
            renews_at=now + (timedelta(days=365) if billing_cycle == "annual" else timedelta(days=30)),
        )
        db.add(subscription)

    # Save Stripe customer/subscription IDs on payment method record
    pm = db.query(PaymentMethod).filter(
        PaymentMethod.tenant_id == tenant_id,
        PaymentMethod.payment_provider == "stripe",
    ).first()
    if pm:
        meta = dict(pm.metadata or {})
        meta["stripe_customer_id"] = customer_id
        meta["stripe_subscription_id"] = subscription_id
        pm.metadata = meta
    else:
        pm = PaymentMethod(
            tenant_id=tenant_id,
            payment_provider="stripe",
            provider_id=customer_id or "",
            method_type="card",
            is_default=True,
            metadata={"stripe_customer_id": customer_id, "stripe_subscription_id": subscription_id},
        )
        db.add(pm)

    db.commit()
    logger.info(f"Subscription provisioned: tenant={tenant_id} tier={tier}")


async def _handle_invoice_paid(event: dict, db: Session) -> None:
    """Record paid invoice from Stripe."""
    if db is None:
        return

    inv_obj = event.get("data", {}).get("object", {})
    customer_id = inv_obj.get("customer")
    amount_paid = inv_obj.get("amount_paid", 0) / 100  # cents to dollars

    # Find tenant from payment method
    pm = db.query(PaymentMethod).filter(
        PaymentMethod.payment_provider == "stripe",
    ).all()
    tenant_id = None
    for p in pm:
        if (p.metadata or {}).get("stripe_customer_id") == customer_id:
            tenant_id = p.tenant_id
            break

    if not tenant_id:
        return

    # Update existing open invoice or create record
    now = datetime.now(timezone.utc)
    invoice = (
        db.query(Invoice)
        .filter(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.ISSUED)
        .order_by(Invoice.issued_at.desc())
        .first()
    )
    if invoice:
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = now
        db.commit()
        logger.info(f"Invoice marked paid: {invoice.invoice_number}")


async def _handle_invoice_failed(event: dict, db: Session) -> None:
    """Mark invoice overdue on failed payment."""
    if db is None:
        return

    inv_obj = event.get("data", {}).get("object", {})
    customer_id = inv_obj.get("customer")

    pm = db.query(PaymentMethod).filter(PaymentMethod.payment_provider == "stripe").all()
    tenant_id = None
    for p in pm:
        if (p.metadata or {}).get("stripe_customer_id") == customer_id:
            tenant_id = p.tenant_id
            break

    if not tenant_id:
        return

    invoice = (
        db.query(Invoice)
        .filter(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.ISSUED)
        .order_by(Invoice.issued_at.desc())
        .first()
    )
    if invoice:
        invoice.status = InvoiceStatus.OVERDUE
        db.commit()
        logger.warning(f"Invoice payment failed, marked overdue: tenant={tenant_id}")


async def _handle_subscription_cancelled(event: dict, db: Session) -> None:
    """Downgrade subscription on cancellation."""
    if db is None:
        return

    sub_obj = event.get("data", {}).get("object", {})
    customer_id = sub_obj.get("customer")

    pm = db.query(PaymentMethod).filter(PaymentMethod.payment_provider == "stripe").all()
    tenant_id = None
    for p in pm:
        if (p.metadata or {}).get("stripe_customer_id") == customer_id:
            tenant_id = p.tenant_id
            break

    if not tenant_id:
        return

    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if subscription:
        subscription.status = "cancelled"
        subscription.tier = SubscriptionTier.FREE
        subscription.monthly_cost = 0.0
        subscription.cancelled_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Subscription cancelled, downgraded to free: tenant={tenant_id}")
