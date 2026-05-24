"""
Puente simulador → Ghostwriter → PDF ejecutivo (doc 01).

Genera narrativa institucional SCQA con el pipeline ÁGORA (Ghostwriter + Humanizador)
o fallback determinístico alineado a document_specs.spec_ejecutivo.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from app.agents.agora import PlanInput
from app.agents.schemas import DraftDocument
from app.export.schemas import ExecutivePdfRequest

logger = logging.getLogger(__name__)


def plan_input_from_executive_request(
    req: ExecutivePdfRequest,
    ctx: dict[str, Any],
) -> PlanInput:
    """PlanInput mínimo para ScenarioBundle + Ghostwriter."""
    snap = req.snapshot_datos or {}
    kpis = dict(req.resultados or {})
    municipio = req.municipio_nombre or req.municipio_id
    scenario_json: dict[str, Any] = {
        "horizonte": 3,
        "municipio_nombre": municipio,
        "estado_nombre": ctx.get("estado_nombre") or "",
    }
    if ctx.get("arbol_decision"):
        scenario_json["arbol_decision"] = ctx["arbol_decision"]
    if ctx.get("implicacion_decision"):
        scenario_json["implicacion_decision"] = ctx["implicacion_decision"]

    data_provenance: dict[str, Any] = {
        "score_datos": snap.get("score_datos"),
        "advertencias": [{"advertencia": a} for a in (snap.get("advertencias") or [])],
        "fuentes_usadas": snap.get("fuentes_usadas") or [],
    }
    for key, val in kpis.items():
        data_provenance.setdefault("kpis", []).append({
            "kpi_id": key,
            "valor": val,
            "provenance": {"tipo": "calculado", "confianza": 0.75, "fuente_nombre": "Simulador ALQUIMIA"},
        })

    rf = ctx.get("research_findings")
    if isinstance(rf, dict):
        pass
    else:
        rf = None

    return PlanInput(
        municipio=municipio,
        zm=req.zm,
        scenario_json=scenario_json,
        kpis_json=kpis,
        data_provenance=data_provenance,
        reasoning_graph=ctx.get("reasoning_graph") if isinstance(ctx.get("reasoning_graph"), dict) else None,
        research_findings=rf,
    )


async def generate_executive_draft(
    req: ExecutivePdfRequest,
    ctx: dict[str, Any],
) -> Optional[DraftDocument]:
    """Ghostwriter + Humanizador para doc 01; fallback SCQA si no hay LLM."""
    from app.agents.agora import draft_ejecutivo_for_export

    plan_input = plan_input_from_executive_request(req, ctx)
    municipios = [req.municipio_id] if req.municipio_id else None
    try:
        doc = await draft_ejecutivo_for_export(plan_input, municipios_activos=municipios)
        if doc and doc.secciones:
            return doc
    except Exception as exc:
        logger.warning("Ghostwriter ejecutivo falló: %s", exc)
    return None
