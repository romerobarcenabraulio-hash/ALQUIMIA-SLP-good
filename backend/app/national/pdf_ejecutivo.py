"""PDF Ejecutivo Municipal — Diagnóstico RSU Nacional.

Reusa el patrón de empresa/pdf_perfil.py (ReportLab, $0 template).
Cada cifra aparece con su fuente de procedencia.
"""
from __future__ import annotations

import io
from datetime import date
from typing import Any, Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.national.schemas import CoverageStatus, MunicipioProfile


# ── Etiquetas legibles ────────────────────────────────────────────────────────

_SOURCE_LABEL: Dict[str, str] = {
    "verificado":    "Verificado",
    "localizado":    "Localizado",
    "estimado":      "Estimado",
    "no_disponible": "Sin datos",
    "bloqueado":     "Bloqueado",
}

_STAGE_LABEL: Dict[str, str] = {
    "no_iniciado":           "Sin iniciar",
    "datos_basicos":         "Datos básicos",
    "datos_certificados":    "Datos certificados",
    "legal_localizado":      "Legal localizado",
    "legal_verificado":      "Legal verificado",
    "contrato_identificado": "Contrato identificado",
    "operacion_modelada":    "Operación modelada",
    "documentos_borrador":   "Documentos borrador",
    "documentos_defendibles":"Documentos defendibles",
    "implementacion_activa": "Implementación activa",
}


def _fmt_num(v: Optional[float], decimals: int = 0) -> str:
    if v is None:
        return "—"
    fmt = f"{v:,.{decimals}f}"
    return fmt


def _resolve_provenance_href(src: Any) -> Optional[str]:
    """Extrae URL de cadena o dict {url: ...}; None si no aplica."""
    if isinstance(src, str) and src:
        return src
    if isinstance(src, dict) and "url" in src and isinstance(src["url"], str):
        return src["url"]
    return None


