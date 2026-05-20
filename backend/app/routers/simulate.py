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
import httpx

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
    # Intentar actualizar precios con Serper API (si hay key configurada)
    updated_precios = await fetch_live_prices(scenario.precios.model_dump())
    scenario.precios = type(scenario.precios)(**updated_precios)

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


async def fetch_live_prices(precios: dict) -> dict:
    """
    Stub para actualización de precios vía Serper.

    ESTADO ACTUAL: La función realiza el fetch pero no parsea la respuesta HTML/JSON
    de búsqueda para extraer precios reales — devuelve los precios de entrada sin cambios.

    PENDIENTE (P9): Implementar extracción con regex o LLM sobre resp.text para actualizar
    precios.pet, precios.papel, etc., cuando SERPER_API_KEY esté disponible.
    Hasta entonces, los precios provienen del usuario vía simulatorStore.
    """
    from app.config import settings
    if not settings.SERPER_API_KEY:
        return precios  # Sin key → sin fetch; precios del usuario intactos

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://api.serper.dev/search",
                headers={"X-API-KEY": settings.SERPER_API_KEY},
                json={"q": "precio PET reciclado México 2025 MXN kg"},
            )
            if resp.status_code == 200:
                # TODO: parsear resp.json()["organic"][0]["snippet"] para extraer precio
                logger.info("Serper fetch OK — parsing pendiente (stub activo, precios sin cambio)")
    except Exception as e:
        logger.warning(f"Serper API no disponible: {e}")

    return precios  # Devuelve precios originales hasta implementar el parser
