"""
Mapeo de documentos ÁGORA → carpetas analisis/ e implementacion/.
"""
from __future__ import annotations

import re
from typing import Optional

# Stems de documentos en analisis/ (decisión)
ANALISIS_DOC_PATTERNS: list[str] = [
    r"01_.*",
    r"02_.*",
    r"03_.*",
    r"04_.*",
    r"07_.*",
    r"03b_.*",
]

# task_id → stems de DOCX en entregables/ de la etapa
ETAPA_ENTREGABLES: dict[str, list[str]] = {
    "T01": ["10_", "02_"],
    "T02": [],
    "T03": ["03_", "04_"],
    "T04": [],
    "T05": [],
    "T06": [],
    "T07": ["09_"],
    "T08": [],
    "T09": ["06_"],
    "T10": [],
    "T11": [],
    "T12": [],
    "T13": ["08_"],
    "T14": ["05_"],
    "T15": ["11_"],
}

# task_id → ids de plantillas en herramientas/
ETAPA_HERRAMIENTAS: dict[str, list[str]] = {
    "T01": ["formulario_levantamiento_predial"],
    "T03": ["acta_sesion_cabildo", "plantilla_convocatoria_licitacion"],
    "T04": ["bitacora_obra_ca"],
    "T07": ["ficha_tecnica_vehicular"],
    "T11": ["encuesta_ciudadana"],
    "T13": ["kpis_operativos_tracking"],
    "T14": ["checklist_arranque_oficial"],
}

# Carpeta analisis por stem
ANALISIS_FOLDERS: dict[str, str] = {
    "01": "01_Resumen_Ejecutivo",
    "02": "02_Modelo_Tecnico_Financiero",
    "03": "03_Diagnostico_Juridico",
    "03b": "03_Diagnostico_Juridico",
    "04": "04_Coordinacion_Metropolitana",
    "07": "07_Fuentes_Trazabilidad",
}


def _stem_prefix(stem: str) -> str:
    m = re.match(r"^(\d+[a-z]?)_", stem, re.I)
    return m.group(1).lower() if m else stem[:2]


def is_analisis_doc(stem: str) -> bool:
    return any(re.match(p, stem, re.I) for p in ANALISIS_DOC_PATTERNS)


def analisis_folder(stem: str) -> str:
    prefix = _stem_prefix(stem)
    return ANALISIS_FOLDERS.get(prefix, f"{prefix}_Documento")


def doc_matches_etapa(stem: str, task_id: str) -> bool:
    prefixes = ETAPA_ENTREGABLES.get(task_id, [])
    return any(stem.startswith(p) for p in prefixes)


def etapa_herramientas(task_id: str) -> list[str]:
    return ETAPA_HERRAMIENTAS.get(task_id, [])


def resolve_gantt_params(manifest: dict, resultados: dict | None) -> dict:
    """Extrae parámetros para build_gantt desde manifest/resultados."""
    res = resultados or {}
    mix = manifest.get("mix_cas") or res.get("mixCAs") or {}
    return {
        "municipio": (manifest.get("municipios") or ["municipio"])[0],
        "zm": manifest.get("zm") or "SLP",
        "scenario_id": manifest.get("bundle_id") or manifest.get("package_id") or "export",
        "n_cas_pequeno": int(mix.get("P") or mix.get("pequeno") or 1),
        "n_cas_mediano": int(mix.get("M") or mix.get("mediano") or 0),
        "n_cas_grande": int(mix.get("G") or mix.get("grande") or 0),
        "capex_total": float(res.get("capex_total") or res.get("capexTotal") or 1_500_000),
        "horizonte_semanas": int(res.get("horizonte_semanas") or 52),
    }
