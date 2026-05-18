"""
Readiness Engine — score de cumplimiento por estándar.

Para cada municipio calcula:
  - GRI 306 Readiness Score (0-100%)
  - SASB EM-WM Readiness Score (0-100%)
  - ISO 9001 Readiness Score (0-100%)
  - ODS Readiness Score (0-100%)
  - Gaps accionables con prioridad

Lógica: revisa qué datos del SimulateResponse / ImpactoReal están disponibles
y validados, y qué KPIs están en threshold verde.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.standards.mapper import STANDARDS_MAP, get_mapping, color_semaforo


@dataclass
class Gap:
    campo:       str
    label:       str
    descripcion: str
    prioridad:   str  # alta | media | baja
    accion:      str


@dataclass
class StandardScore:
    nombre:      str
    codigo:      str
    score_pct:   float
    disclosures_cubiertos: int
    disclosures_total:     int
    gaps:        list[Gap] = field(default_factory=list)
    observacion: str = ""


@dataclass
class ReadinessReport:
    municipio_id:  str
    periodo:       str
    gri306:        StandardScore
    sasb:          StandardScore
    iso9001:       StandardScore
    ods:           StandardScore
    score_global:  float
    nivel:         str  # incipiente | en_desarrollo | avanzado | listo
    recomendaciones: list[str] = field(default_factory=list)


# ── GRI 306 Disclosures requeridos ────────────────────────────────────────────

GRI306_REQUIRED = {
    "GRI 306-1": "ton_rsu_generadas_anual",
    "GRI 306-2": "ton_rsu_relleno_sanitario",
    "GRI 306-3": None,  # Incidentes significativos — narrativo
    "GRI 306-4": "ton_rsu_desviadas_anual",
    "GRI 306-5": "co2e_evitadas_ton",
}

SASB_REQUIRED = {
    "EM-WM-150a.1": "ton_rsu_desviadas_anual",
    "EM-WM-110a.1": "co2e_evitadas_ton",
    "EM-WM-150a.2": "ingreso_materiales_mxn",
    "EM-WM-000.A":  "poblacion_atendida",
    "EM-WM-000.B":  "empleos_generados",
}

ISO9001_CLAUSULAS = {
    "4 - Contexto":          "diagnostico_completado",
    "5 - Liderazgo":         "campeon_identificado",
    "6 - Planificación":     "plan_completado",
    "7 - Apoyo":             "personal_capacitado",
    "8 - Operación":         "proceso_documentado",
    "9 - Evaluación":        "datos_medidos",
    "10 - Mejora":           "no_conformidades_resueltas",
}

ODS_METAS = {
    "11.6": "ton_rsu_desviadas_anual",
    "12.5": "tasa_desvio_pct",
    "13.2": "co2e_evitadas_ton",
    "8.5":  "empleos_generados",
    "8.4":  "ingreso_materiales_mxn",
    "17.16": "tir_pct",
}


def calcular_readiness(
    municipio_id: str,
    periodo: str,
    datos: dict,  # {campo: valor} del SimulateResponse + ImpactoReal
    contexto: Optional[dict] = None,  # {clausula_iso: bool}
) -> ReadinessReport:
    """
    datos: diccionario con los campos del municipio (desde simulate + impacto real).
    contexto: dict con checks booleanos para cláusulas ISO 9001.
    """
    ctx = contexto or {}

    # ── GRI 306 ───────────────────────────────────────────────────────────────
    gri_cubiertos = 0
    gri_gaps: list[Gap] = []
    for disclosure, campo in GRI306_REQUIRED.items():
        if campo is None:
            # Disclosure narrativo — siempre se puede redactar
            gri_cubiertos += 1
            continue
        val = datos.get(campo)
        if val is not None and val > 0:
            gri_cubiertos += 1
            color = color_semaforo(campo, val)
            if color == "rojo":
                mapping = get_mapping(campo)
                gri_gaps.append(Gap(
                    campo=campo,
                    label=mapping.label if mapping else campo,
                    descripcion=f"{disclosure}: valor {val:.1f} por debajo del umbral verde ({mapping.threshold_verde if mapping else 'N/D'})",
                    prioridad="alta",
                    accion=f"Aumentar desvío de residuos. Meta verde: ≥{mapping.threshold_verde if mapping else '?'} {mapping.threshold_unidad if mapping else ''}",
                ))
        else:
            mapping = get_mapping(campo)
            gri_gaps.append(Gap(
                campo=campo,
                label=mapping.label if mapping else campo,
                descripcion=f"{disclosure} requiere dato de '{campo}' — no disponible",
                prioridad="alta",
                accion="Registrar datos reales con pesaje verificado o auto-reporte mensual",
            ))

    gri_score = round(gri_cubiertos / len(GRI306_REQUIRED) * 100, 1)
    gri = StandardScore(
        nombre="GRI 306: Residuos",
        codigo="GRI 306",
        score_pct=gri_score,
        disclosures_cubiertos=gri_cubiertos,
        disclosures_total=len(GRI306_REQUIRED),
        gaps=gri_gaps,
        observacion=_gri_observacion(gri_score),
    )

    # ── SASB EM-WM ────────────────────────────────────────────────────────────
    sasb_cubiertos = 0
    sasb_gaps: list[Gap] = []
    for code, campo in SASB_REQUIRED.items():
        val = datos.get(campo)
        if val is not None and (isinstance(val, (int, float)) and val > 0 or isinstance(val, str)):
            sasb_cubiertos += 1
        else:
            mapping = get_mapping(campo)
            sasb_gaps.append(Gap(
                campo=campo,
                label=mapping.label if mapping else campo,
                descripcion=f"SASB {code} requiere '{campo}'",
                prioridad="media",
                accion="Incluir en reporte operativo mensual",
            ))

    sasb_score = round(sasb_cubiertos / len(SASB_REQUIRED) * 100, 1)
    sasb = StandardScore(
        nombre="SASB EM-WM: Gestión de Residuos",
        codigo="SASB EM-WM",
        score_pct=sasb_score,
        disclosures_cubiertos=sasb_cubiertos,
        disclosures_total=len(SASB_REQUIRED),
        gaps=sasb_gaps,
        observacion=_sasb_observacion(sasb_score),
    )

    # ── ISO 9001 ──────────────────────────────────────────────────────────────
    iso_cubiertos = 0
    iso_gaps: list[Gap] = []
    clausula_check_map = {
        "diagnostico_completado": datos.get("_diagnostico_ok", False),
        "campeon_identificado":   datos.get("_campeon_ok", False),
        "plan_completado":        datos.get("_plan_ok", ctx.get("plan_completado", False)),
        "personal_capacitado":    ctx.get("personal_capacitado", False),
        "proceso_documentado":    ctx.get("proceso_documentado", False),
        "datos_medidos":          datos.get("ton_rsu_desviadas_anual") is not None,
        "no_conformidades_resueltas": ctx.get("no_conformidades_resueltas", False),
    }
    for clausula, check_key in ISO9001_CLAUSULAS.items():
        if clausula_check_map.get(check_key, False):
            iso_cubiertos += 1
        else:
            iso_gaps.append(Gap(
                campo=check_key,
                label=clausula,
                descripcion=f"Cláusula {clausula} del SGC no verificada",
                prioridad="media" if "Operación" not in clausula else "alta",
                accion=f"Completar evidencia documental para {clausula}",
            ))

    iso_score = round(iso_cubiertos / len(ISO9001_CLAUSULAS) * 100, 1)
    iso = StandardScore(
        nombre="ISO 9001:2015 — SGC Centros de Acopio",
        codigo="ISO 9001",
        score_pct=iso_score,
        disclosures_cubiertos=iso_cubiertos,
        disclosures_total=len(ISO9001_CLAUSULAS),
        gaps=iso_gaps,
        observacion=_iso_observacion(iso_score),
    )

    # ── ODS ───────────────────────────────────────────────────────────────────
    ods_cubiertos = 0
    ods_gaps: list[Gap] = []
    for meta, campo in ODS_METAS.items():
        val = datos.get(campo)
        if val is not None and (isinstance(val, (int, float)) and val > 0):
            color = color_semaforo(campo, val)
            if color in ("verde", "gris"):
                ods_cubiertos += 1
            else:
                mapping = get_mapping(campo)
                ods_gaps.append(Gap(
                    campo=campo,
                    label=f"ODS Meta {meta}",
                    descripcion=f"Valor {val:.1f} por debajo del umbral verde",
                    prioridad="media",
                    accion=f"Mejorar {mapping.label if mapping else campo} para contribuir a ODS {meta}",
                ))
        else:
            ods_gaps.append(Gap(
                campo=campo,
                label=f"ODS Meta {meta}",
                descripcion=f"Sin datos para medir contribución a ODS {meta}",
                prioridad="baja",
                accion="Levantar dato en reporte de impacto real mensual",
            ))

    ods_score = round(ods_cubiertos / len(ODS_METAS) * 100, 1)
    ods = StandardScore(
        nombre="ODS (Agenda 2030)",
        codigo="ODS",
        score_pct=ods_score,
        disclosures_cubiertos=ods_cubiertos,
        disclosures_total=len(ODS_METAS),
        gaps=ods_gaps,
    )

    # ── Score global + nivel ──────────────────────────────────────────────────
    global_score = round((gri_score + sasb_score + iso_score + ods_score) / 4, 1)
    nivel = (
        "listo" if global_score >= 80
        else "avanzado" if global_score >= 60
        else "en_desarrollo" if global_score >= 35
        else "incipiente"
    )

    recomendaciones = _generar_recomendaciones(gri, sasb, iso, ods, datos)

    return ReadinessReport(
        municipio_id=municipio_id,
        periodo=periodo,
        gri306=gri,
        sasb=sasb,
        iso9001=iso,
        ods=ods,
        score_global=global_score,
        nivel=nivel,
        recomendaciones=recomendaciones,
    )


def _gri_observacion(score: float) -> str:
    if score >= 80:
        return "El municipio puede iniciar reporte GRI verificado por terceros."
    if score >= 50:
        return "Reporte GRI auto-declarado posible. Faltan datos cuantitativos clave."
    return "Recomendable comenzar con GRI Referenced — solo disclosures disponibles."


def _sasb_observacion(score: float) -> str:
    if score >= 80:
        return "Cumplimiento SASB EM-WM suficiente para divulgación ante inversores ESG."
    if score >= 50:
        return "Base para reporte SASB. Completar métricas de volumen y empleo."
    return "Recopilar datos de gestión operativa para alcanzar nivel SASB básico."


def _iso_observacion(score: float) -> str:
    if score >= 80:
        return "Listo para auditoría de certificación ISO 9001 en centros de acopio."
    if score >= 50:
        return "Avanzado. Documentar cláusulas 8 (Operación) y 9 (Evaluación) para certificar."
    return "Implementar SGC desde cero. ALQUIMIA puede generar el Manual de Calidad automáticamente."


def _generar_recomendaciones(gri, sasb, iso, ods, datos: dict) -> list[str]:
    recs = []
    if gri.score_pct < 60:
        recs.append("Prioridad GRI: implementar sistema de pesaje mensual en vehículos recolectores para tener 306-1 y 306-4.")
    if sasb.score_pct < 60:
        recs.append("Prioridad SASB: registrar ingresos por venta de materiales separados de los ingresos tarifarios.")
    if iso.score_pct < 60:
        recs.append("Prioridad ISO 9001: documentar el proceso operativo del centro de acopio (cláusulas 8.1-8.5).")
    if ods.score_pct < 50:
        recs.append("Prioridad ODS: establecer línea base de tasa de desvío y CO₂e para medir contribución a ODS 11.6 y 13.2.")
    if not recs:
        recs.append("Municipio en camino a estándar internacional. Siguiente paso: reporte de impacto verificado por terceros.")
    return recs
