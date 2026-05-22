"""
Fase 5 — Endpoints de Marketplace / Precolocación.

Endpoints:
  GET  /market/buyers              → compradores filtrados por material y/o zm
  POST /market/place               → corre algoritmo y retorna MarketSummary
  GET  /market/summary/{zm}        → último MarketSummary calculado para la ZM
  GET  /market/opportunities/{zm}  → tabla de oportunidades/riesgos por material
"""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.market.placement import compute_market_summary, compute_placement
from app.market.registry import get_all_buyers, get_buyers
from app.market.schemas import (
    MarketSummary,
    MaterialBuyer,
    OpportunityItem,
    PlaceRequest,
    RiesgoMercado,
)

router = APIRouter()

# Store en memoria: zm → último MarketSummary calculado
# En producción: Redis o tabla en base de datos.
_summary_store: Dict[str, MarketSummary] = {}

# Materiales soportados en el MVP
MATERIALES_MVP = ["organico", "papel", "plastico", "vidrio", "metales", "pet", "aluminio"]


# ─── GET /market/buyers ───────────────────────────────────────────────────────

@router.get("/buyers", response_model=List[MaterialBuyer])
def list_buyers(
    material: Optional[str] = Query(None, description="Filtrar por material: pet, papel, aluminio..."),
    zm: Optional[str] = Query(None, description="Filtrar por ZM: SLP, MTY, QRO, GDL"),
):
    """
    Lista compradores del catálogo activo.

    ADVERTENCIA: todos los compradores son benchmark o estimados.
    Ninguno debe presentarse como comprador oficial sin verificación.
    """
    if material:
        buyers = get_buyers(material=material.lower(), zm=zm)
    else:
        buyers = get_all_buyers(zm=zm)

    return buyers


# ─── POST /market/place ───────────────────────────────────────────────────────

@router.post("/place", response_model=MarketSummary)
def place_materials(body: PlaceRequest):
    """
    Ejecuta el algoritmo de colocación para los volúmenes dados.

    Body: { zm, municipios, volumes_ton_anio: { "pet": 1200, "papel": 800, ... } }

    Retorna MarketSummary con:
      - PlacementPlan por material
      - ingresos_ajustados_mxn (con descuentos por riesgo)
      - descuento_por_riesgo_mxn (diferencia entre potencial y ajustado)
      - warnings de honestidad

    Si un material no tiene compradores, su ingreso_ajustado = 0.
    """
    if not body.volumes_ton_anio:
        raise HTTPException(
            status_code=422,
            detail="volumes_ton_anio no puede estar vacío.",
        )

    zm = (body.zm or "").upper()
    municipios = body.municipios or []

    planes = {}
    for material, vol in body.volumes_ton_anio.items():
        mat_key = material.lower()
        buyers = get_buyers(material=mat_key, zm=zm if zm else None)
        plan = compute_placement(
            material=mat_key,
            vol_ton_anio=float(vol),
            zm=zm,
            municipios=municipios,
            buyers=buyers,
        )
        planes[mat_key] = plan

    summary = compute_market_summary(zm=zm, planes=planes)

    # Persistir en memoria para GET /market/summary/{zm}
    _summary_store[zm] = summary

    return summary


# ─── GET /market/summary/{zm} ─────────────────────────────────────────────────

@router.get("/summary/{zm}", response_model=MarketSummary)
def get_summary(zm: str):
    """
    Retorna el último MarketSummary calculado para la ZM.
    Retorna 404 si no se ha ejecutado POST /market/place todavía.
    """
    zm_key = zm.upper()
    if zm_key not in _summary_store:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No hay MarketSummary para ZM={zm_key}. "
                "Ejecutar POST /market/place primero."
            ),
        )
    return _summary_store[zm_key]


# ─── GET /market/opportunities/{zm} ──────────────────────────────────────────

@router.get("/opportunities/{zm}", response_model=List[OpportunityItem])
def get_opportunities(zm: str):
    """
    Retorna tabla de oportunidades/riesgos por material para la ZM.

    Requiere que POST /market/place haya sido ejecutado previamente.
    Las recomendaciones son operativas, no contractuales.
    """
    zm_key = zm.upper()
    if zm_key not in _summary_store:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No hay MarketSummary para ZM={zm_key}. "
                "Ejecutar POST /market/place primero."
            ),
        )

    summary = _summary_store[zm_key]
    items: List[OpportunityItem] = []

    for mat, plan in summary.planes_por_material.items():
        # Recomendación operativa basada en estado
        if plan.riesgo_mercado == RiesgoMercado.critico:
            rec = (
                f"Sin mercado identificado para {mat}. "
                "Priorizar convenios con compostadores o gestores locales."
            )
        elif plan.riesgo_mercado == RiesgoMercado.alto:
            rec = (
                f"Capacidad de compra insuficiente para {mat} ({plan.pct_colocado:.0f} % colocado). "
                "Explorar compradores regionales adicionales o reducir volumen."
            )
        elif plan.estado_colocacion.value == "requiere_verificacion":
            rec = (
                f"Compradores disponibles para {mat} son estimados. "
                "Verificar con directorio empresarial local antes de presupuestar."
            )
        elif plan.riesgo_mercado == RiesgoMercado.medio:
            rec = (
                f"Colocación parcial o compradores no verificados para {mat}. "
                "Ingreso ajustado refleja descuento por riesgo."
            )
        else:
            rec = (
                f"Colocación al {plan.pct_colocado:.0f} % para {mat}. "
                "Confirmar precios con compradores antes de proyectar ingresos oficiales."
            )

        items.append(OpportunityItem(
            material=mat,
            volumen_ton_anio=plan.volumen_ton_anio,
            pct_colocado=plan.pct_colocado,
            ingreso_ajustado_mxn=plan.ingreso_ajustado_mxn,
            riesgo=plan.riesgo_mercado,
            estado_colocacion=plan.estado_colocacion,
            recomendacion=rec,
            compradores_activos=plan.compradores_considerados,
        ))

    # Ordenar por riesgo descendente (crítico primero)
    _risk_order = {
        RiesgoMercado.critico: 0,
        RiesgoMercado.alto: 1,
        RiesgoMercado.medio: 2,
        RiesgoMercado.bajo: 3,
    }
    items.sort(key=lambda x: _risk_order.get(x.riesgo, 99))

    return items
