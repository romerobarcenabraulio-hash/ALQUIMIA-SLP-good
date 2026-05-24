"""
PDF integrado del acto de análisis (docs 01–04, 07).
"""
from __future__ import annotations

import io
from typing import Optional

from app.export.schemas import DocumentTheme


def build_paquete_analisis_pdf(
    md_sections: list[tuple[str, str]],
    theme: DocumentTheme,
) -> bytes:
    """
    Genera PDF con portada + secciones markdown.
    md_sections: [(titulo, markdown_content), ...]
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        from reportlab.pdfgen import canvas
        from app.export.consulting_pdf_builder import _append_markdown_body
    except ImportError:
        return b""

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    # Portada
    c.setFont("Helvetica-Bold", 18)
    c.drawString(inch, height - 1.5 * inch, "Paquete Integral de Análisis")
    c.setFont("Helvetica", 12)
    c.drawString(inch, height - 2 * inch, f"{theme.municipio.title()} · ZM {theme.zm}")
    c.drawString(inch, height - 2.4 * inch, f"Fecha: {theme.date}")
    c.showPage()

    for titulo, md in md_sections:
        y = height - inch
        c.setFont("Helvetica-Bold", 14)
        c.drawString(inch, y, titulo[:70])
        y -= 0.3 * inch
        try:
            y = _append_markdown_body(c, md, inch, y, width - 2 * inch)
        except Exception:
            c.setFont("Helvetica", 10)
            for line in md.splitlines()[:40]:
                if y < inch:
                    c.showPage()
                    y = height - inch
                    c.setFont("Helvetica", 10)
                c.drawString(inch, y, line[:90])
                y -= 12
        c.showPage()

    c.save()
    buf.seek(0)
    return buf.read()
