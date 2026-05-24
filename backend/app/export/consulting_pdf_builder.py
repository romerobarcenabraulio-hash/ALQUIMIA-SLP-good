"""
Constructor de páginas PDF consultoría — portada, índice, secciones.

Convenciones (McKinsey × BCG × ALQUIMIA):
  - Portada: Prepared for · Prepared by · Clasificación · Código documento
  - Índice: títulos de acción (no genéricos)
  - Cuerpo: secciones numeradas + exhibits cuando aplique
"""
from __future__ import annotations

from datetime import date
from typing import Any, Optional

from app.export.consulting_pdf_theme import (
    consulting_styles,
    margins,
    palette,
    table_style_consulting,
)
from app.export.document_blueprints import (
    FRAME_LABEL,
    BLUEPRINT_INDICE_MAESTRO,
    DocumentBlueprint,
    list_package_blueprints,
)

_MONTHS_ES = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)


def fecha_larga_es() -> str:
    d = date.today()
    return f"{d.day} de {_MONTHS_ES[d.month - 1]} de {d.year}"


def build_cover_page(
    story: list,
    bp: DocumentBlueprint,
    *,
    zm: str,
    municipio: str,
    version: str,
    package_id: str,
) -> None:
    from reportlab.platypus import HRFlowable, PageBreak, Paragraph, Spacer

    styles = consulting_styles()
    c = palette()
    GREEN = c["GREEN"]
    MARGINS = margins()

    story.append(Spacer(1, 0.8 * MARGINS["top"]))
    story.append(Paragraph("ALQUIMIA", styles["cover_kicker"]))
    story.append(Paragraph(bp.subtitulo_portada, styles["cover_subtitle"]))
    story.append(Spacer(1, 0.35 * MARGINS["top"]))
    story.append(HRFlowable(width="32%", thickness=2, color=GREEN, spaceAfter=12, hAlign="CENTER"))
    story.append(Paragraph(bp.titulo_portada, styles["cover_title"]))
    story.append(Paragraph(f"{municipio} · ZM {zm}", styles["cover_subtitle"]))
    story.append(Spacer(1, 0.2 * MARGINS["top"]))
    story.append(Paragraph(fecha_larga_es(), styles["cover_meta"]))
    story.append(Paragraph(f"Documento {bp.codigo} · Versión {version}", styles["cover_meta"]))
    story.append(Paragraph(bp.clasificacion, styles["cover_meta"]))

    meta_rows = [
        ["Prepared for", ", ".join(bp.audiencia[:3]) + ("…" if len(bp.audiencia) > 3 else "")],
        ["Prepared by", "ALQUIMIA · Plataforma de consultoría integral"],
        ["Marco analítico", FRAME_LABEL.get(bp.frame, bp.frame.value)],
        ["Decisión que habilita", bp.decision_que_habilita[:120] + ("…" if len(bp.decision_que_habilita) > 120 else "")],
        ["Referencia", package_id[:20] + ("…" if len(package_id) > 20 else "")],
    ]
    from reportlab.platypus import Table

    tbl = Table([["Campo", "Detalle"]] + meta_rows, colWidths=[4.5 * MARGINS["left"], 11.5 * MARGINS["left"]])
    tbl.setStyle(table_style_consulting())
    story.append(Spacer(1, 0.4 * MARGINS["top"]))
    story.append(tbl)
    story.append(PageBreak())


def build_toc_page(story: list, bp: DocumentBlueprint) -> None:
    from reportlab.platypus import PageBreak, Paragraph, Spacer, Table

    if not bp.indice:
        return

    styles = consulting_styles()
    MARGINS = margins()

    story.append(Paragraph("Índice de contenidos", styles["section_h1"]))
    story.append(Paragraph(
        "Los títulos de acción orientan la lectura ejecutiva (convención consultoría estratégica).",
        styles["legal"],
    ))
    story.append(Spacer(1, 0.2 * MARGINS["top"]))

    rows = [["§", "Sección", "Título de acción", "Exhibits"]]
    for entry in bp.indice:
        ex = ", ".join(entry.exhibits) if entry.exhibits else "—"
        rows.append([entry.number, entry.title, entry.action_title, ex])

    tbl = Table(rows, colWidths=[1.0 * MARGINS["left"], 3.5 * MARGINS["left"], 7.5 * MARGINS["left"], 2.5 * MARGINS["left"]])
    tbl.setStyle(table_style_consulting())
    story.append(tbl)

    if bp.mensajes_clave:
        story.append(Spacer(1, 0.3 * MARGINS["top"]))
        story.append(Paragraph("Mensajes clave (lectura rápida)", styles["section_h2"]))
        for msg in bp.mensajes_clave:
            story.append(Paragraph(f"• {msg}", styles["body_bullet"]))

    story.append(PageBreak())


