"""Endpoints Fase 6: macrogeneradores."""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.macros.impact import compute_macro_impact
from app.macros.registry import add_generator, list_generators, update_generator
from app.macros.schemas import MacroGenerator, MacroGeneratorUpdate, MacroImpactRequest, MacroImpactSummary


router = APIRouter()

_summary_store: Dict[str, MacroImpactSummary] = {}


@router.get("/generators", response_model=List[MacroGenerator])
def get_generators(
    zm: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
):
    return list_generators(zm=zm, municipio=municipio)


@router.post("/generators", response_model=MacroGenerator)
def create_generator(generator: MacroGenerator):
    try:
        return add_generator(generator)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/generators/{generator_id}", response_model=MacroGenerator)
def patch_generator(generator_id: str, updates: MacroGeneratorUpdate):
    updated = update_generator(generator_id, updates.model_dump(exclude_unset=True))
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Macrogenerador no encontrado: {generator_id}")
    return updated


@router.post("/impact", response_model=MacroImpactSummary)
def impact(body: MacroImpactRequest):
    generators = body.generators or []
    if body.include_registry:
        generators = list_generators(zm=body.zm) + generators
    summary = compute_macro_impact(
        zm=body.zm,
        municipios=body.municipios,
        generators=generators,
        recalculate_market=True,
    )
    _summary_store[summary.zm] = summary
    return summary


@router.get("/summary/{zm}", response_model=MacroImpactSummary)
def get_summary(zm: str):
    zm_key = zm.upper()
    if zm_key not in _summary_store:
        raise HTTPException(
            status_code=404,
            detail=f"No hay MacroImpactSummary para ZM={zm_key}. Ejecutar POST /macros/impact primero.",
        )
    return _summary_store[zm_key]
