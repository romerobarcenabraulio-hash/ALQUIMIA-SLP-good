"""
Standards Mapper — ALQUIMIA KPI → GRI 306 / SASB EM-WM / ODS / ISO 9001.

Para cada campo del SimulateResponse / ImpactoReal, define:
  - Disclosure GRI 306 correspondiente
  - Metric SASB EM-WM correspondiente
  - ODS Meta aplicable
  - Cláusula ISO 9001:2015 relacionada (para centros de acopio)
  - Interpretación y threshold de materialidad

Este mapper es la columna vertebral del reporte automático de estándares.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StandardsMapping:
    """Mapeo completo de un KPI hacia los estándares internacionales."""
    campo_alquimia:    str
    label:             str
    unidad:            str
    # GRI 306: Waste (2020)
    gri_disclosure:    Optional[str]  = None
    gri_requerimiento: Optional[str]  = None
    # SASB EM-WM (Waste Management)
    sasb_metric:       Optional[str]  = None
    sasb_code:         Optional[str]  = None
    # ODS Meta
    ods_meta:          Optional[str]  = None
    ods_descripcion:   Optional[str]  = None
    # ISO 9001:2015
    iso_clausula:      Optional[str]  = None
    iso_proceso:       Optional[str]  = None
    # Materialidad
    threshold_verde:   Optional[float] = None
    threshold_amarillo: Optional[float] = None
    threshold_unidad:  Optional[str]  = None
    notas:             str = ""


# ── Tabla maestra de mapeo ────────────────────────────────────────────────────

STANDARDS_MAP: list[StandardsMapping] = [
    StandardsMapping(
        campo_alquimia="ton_rsu_generadas_anual",
        label="Residuos sólidos generados (total)",
        unidad="toneladas/año",
        gri_disclosure="GRI 306-1",
        gri_requerimiento="Generación de residuos y residuos significativos",
        sasb_metric="Total waste generated",
        sasb_code="EM-WM-150a.1",
        ods_meta="12.5",
        ods_descripcion="Para 2030, reducir considerablemente la generación de desechos",
        iso_clausula="8.5",
        iso_proceso="Control de producción y provisión del servicio",
        threshold_verde=None,
        threshold_amarillo=None,
        notas="Dato base; se expresa por habitante para comparabilidad.",
    ),
    StandardsMapping(
        campo_alquimia="ton_rsu_desviadas_anual",
        label="Residuos desviados del relleno sanitario",
        unidad="toneladas/año",
        gri_disclosure="GRI 306-4",
        gri_requerimiento="Residuos desviados de la eliminación — recuperación",
        sasb_metric="Waste diverted from landfill",
        sasb_code="EM-WM-150a.1",
        ods_meta="11.6",
        ods_descripcion="Reducir el impacto ambiental negativo per cápita de las ciudades",
        iso_clausula="8.1",
        iso_proceso="Planificación y control operacional",
        threshold_verde=30.0,
        threshold_amarillo=15.0,
        threshold_unidad="%",
        notas="Umbral verde = ≥30% tasa de desvío. Amarillo = 15-30%.",
    ),
    StandardsMapping(
        campo_alquimia="tasa_desvio_pct",
        label="Tasa de desvío de residuos",
        unidad="%",
        gri_disclosure="GRI 306-4",
        gri_requerimiento="Porcentaje de residuos recuperados",
        sasb_metric="% waste diverted",
        sasb_code="EM-WM-150a.1",
        ods_meta="12.5",
        ods_descripcion="Reducción de la generación de desechos",
        threshold_verde=30.0,
        threshold_amarillo=15.0,
        threshold_unidad="%",
    ),
    StandardsMapping(
        campo_alquimia="co2e_evitadas_ton",
        label="Emisiones de GHG evitadas",
        unidad="tCO₂e/año",
        gri_disclosure="GRI 306-5",
        gri_requerimiento="Residuos dirigidos a eliminación — impacto climático",
        sasb_metric="GHG emissions avoided from waste diversion",
        sasb_code="EM-WM-110a.1",
        ods_meta="13.2",
        ods_descripcion="Incorporar medidas contra el cambio climático en políticas nacionales",
        iso_clausula="9.1",
        iso_proceso="Seguimiento, medición, análisis y evaluación",
        threshold_verde=500.0,
        threshold_amarillo=100.0,
        threshold_unidad="tCO₂e",
    ),
    StandardsMapping(
        campo_alquimia="ingreso_materiales_mxn",
        label="Ingresos por venta de materiales recuperados",
        unidad="MXN/año",
        gri_disclosure="GRI 306-4",
        gri_requerimiento="Valor económico de materiales recuperados",
        sasb_metric="Revenue from recycled/recovered materials",
        sasb_code="EM-WM-150a.2",
        ods_meta="8.4",
        ods_descripcion="Mejorar la eficiencia de recursos en consumo y producción",
        iso_clausula="8.4",
        iso_proceso="Control de procesos y productos suministrados externamente",
    ),
    StandardsMapping(
        campo_alquimia="empleos_generados",
        label="Empleos formales en cadena de reciclaje",
        unidad="empleos",
        gri_disclosure="GRI 401-1",
        gri_requerimiento="Nuevas contrataciones y rotación de empleados",
        sasb_metric="Number of employees",
        sasb_code="EM-WM-000.B",
        ods_meta="8.5",
        ods_descripcion="Empleo pleno y productivo y trabajo decente para todos",
        iso_clausula="7.1.2",
        iso_proceso="Recursos humanos — competencia",
        threshold_verde=5,
        threshold_amarillo=1,
        threshold_unidad="empleos",
    ),
    StandardsMapping(
        campo_alquimia="tir_pct",
        label="Tasa Interna de Retorno del programa",
        unidad="%",
        gri_disclosure=None,
        sasb_metric="Return on invested capital",
        sasb_code=None,
        ods_meta="17.16",
        ods_descripcion="Fortalecer la alianza mundial para el desarrollo sostenible",
        iso_clausula="6.1",
        iso_proceso="Acciones para abordar riesgos y oportunidades",
        threshold_verde=15.0,
        threshold_amarillo=8.0,
        threshold_unidad="%",
    ),
    StandardsMapping(
        campo_alquimia="capex_total_mxn",
        label="Inversión de capital requerida",
        unidad="MXN",
        gri_disclosure="GRI 201-1",
        gri_requerimiento="Valor económico directo generado y distribuido",
        sasb_metric="Capital expenditures",
        sasb_code="EM-WM-000.E",
        ods_meta="11.6",
        ods_descripcion="Ciudades sostenibles",
        iso_clausula="7.1.3",
        iso_proceso="Infraestructura",
    ),
    StandardsMapping(
        campo_alquimia="ton_rsu_relleno_sanitario",
        label="Residuos enviados a relleno sanitario",
        unidad="toneladas/año",
        gri_disclosure="GRI 306-5",
        gri_requerimiento="Residuos dirigidos a eliminación",
        sasb_metric="Waste to landfill",
        sasb_code="EM-WM-150a.1",
        ods_meta="12.5",
        iso_clausula="8.7",
        iso_proceso="Control de salidas no conformes",
        notas="Objetivo: minimizar. Requiere plan de cierre progresivo.",
    ),
    StandardsMapping(
        campo_alquimia="poblacion_atendida",
        label="Población atendida por el servicio",
        unidad="habitantes",
        gri_disclosure="GRI 201-1",
        sasb_metric="Population served",
        sasb_code="EM-WM-000.A",
        ods_meta="11.6",
        iso_clausula="8.2",
        iso_proceso="Requisitos para los productos y servicios",
    ),
]

# Índice por campo para lookup O(1)
_MAP_INDEX: dict[str, StandardsMapping] = {m.campo_alquimia: m for m in STANDARDS_MAP}


def get_mapping(campo: str) -> Optional[StandardsMapping]:
    return _MAP_INDEX.get(campo)


def get_all_mappings() -> list[StandardsMapping]:
    return STANDARDS_MAP


def color_semaforo(campo: str, valor: float) -> str:
    """verde | amarillo | rojo según thresholds del campo."""
    m = get_mapping(campo)
    if not m or m.threshold_verde is None:
        return "gris"
    if valor >= m.threshold_verde:
        return "verde"
    if m.threshold_amarillo and valor >= m.threshold_amarillo:
        return "amarillo"
    return "rojo"