def build_section_skeleton(story: list, bp: DocumentBlueprint) -> None:
    """Esqueleto de secciones con títulos de acción — contenido se completa en ÁGORA/DOCX."""
    from reportlab.platypus import Paragraph, Spacer

    styles = consulting_styles()
    MARGINS = margins()

    story.append(Paragraph("Estructura del documento", styles["section_h1"]))
    story.append(Paragraph(
        f"Extensión objetivo: ≤{bp.max_paginas} páginas. "
        "Las secciones siguientes siguen el blueprint consultoría ALQUIMIA; "
        "el contenido detallado se genera en el pipeline ÁGORA (Markdown/DOCX).",
        styles["body"],
    ))
    story.append(Spacer(1, 0.15 * MARGINS["top"]))

    for entry in bp.indice:
        story.append(Paragraph(
            f"{entry.number}. {entry.title}",
            styles["section_h1"],
        ))
        story.append(Paragraph(f"<i>{entry.action_title}</i>", styles["body"]))
        story.append(Paragraph(
            "[Contenido generado por ÁGORA según datos del escenario y trazabilidad activa.]",
            styles["legal"],
        ))


def build_master_index_body(
    story: list,
    *,
    zm: str,
    municipio: str,
    manifest: dict,
) -> None:
    from reportlab.platypus import Paragraph, Spacer, Table

    styles = consulting_styles()
    MARGINS = margins()
    bp = BLUEPRINT_INDICE_MAESTRO

    story.append(Paragraph("Paquete documental — inventario", styles["section_h1"]))
    story.append(Paragraph(
        f"Zona metropolitana {zm} · Municipio ancla {municipio}. "
        f"Score de datos: {manifest.get('score_datos', 'N/D')}.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.2 * MARGINS["top"]))

    rows = [["Cód.", "Documento", "Audiencia principal", "Págs. obj.", "Formato"]]
    for doc in list_package_blueprints():
        rows.append([
            doc.codigo,
            doc.titulo_corto,
            doc.audiencia[0] if doc.audiencia else "—",
            str(doc.max_paginas),
            "PDF · DOCX · MD",
        ])

    tbl = Table(rows, colWidths=[1.2 * MARGINS["left"], 4.5 * MARGINS["left"], 4.5 * MARGINS["left"], 1.8 * MARGINS["left"], 2.5 * MARGINS["left"]])
    tbl.setStyle(table_style_consulting())
    story.append(tbl)

    story.append(Spacer(1, 0.3 * MARGINS["top"]))
    story.append(Paragraph("Orden de lectura recomendado", styles["section_h2"]))
    orden = [
        "01 Resumen ejecutivo → decisión de Cabildo",
        "02 Modelo financiero → validación de tesorería",
        "03 Diagnóstico jurídico → ruta normativa",
        "07 Fuentes → auditoría y trazabilidad",
        "05 Manual operativo + 08–11 Logística → ejecución",
        "12 Acta de inspección → procedimiento sancionatorio (cuando aplique)",
    ]
    for o in orden:
        story.append(Paragraph(f"• {o}", styles["body_bullet"]))


def build_municipal_context_narrative(story: list, ctx: dict) -> None:
    """Narrativa municipal exclusiva — antes de KPIs genéricos en doc 01."""
    from reportlab.platypus import Paragraph, Spacer

    from app.export.municipal_context import narrative_blocks

    styles = consulting_styles()
    MARGINS = margins()

    story.append(Paragraph("0. Lectura municipal (caso único)", styles["section_h1"]))
    story.append(Paragraph(
        "El enfoque de este PDF deriva del árbol de decisión, el estudio de noticias "
        "y programas locales, y el reglamento cargado — no de una plantilla nacional.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.12 * MARGINS["top"]))

    for title, lines in narrative_blocks(ctx):
        story.append(Paragraph(title, styles["section_h2"]))
        for line in lines:
            style = styles["body_bullet"] if line.strip().startswith(("•", "–", "⚠")) else styles["body"]
            story.append(Paragraph(line, style))
        story.append(Spacer(1, 0.08 * MARGINS["top"]))


def _escape_reportlab(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _inline_md_to_reportlab(line: str) -> str:
    """Convierte **bold** y viñetas simples a markup ReportLab."""
    import re

    s = _escape_reportlab(line.strip())
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    if s.startswith("- ") or s.startswith("• "):
        return s[2:]
    return s


def _append_markdown_body(story: list, contenido: str, styles: dict, margin_unit: float) -> None:
    from reportlab.platypus import Paragraph, Spacer

    blocks = [b.strip() for b in contenido.split("\n\n") if b.strip()]
    for block in blocks:
        if block.startswith("|") and "|" in block[1:]:
            from reportlab.platypus import Table

            rows = []
            for row in block.split("\n"):
                if row.strip().startswith("|---"):
                    continue
                cells = [c.strip() for c in row.strip("|").split("|")]
                if cells:
                    rows.append(cells)
            if rows:
                tbl = Table(rows)
                tbl.setStyle(table_style_consulting())
                story.append(tbl)
                story.append(Spacer(1, 0.06 * margin_unit))
            continue

        for line in block.split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith(("- ", "• ", "* ")):
                story.append(Paragraph(_inline_md_to_reportlab(line), styles["body_bullet"]))
            else:
                story.append(Paragraph(_inline_md_to_reportlab(line), styles["body"]))
        story.append(Spacer(1, 0.06 * margin_unit))


def build_ghostwriter_narrative(story: list, draft: Any) -> None:
    """Secciones SCQA redactadas por Ghostwriter (+ Humanizador)."""
    from reportlab.platypus import Paragraph, Spacer

    styles = consulting_styles()
    MARGINS = margins()

    story.append(Paragraph("Narrativa ejecutiva — ÁGORA Ghostwriter", styles["section_h1"]))
    badge = "borrador LLM" if not getattr(draft, "is_fallback", True) else "borrador asistido"
    story.append(Paragraph(
        f"Redacción institucional ALQUIMIA ({badge}). "
        "Propuesta expositiva — no dictamen oficial.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.1 * MARGINS["top"]))

    for sec in getattr(draft, "secciones", []) or []:
        titulo = getattr(sec, "titulo", None) or sec.get("titulo", "Sección")
        contenido = getattr(sec, "contenido", None) or sec.get("contenido", "")
        story.append(Paragraph(_escape_reportlab(str(titulo)), styles["section_h2"]))
        _append_markdown_body(story, str(contenido), styles, MARGINS["top"])


def build_kpi_section(story: list, resultados: dict, manifest: dict) -> None:
    """Sección KPI para documento 01 — contenido productivo."""
    from reportlab.platypus import Paragraph, Spacer, Table

    styles = consulting_styles()
    c = palette()
    GREEN = c["GREEN"]
    ORANGE = c["ORANGE"]
    MARGINS = margins()

    score = manifest.get("score_datos")
    score_text = f"{score:.1f}%" if score is not None else "N/D"
    score_hex = GREEN.hexval() if (score or 0) >= 70 else ORANGE.hexval()  # type: ignore[attr-defined]

    story.append(Paragraph("1. Página de decisión", styles["section_h1"]))
    story.append(Paragraph(
        "Este documento habilita la deliberación de Cabildo sobre el programa de gestión integral "
        "de residuos modelado en ALQUIMIA.",
        styles["body"],
    ))
    story.append(Paragraph(
        f"<b>Calidad de datos:</b> <font color='{score_hex}'>{score_text}</font>",
        styles["body"],
    ))

    story.append(Spacer(1, 0.2 * MARGINS["top"]))
    story.append(Paragraph("4. Inversión y retorno — Indicadores clave", styles["section_h1"]))

    kpi_rows: list[list[str]] = []
    mapping = [
        ("tir", "TIR del proyecto", "{:.1f}%", "Retorno interno"),
        ("vpn", "VPN", "${:,.0f} MXN", "Valor presente neto"),
        ("capex_total", "CAPEX total", "${:,.0f} MXN", "Inversión total"),
        ("payback_meses", "Payback", "{:.0f} meses", "Recuperación"),
        ("empleos_directos", "Empleos directos", "{:,.0f}", "Impacto social"),
        ("co2e_evitadas_anual", "CO₂e evitadas/año", "{:,.0f} t", "Impacto ambiental"),
        ("ingresos_brutos", "Ingresos brutos", "${:,.0f} MXN", "Modelo de ingresos"),
    ]
    for key, label, fmt, desc in mapping:
        val = resultados.get(key)
        if val is not None:
            kpi_rows.append([label, fmt.format(float(val)), desc])

    if kpi_rows:
        tbl = Table([["Indicador", "Valor", "Interpretación"]] + kpi_rows, colWidths=[5.2 * MARGINS["left"], 4.2 * MARGINS["left"], 6.8 * MARGINS["left"]])
        tbl.setStyle(table_style_consulting())
        story.append(tbl)
    else:
        story.append(Paragraph("KPIs no disponibles — complete M01 y M09.", styles["body"]))

    fuentes = manifest.get("fuentes_usadas") or []
    warnings = manifest.get("warnings_activos") or []
    story.append(Paragraph("7. Fuentes y advertencias", styles["section_h1"]))
    if fuentes:
        for f in fuentes[:8]:
            story.append(Paragraph(f"• {f}", styles["body_bullet"]))
    if warnings:
        for w in warnings[:6]:
            story.append(Paragraph(f"⚠ {w}", styles["legal"]))


def build_legal_footer(story: list, package_id: str, version: str) -> None:
    from app.legal.agora_export_disclaimers import EXPORT_LIABILITY_WAIVER
    from reportlab.platypus import HRFlowable, Paragraph, Spacer

    styles = consulting_styles()
    c = palette()
    BORDER = c["BORDER"]
    MARGINS = margins()

    story.append(Spacer(1, 0.4 * MARGINS["top"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=8))
    story.append(Paragraph(EXPORT_LIABILITY_WAIVER.replace("\n", "<br/>"), styles["legal"]))
    story.append(Paragraph(
        f"ALQUIMIA · Times New Roman · {package_id[:18]} · v{version} · {date.today().isoformat()}",
        styles["footer"],
    ))
