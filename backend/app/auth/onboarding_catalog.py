"""Catálogo de segmentos y servicios para el filtro de onboarding."""
from __future__ import annotations

from typing import Literal

ClientSegment = Literal["politica_publica", "empresarial"]

SEGMENTS: dict[str, dict] = {
    "politica_publica": {
        "label": "Política pública",
        "description": "Gobierno municipal, estatal o dependencias de la administración pública.",
        "services": [
            {"id": "reforma_rsu", "label": "Reforma integral RSU", "description": "Diagnóstico, reglamento y hoja de ruta municipal."},
            {"id": "dictamen_tecnico", "label": "Dictamen técnico", "description": "Evidencia normativa y técnica para decisiones de gabinete."},
            {"id": "simulador_economico", "label": "Simulador económico", "description": "Modelado de costos, ingresos y escenarios fiscales."},
            {"id": "capacitacion_institucional", "label": "Capacitación institucional", "description": "Formación para equipos operativos y mandos medios."},
            {"id": "consultoria_regulatoria", "label": "Consultoría regulatoria", "description": "Alineación normativa federal, estatal y municipal."},
        ],
    },
    "empresarial": {
        "label": "Sector empresarial",
        "description": "Empresas, cámaras, operadores privados y consultores corporativos.",
        "services": [
            {"id": "consultoria_esg", "label": "Consultoría ESG", "description": "Cumplimiento ambiental y reportes de sostenibilidad."},
            {"id": "cadena_valor_residuos", "label": "Cadena de valor de residuos", "description": "Reciclaje, logística inversa y economía circular."},
            {"id": "due_diligence_ambiental", "label": "Due diligence ambiental", "description": "Evaluación de riesgos regulatorios y operativos."},
            {"id": "capacitacion_corporativa", "label": "Capacitación corporativa", "description": "Programas para equipos comerciales y de operaciones."},
            {"id": "analisis_viabilidad", "label": "Análisis de viabilidad", "description": "Business case para inversiones en gestión de residuos."},
        ],
    },
}

VALID_SEGMENTS = frozenset(SEGMENTS.keys())

# Servicios que exigen PDF del reglamento de aseo/limpia del municipio
SERVICES_REQUIRING_REGLAMENTO = frozenset({
    "reforma_rsu",
    "dictamen_tecnico",
    "simulador_economico",
    "consultoria_regulatoria",
})


def service_requires_reglamento(segment: str, service_id: str) -> bool:
    if segment != "politica_publica":
        return False
    return service_id in SERVICES_REQUIRING_REGLAMENTO


def service_ids_for(segment: str) -> frozenset[str]:
    block = SEGMENTS.get(segment)
    if not block:
        return frozenset()
    return frozenset(s["id"] for s in block["services"])


def is_valid_service(segment: str, service_id: str) -> bool:
    return service_id in service_ids_for(segment)
