"""
Router: /simulate

Fase 2.5: el endpoint POST / ahora llama DataRegistry para obtener un
SnapshotDatos con provenance real (INEGI, SEMARNAT, Banxico, SMN) antes
de invocar al calculador.

Regla: si el registry falla, el cálculo continúa con ZM_DATA hardcoded
(modo offline) — NUNCA retorna error 500 por falta de datos.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.data.registry import DataRegistry
from app.routers.auth import get_current_user, UserInfo
from app.schemas.simulate import ScenarioInput, SimulateResponse
from app.services.calculator import calcular_scenario

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=SimulateResponse)
async def simulate(
    scenario: ScenarioInput,
    _user: UserInfo = Depends(get_current_user),
) -> SimulateResponse:
    """
    Calcula el escenario de circularidad para la ZM indicada.

    Fase 2.5: antes de calcular, obtiene el SnapshotDatos del registry
    (INEGI, SEMARNAT, Banxico) para usar valores verificados como entradas.
    El snapshot se incluye en la respuesta como `data_provenance`.
    """
    # Precios provienen de ScenarioInput (simulatorStore). Serper vive en ResearchService (ÁGORA).

    # Fase 2.5: obtener snapshot del registry con provenance real
    snapshot = None
    try:
        snapshot = await DataRegistry.instance().snapshot(scenario.zm_activa)
        logger.info(
            f"DataRegistry snapshot obtenido para {scenario.zm_activa}: "
            f"score={snapshot.score_datos}, kpis={len(snapshot.kpis)}"
        )
    except Exception as exc:
        # El registry no debe lanzar, pero si lo hace: modo offline
        logger.warning(f"DataRegistry falló para {scenario.zm_activa}: {exc}. Usando ZM_DATA.")

    result = calcular_scenario(scenario, snapshot=snapshot)
    return result
