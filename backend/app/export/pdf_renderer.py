"""
Fase 4 — pdf_renderer.py

Renderiza PDF ejecutivo de lectura rápida desde manifest y KPIs.

Política de bloqueo:
  Si reportlab falla o no está disponible → retorna (None, razón_explícita).
  El package_renderer registra el bloqueo en RenderReport y continúa con DOCX/XLSX.
  NUNCA tira todo el pipeline por el PDF.
"""
from __future__ import annotations

import io
import logging
from datetime import date
from typing import Optional

logger = logging.getLogger(__name__)


def render_executive_pdf(
    manifest: dict,
    resultados: Optional[dict] = None,
    theme_zm: str = "",
    theme_municipio: str = "",
    package_id: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    """
    Genera PDF ejecutivo de lectura rápida.

    Retorna:
      (bytes, None)      → OK
      (None, "razón")    → Bloqueado — razón explícita para RenderReport
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
        from reportlab.lib.enums import TA_CENTER
    except ImportError as e:
        reason = f"reportlab no disponible: {e}. Instalar con pip install reportlab>=4.1.0"
        logger.warning(f"PDF bloqueado: {reason}")
        return None, reason

    res = resultados or {}
    zm  = manifest.get("zm") or theme_zm or "ZM"

    buf  = io.BytesIO()
    doc  = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.5 * cm, rightMargin=2.5 * cm,
        topMargin=2.5 * cm,  bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    GREEN  = colors.HexColor("#3B6D11")
    BLUE   = colors.HexColor("#1A5FA8")
    ORANGE = colors.HexColor("#D4881E")
    DARK   = colors.HexColor("#1C1B18")
    GREY   = colors.HexColor("#6B6760")

    title_style = ParagraphStyle("Title4",
        fontName="Helvetica-Bold", fontSize=22, textColor=GREEN,
        spaceAfter=6, alignment=TA_CENTER)
    sub_style = ParagraphStyle("Sub4",
        fontName="Helvetica", fontSize=11, textColor=GREY,
        spaceAfter=4, alignment=TA_CENTER)
    h2_style = ParagraphStyle("H2_4",
        fontName="Helvetica-Bold", fontSize=13, textColor=BLUE,
        spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("Body4",
        fontName="Helvetica", fontSize=10, textColor=DARK,
        spaceAfter=4, leading=14)
    warn_style = ParagraphStyle("Warn4",
        fontName="Helvetica", fontSize=9, textColor=ORANGE,
        spaceAfter=4, leading=12)
    footer_style = ParagraphStyle("Footer4",
        fontName="Helvetica", fontSize=8, textColor=GREY,
        alignment=TA_CENTER)

    story = []

    # ── Portada ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5 * cm))
    story.append(Paragraph("ÁGORA GOV — ALQUIMIA", sub_style))
    story.append(Paragraph(
        f"Reporte Ejecutivo — ZM {zm}",
        title_style
    ))
    story.append(Paragraph(
        f"{theme_municipio or zm}  ·  {date.today().strftime('%d de %B de %Y')}  ·  v{manifest.get('version','0.1')}",
        sub_style
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN, spaceAfter=16))

    # ── Score y estado ────────────────────────────────────────────────────────
    score = manifest.get("score_datos")
    score_text = f"{score:.1f}%" if score is not None else "N/D"
    score_color = GREEN if (score or 0) >= 70 else ORANGE

    story.append(Paragraph(
        f'Score de datos del paquete: <font color="{score_color.hexval()}">'  # type: ignore[attr-defined]
        f'<b>{score_text}</b></font>',
        body_style
    ))

    n_warnings = len(manifest.get("warnings_activos") or [])
    if n_warnings:
        story.append(Paragraph(
            f"⚠ {n_warnings} advertencia(s) activa(s) — ver Advertencias.", warn_style))

    story.append(Spacer(1, 0.5 * cm))

    # ── Mensajes clave ────────────────────────────────────────────────────────
    story.append(Paragraph("Mensajes clave del paquete", h2_style))

    kpi_rows = []
    if res.get("tir"):
        kpi_rows.append(("TIR del proyecto", f"{res['tir']:.1f}%", "Retorno interno"))
    if res.get("vpn"):
        kpi_rows.append(("VPN", f"${res['vpn']:,.0f} MXN", "Valor presente neto"))
    if res.get("capex_total"):
        kpi_rows.append(("CAPEX total", f"${res['capex_total']:,.0f} MXN", "Inversión total"))
    if res.get("payback_meses"):
        kpi_rows.append(("Payback", f"{res['payback_meses']:.0f} meses", "Período de recuperación"))
    if res.get("empleos_directos"):
        kpi_rows.append(("Empleos directos", f"{res['empleos_directos']:.0f}", "Creación de empleo"))
    if res.get("co2e_evitadas_anual"):
        kpi_rows.append(("CO2e evitadas/año", f"{res['co2e_evitadas_anual']:,.0f} t", "Impacto ambiental"))

    if kpi_rows:
        tbl = Table(
            [["KPI", "Valor", "Descripción"]] + kpi_rows,
            colWidths=[5 * cm, 4 * cm, 7 * cm]
        )
        tbl.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8F6F1"), colors.white]),
            ("FONTSIZE",    (0, 1), (-1, -1), 9),
            ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E8E4DC")),
            ("TOPPADDING",  (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 0.4 * cm))
    else:
        story.append(Paragraph(
            "Los KPIs financieros no están disponibles en este paquete. "
            "Ver hoja 'Resultados' en 05_Modelo_Financiero_CFO.xlsx.",
            body_style
        ))

    # ── Fuentes ───────────────────────────────────────────────────────────────
    fuentes = manifest.get("fuentes_usadas") or []
    story.append(Paragraph("Fuentes declaradas", h2_style))
    if fuentes:
        for f in fuentes:
            story.append(Paragraph(f"• {f}", body_style))
    else:
        story.append(Paragraph("Ver manifest.json del paquete para detalle de fuentes.", body_style))

    # ── Advertencias ──────────────────────────────────────────────────────────
    warnings = manifest.get("warnings_activos") or []
    if warnings:
        story.append(Paragraph("Advertencias activas", h2_style))
        for w in warnings:
            story.append(Paragraph(f"⚠ {w}", warn_style))

    # ── Riesgos principales ───────────────────────────────────────────────────
    story.append(Paragraph("Riesgos principales a considerar", h2_style))
    riesgos = [
        "Cambio de administración municipal sin compromisos formalizados.",
        "Score de datos bajo — validar fuentes antes de presentar a financiadores.",
        "Reglamentos sin homologar entre municipios de la ZM.",
    ]
    for r in riesgos:
        story.append(Paragraph(f"• {r}", body_style))

    # ── Recomendación ─────────────────────────────────────────────────────────
    story.append(Paragraph("Recomendación", h2_style))
    story.append(Paragraph(
        "Este paquete documental es un punto de partida institucional. "
        "Antes de presentar ante cabildo o financiadores, verificar: "
        "(1) fuentes legales municipales con jurista, "
        "(2) cifras financieras con contador, "
        "(3) advertencias activas del paquete.",
        body_style
    ))

    # ── Nota de trazabilidad ──────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREY, spaceBefore=14))
    pkg_short = package_id[:16] + "…" if len(package_id) > 16 else package_id
    story.append(Paragraph(
        f"Generado por ÁGORA GOV — ALQUIMIA  ·  Package ID: {pkg_short}  ·  "
        f"Versión: {manifest.get('version','0.1-borrador')}  ·  "
        f"Fecha: {date.today().isoformat()}",
        footer_style
    ))
    story.append(Paragraph(
        "Documento generado algorítmicamente. No constituye asesoría legal, financiera ni técnica certificada.",
        footer_style
    ))

    try:
        doc.build(story)
        return buf.getvalue(), None
    except Exception as e:
        reason = f"Error al construir PDF: {e}"
        logger.error(f"PDF render falló: {reason}")
        return None, reason
