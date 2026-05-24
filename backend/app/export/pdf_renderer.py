"""
Fase 4 — pdf_renderer.py

Renderiza PDFs de consultoría con portada, índice y estructura por documento.
Tipografía: Times-Roman (Times New Roman).

Blueprints: app/export/document_blueprints.py
"""
from __future__ import annotations

import io
import logging
from typing import Optional

from app.export.consulting_pdf_builder import (
    build_cover_page,
    build_kpi_section,
    build_legal_footer,
    build_master_index_body,
    build_section_skeleton,
    build_toc_page,
)
from app.export.consulting_pdf_theme import margins
from app.export.document_blueprints import (
    BLUEPRINT_INDICE_MAESTRO,
    get_blueprint,
)

logger = logging.getLogger(__name__)


def _build_pdf(story: list, title: str) -> tuple[Optional[bytes], Optional[str]]:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate
    except ImportError as e:
        reason = f"reportlab no disponible: {e}"
        logger.warning("PDF bloqueado: %s", reason)
        return None, reason

    MARGINS = margins()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGINS["left"],
        rightMargin=MARGINS["right"],
        topMargin=MARGINS["top"],
        bottomMargin=MARGINS["bottom"],
        title=title,
        author="ALQUIMIA · Plataforma de consultoría integral",
    )
    try:
        doc.build(story)
        return buf.getvalue(), None
    except Exception as e:
        reason = f"Error al construir PDF: {e}"
        logger.error("PDF render falló: %s", reason)
        return None, reason


def render_consulting_document_pdf(
    document_id: str,
    manifest: dict,
    resultados: Optional[dict] = None,
    theme_zm: str = "",
    theme_municipio: str = "",
    package_id: str = "",
    module_label: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    """
    Genera PDF con portada + índice + estructura del blueprint indicado.
    document_id: clave en document_blueprints (default ejecutivo si no existe).
    """
    bp = get_blueprint(document_id) or get_blueprint("01_resumen_ejecutivo_municipal")
    if bp is None:
        return None, f"Blueprint no encontrado: {document_id}"

    zm = manifest.get("zm") or theme_zm or "ZM"
    municipio = theme_municipio or manifest.get("municipio") or zm
    version = manifest.get("version", "0.1-borrador")
    res = resultados or {}
    pkg = package_id or "simulador"

    story: list = []
    titulo = module_label or bp.titulo_portada

    build_cover_page(story, bp, zm=zm, municipio=municipio, version=version, package_id=pkg)
    build_toc_page(story, bp)

    if bp.document_id == "01_resumen_ejecutivo_municipal":
        build_kpi_section(story, res, manifest)
    elif bp.document_id == "00_indice_maestro_paquete":
        build_master_index_body(story, zm=zm, municipio=municipio, manifest=manifest)
    else:
        build_section_skeleton(story, bp)

    build_legal_footer(story, pkg, version)
    return _build_pdf(story, f"ALQUIMIA — {titulo}")


def render_master_index_pdf(
    manifest: dict,
    theme_zm: str = "",
    theme_municipio: str = "",
    package_id: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    """Índice maestro del paquete (documento 00)."""
    return render_consulting_document_pdf(
        document_id=BLUEPRINT_INDICE_MAESTRO.document_id,
        manifest=manifest,
        theme_zm=theme_zm,
        theme_municipio=theme_municipio,
        package_id=package_id,
    )


def render_executive_pdf(
    manifest: dict,
    resultados: Optional[dict] = None,
    theme_zm: str = "",
    theme_municipio: str = "",
    package_id: str = "",
    module_label: str = "",
) -> tuple[Optional[bytes], Optional[str]]:
    """Alias retrocompatible — documento 01 Resumen ejecutivo."""
    return render_consulting_document_pdf(
        document_id="01_resumen_ejecutivo_municipal",
        manifest=manifest,
        resultados=resultados,
        theme_zm=theme_zm,
        theme_municipio=theme_municipio,
        package_id=package_id,
        module_label=module_label,
    )
