"""
Fase 4 — pdf_renderer.py

Renderiza PDF ejecutivo de consultoría desde manifest y KPIs.
Tipografía: Times-Roman (equivalente PDF de Times New Roman).

Política de bloqueo:
  Si reportlab falla → retorna (None, razón_explícita).
  NUNCA tira todo el pipeline por el PDF.
"""
from __future__ import annotations

import io
import logging
from datetime import date
from typing import Optional

from app.export.consulting_pdf_theme import (
    consulting_styles,
    margins,
    palette,
    table_style_consulting,
)
from app.legal.agora_export_disclaimers import AGORA_EXPORT_COVER_DISCLAIMER, EXPORT_LIABILITY_WAIVER

logger = logging.getLogger(__name__)

_MONTHS_ES = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)


def _fecha_larga_es() -> str:
    d = date.today()
    return f"{d.day} de {_MONTHS_ES[d.month - 1]} de {d.year}"


def render_executive_pdf(
    manifest: dict,
    resultados: Optional[dict] = None,
    theme_zm: str = "",
    theme_municipio: str = "",
    package_id: str = "",
    module_label: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    """
    Genera PDF ejecutivo de consultoría (Times New Roman).

    Retorna:
      (bytes, None)      → OK
      (None, "razón")    → Bloqueado
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import (
            HRFlowable,
            PageBreak,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
        )
    except ImportError as e:
        reason = f"reportlab no disponible: {e}. Instalar con pip install reportlab>=4.1.0"
        logger.warning("PDF bloqueado: %s", reason)
        return None, reason

    res = resultados or {}
    zm = manifest.get("zm") or theme_zm or "ZM"
    municipio = theme_municipio or manifest.get("municipio") or zm
    styles = consulting_styles()
    c = palette()
    GREEN = c["GREEN"]
    ORANGE = c["ORANGE"]
    BORDER = c["BORDER"]
    MARGINS = margins()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGINS["left"],
        rightMargin=MARGINS["right"],
        topMargin=MARGINS["top"],
        bottomMargin=MARGINS["bottom"],
        title=f"ALQUIMIA — Reporte Ejecutivo {zm}",
        author="ALQUIMIA · Plataforma de consultoría integral",
    )

    story: list = []

    # ── Portada consultoría ───────────────────────────────────────────────────
    story.append(Spacer(1, 1.2 * MARGINS["top"]))
    story.append(Paragraph("ALQUIMIA", styles["cover_kicker"]))
    story.append(Paragraph(
        "Plataforma de consultoría integral<br/>de gestión pública municipal",
        styles["cover_subtitle"],
    ))
    story.append(Spacer(1, 0.4 * MARGINS["top"]))
    story.append(HRFlowable(width="28%", thickness=2, color=GREEN, spaceAfter=14, hAlign="CENTER"))
    story.append(Paragraph(
        module_label or "Reporte ejecutivo de viabilidad",
        styles["cover_title"],
    ))
    story.append(Paragraph(
        f"Zona metropolitana {zm} · {municipio}",
        styles["cover_subtitle"],
    ))
    story.append(Spacer(1, 0.25 * MARGINS["top"]))
    story.append(Paragraph(_fecha_larga_es(), styles["cover_meta"]))
    story.append(Paragraph(
        f"Versión documental {manifest.get('version', '0.1-borrador')} · Confidencial",
        styles["cover_meta"],
    ))
    story.append(Spacer(1, 0.6 * MARGINS["top"]))

    # Aviso legal compacto en portada
    story.append(Paragraph("Aviso legal", styles["section_h2"]))
    cover_legal = AGORA_EXPORT_COVER_DISCLAIMER.replace("\r\n", "\n").split("\n\n")[0]
    story.append(Paragraph(cover_legal.replace("\n", "<br/>"), styles["legal"]))
    story.append(PageBreak())

    # ── Resumen ejecutivo ───────────────────────────────────────────────────────
    story.append(Paragraph("1. Resumen ejecutivo", styles["section_h1"]))
    story.append(Paragraph(
        "Este documento sintetiza la viabilidad técnica, financiera y operativa del programa "
        "de gestión integral de residuos modelado en ALQUIMIA. Está redactado para lectura "
        "en sesión de cabildo o comité de inversiones (≤5 minutos).",
        styles["body"],
    ))

    score = manifest.get("score_datos")
    score_text = f"{score:.1f}%" if score is not None else "N/D"
    score_hex = GREEN.hexval() if (score or 0) >= 70 else ORANGE.hexval()  # type: ignore[attr-defined]
    story.append(Paragraph(
        f"<b>Calidad de datos del escenario:</b> "
        f'<font color="{score_hex}">{score_text}</font>',
        styles["body"],
    ))

    n_warnings = len(manifest.get("warnings_activos") or [])
    if n_warnings:
        story.append(Paragraph(
            f"{n_warnings} advertencia(s) activa(s) — consulte la sección 4 antes de decidir.",
            styles["legal"],
        ))

    story.append(Spacer(1, 0.3 * MARGINS["top"]))
    story.append(Paragraph("2. Indicadores clave de desempeño", styles["section_h1"]))

    kpi_rows: list[tuple[str, str, str]] = []
    if res.get("tir") is not None:
        kpi_rows.append(("TIR del proyecto", f"{float(res['tir']):.1f}%", "Retorno interno"))
    if res.get("vpn") is not None:
        kpi_rows.append(("VPN", f"${float(res['vpn']):,.0f} MXN", "Valor presente neto"))
    if res.get("capex_total") is not None:
        kpi_rows.append(("CAPEX total", f"${float(res['capex_total']):,.0f} MXN", "Inversión total"))
    if res.get("payback_meses") is not None:
        kpi_rows.append(("Payback", f"{float(res['payback_meses']):.0f} meses", "Recuperación"))
    if res.get("empleos_directos") is not None:
        kpi_rows.append(("Empleos directos", f"{float(res['empleos_directos']):,.0f}", "Impacto social"))
    if res.get("co2e_evitadas_anual") is not None:
        kpi_rows.append(("CO₂e evitadas/año", f"{float(res['co2e_evitadas_anual']):,.0f} t", "Impacto ambiental"))
    if res.get("ingresos_brutos") is not None:
        kpi_rows.append(("Ingresos brutos", f"${float(res['ingresos_brutos']):,.0f} MXN", "Modelo de ingresos"))

    if kpi_rows:
        tbl = Table(
            [["Indicador", "Valor", "Interpretación"]] + kpi_rows,
            colWidths=[5.2 * MARGINS["left"], 4.2 * MARGINS["left"], 6.8 * MARGINS["left"]],
        )
        tbl.setStyle(table_style_consulting())
        story.append(tbl)
    else:
        story.append(Paragraph(
            "Los KPIs financieros no están disponibles en este borrador. "
            "Complete la línea base (M01) y el modelo financiero (M09) en el simulador, "
            "o consulte el paquete XLSX profesional.",
            styles["body"],
        ))

    # ── Fuentes y trazabilidad ────────────────────────────────────────────────
    story.append(Paragraph("3. Fuentes y trazabilidad", styles["section_h1"]))
    fuentes = manifest.get("fuentes_usadas") or []
    if fuentes:
        for f in fuentes:
            story.append(Paragraph(f"• {f}", styles["body_bullet"]))
    else:
        story.append(Paragraph(
            "Sin fuentes declaradas en el escenario. Ver matriz de trazabilidad del paquete ÁGORA.",
            styles["body"],
        ))

    # ── Advertencias ──────────────────────────────────────────────────────────
    warnings = manifest.get("warnings_activos") or []
    story.append(Paragraph("4. Advertencias y limitaciones", styles["section_h1"]))
    if warnings:
        for w in warnings:
            story.append(Paragraph(f"• {w}", styles["legal"]))
    else:
        story.append(Paragraph("No hay advertencias activas en el escenario modelado.", styles["body"]))

    story.append(Paragraph("Riesgos estructurales a considerar", styles["section_h2"]))
    for r in (
        "Cambio de administración municipal sin compromisos formalizados.",
        "Score de datos bajo — validar fuentes antes de presentar a financiadores.",
        "Reglamentos sin homologar entre municipios de la ZM.",
    ):
        story.append(Paragraph(f"• {r}", styles["body_bullet"]))

    # ── Recomendación ─────────────────────────────────────────────────────────
    story.append(Paragraph("5. Recomendación de consultoría", styles["section_h1"]))
    story.append(Paragraph(
        "Este borrador es insumo para deliberación institucional. Antes de cabildo o cierre "
        "financiero, verificar: (1) marco legal con jurista municipal, "
        "(2) cifras con tesorería/contador, (3) advertencias activas del paquete.",
        styles["body"],
    ))

    # ── Pie legal ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.4 * MARGINS["top"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=8))
    story.append(Paragraph(EXPORT_LIABILITY_WAIVER.replace("\n", "<br/>"), styles["legal"]))
    pkg_short = package_id[:16] + "…" if len(package_id) > 16 else (package_id or "simulador")
    story.append(Paragraph(
        f"ALQUIMIA · Tipografía Times New Roman · Package: {pkg_short} · "
        f"Generado {date.today().isoformat()}",
        styles["footer"],
    ))
    story.append(Paragraph(
        "Documento generado algorítmicamente. No constituye asesoría legal, financiera ni técnica certificada.",
        styles["footer"],
    ))

    try:
        doc.build(story)
        return buf.getvalue(), None
    except Exception as e:
        reason = f"Error al construir PDF: {e}"
        logger.error("PDF render falló: %s", reason)
        return None, reason
