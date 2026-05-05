"""Fase 13.6: generador de reporte ejecutivo modelado (sin archivo binario)."""
from __future__ import annotations

from datetime import datetime, timezone

from app.export.schemas import (
    ExportRequest,
    ExportResponse,
    ExportSection,
    SeccionExportada,
)

_SECTION_TITLES = {
    ExportSection.infraestructura: "Plan de Infraestructura de Centros de Acopio",
    ExportSection.macrogeneradores: "Diagnóstico de Macrogeneradores Municipales",
    ExportSection.flujos: "Flujos de Residuos y Brecha de Recuperación",
    ExportSection.roadmap: "Hoja de Ruta Ejecutiva 30/60/90",
    ExportSection.portal_empresarial: "Portal Empresarial e Institucional",
}

_SECTION_SUMMARIES = {
    ExportSection.infraestructura: (
        "Resume la capacidad instalada por tipo de centro y la brecha operativa "
        "contra flujo capturable municipal."
    ),
    ExportSection.macrogeneradores: (
        "Consolida los aportes adicionales de grandes generadores por tipo, con "
        "incertidumbre y advertencias de no-RSU."
    ),
    ExportSection.flujos: (
        "Presenta corrientes por destino, recuperación potencial y pérdidas "
        "recuperables con oportunidad económica estimada."
    ),
    ExportSection.roadmap: (
        "Integra acciones ejecutivas 30/60/90 con prioridades, responsables y "
        "KPIs de cierre municipal."
    ),
    ExportSection.portal_empresarial: (
        "Describe evaluación organizacional por actividad, plan de contenedores "
        "y alertas de proveedor autorizado cuando aplica."
    ),
}

_SECTION_TRACE = {
    ExportSection.infraestructura: "brecha_ton_dia = capturable - capacidad_instalada",
    ExportSection.macrogeneradores: "ton_dia = actividad_base × factor_tipo × estacionalidad",
    ExportSection.flujos: "(ton_recuperables_perdidas × 365 días × $800/ton)",
    ExportSection.roadmap: "prioridad = f(brecha, corrientes_criticas, estado_legal, no-RSU)",
    ExportSection.portal_empresarial: "ton_dia = variables_tipo × factor_sectorial (rango ±30%)",
}


def _section_payload(section: ExportSection, include_trace: bool, include_warnings: bool) -> SeccionExportada:
    datos = {
        "unidad": "t/día",
        "fuente": "ALQUIMIA 2026",
    }
    advertencias = []
    if include_warnings:
        advertencias = [
            "Salida propuesta no oficial; validar con autoridad municipal competente."
        ]
    return SeccionExportada(
        nombre=section.value,
        titulo=_SECTION_TITLES[section],
        resumen=_SECTION_SUMMARIES[section],
        datos_clave=datos,
        advertencias=advertencias,
        trazabilidad=_SECTION_TRACE[section] if include_trace else None,
    )


def build_export_report(req: ExportRequest) -> ExportResponse:
    blockers: list[str] = []
    municipio_id = (req.municipio_id or "").strip().lower()

    if not municipio_id:
        blockers.append("municipio_id es obligatorio para exportar reporte ejecutivo.")
    if not req.secciones:
        blockers.append("Selecciona al menos una sección para exportar")

    if blockers:
        return ExportResponse(
            status="blocked",
            blockers=blockers,
            municipio_id=municipio_id,
            formato=req.formato,
            secciones_exportadas=[],
            metadata={
                "fecha_generacion": datetime.now(timezone.utc).isoformat(),
                "version": "13.6",
                "total_secciones": "0",
            },
        )

    secciones = [
        _section_payload(
            section=s,
            include_trace=req.incluir_trazabilidad,
            include_warnings=req.incluir_advertencias,
        )
        for s in req.secciones
    ]

    return ExportResponse(
        status="ready",
        blockers=[],
        municipio_id=municipio_id,
        formato=req.formato,
        secciones_exportadas=secciones,
        metadata={
            "fecha_generacion": datetime.now(timezone.utc).isoformat(),
            "version": "13.6",
            "total_secciones": str(len(secciones)),
        },
    )
