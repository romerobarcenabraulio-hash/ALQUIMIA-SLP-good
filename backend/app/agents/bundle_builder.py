"""
Fase 3 — ÁGORA Document Intelligence: adaptador PlanInput → ScenarioBundle.

Este módulo convierte la entrada legacy (PlanInput con dicts sueltos) en el
contrato estructurado ScenarioBundle que el Director de Paquete y los agentes
de Fase 3 necesitan.

Retrocompatibilidad: PlanInput sigue funcionando desde el router generate_plan.py.
La conversión es transparente para el caller.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.agents.agora import PlanInput
from app.agents.schemas import ScenarioBundle

logger = logging.getLogger(__name__)


def build_bundle_from_plan_input(
    plan_input: PlanInput,
    municipios_activos: Optional[list[str]] = None,
) -> ScenarioBundle:
    """
    Convierte un PlanInput (entrada legacy del router) en un ScenarioBundle
    estructurado para la Fase 3.

    Args:
        plan_input:          Entrada del router generate_plan.
        municipios_activos:  Lista de municipio_ids activos. Si es None, usa
                             [plan_input.municipio].
    """
    # Municipios activos: desde el campo del router o fallback al municipio principal
    municipios = municipios_activos or [plan_input.municipio.lower()]

    # KPIs con provenance: construir desde kpis_json + data_provenance
    kpis_con_provenance: list[dict] = []
    if plan_input.data_provenance:
        # El data_provenance ya viene con kpis y provenance por KPI
        kpis_raw = plan_input.data_provenance.get("kpis", [])
        for k in kpis_raw:
            kpis_con_provenance.append({
                "kpi_id":    k.get("kpi_id", ""),
                "valor":     k.get("valor"),
                "unidad":    k.get("unidad", ""),
                "provenance": k.get("provenance"),
            })
    elif plan_input.kpis_json:
        # Sin provenance: mapear kpis_json plano, marcar como sin trazabilidad
        for kpi_id, valor in plan_input.kpis_json.items():
            kpis_con_provenance.append({
                "kpi_id":    kpi_id,
                "valor":     valor,
                "provenance": None,   # sin trazabilidad — honesto
            })

    # Diagnóstico legal por municipio (desde el repo legal)
    legal_municipal: dict = {}
    warnings: list[str] = []
    bloqueos: list[str] = []

    try:
        from app.legal.diagnostic import build_diagnostic
        for m_id in municipios:
            diag = build_diagnostic(m_id.lower())
            if diag:
                legal_municipal[m_id] = {
                    "municipio_id":      m_id,
                    "reglamento":        diag.reglamento_nombre,
                    "version":           diag.reglamento_version,
                    "fuente":            diag.reglamento_fuente,
                    "score_legal":       diag.score_legal,
                    "verificado":        not diag.agora_bloqueado,
                    "agora_bloqueado":   diag.agora_bloqueado,
                    "brecha_critica":    diag.brecha_critica,
                    "articulos":         [a.model_dump() for a in diag.articulos]
                                         if hasattr(diag, "articulos") else [],
                }
                if diag.agora_bloqueado:
                    bloqueos.append(
                        f"Municipio '{m_id}' bloqueado: {diag.brecha_critica or 'reglamento no verificado'}"
                    )
            else:
                logger.warning(f"No se encontró diagnóstico legal para '{m_id}'")
                warnings.append(f"Municipio '{m_id}' sin diagnóstico jurídico en el repositorio legal.")
    except Exception as e:
        logger.warning(f"No se pudo cargar diagnóstico legal: {e}")
        warnings.append(f"Diagnóstico legal no disponible: {e}")

    # Paquete metropolitano
    legal_metropolitano: Optional[dict] = None
    if len(municipios) > 1:
        try:
            from app.legal.metropolitan import build_paquete_metropolitano
            metro_pkg = build_paquete_metropolitano(plan_input.zm, municipios)
            if metro_pkg:
                legal_metropolitano = metro_pkg.model_dump() if hasattr(metro_pkg, "model_dump") else dict(metro_pkg)
        except Exception as e:
            logger.warning(f"Paquete metropolitano no disponible: {e}")
            warnings.append(f"Paquete metropolitano no disponible: {e}")

    # Score de confianza: desde score_datos del data_provenance o default
    score_datos = 100
    if plan_input.data_provenance:
        score_datos = plan_input.data_provenance.get("score_datos", 100)
        # Advertencias de datos con bloqueo
        for adv in plan_input.data_provenance.get("advertencias", []):
            if adv.get("bloquea_agora"):
                warnings.append(
                    f"KPI crítico sin dato: {adv.get('kpi_label', adv.get('kpi_id', '?'))} — "
                    f"{adv.get('advertencia', '')}"
                )
    confidence_score = max(0.0, min(1.0, score_datos / 100.0))

    bundle = ScenarioBundle(
        zm=plan_input.zm,
        municipios_activos=municipios,
        horizonte_anios=plan_input.scenario_json.get("horizonte", 3),
        inputs_usuario=plan_input.scenario_json,
        resultados=plan_input.kpis_json,
        kpis_con_provenance=kpis_con_provenance,
        snapshot_datos=plan_input.data_provenance,
        legal_municipal=legal_municipal,
        legal_metropolitano=legal_metropolitano,
        warnings=warnings,
        bloqueos=bloqueos,
        confidence_score=confidence_score,
    )

    logger.info(
        f"ScenarioBundle construido: zm={bundle.zm}, "
        f"municipios={bundle.municipios_activos}, "
        f"kpis={len(bundle.kpis_con_provenance)}, "
        f"confidence={bundle.confidence_score:.2f}, "
        f"warnings={len(bundle.warnings)}, bloqueos={len(bundle.bloqueos)}"
    )

    return bundle
