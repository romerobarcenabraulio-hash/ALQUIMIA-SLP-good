"""
Router: /api/planning/budget

Endpoints EVM para KRONOS (Nivel B — proyecto municipal).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.planning.budget.evm_engine import EVMResult, calculate_evm

router = APIRouter()
logger = logging.getLogger(__name__)


class EVMRequest(BaseModel):
    bac: float = Field(..., gt=0, description="Budget at Completion en MXN")
    pv: float = Field(..., gt=0, description="Planned Value en MXN")
    ev: float = Field(..., ge=0, description="Earned Value en MXN")
    ac: float = Field(..., gt=0, description="Actual Cost en MXN")
    municipio_id: str | None = Field(None, description="ID municipio contratante (Nivel B EVM)")


class EVMResponse(BaseModel):
    bac: float
    pv: float
    ev: float
    ac: float
    cv: float
    sv: float
    cv_pct: float
    sv_pct: float
    cpi: float
    spi: float
    tcpi: float
    eac_likely: float
    eac_optimistic: float
    eac_conservative: float
    etc: float
    vac: float
    vac_pct: float
    semaforo: str
    nivel: str = "municipal"
    municipio_id: str | None = None


@router.post("/evm", response_model=EVMResponse, summary="Calcular EVM completo")
def calculate_evm_endpoint(req: EVMRequest) -> EVMResponse:
    """Calcula EVM Nivel B (proyecto municipal). BAC debe venir del simulador (capexTotal)."""
    try:
        result: EVMResult = calculate_evm(
            bac=req.bac,
            pv=req.pv,
            ev=req.ev,
            ac=req.ac,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return EVMResponse(
        **result.__dict__,
        nivel="municipal",
        municipio_id=req.municipio_id,
    )
