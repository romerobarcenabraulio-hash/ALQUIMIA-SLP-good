"""
PDF expediente de inspección — estándar consultoría ALQUIMIA (Times New Roman).
"""
from __future__ import annotations

import io
import logging
from datetime import date
from typing import Any, Optional

from app.export.consulting_pdf_builder import (
    build_cover_page,
    build_legal_footer,
    build_toc_page,
    fecha_larga_es,
)
from app.export.consulting_pdf_theme import consulting_styles, margins, palette, table_style_consulting
from app.export.document_blueprints import get_blueprint

logger = logging.getLogger(__name__)

NIVEL_LABEL = {
    "aviso": "Aviso",
    "advertencia": "Advertencia",
    "multa_menor": "Multa menor",
    "multa_media": "Multa media",
    "multa_maxima": "Multa máxima",
    "clausura": "Clausura",
}


def _fmt_mxn(n: float) -> str:
    return f"${n:,.2f} MXN"


def render_expediente_inspeccion_pdf(
    predio: dict[str, Any],
    inspeccion: dict[str, Any],
    expediente: dict[str, Any],
    *,
    zm: str = "ZM",
    package_id: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table
    except ImportError as e:
        return None, f"reportlab no disponible: {e}"

    bp = get_blueprint("12_expediente_inspeccion")
    if bp is None:
        return None, "Blueprint 12 no encontrado"

    municipio = expediente.get("municipio_id") or predio.get("municipio_id") or zm
    version = "0.1-borrador-inspeccion"
    pkg = package_id or expediente.get("expediente_id", "expediente")
    styles = consulting_styles()
    c = palette()
    ORANGE = c["ORANGE"]
    MARGINS = margins()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGINS["left"],
        rightMargin=MARGINS["right"],
        topMargin=MARGINS["top"],
        bottomMargin=MARGINS["bottom"],
        title=f"ALQUIMIA — Expediente {expediente.get('expediente_id', '')}",
        author="ALQUIMIA · Plataforma de consultoría integral",
    )

    manifest = {"version": version, "zm": zm, "municipio": municipio}
    story: list = []

    build_cover_page(story, bp, zm=zm, municipio=str(municipio), version=version, package_id=pkg)
    build_toc_page(story, bp)

    # §1 Aviso
    story.append(Paragraph("1. Aviso de borrador", styles["section_h1"]))
    story.append(Paragraph(
        "<b>BORRADOR DE EXPEDIENTE TÉCNICO</b> — no es acto de autoridad hasta firma del funcionario "
        "competente. Este documento es insumo para el procedimiento administrativo municipal.",
        styles["legal"],
    ))
    story.append(HRFlowable(width="100%", thickness=0.75, color=ORANGE, spaceAfter=10))

    # §2 Predio
    story.append(Paragraph("2. Identificación del predio", styles["section_h1"]))
    predio_rows = [
        ["Campo", "Valor"],
        ["Expediente", str(expediente.get("expediente_id", "—"))],
        ["Predio", str(predio.get("predio_id", "—"))],
        ["Municipio", str(municipio)],
        ["Dirección", str(predio.get("direccion_texto", "—"))],
    ]
    lat, lon = predio.get("lat"), predio.get("lon")
    if lat is not None and lon is not None:
        predio_rows.append(["Coordenadas WGS84", f"{lat}, {lon}"])
    if predio.get("uso_suelo_declarado"):
        predio_rows.append(["Uso declarado", str(predio["uso_suelo_declarado"])])
    if predio.get("area_m2") is not None:
        predio_rows.append(["Área", f"{predio['area_m2']} m²"])

    tbl = Table(predio_rows, colWidths=[4.5 * MARGINS["left"], 11.5 * MARGINS["left"]])
    tbl.setStyle(table_style_consulting())
    story.append(tbl)

    # §3 Inspección
    story.append(Paragraph("3. Acta de inspección", styles["section_h1"]))
    insp_rows = [
        ["Campo", "Detalle"],
        ["Fecha", str(inspeccion.get("fecha_inspeccion", "—"))],
        ["Tipo infracción", str(inspeccion.get("tipo_infraccion", "—"))],
        ["Hallazgo", str(inspeccion.get("descripcion_hallazgo", "—"))],
        ["Permiso CA", "Sí" if inspeccion.get("tiene_permiso_ca") else "No"],
        [
            "Inspector",
            f"{inspeccion.get('inspector_nombre') or '—'} ({inspeccion.get('inspector_cargo') or 'sin cargo'})",
        ],
    ]
    tbl2 = Table(insp_rows, colWidths=[4.5 * MARGINS["left"], 11.5 * MARGINS["left"]])
    tbl2.setStyle(table_style_consulting())
    story.append(tbl2)

    # §4 Sanción orientativa
    story.append(Paragraph("4. Sanción orientativa (UMA / MXN)", styles["section_h1"]))
    valor_uma = float(expediente.get("valor_uma_mxn") or 0)
    monto_min = float(expediente.get("monto_min_mxn") or 0)
    monto_max = float(expediente.get("monto_max_mxn") or 0)
    uma_ap = float(expediente.get("uma_aplicado") or 0)
    nivel = str(expediente.get("nivel_sancion", ""))

    sanc_rows = [
        ["Concepto", "Valor"],
        ["Nivel", NIVEL_LABEL.get(nivel, nivel)],
        ["Artículo reglamento", str(expediente.get("articulo_reglamento", "—"))],
        ["Valor UMA referencia", _fmt_mxn(valor_uma) if valor_uma else "—"],
        ["Rango montos", f"{_fmt_mxn(monto_min)} – {_fmt_mxn(monto_max)}"],
        ["Punto medio trazabilidad", _fmt_mxn(uma_ap * valor_uma) if valor_uma else "—"],
        ["¿Clausura orientativa?", "Sí" if expediente.get("genera_clausura") else "No"],
    ]
    tbl3 = Table(sanc_rows, colWidths=[5.5 * MARGINS["left"], 10.5 * MARGINS["left"]])
    tbl3.setStyle(table_style_consulting())
    story.append(tbl3)

    # §5–6
    story.append(Paragraph("5. Cadena probatoria", styles["section_h1"]))
    story.append(Paragraph(
        "El expediente debe someterse al derecho de audiencia del presunto infractor antes de cualquier "
        "sanción. La validación jurídica es obligatoria.",
        styles["body"],
    ))
    story.append(Paragraph("6. Limitaciones", styles["section_h1"]))
    story.append(Paragraph(str(expediente.get("disclaimer", "")), styles["legal"]))
    story.append(Paragraph(
        f"Generado {fecha_larga_es()} · UTC {expediente.get('fecha_generacion', date.today().isoformat())}",
        styles["footer"],
    ))

    build_legal_footer(story, pkg, version)

    try:
        doc.build(story)
        return buf.getvalue(), None
    except Exception as e:
        logger.error("Expediente PDF falló: %s", e)
        return None, str(e)
