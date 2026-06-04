"""
Router: /api/v1/rcd

RCD (Residuos de Construcción y Demolición) waste classification, composition analysis.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.rcd_fraccion import RCDFraccion, SimulationRCDComposition
from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/rcd", tags=["rcd-fraccion"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RCDFraccionDTO(BaseModel):
    id: str
    codigo: str
    nombre: str
    descripcion: str
    categoria_principal: str
    densidad_kg_m3: Optional[float] = None
    humedad_promedio_pct: Optional[float] = None
    recuperable: bool
    reciclable: bool
    reusable: bool
    precio_compra_promedio_ton: Optional[float] = None
    precio_venta_recuperador_ton: Optional[float] = None
    tratamiento_recomendado: str
    normas_aplicables: List[str]


class ComposicionFraccion(BaseModel):
    fraccion_codigo: str
    pct: float
    ton_dia: Optional[float] = None
    recuperable: bool
    reciclable: bool
    valor_potencial_diario: Optional[float] = None


class RCDCompositionRequest(BaseModel):
    toneladas_rcd_dia: float
    composicion: dict  # fraccion_codigo -> pct
    scenario_notes: Optional[str] = None


class RCDCompositionResponse(BaseModel):
    ton_rcd_total: float
    ton_recuperables: float
    ton_reciclables: float
    ton_disposicion_final: float
    valor_economico_diario: float
    # MXN
    fracciones: List[ComposicionFraccion]
    tasa_recuperacion_pct: float


# ─── Data: seed fractions ─────────────────────────────────────────────────────

SEED_FRACCIONES = [
    {
        "codigo": "RCD-CON",
        "nombre": "Concreto y mampostería",
        "descripcion": "Hormigón, ladrillos, bloques de cemento de demolición",
        "categoria_principal": "demolition",
        "densidad_kg_m3": 2400,
        "humedad_promedio_pct": 5,
        "recuperable": True,
        "reciclable": True,
        "reusable": False,
        "precio_compra_promedio_ton": 30,
        "precio_venta_recuperador_ton": 50,
        "tratamiento_recomendado": "recycling",
        "normas_aplicables": ["NOM-161", "GRI-306"],
    },
    {
        "codigo": "RCD-ACE",
        "nombre": "Acero y metales",
        "descripcion": "Varillas, estructuras metálicas, perfiles de acero",
        "categoria_principal": "demolition",
        "densidad_kg_m3": 7850,
        "humedad_promedio_pct": 0,
        "recuperable": True,
        "reciclable": True,
        "reusable": True,
        "precio_compra_promedio_ton": 450,
        "precio_venta_recuperador_ton": 600,
        "tratamiento_recomendado": "recycling",
        "normas_aplicables": ["NOM-161", "GRI-306"],
    },
    {
        "codigo": "RCD-MAD",
        "nombre": "Madera",
        "descripcion": "Vigas, tableros, marcos de madera de demolición",
        "categoria_principal": "demolition",
        "densidad_kg_m3": 600,
        "humedad_promedio_pct": 15,
        "recuperable": True,
        "reciclable": True,
        "reusable": True,
        "precio_compra_promedio_ton": 100,
        "precio_venta_recuperador_ton": 200,
        "tratamiento_recomendado": "energy_recovery",
        "normas_aplicables": ["NOM-161", "GRI-306"],
    },
    {
        "codigo": "RCD-VID",
        "nombre": "Vidrio",
        "descripcion": "Vidrio plano de ventanas, puertas",
        "categoria_principal": "demolition",
        "densidad_kg_m3": 2500,
        "humedad_promedio_pct": 0,
        "recuperable": True,
        "reciclable": True,
        "reusable": False,
        "precio_compra_promedio_ton": 50,
        "precio_venta_recuperador_ton": 150,
        "tratamiento_recomendado": "recycling",
        "normas_aplicables": ["NOM-161", "GRI-306"],
    },
    {
        "codigo": "RCD-PLC",
        "nombre": "Plásticos y poliestireno",
        "descripcion": "Tuberías PVC, aislantes, films de construcción",
        "categoria_principal": "construction",
        "densidad_kg_m3": 1200,
        "humedad_promedio_pct": 0,
        "recuperable": False,
        "reciclable": True,
        "reusable": False,
        "precio_compra_promedio_ton": 0,
        "precio_venta_recuperador_ton": 80,
        "tratamiento_recomendado": "recycling",
        "normas_aplicables": ["NOM-161", "GRI-306"],
    },
    {
        "codigo": "RCD-GYP",
        "nombre": "Yeso y placas de yeso",
        "descripcion": "Paneles de drywall, yeso puro",
        "categoria_principal": "construction",
        "densidad_kg_m3": 800,
        "humedad_promedio_pct": 10,
        "recuperable": False,
        "reciclable": True,
        "reusable": False,
        "precio_compra_promedio_ton": 0,
        "precio_venta_recuperador_ton": 30,
        "tratamiento_recomendado": "landfill",
        "normas_aplicables": ["NOM-161"],
    },
    {
        "codigo": "RCD-INA",
        "nombre": "Inertes indeterminados",
        "descripcion": "Mezcla de escombro, tierra, piedra sin clasificar",
        "categoria_principal": "mixed",
        "densidad_kg_m3": 1800,
        "humedad_promedio_pct": 10,
        "recuperable": False,
        "reciclable": False,
        "reusable": False,
        "precio_compra_promedio_ton": 0,
        "precio_venta_recuperador_ton": 0,
        "tratamiento_recomendado": "landfill",
        "normas_aplicables": ["NOM-083", "NOM-161"],
    },
]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/fracciones", response_model=List[RCDFraccionDTO])
async def list_fracciones(
    categoria: Optional[str] = Query(None),
    reciclable_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """List RCD waste fractions."""
    if db is None:
        return []

    q = db.query(RCDFraccion)
    if categoria:
        q = q.filter(RCDFraccion.categoria_principal == categoria)
    if reciclable_only:
        q = q.filter(RCDFraccion.reciclable == True)

    fracciones = q.order_by(RCDFraccion.nombre).all()

    return [
        RCDFraccionDTO(
            id=f.id,
            codigo=f.codigo,
            nombre=f.nombre,
            descripcion=f.descripcion,
            categoria_principal=f.categoria_principal,
            densidad_kg_m3=f.densidad_kg_m3,
            humedad_promedio_pct=f.humedad_promedio_pct,
            recuperable=f.recuperable,
            reciclable=f.reciclable,
            reusable=f.reusable,
            precio_compra_promedio_ton=f.precio_compra_promedio_ton,
            precio_venta_recuperador_ton=f.precio_venta_recuperador_ton,
            tratamiento_recomendado=f.tratamiento_recomendado,
            normas_aplicables=f.normas_aplicables,
        )
        for f in fracciones
    ]


@router.post("/analizar-composicion", response_model=RCDCompositionResponse)
async def analyze_composition(
    body: RCDCompositionRequest,
    db: Session = Depends(get_db),
):
    """Analyze RCD waste composition and calculate recovery/recycling potential."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Get all fractions from DB
    all_fractions = db.query(RCDFraccion).all()
    fraction_map = {f.codigo: f for f in all_fractions}

    if not fraction_map:
        raise HTTPException(status_code=400, detail="No fracciones defined in database")

    # Calculate composition
    ton_recuperables = 0.0
    ton_reciclables = 0.0
    ton_disposicion_final = 0.0
    valor_economico = 0.0

    fracciones_response = []

    for codigo, pct in body.composicion.items():
        if codigo not in fraction_map:
            logger.warning(f"Unknown fraccion: {codigo}")
            continue

        fraction = fraction_map[codigo]
        ton_this_fraccion = (pct / 100.0) * body.toneladas_rcd_dia

        if fraction.recuperable:
            ton_recuperables += ton_this_fraccion
        if fraction.reciclable:
            ton_reciclables += ton_this_fraccion
        else:
            ton_disposicion_final += ton_this_fraccion

        # Calculate economic value
        valor_potencial = 0.0
        if fraction.precio_venta_recuperador_ton and fraction.recuperable:
            valor_potencial = ton_this_fraccion * fraction.precio_venta_recuperador_ton

        valor_economico += valor_potencial

        fracciones_response.append(
            ComposicionFraccion(
                fraccion_codigo=codigo,
                pct=pct,
                ton_dia=round(ton_this_fraccion, 2),
                recuperable=fraction.recuperable,
                reciclable=fraction.reciclable,
                valor_potencial_diario=round(valor_potencial, 0) if valor_potencial > 0 else None,
            )
        )

    tasa_recuperacion = (
        (ton_recuperables / body.toneladas_rcd_dia * 100)
        if body.toneladas_rcd_dia > 0
        else 0
    )

    return RCDCompositionResponse(
        ton_rcd_total=body.toneladas_rcd_dia,
        ton_recuperables=round(ton_recuperables, 2),
        ton_reciclables=round(ton_reciclables, 2),
        ton_disposicion_final=round(ton_disposicion_final, 2),
        valor_economico_diario=round(valor_economico, 0),
        fracciones=fracciones_response,
        tasa_recuperacion_pct=round(tasa_recuperacion, 1),
    )
