"""
SurveyPDF — Generador de PDF branded para encuestas ALQUIMIA (Wave 1).

Genera:
1. Un PDF imprimible de la encuesta (para distribución física).
2. Un link de formulario digital (template Google Forms / Typeform) — stub.
3. Una plantilla de datos en CSV con los campos a capturar.

Depende de reportlab (en requirements.txt). Si no está instalado, retorna
un PDF vacío con mensaje de error — nunca bloquea el pipeline.
"""
from __future__ import annotations

import csv
import io
import logging
from typing import Optional

from app.agents.schemas import SurveyTemplate

logger = logging.getLogger(__name__)


# ─── Colores ALQUIMIA ─────────────────────────────────────────────────────────
_ALQUIMIA_GOLD  = (0.847, 0.718, 0.376)   # #D8B760
_ALQUIMIA_DARK  = (0.067, 0.090, 0.149)   # #111726
_ALQUIMIA_GRAY  = (0.55, 0.55, 0.57)
_WHITE          = (1.0, 1.0, 1.0)


def generate_survey_pdf(survey: SurveyTemplate) -> bytes:
    """
    Genera el PDF de la encuesta en memoria y retorna bytes.
    Lanza un ValueError si reportlab no está instalado.
    """
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.lib.units import cm
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable,
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.lib import colors
    except ImportError as exc:
        raise ValueError(
            f"reportlab no está instalado. Agrégalo a requirements.txt: {exc}"
        ) from exc

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=2.0 * cm,
        rightMargin=2.0 * cm,
        topMargin=2.0 * cm,
        bottomMargin=2.0 * cm,
    )

    gold = colors.Color(*_ALQUIMIA_GOLD)
    dark = colors.Color(*_ALQUIMIA_DARK)
    gray = colors.Color(*_ALQUIMIA_GRAY)

    # ── Estilos ───────────────────────────────────────────────────────────────
    st_titulo = ParagraphStyle(
        "titulo",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=dark,
        spaceAfter=4,
        alignment=TA_CENTER,
    )
    st_subtitulo = ParagraphStyle(
        "subtitulo",
        fontName="Helvetica",
        fontSize=9,
        textColor=gray,
        spaceAfter=10,
        alignment=TA_CENTER,
    )
    st_seccion = ParagraphStyle(
        "seccion",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=colors.Color(*_ALQUIMIA_GOLD),
        spaceBefore=12,
        spaceAfter=4,
        alignment=TA_LEFT,
    )
    st_pregunta = ParagraphStyle(
        "pregunta",
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=dark,
        spaceBefore=8,
        spaceAfter=3,
        leftIndent=0,
    )
    st_opcion = ParagraphStyle(
        "opcion",
        fontName="Helvetica",
        fontSize=9,
        textColor=dark,
        spaceAfter=1,
        leftIndent=12,
    )
    st_consentimiento = ParagraphStyle(
        "consent",
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        textColor=gray,
        spaceBefore=16,
        alignment=TA_CENTER,
    )
    st_footer = ParagraphStyle(
        "footer",
        fontName="Helvetica",
        fontSize=7,
        textColor=gray,
        alignment=TA_CENTER,
    )

    # ── Contenido ─────────────────────────────────────────────────────────────
    story = []

    # Cabecera
    story.append(HRFlowable(
        width="100%", thickness=3, color=gold, spaceAfter=8
    ))
    story.append(Paragraph("ÁGORA GOV — ALQUIMIA", st_subtitulo))
    story.append(Paragraph(survey.titulo, st_titulo))
    story.append(Paragraph(survey.descripcion, st_subtitulo))
    story.append(HRFlowable(
        width="100%", thickness=1, color=gray, spaceAfter=10
    ))

    # Preguntas agrupadas por sección
    current_seccion = None
    for i, pregunta in enumerate(survey.preguntas, 1):
        if pregunta.seccion and pregunta.seccion != current_seccion:
            current_seccion = pregunta.seccion
            story.append(Paragraph(f"▶ {current_seccion.upper()}", st_seccion))

        obligatorio = " *" if pregunta.obligatoria else ""
        story.append(Paragraph(f"{i}. {pregunta.texto}{obligatorio}", st_pregunta))

        if pregunta.tipo in ("opcion_multiple", "escala_likert"):
            for opcion in pregunta.opciones:
                story.append(Paragraph(f"○  {opcion}", st_opcion))
        elif pregunta.tipo == "numerica":
            story.append(Paragraph("Respuesta: ___________________________", st_opcion))
        elif pregunta.tipo == "abierta":
            story.append(Paragraph(
                "_______________________________________________________________________________",
                st_opcion,
            ))
            story.append(Paragraph(
                "_______________________________________________________________________________",
                st_opcion,
            ))

    # Consentimiento
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=gray, spaceAfter=6))
    story.append(Paragraph(survey.consentimiento, st_consentimiento))

    # Pie de página
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        f"ÁGORA GOV — ALQUIMIA  |  {survey.municipio}  |  ZM {survey.zm}  |  "
        f"v{survey.version}  |  ID: {str(survey.survey_id)[:8]}",
        st_footer,
    ))

    doc.build(story)
    return buf.getvalue()


def generate_survey_csv_template(survey: SurveyTemplate) -> str:
    """
    Genera una plantilla CSV con los campos de captura de respuestas.
    Lista de columnas: pregunta_id, pregunta_texto, tipo, respuesta.
    """
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["pregunta_id", "seccion", "pregunta_texto", "tipo", "respuesta"])
    for p in survey.preguntas:
        writer.writerow([p.pregunta_id, p.seccion, p.texto, p.tipo, ""])
    return buf.getvalue()


def generate_digital_link_stub(survey: SurveyTemplate, base_url: str = "https://alquimia.mx/encuesta") -> str:
    """
    Retorna el link digital de la encuesta (shortlink hacia formulario web).
    En producción, este link apunta al frontend de encuestas.
    """
    return f"{base_url}/{survey.survey_id}"


def try_generate_survey_pdf(survey: SurveyTemplate) -> Optional[bytes]:
    """
    Wrapper que no rompe el pipeline si reportlab no está disponible.
    Retorna bytes del PDF o None con log de advertencia.
    """
    try:
        return generate_survey_pdf(survey)
    except ValueError as exc:
        logger.warning(f"SurveyPDF: {exc}")
        return None
    except Exception as exc:
        logger.error(f"SurveyPDF: error inesperado generando PDF: {exc}")
        return None