def build_pdf_ejecutivo_municipal(
    profile: "MunicipioProfile",
    coverage: Optional["CoverageStatus"] = None,
    app_version: str = "1.0.0",
) -> tuple[Optional[bytes], Optional[str]]:
    """Genera PDF ejecutivo municipal. Devuelve (bytes, None) o (None, error_msg)."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
        )
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    except ImportError as e:
        return None, f"reportlab no disponible: {e}"

    # ── Colores ALQUIMIA ──────────────────────────────────────────────────────
    C_GREEN  = colors.HexColor("#3B6D11")
    C_AMBER  = colors.HexColor("#D4881E")
    C_RED    = colors.HexColor("#C0392B")
    C_GREY   = colors.HexColor("#6B6760")
    C_LIGHT  = colors.HexColor("#EAF3DE")
    C_BORDER = colors.HexColor("#E8E4DC")
    C_PAPER  = colors.HexColor("#F4F2ED")
    C_INK    = colors.HexColor("#1C1B18")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
        title=f"ALQUIMIA · Diagnóstico RSU · {profile.nombre}",
        author="ALQUIMIA Platform",
    )

    styles = getSampleStyleSheet()
    title_st = ParagraphStyle(
        "TitleCustom", parent=styles["Heading1"],
        fontSize=18, spaceAfter=4, alignment=TA_CENTER,
        textColor=C_GREEN,
    )
    sub_st = ParagraphStyle(
        "SubTitle", parent=styles["Normal"],
        fontSize=11, spaceAfter=2, alignment=TA_CENTER,
        textColor=C_GREY,
    )
    h2_st = ParagraphStyle(
        "H2", parent=styles["Heading2"],
        fontSize=11, spaceBefore=10, spaceAfter=4,
        textColor=C_INK, borderPad=0,
    )
    body_st = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=9, leading=13, textColor=C_INK,
    )
    small_st = ParagraphStyle(
        "Small", parent=styles["Normal"],
        fontSize=7, textColor=C_GREY, leading=10,
    )
    prov_st = ParagraphStyle(
        "Prov", parent=styles["Normal"],
        fontSize=7, textColor=colors.HexColor("#1A5FA8"), leading=10,
    )

    story = []

    # ── Portada ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("ALQUIMIA", title_st))
    story.append(Paragraph("Diagnóstico RSU Nacional · Ficha Ejecutiva Municipal", sub_st))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BORDER, spaceAfter=8))

    story.append(Paragraph(f"<b>{profile.nombre}</b>", ParagraphStyle(
        "MunName", parent=styles["Heading1"], fontSize=20, textColor=C_INK,
        alignment=TA_CENTER, spaceAfter=2,
    )))
    story.append(Paragraph(
        f"{profile.estado} · Zona Metropolitana {profile.zm_id}",
        sub_st,
    ))
    story.append(Paragraph(
        f"Generado: {date.today().isoformat()} · ALQUIMIA v{app_version}",
        ParagraphStyle("Meta", parent=styles["Normal"], fontSize=7, textColor=C_GREY,
                       alignment=TA_CENTER, spaceBefore=2),
    ))
    story.append(Spacer(1, 0.6 * cm))

    # ── KPIs principales con procedencia ─────────────────────────────────────
    story.append(Paragraph("Indicadores clave · procedencia por campo", h2_st))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=6))

    prov = profile.data_provenance or {}

    def prov_note(key: str) -> str:
        src = prov.get(key)
        href = _resolve_provenance_href(src)
        if href:
            return f'<font color="#1A5FA8" size="7">Fuente: {href}</font>'
        return '<font color="#A8A49C" size="7">Fuente: no registrada</font>'

    kpi_rows = [
        ["Indicador", "Valor", "Unidad", "Procedencia"],
        [
            "Población",
            _fmt_num(profile.poblacion),
            "hab.",
            Paragraph(prov_note("poblacion"), body_st),
        ],
        [
            "RSU generado",
            _fmt_num(profile.rsu_ton_dia, 2),
            "ton/día",
            Paragraph(prov_note("rsu_ton_dia"), body_st),
        ],
        [
            "Per cápita RSU",
            _fmt_num(profile.gen_per_capita, 3),
            "kg/hab/día",
            Paragraph(prov_note("gen_per_capita"), body_st),
        ],
        [
            "CO₂e disposición",
            _fmt_num(profile.co2e_disposal_ton_dia, 2),
            "ton CO₂e/día",
            Paragraph(prov_note("co2e_disposal_ton_dia"), body_st),
        ],
        [
            "Presupuesto",
            f"${_fmt_num(profile.presupuesto_mxn)}" if profile.presupuesto_mxn else "—",
            "MXN",
            Paragraph(prov_note("presupuesto"), body_st),
        ],
        [
            "Viviendas",
            _fmt_num(profile.viviendas),
            "viviendas",
            Paragraph(prov_note("viviendas"), body_st),
        ],
    ]

    kpi_table = Table(
        kpi_rows,
        colWidths=[4 * cm, 2.5 * cm, 2.5 * cm, 8 * cm],
    )
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0),  C_LIGHT),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  C_INK),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 8),
        ("GRID",        (0, 0), (-1, -1), 0.4, C_BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_PAPER]),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── Etapa SCR ─────────────────────────────────────────────────────────────
    story.append(Paragraph("Etapa SCR (Sistema de Cobertura RSU)", h2_st))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=6))
    stage_label = _STAGE_LABEL.get(profile.coverage_status.value if hasattr(profile.coverage_status, "value") else str(profile.coverage_status), str(profile.coverage_status))
    story.append(Paragraph(f"<b>Etapa actual:</b> {stage_label}", body_st))
    story.append(Paragraph(f"<b>Dependencia responsable:</b> {profile.dependencia_responsable or '—'}", body_st))
    story.append(Paragraph(f"<b>Concesión:</b> {_SOURCE_LABEL.get(str(profile.concesion_status.value if hasattr(profile.concesion_status, 'value') else profile.concesion_status), '—')}", body_st))
    story.append(Spacer(1, 0.3 * cm))

    # ── Cobertura por dimensión ───────────────────────────────────────────────
    if coverage is not None:
        story.append(Paragraph("Semáforo de cobertura por dimensión", h2_st))
        story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=6))

        dims = [
            ("Demografía",  str(coverage.demografia.value if hasattr(coverage.demografia, "value") else coverage.demografia)),
            ("RSU",         str(coverage.rsu.value if hasattr(coverage.rsu, "value") else coverage.rsu)),
            ("Legal",       str(coverage.legal.value if hasattr(coverage.legal, "value") else coverage.legal)),
            ("Contrato",    str(coverage.contrato.value if hasattr(coverage.contrato, "value") else coverage.contrato)),
            ("Presupuesto", str(coverage.presupuesto.value if hasattr(coverage.presupuesto, "value") else coverage.presupuesto)),
            ("Operación",   str(coverage.operacion.value if hasattr(coverage.operacion, "value") else coverage.operacion)),
            ("Documentos",  str(coverage.documentos.value if hasattr(coverage.documentos, "value") else coverage.documentos)),
        ]

        def dim_color(st: str) -> colors.HexColor:
            if st == "verificado":   return C_GREEN
            if st in ("localizado", "estimado"): return C_AMBER
            if st in ("no_disponible", "bloqueado"): return C_RED
            return C_GREY

        cov_rows = [["Dimensión", "Estado"]]
        for dim_name, dim_st in dims:
            cov_rows.append([dim_name, _SOURCE_LABEL.get(dim_st, dim_st)])

        cov_table = Table(cov_rows, colWidths=[5 * cm, 12 * cm])
        cov_styles: list = [
            ("BACKGROUND",  (0, 0), (-1, 0),  C_LIGHT),
            ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("GRID",        (0, 0), (-1, -1), 0.4, C_BORDER),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",  (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]
        for i, (_, dim_st) in enumerate(dims, start=1):
            cov_styles.append(("TEXTCOLOR", (1, i), (1, i), dim_color(dim_st)))
            cov_styles.append(("FONTNAME", (1, i), (1, i), "Helvetica-Bold"))

        cov_table.setStyle(TableStyle(cov_styles))
        story.append(cov_table)
        story.append(Spacer(1, 0.2 * cm))

        if coverage.siguiente_accion:
            story.append(Paragraph(f"<b>Siguiente acción:</b> {coverage.siguiente_accion}", body_st))

        if coverage.bloqueos:
            story.append(Paragraph("<b>Bloqueos activos:</b>", body_st))
            for b in coverage.bloqueos:
                story.append(Paragraph(f"· {b}", ParagraphStyle(
                    "Bloqueo", parent=body_st, textColor=C_RED, leftIndent=8,
                )))

        story.append(Spacer(1, 0.3 * cm))

    # ── Disclaimer ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=4))
    story.append(Paragraph(
        "BORRADOR DE REFERENCIA · Este documento es un estimado de diagnóstico generado "
        "automáticamente por ALQUIMIA con base en datos públicos y fuentes declaradas. "
        "Los valores marcados como «Estimado» o «Sin datos» requieren verificación documental "
        "antes de su uso en propuestas de inversión, contratos o actos de autoridad. "
        "La procedencia de cada cifra se indica en la columna «Fuente» de la tabla de indicadores.",
        small_st,
    ))
    story.append(Paragraph(
        f"ALQUIMIA Platform v{app_version} · {date.today().isoformat()} · "
        "Datos base: INEGI MGN 2022, SEMARNAT DBGIR 2020, fuentes estatales.",
        small_st,
    ))

    doc.build(story)
    return buf.getvalue(), None
