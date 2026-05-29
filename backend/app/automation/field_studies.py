"""Fase 19 field studies, M00B pipeline and missing KPI contracts.

This module defines defensibility requirements. It does not create local study
results and it does not upgrade benchmarks into municipal truth.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Literal

StudyCriticality = Literal["critico", "recomendado", "opcional"]
GateId = Literal["G1", "G2", "G3", "G4", "G5"]


FIELD_STUDIES: dict[str, dict[str, Any]] = {
    "estudio_cuarteo": {
        "name": "Estudio de cuarteo y caracterización física",
        "standard": "NMX-AA-015-1985",
        "supporting_standards": ["NMX-AA-019", "NMX-AA-022", "NMX-AA-061", "NMX-AA-091"],
        "gate": "G1",
        "criticality": "critico",
        "responsible": "Laboratorio o consultor certificado contratado por el municipio",
        "paid_by": "municipio",
        "estimated_cost_mxn": {"min": 80_000, "max": 250_000},
        "estimated_duration": "2-3 semanas",
        "evidence_required": [
            "cedula_campo_pdf_url",
            "informe_laboratorio_pdf_url",
            "bitacora_pdf_url",
            "fotografias_urls",
        ],
        "schema": {
            "metodologia_aplicada": "NMX-AA-015-1985",
            "fecha_estudio": "date",
            "duracion_dias": "number",
            "consultor_responsable": "string",
            "zonas_muestreadas": "array",
            "resultados_caracterizacion": {
                "generacion_per_capita_kg_dia": "number",
                "peso_volumetrico_kg_m3": "number",
                "composicion_pct": "object",
                "humedad_pct": "number",
                "materia_organica_pct": "number",
                "poder_calorifico_kJ_kg": "number|null",
            },
            "evidencia": "object",
            "costo_estudio_mxn": "number",
            "proveedor_estudio": "string",
        },
        "auditor_note": "Sin estudio local, M01 debe mostrarse como benchmark o inferencia, no caracterización municipal oficial.",
    },
    "estudio_rutas": {
        "name": "Estudio de rutas y tiempos de recolección",
        "standard": "Wasteaware ISWM operational practice",
        "gate": "G2",
        "criticality": "critico",
        "responsible": "Operador actual supervisado por municipio/Alquimia",
        "paid_by": "municipio_o_concesionario",
        "estimated_cost_mxn": {"min": 30_000, "max": 100_000},
        "estimated_duration": "2-4 semanas",
        "evidence_required": ["gps_tracks", "bitacora_rutas_pdf_url", "cedulas_turno", "pesajes_por_ruta"],
        "schema": {
            "fecha_inicio_estudio": "date",
            "fecha_fin_estudio": "date",
            "rutas_documentadas": "array",
            "cobertura_efectiva_pct": "number",
            "zonas_sin_cobertura": "array",
        },
        "auditor_note": "Sin rutas reales, M08 solo puede mostrar hipótesis operativas.",
    },
    "censo_pepenadores": {
        "name": "Censo de pepenadores y trabajadores informales",
        "standard": "GRI 408-1 + buenas prácticas ISWM",
        "gate": "G1",
        "criticality": "critico",
        "responsible": "Trabajo social municipal u ONG local supervisada",
        "paid_by": "municipio",
        "estimated_cost_mxn": {"min": 50_000, "max": 150_000},
        "estimated_duration": "3-6 semanas",
        "evidence_required": ["cedula_censo_pdf_url", "consentimientos", "resumen_demografico", "plan_integracion"],
        "schema": {
            "fecha_censo": "date",
            "ubicaciones_relevadas": "array",
            "esquema_actual_compensacion": "string",
            "riesgos_laborales_identificados": "array",
            "propuesta_integracion": "object",
        },
        "auditor_note": "No exponer nombres personales en analytics agregada; conservar datos nominales solo en Tenant Private Store.",
    },
    "auditoria_infraestructura": {
        "name": "Auditoría de infraestructura existente",
        "standard": "ISO 55000 asset management practice",
        "gate": "G2",
        "criticality": "critico",
        "responsible": "Personal técnico municipal o consultor externo",
        "paid_by": "municipio",
        "estimated_cost_mxn": {"min": 30_000, "max": 80_000},
        "estimated_duration": "1-2 semanas",
        "evidence_required": ["inventario_flotilla", "fichas_relleno", "fotografias_urls", "dictamen_estado_activos"],
        "schema": {
            "flotilla": "array",
            "rellenos_sanitarios": "array",
            "centros_transferencia": "array",
            "centros_acopio_existentes": "array",
            "estacion_pesaje_publica": "boolean",
            "taller_mantenimiento_municipal": "boolean",
        },
        "auditor_note": "Sin auditoría, M06/M09 deben distinguir CAPEX estimado de línea base local validada.",
    },
    "estudio_juridico": {
        "name": "Estudio jurídico-administrativo del marco vigente",
        "standard": "LGPGIR + marco estatal aplicable",
        "gate": "G1",
        "criticality": "critico",
        "responsible": "Abogado externo especializado en derecho administrativo municipal",
        "paid_by": "municipio",
        "estimated_cost_mxn": {"min": 40_000, "max": 120_000},
        "estimated_duration": "2-4 semanas",
        "evidence_required": ["dictamen_firmado_pdf_url", "cedula_profesional", "matriz_brechas", "propuesta_articulos"],
        "schema": {
            "abogado_firmante": "object",
            "fecha_dictamen": "date",
            "reglamento_vigente_analizado": "object",
            "brechas_identificadas": "array",
            "facultades_cabildo": "object",
            "riesgos_juridicos": "array",
        },
        "auditor_note": "M03B sin firma jurídica es análisis preliminar, no dictamen.",
    },
    "estudio_psp": {
        "name": "Estudio de aceptación a pago por servicio / PSP",
        "standard": "Valoración contingente / experimento de elección",
        "gate": "G2",
        "criticality": "recomendado",
        "required_when": "M11 propone tarifa al usuario o recuperación vía cobro directo.",
        "responsible": "Consultora especializada en estudios socioeconómicos",
        "paid_by": "municipio",
        "estimated_cost_mxn": {"min": 100_000, "max": 300_000},
        "estimated_duration": "4-8 semanas",
        "evidence_required": ["metodologia_pdf_url", "base_respuestas_anonimizada", "informe_resultados_pdf_url"],
        "schema": {
            "metodologia": "valoracion_contingente|experimento_eleccion|encuesta_directa",
            "muestra_n": "number",
            "estratos_socioeconomicos": "array",
            "resultados": "object",
            "condiciones_para_pagar": "array",
            "proyeccion_recaudacion_mxn_anual": "number",
        },
        "auditor_note": "Sin PSP, M11/M13 no deben presentar tarifa ciudadana como defendible.",
    },
}

GATE_FIELD_STUDY_REQUIREMENTS: dict[str, list[dict[str, str]]] = {
    "G1": [
        {"study_id": "estudio_cuarteo", "criticality": "critico"},
        {"study_id": "censo_pepenadores", "criticality": "critico"},
        {"study_id": "estudio_juridico", "criticality": "critico"},
    ],
    "G2": [
        {"study_id": "estudio_rutas", "criticality": "critico"},
        {"study_id": "auditoria_infraestructura", "criticality": "critico"},
        {"study_id": "estudio_psp", "criticality": "recomendado"},
    ],
}

M00B_HERMES_PIPELINE: list[dict[str, Any]] = [
    {
        "field_group": "presidente_municipal",
        "sources": ["INE", "INAFED", "sitio_oficial_municipal"],
        "method": "scraping + verificación cruzada",
        "confidence": "verified_secondary",
        "fallback": "manual_required",
        "estimated_time": "30 seg",
        "must_not_infer": ["posturas_no_declaradas", "conflictos_internos"],
    },
    {
        "field_group": "cabildo",
        "sources": ["sitio_oficial_municipal", "periodico_oficial_estado"],
        "method": "scraping + descarga de gaceta",
        "confidence": "verified_secondary",
        "fallback": "manual_required",
        "estimated_time": "1-3 min",
        "must_not_infer": ["postura_por_regidor", "partido_como_variable_aprendible"],
    },
    {
        "field_group": "comisiones_permanentes",
        "sources": ["sitio_oficial_municipal", "gaceta_municipal"],
        "method": "scraping de reglamento interior y actas públicas",
        "confidence": "verified_secondary",
        "fallback": "manual_required",
        "estimated_time": "1-2 min",
        "must_not_infer": ["influencia_informal"],
    },
    {
        "field_group": "estructura_administrativa",
        "sources": ["PNT", "sitio_oficial_municipal"],
        "method": "consulta PNT + scraping",
        "confidence": "verified_official",
        "fallback": "manual_required",
        "estimated_time": "30 seg",
        "must_not_infer": ["telefonos_personales", "correos_personales"],
    },
    {
        "field_group": "reglamento_limpia",
        "sources": ["periodico_oficial_estado", "marco_normativo_municipal"],
        "method": "búsqueda por palabras clave + descarga PDF",
        "confidence": "verified_official",
        "fallback": "manual_required",
        "estimated_time": "2-5 min",
        "must_not_infer": ["vigencia_no_publicada"],
    },
    {
        "field_group": "concesion_actual",
        "sources": ["periodico_oficial_estado", "prensa_local", "PNT"],
        "method": "búsqueda documental con validación humana",
        "confidence": "inferred",
        "fallback": "manual_required",
        "estimated_time": "3-8 min",
        "must_not_infer": ["cifras_comerciales_privadas", "contratos_no_publicos"],
    },
    {
        "field_group": "prensa_24_meses",
        "sources": ["Google News API", "hemeroteca_local"],
        "method": "API call con filtros por municipio y RSU",
        "confidence": "inferred",
        "fallback": "manual_required",
        "estimated_time": "2-3 min",
        "must_not_infer": ["sentimiento_politico_no_trazado"],
    },
    {
        "field_group": "proximo_proceso_electoral",
        "sources": ["INE", "organismo_publico_local_electoral"],
        "method": "consulta directa calendario electoral",
        "confidence": "verified_official",
        "fallback": "manual_required",
        "estimated_time": "30 seg",
        "must_not_infer": [],
    },
]

WAVE_ONE_KPIS: dict[str, dict[str, Any]] = {
    "sdg_11_6_1": {
        "name": "SDG 11.6.1",
        "module_id": "city_baseline",
        "gate": "G1",
        "definition": "Proporción de residuos sólidos municipales recolectados y manejados en instalaciones controladas respecto al total generado.",
        "formula": "(residuos_recolectados_y_manejados_controladamente_ton / residuos_generados_totales_ton) * 100",
        "required_source": "estudio_cuarteo + estudio_rutas + auditoria_infraestructura",
        "confidence": "missing_local_study_until_evidence",
        "standard": "SDG 11.6.1",
    },
    "wasteaware_fisicos": {
        "name": "Wasteaware ISWM físicos",
        "module_id": "city_baseline",
        "gate": "G1",
        "definition": "Tasas físicas de recolección formal, captura para reciclaje y disposición controlada.",
        "formula": "rúbrica Wasteaware ISWM por componente físico",
        "required_source": "estudio_cuarteo + estudio_rutas + censo_pepenadores + auditoria_infraestructura",
        "confidence": "missing_local_study_until_evidence",
        "standard": "Wasteaware ISWM Benchmark Indicators",
    },
    "wasteaware_gobernanza": {
        "name": "Wasteaware ISWM gobernanza",
        "module_id": "capacidad_institucional",
        "gate": "G1",
        "definition": "Inclusividad de usuarios, sector informal, sostenibilidad financiera e instituciones.",
        "formula": "rúbrica Wasteaware ISWM por componente de gobernanza",
        "required_source": "censo_pepenadores + estudio_juridico + cuenta_publica_municipal",
        "confidence": "missing_local_study_until_evidence",
        "standard": "Wasteaware ISWM Benchmark Indicators",
    },
    "gri_302_1_energia": {
        "name": "GRI 302-1 energía",
        "module_id": "logistica",
        "gate": "G2",
        "definition": "Consumo energético dentro de la organización asociado a flotilla, operación y biogás si aplica.",
        "formula": "combustible_litros * factor_energia + electricidad_kWh + energía_recuperada",
        "required_source": "estudio_rutas + auditoria_infraestructura + facturas_energia",
        "confidence": "missing_local_study_until_evidence",
        "standard": "GRI 302-1",
    },
    "gri_303_2_lixiviados": {
        "name": "GRI 303-2 agua/lixiviados",
        "module_id": "infraestructura",
        "gate": "G2",
        "definition": "Gestión de impactos relacionados con vertidos de agua y lixiviados en infraestructura RSU.",
        "formula": "cumplimiento de manejo de lixiviados + volumen tratado/descargado con evidencia",
        "required_source": "auditoria_infraestructura + bitacoras_lixiviados",
        "confidence": "missing_local_study_until_evidence",
        "standard": "GRI 303-2",
    },
    "inclusion_sector_informal": {
        "name": "Indicador de inclusión del sector informal",
        "module_id": "social_diagnostico",
        "gate": "G1",
        "definition": "Grado de identificación, protección e integración de pepenadores y trabajadores informales.",
        "formula": "rúbrica: censo completo, riesgos laborales, menores identificados, propuesta de integración y compensación",
        "required_source": "censo_pepenadores",
        "confidence": "missing_local_study_until_evidence",
        "standard": "GRI 408-1 + Wasteaware informal sector inclusion",
    },
}

MODULE_DEFENSIBILITY_RULES: dict[str, str] = {
    "city_baseline": "M01 debe distinguir benchmark nacional, inferencia y estudio de cuarteo local.",
    "marco_legal": "M03B sin estudio jurídico firmado debe mostrarse como análisis preliminar, no dictamen.",
    "infraestructura": "M06 sin auditoría de infraestructura debe marcar brecha crítica.",
    "logistica": "M08 sin estudio de rutas debe marcar hipótesis operativa.",
    "costos_programa": "M09 sin auditoría/rutas debe mostrar CAPEX/OPEX estimado, no línea base validada.",
    "esquema_concesion": "M11 sin PSP no debe defender tarifa al usuario.",
    "escenarios_financieros": "M13 debe separar datos locales validados de sensibilidad financiera.",
}


def gate_gap_summary(completed_studies: set[str], gate: GateId) -> list[dict[str, Any]]:
    gaps: list[dict[str, Any]] = []
    for requirement in GATE_FIELD_STUDY_REQUIREMENTS.get(gate, []):
        study_id = requirement["study_id"]
        if study_id in completed_studies:
            continue
        study = FIELD_STUDIES[study_id]
        gaps.append(
            {
                "study_id": study_id,
                "gate": gate,
                "criticality": requirement["criticality"],
                "status": "brecha_critica" if requirement["criticality"] == "critico" else "brecha_recomendada",
                "message": f"Falta estudio local: {study['name']}. No convertir benchmark en verdad municipal.",
                "evidence_required": deepcopy(study["evidence_required"]),
            }
        )
    return gaps


def kpi_contracts() -> list[dict[str, Any]]:
    return [deepcopy({"kpi_id": key, **value}) for key, value in WAVE_ONE_KPIS.items()]

