from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any, List

from app.db.session import get_db
from app.db.security import current_user
from app.models.decision_tree import DecisionTreeSession, DecisionTreeType
from app.models.user_account import User
from app.decision_tree.engine import (
    get_questions_for_tree,
    estimate_residues,
    generate_compliance_guide,
    TREE_CONFIGS,
)

router = APIRouter()


# ─── Pydantic Schemas ────────────────────────────────────────────────────────


from pydantic import BaseModel
from typing import Dict, Any, Optional


class DecisionTreeStartRequest(BaseModel):
    tree_type: str
    municipio: Optional[str] = None
    estado_mx: Optional[str] = None


class DecisionTreeAnswersRequest(BaseModel):
    answers: Dict[str, Any]


class DecisionTreeQuestionResponse(BaseModel):
    id: str
    text: str
    tipo: str
    opciones: List[Dict[str, str]]


# ─── Routes ──────────────────────────────────────────────────────────────────


@router.get("/decision-tree/types")
async def list_tree_types() -> dict:
    """Get available decision tree types."""
    return {
        "types": [
            {
                "id": t,
                "label": t.title(),
                "questions_count": len(TREE_CONFIGS[t]["questions"]),
            }
            for t in TREE_CONFIGS.keys()
        ]
    }


@router.post("/decision-tree/start")
async def start_decision_tree(
    req: DecisionTreeStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Start a new decision tree session."""

    if req.tree_type not in TREE_CONFIGS:
        raise HTTPException(status_code=400, detail="Invalid tree type")

    session = DecisionTreeSession(
        tenant_id=user.tenant_id,
        user_id=user.id,
        tree_type=req.tree_type,
        municipio=req.municipio,
        estado_mx=req.estado_mx,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": str(session.id),
        "tree_type": session.tree_type,
        "questions": get_questions_for_tree(req.tree_type),
    }


@router.get("/decision-tree/{session_id}")
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get a decision tree session."""

    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    session = db.query(DecisionTreeSession).filter(
        and_(
            DecisionTreeSession.id == sid,
            DecisionTreeSession.tenant_id == user.tenant_id,
        )
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "tree_type": session.tree_type,
        "answers": session.answers,
        "completado": session.completado,
        "residue_generation_tons_mes": session.residue_generation_tons_mes,
        "residue_breakdown": session.residue_breakdown,
        "created_at": session.created_at.isoformat(),
    }


@router.post("/decision-tree/{session_id}/answers")
async def submit_answers(
    session_id: str,
    req: DecisionTreeAnswersRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Submit answers and get estimation."""

    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    session = db.query(DecisionTreeSession).filter(
        and_(
            DecisionTreeSession.id == sid,
            DecisionTreeSession.tenant_id == user.tenant_id,
        )
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Store answers
    session.answers = req.answers

    # Estimate residues
    estimation = estimate_residues(session.tree_type, req.answers)
    if "error" in estimation:
        raise HTTPException(status_code=400, detail=estimation["error"])

    session.residue_generation_tons_mes = estimation.get("residue_generation_tons_mes")
    session.residue_breakdown = estimation.get("residue_breakdown")
    session.materiales_generados = estimation.get("materiales_generados")

    # Get ISIC
    config = TREE_CONFIGS.get(session.tree_type)
    if config:
        session.sector_isic = config["isic"]
        session.sector_desc = config["isic_desc"]

    # Generate compliance guide
    guide = generate_compliance_guide(session.tree_type, req.answers)
    session.compliance_guide_json = guide
    session.completado = True

    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    return {
        "session_id": str(session.id),
        "completado": session.completado,
        "residue_generation_tons_mes": session.residue_generation_tons_mes,
        "residue_breakdown": session.residue_breakdown,
        "materiales_generados": session.materiales_generados,
        "sector_isic": session.sector_isic,
        "sector_desc": session.sector_desc,
        "estimation_confidence_pct": estimation.get("estimation_confidence_pct"),
        "compliance_guide": guide,
    }


@router.get("/decision-tree/{session_id}/compliance-guide")
async def get_compliance_guide(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get compliance guide for a session."""

    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    session = db.query(DecisionTreeSession).filter(
        and_(
            DecisionTreeSession.id == sid,
            DecisionTreeSession.tenant_id == user.tenant_id,
        )
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.compliance_guide_json:
        raise HTTPException(status_code=400, detail="Guide not generated yet")

    return {
        "session_id": str(session.id),
        "guide": session.compliance_guide_json,
    }


@router.get("/decision-tree/sessions/list")
async def list_sessions(
    tree_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """List decision tree sessions for current user/tenant."""

    query = db.query(DecisionTreeSession).filter(
        DecisionTreeSession.tenant_id == user.tenant_id
    )

    if tree_type:
        query = query.filter(DecisionTreeSession.tree_type == tree_type)

    total = query.count()
    sessions = query.order_by(desc(DecisionTreeSession.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "sessions": [
            {
                "id": str(s.id),
                "tree_type": s.tree_type,
                "completado": s.completado,
                "residue_generation_tons_mes": s.residue_generation_tons_mes,
                "sector_isic": s.sector_isic,
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions
        ],
    }


@router.post("/decision-tree/{session_id}/create-generador")
async def create_generador_from_session(
    session_id: str,
    req: Dict[str, Any],
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Create a GeneradorEntity from a completed decision tree session.

    req: {
        "nombre": "My Company",
        "municipio": "San Luis Potosí",
        "estado_mx": "San Luis Potosí",
        "contacto_nombre": "John Doe",
        "contacto_email": "john@example.com",
        "contacto_telefono": "4441234567"
    }
    """

    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    session = db.query(DecisionTreeSession).filter(
        and_(
            DecisionTreeSession.id == sid,
            DecisionTreeSession.tenant_id == user.tenant_id,
        )
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.completado:
        raise HTTPException(status_code=400, detail="Session must be completed first")

    # Map tree type to generador tipo
    tipo_map = {
        "construccion": "construccion",
        "hospital": "hospital",
        "comercio": "comercio",
        "restaurante": "restaurante",
    }

    from app.models.generador import GeneradorEntity

    generador = GeneradorEntity(
        tenant_id=user.tenant_id,
        nombre=req.get("nombre", "Unknown"),
        tipo=tipo_map.get(session.tree_type, "otro"),
        municipio=req.get("municipio", session.municipio or "Unknown"),
        estado_mx=req.get("estado_mx", session.estado_mx or "Unknown"),
        contacto_nombre=req.get("contacto_nombre"),
        contacto_email=req.get("contacto_email"),
        contacto_telefono=req.get("contacto_telefono"),
        sector_isic=session.sector_isic,
        sector_desc=session.sector_desc,
        capacidad_generacion_ton_mes=session.residue_generation_tons_mes,
        materiales_generados=session.materiales_generados,
        source="decision_tree",
        source_metadata={"decision_tree_session_id": str(session.id)},
    )

    db.add(generador)
    db.commit()
    db.refresh(generador)

    return {
        "id": str(generador.id),
        "nombre": generador.nombre,
        "tipo": generador.tipo.value,
        "municipio": generador.municipio,
        "capacidad_generacion_ton_mes": generador.capacidad_generacion_ton_mes,
        "materiales_generados": generador.materiales_generados,
        "source": "decision_tree",
        "created_at": generador.created_at.isoformat(),
    }


@router.delete("/decision-tree/{session_id}")
async def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Delete a decision tree session."""

    try:
        sid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    session = db.query(DecisionTreeSession).filter(
        and_(
            DecisionTreeSession.id == sid,
            DecisionTreeSession.tenant_id == user.tenant_id,
        )
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

    return {"status": "deleted", "id": str(session.id)}
