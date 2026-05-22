"""
Estilo PDF consultoría ALQUIMIA — Times New Roman, layout institucional.

Importaciones ReportLab diferidas para no romper entornos sin la dependencia instalada.
"""
from __future__ import annotations

# Tipografía (built-in PDF fonts ≈ Times New Roman en Word)
FONT_REGULAR = "Times-Roman"
FONT_BOLD = "Times-Bold"
FONT_ITALIC = "Times-Italic"
FONT_BOLD_ITALIC = "Times-BoldItalic"


def _colors():
    from reportlab.lib import colors

    return {
        "GREEN": colors.HexColor("#3B6D11"),
        "BLUE": colors.HexColor("#1A5FA8"),
        "NAVY": colors.HexColor("#0E1E30"),
        "DARK": colors.HexColor("#1C1B18"),
        "GREY": colors.HexColor("#6B6760"),
        "LIGHT_GREY": colors.HexColor("#F4F2ED"),
        "BORDER": colors.HexColor("#D8D4CC"),
        "WHITE": colors.white,
        "ORANGE": colors.HexColor("#D4881E"),
    }


def consulting_styles() -> dict:
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    from reportlab.lib.styles import ParagraphStyle

    c = _colors()
    NAVY = c["NAVY"]
    BLUE = c["BLUE"]
    GREY = c["GREY"]
    DARK = c["DARK"]

    return {
        "cover_kicker": ParagraphStyle(
            "CoverKicker",
            fontName=FONT_BOLD,
            fontSize=9,
            textColor=BLUE,
            spaceAfter=4,
            alignment=TA_CENTER,
            leading=12,
            letterSpacing=1.2,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            fontName=FONT_BOLD,
            fontSize=26,
            textColor=NAVY,
            spaceAfter=8,
            alignment=TA_CENTER,
            leading=32,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            fontName=FONT_REGULAR,
            fontSize=13,
            textColor=GREY,
            spaceAfter=6,
            alignment=TA_CENTER,
            leading=18,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            fontName=FONT_ITALIC,
            fontSize=10,
            textColor=GREY,
            spaceAfter=4,
            alignment=TA_CENTER,
            leading=14,
        ),
        "section_h1": ParagraphStyle(
            "SectionH1",
            fontName=FONT_BOLD,
            fontSize=14,
            textColor=NAVY,
            spaceBefore=16,
            spaceAfter=8,
            leading=18,
        ),
        "section_h2": ParagraphStyle(
            "SectionH2",
            fontName=FONT_BOLD,
            fontSize=12,
            textColor=BLUE,
            spaceBefore=12,
            spaceAfter=6,
            leading=16,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName=FONT_REGULAR,
            fontSize=11,
            textColor=DARK,
            spaceAfter=6,
            leading=16,
            alignment=TA_JUSTIFY,
        ),
        "body_bullet": ParagraphStyle(
            "BodyBullet",
            fontName=FONT_REGULAR,
            fontSize=11,
            textColor=DARK,
            spaceAfter=4,
            leading=15,
            leftIndent=14,
            bulletIndent=6,
        ),
        "legal": ParagraphStyle(
            "Legal",
            fontName=FONT_ITALIC,
            fontSize=9,
            textColor=GREY,
            spaceAfter=4,
            leading=13,
            alignment=TA_JUSTIFY,
        ),
        "footer": ParagraphStyle(
            "Footer",
            fontName=FONT_REGULAR,
            fontSize=8,
            textColor=GREY,
            alignment=TA_CENTER,
            leading=11,
        ),
    }


def table_style_consulting(header_rows: int = 1):
    from reportlab.platypus.tables import TableStyle

    c = _colors()
    NAVY = c["NAVY"]
    WHITE = c["WHITE"]
    LIGHT_GREY = c["LIGHT_GREY"]
    BORDER = c["BORDER"]

    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, header_rows - 1), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, header_rows - 1), WHITE),
            ("FONTNAME", (0, 0), (-1, header_rows - 1), FONT_BOLD),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [WHITE, LIGHT_GREY]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]
    )


def margins():
    from reportlab.lib.units import cm

    return {
        "left": 2.8 * cm,
        "right": 2.8 * cm,
        "top": 2.5 * cm,
        "bottom": 2.2 * cm,
    }


def palette():
    """Colores para uso directo en pdf_renderer."""
    return _colors()
