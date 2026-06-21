"""NOUS v1 inference engine: pattern detection and insight generation."""

from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


def generate_insights(tenant_data: dict[str, Any]) -> list[dict]:
    """Generate actionable insights from tenant data.

    Args:
        tenant_data: aggregated tenant metrics (simulation state, gates, RCD, etc)

    Returns:
        list of insight dicts with tipo, titulo, descripcion, recomendacion, confianza
    """
    insights = []

    # Extract key metrics
    tasa_recuperacion = tenant_data.get("tasa_recuperacion", 0)
    ton_rcd_dia = tenant_data.get("ton_rcd_dia", 0)
    valor_economico_dia = tenant_data.get("valor_economico_dia", 0)
    gates_completed = tenant_data.get("gates_completed", 0)
    current_stage = tenant_data.get("current_stage", "validation")
    ambito_aplicables = tenant_data.get("ambito_aplicables", [])

    # ─── Pattern 1: Recovery potential ───
    if 0 < tasa_recuperacion < 50:
        insights.append({
            "tipo": "recovery_potential",
            "titulo": "Potencial de recuperación bajo",
            "descripcion": f"Tu tasa de recuperación ({tasa_recuperacion:.1f}%) está por debajo del benchmark municipal (60%). "
                          f"Aumentar la separación en origen podría generar ingresos adicionales.",
            "recomendacion": "Audita los centros de acopio locales y negocia precios de compra; considera aumentar incentivos de separación.",
            "confianza": 0.75,
            "impacto_potencial": "alto",
        })

    # ─── Pattern 2: Economic value ───
    if ton_rcd_dia > 0 and valor_economico_dia > 0:
        ingresos_mes = valor_economico_dia * 30
        if ingresos_mes > 100000:
            insights.append({
                "tipo": "cost_optimization",
                "titulo": "Oportunidad de ingresos significativos",
                "descripcion": f"Recuperando {ton_rcd_dia:.1f} ton/día de RCD, podrías generar ~${ingresos_mes:,.0f} MXN/mes. "
                              f"Esto podría financiar mejoras operativas.",
                "recomendacion": "Formaliza acuerdos de venta con recicladoras; presenta este análisis al cabildo como fuente de ingresos.",
                "confianza": 0.85,
                "impacto_potencial": "alto",
            })

    # ─── Pattern 3: Compliance readiness ───
    if gates_completed >= 3:
        insights.append({
            "tipo": "compliance_risk",
            "titulo": "Buen progreso en cumplimiento normativo",
            "descripcion": f"Has avanzado {gates_completed} puertas. Con el Marco Regulatorio en línea, "
                          f"estás en posición de demostrar cumplimiento ante ASF.",
            "recomendacion": "Documenta todo: planes, pruebas de contratación, reportes ASF. Prepara dossier para auditoría.",
            "confianza": 0.8,
            "impacto_potencial": "medio",
        })

    # ─── Pattern 4: Stage progression ───
    if current_stage == "validation" and gates_completed >= 2:
        insights.append({
            "tipo": "operational_efficiency",
            "titulo": "Listo para pasar a planeación",
            "descripcion": "Has completado validación suficiente. Puedes iniciar Plan Maestro.",
            "recomendacion": "Usa Análisis RCD y simulaciones para diseñar tu Plan Maestro. Incluye composición de residuos y flujos.",
            "confianza": 0.9,
            "impacto_potencial": "alto",
        })

    # ─── Pattern 5: Regulatory scope ───
    if ambito_aplicables and "estatal" in ambito_aplicables and "federal" in ambito_aplicables:
        insights.append({
            "tipo": "compliance_risk",
            "titulo": "Alcance regulatorio multi-nivel",
            "descripcion": "Tu municipio está sujeto a regulaciones federales, estatales y normas técnicas. "
                          "Esto requiere coordinación entre niveles.",
            "recomendacion": "En el Plan Maestro, mapea responsabilidades: qué cumple municipio, qué estado, qué federal.",
            "confianza": 0.7,
            "impacto_potencial": "medio",
        })

    # ─── Pattern 6: Data quality ───
    completeness = sum([
        1 if tasa_recuperacion > 0 else 0,
        1 if ton_rcd_dia > 0 else 0,
        1 if gates_completed > 0 else 0,
    ]) / 3
    if completeness < 0.5:
        insights.append({
            "tipo": "operational_efficiency",
            "titulo": "Datos incompletos limitan insights",
            "descripcion": "No tenemos suficientes datos de operación (RCD, recuperación, etc). "
                          "Completa el Simulador con información real.",
            "recomendacion": "Carga datos operacionales: generación diaria, composición, precios de venta, centros de acopio.",
            "confianza": 0.95,
            "impacto_potencial": "alto",
        })

    return insights
