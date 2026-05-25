"""Router: /api/planning/prices — monitor de precios ancla ±10%."""
from __future__ import annotations

from typing import Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.planning.financial_model.material_prices import (
    UMBRAL_ALERTA,
    check_all_precios,
    check_precio_material,
    get_precio_ancla,
)

router = APIRouter()


class PreciosCheckRequest(BaseModel):
    precios: Dict[str, float] = Field(..., description="material → precio MXN/kg")
    anclas_override: Optional[Dict[str, float]] = Field(
        None, description="Anclas desde simulatorStore.precios"
    )


@router.get("/anclas", summary="Precios ancla vigentes por material")
def get_anclas(db: Session | None = Depends(get_db)) -> dict:
    """Retorna ancla y fuente para PET, papel_carton, vidrio, aluminio."""
    materiales = {}
    for material in ("PET", "papel_carton", "vidrio", "aluminio"):
        precio, fuente = get_precio_ancla(material, db)
        materiales[material] = {"precio_ancla_mxn_kg": precio, "fuente": fuente}
    return {
        "umbral_alerta_pct": UMBRAL_ALERTA * 100,
        "materiales": materiales,
    }


@router.post("/check", summary="Verificar precios vs ancla (±10%)")
def post_check_precios(
    req: PreciosCheckRequest,
    db: Session | None = Depends(get_db),
) -> dict:
    """Dispara alertas cuando desviación absoluta supera 10% vs ancla."""
    resultados = check_all_precios(req.precios, db, anclas_override=req.anclas_override)
    alertas = [r for r in resultados if r["alerta"]]
    return {
        "total": len(resultados),
        "alertas_activas": len(alertas),
        "umbral_pct": UMBRAL_ALERTA * 100,
        "resultados": resultados,
    }


@router.get("/check-default", summary="Chequeo con anclas como precio actual (baseline OK)")
def get_check_default(db: Session | None = Depends(get_db)) -> dict:
    """Verifica estado baseline: precios = ancla → sin alertas."""
    anclas = {}
    for material in ("PET", "papel_carton", "vidrio", "aluminio"):
        precio, _ = get_precio_ancla(material, db)
        anclas[material] = precio
    resultados = check_all_precios(anclas, db)
    return {
        "total": len(resultados),
        "alertas_activas": sum(1 for r in resultados if r["alerta"]),
        "resultados": resultados,
    }
