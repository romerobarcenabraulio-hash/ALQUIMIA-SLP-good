"""Router Fase 13.4: flujos de residuos y cierre de ciclo."""
from __future__ import annotations

from fastapi import APIRouter

from app.waste_flows.engine import calculate_waste_flows
from app.waste_flows.schemas import DiagnosticoCircularidadRequest, DiagnosticoCircularidadResponse

router = APIRouter()


@router.post("/diagnosis", response_model=DiagnosticoCircularidadResponse)
def diagnose_waste_flows(req: DiagnosticoCircularidadRequest):
    return calculate_waste_flows(req)
