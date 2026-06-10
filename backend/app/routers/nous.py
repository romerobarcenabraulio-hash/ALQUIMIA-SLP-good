"""
Router: /api/v1/nous

NOUS v1: intelligent insights and pattern detection.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.nous_insights import NousInsight
from app.routers.auth import UserInfo, get_current_user
from app.nous.engine import generate_insights

router = APIRouter(prefix="/nous", tags=["nous"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class NousInsightDTO(BaseModel):
    id: str
    tipo: str
    titulo: str
    descripcion: str
    recomendacion: str
    confianza: float
    impacto_potencial: Optional[str] = None
    created_at: str


class GenerateInsightsRequest(BaseModel):
    tenant_id: str
    simulation_state: Optional[dict] = None
    # Additional context if provided


class InsightsResponse(BaseModel):
    total: int
    insights: List[NousInsightDTO]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/generar-insights")
async def generate_tenant_insights(
    body: GenerateInsightsRequest,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate insights for a tenant based on current data."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Aggregate tenant data (simplified)
    tenant_data = body.simulation_state or {}
    tenant_data["tenant_id"] = body.tenant_id
    tenant_data["current_stage"] = tenant_data.get("current_stage", "validation")

    # Generate insights using NOUS engine
    new_insights = generate_insights(tenant_data)

    # Clear old active insights for this tenant
    try:
        old_insights = db.query(NousInsight).filter(
            NousInsight.tenant_id == body.tenant_id,
            NousInsight.activo == True,
        ).all()
        for old in old_insights:
            old.activo = False
        db.commit()
    except Exception as exc:
        logger.warning("cleanup_old_insights_failed: %s", exc)

    # Store new insights
    saved_insights = []
    for insight_data in new_insights:
        insight = NousInsight(
            tenant_id=body.tenant_id,
            tipo=insight_data["tipo"],
            titulo=insight_data["titulo"],
            descripcion=insight_data["descripcion"],
            recomendacion=insight_data["recomendacion"],
            confianza=insight_data["confianza"],
            impacto_potencial=insight_data.get("impacto_potencial"),
            datos_respaldo=tenant_data,
        )
        db.add(insight)
        saved_insights.append(insight)

    db.commit()
    logger.info("nous_insights_generated tenant=%s count=%d", body.tenant_id, len(saved_insights))

    return {
        "total": len(saved_insights),
        "insights": [
            NousInsightDTO(
                id=i.id,
                tipo=i.tipo,
                titulo=i.titulo,
                descripcion=i.descripcion,
                recomendacion=i.recomendacion,
                confianza=i.confianza,
                impacto_potencial=i.impacto_potencial,
                created_at=i.created_at.isoformat(),
            )
            for i in saved_insights
        ],
    }


@router.get("/insights/{tenant_id}", response_model=InsightsResponse)
async def list_insights(
    tenant_id: str,
    tipo: Optional[str] = Query(None),
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List active insights for a tenant."""
    if db is None:
        return InsightsResponse(total=0, insights=[])

    q = db.query(NousInsight).filter(
        NousInsight.tenant_id == tenant_id,
        NousInsight.activo == True,
        NousInsight.descartado == False,
    )
    if tipo:
        q = q.filter(NousInsight.tipo == tipo)

    insights = q.order_by(NousInsight.confianza.desc()).all()

    return InsightsResponse(
        total=len(insights),
        insights=[
            NousInsightDTO(
                id=i.id,
                tipo=i.tipo,
                titulo=i.titulo,
                descripcion=i.descripcion,
                recomendacion=i.recomendacion,
                confianza=i.confianza,
                impacto_potencial=i.impacto_potencial,
                created_at=i.created_at.isoformat(),
            )
            for i in insights
        ],
    )


@router.patch("/{insight_id}/descartar")
async def dismiss_insight(
    insight_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss an insight."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    insight = db.query(NousInsight).filter(NousInsight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.descartado = True
    db.commit()
    logger.info("nous_insight_dismissed id=%s", insight_id)

    return {"id": insight.id, "descartado": insight.descartado}
