"""PDF Perfil de Generación Estimada RSU — estimación voluntaria (reportlab)."""
from __future__ import annotations

import io
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.empresa.schemas import DeclaracionGeneracionRSU


def build_perfil_generacion_pdf(decl: "DeclaracionGeneracionRSU", app_version: str = "1.0.0") -> tuple[bytes | None, str | None]:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.enums import TA_CENTER
    except ImportError as e:
        return None, f"reportlab no disponible: {e}"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="TitleCustom",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#3B6D11"),
    )
    h2 = ParagraphStyle(name="H2", parent=styles["Heading2"], fontSize=12, spaceBefore=10, spaceAfter=6)
    small = ParagraphStyle(name="Small", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    story = []
    story.append(Paragraph("ALQUIMIA", title_style))
    story.append(Paragraph("Perfil de Generación Estimada RSU", styles["Heading2"]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"<b>Organización:</b> {decl.empresa_nombre}", styles["Normal"]))
    if decl.rfc:
        story.append(Paragraph(f"<b>RFC (opcional):</b> {decl.rfc}", styles["Normal"]))
    story.append(Paragraph(f"<b>Municipio (clave interna simulador):</b> {decl.municipio_id}", styles["Normal"]))
    story.append(Paragraph(f"<b>Zona metropolitana:</b> {decl.zm}", styles["Normal"]))
    story.append(Paragraph(f"<b>Giro (código 6 dígitos):</b> {decl.giro_scian} — {decl.descripcion_giro}", styles["Normal"]))
    story.append(Paragraph(f"<b>Producción anual declarada:</b> {decl.produccion_anual:g} ({decl.unidad_produccion})", styles["Normal"]))
    story.append(Paragraph(f"<b>Fecha:</b> {decl.fecha_declaracion}", styles["Normal"]))
    story.append(Paragraph(f"<b>Estado:</b> {decl.status}", styles["Normal"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Generación estimada por material (ton/año)", h2))
    mat_rows = [["Material", "Ton/año"]]
    for k, v in sorted(decl.generacion_estimada.items(), key=lambda x: -x[1]):
        mat_rows.append([k, f"{v:.4f}"])
    mat_rows.append(["Total", f"{decl.generacion_total_ton_anio:.4f}"])
    t = Table(mat_rows, colWidths=[8 * cm, 4 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF3DE")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1C1B18")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E8E4DC")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#FDFCFA")]),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(f"<b>Frecuencia de recolección sugerida:</b> {decl.frecuencia_recoleccion_req}", styles["Normal"]))
    story.append(Paragraph(f"<b>Plan de manejo declarado:</b> {'sí' if decl.tiene_plan_manejo else 'no'}", styles["Normal"]))
    if decl.notas:
        story.append(Paragraph(f"<b>Notas:</b> {decl.notas}", styles["Normal"]))

    story.append(Spacer(1, 0.8 * cm))
    story.append(
        Paragraph(
            decl.disclaimer_voluntaria,
            small,
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        Paragraph(
            f"Factores: SEMARNAT DBGIR 2020 [ESTIMADO]. Cálculo: ALQUIMIA v{app_version}.",
            small,
        )
    )

    doc.build(story)
    return buf.getvalue(), None
