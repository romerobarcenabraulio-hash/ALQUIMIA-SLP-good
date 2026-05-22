"""
Validación numérica RSU — sin LLM (ahorra tokens en ÁGORA).

Reglas alineadas a formulas_rsu_reference.md.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.agents.schemas import ScenarioBundle, ValidationIssue


def _f(kpis: Dict[str, Any], key: str) -> Optional[float]:
    v = kpis.get(key)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def check_kpi_ranges(bundle: ScenarioBundle) -> List[ValidationIssue]:
    """Retorna issues CRITICO/IMPORTANTE por KPIs fuera de rango defendible."""
    issues: List[ValidationIssue] = []
    kpis: Dict[str, Any] = {}
    if getattr(bundle, "kpis_con_provenance", None):
        for k in bundle.kpis_con_provenance:
            kid = k.get("kpi_id")
            if kid:
                kpis[kid] = k.get("valor")
    raw = getattr(bundle, "kpis", None) or bundle.inputs_usuario.get("kpis")
    if isinstance(raw, dict):
        kpis.update(raw)

    tir = _f(kpis, "tir") or _f(kpis, "tir_pct")
    if tir is not None:
        if tir > 50:
            issues.append(ValidationIssue(
                severity="error", document_id="bundle",
                message=f"TIR {tir:.1f}% > 50% — revisar captura y precios (CRITICO RSU)",
                code="KPI_TIR_ALTO",
            ))
        elif tir < -20:
            issues.append(ValidationIssue(
                severity="error", document_id="bundle",
                message=f"TIR {tir:.1f}% < −20% — escenario no defendible",
                code="KPI_TIR_BAJO",
            ))

    captura = _f(kpis, "captura_anio1") or _f(kpis, "pctCapturaAnio1")
    if captura is not None and captura > 30:
        issues.append(ValidationIssue(
            severity="error", document_id="bundle",
            message=f"Captura año 1 {captura:.1f}% > 30% sin encuesta/piloto documentado",
            code="KPI_CAPTURA_ALTA",
        ))

    gen = _f(kpis, "genPerCapita") or _f(kpis, "gen_percapita")
    if gen is not None and (gen < 0.40 or gen > 1.50):
        issues.append(ValidationIssue(
            severity="warning", document_id="bundle",
            message=f"Generación {gen:.2f} kg/hab/día fuera de [0.40, 1.50]",
            code="KPI_GEN_PERCAPITA",
        ))

    return issues
