"""
Router /statistical — Monte Carlo, PERT, multiplicadores IO (sin tokens LLM).
"""
from __future__ import annotations

from fastapi import APIRouter

from app.statistical.io_multipliers import derrama_multiplier, list_sectors
from app.statistical.monte_carlo import run_monte_carlo
from app.statistical.pert_analysis import analyze_pert
from app.statistical.schemas import (
    MonteCarloRequest,
    MonteCarloResponse,
    PertAnalysisRequest,
    PertAnalysisResponse,
)

router = APIRouter(prefix="/statistical", tags=["statistical"])


@router.post("/monte-carlo", response_model=MonteCarloResponse)
def monte_carlo_endpoint(body: MonteCarloRequest) -> MonteCarloResponse:
    """Simulación de ingreso anual — lee price_series si `usar_price_series_db=true`."""
    return run_monte_carlo(body)


@router.post("/pert", response_model=PertAnalysisResponse)
def pert_endpoint(body: PertAnalysisRequest) -> PertAnalysisResponse:
    """PERT β con varianza e IC-90 por tarea y proyecto (ruta crítica)."""
    return analyze_pert(body)


@router.get("/io-sectors")
def io_sectors():
    return {"sectores": list_sectors()}


@router.get("/derrama")
def derrama(empleos_directos: float = 100, sectores: str = "reciclaje,transporte,servicios_publicos"):
    keys = [s.strip() for s in sectores.split(",") if s.strip()]
    return derrama_multiplier(empleos_directos, sectores=keys or None)
