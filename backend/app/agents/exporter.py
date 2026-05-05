"""
Fase 3B — exporter.py

Construye ExportBundle desde DraftBundle.

Reglas:
  - Ningún archivo .txt como salida primaria (usar .md mínimo)
  - Todos los archivos tienen nombre canónico estandarizado
  - Documentos bloqueados se registran pero no se exportan como defendibles
  - El manifest es obligatorio — un paquete sin manifest no es rastreable
  - Fallback template → source="template", nunca source="llm"
"""
from __future__ import annotations

import logging
from typing import Optional

from app.agents.schemas import (
    DocumentPlan,
    DocumentStatusLevel,
    DraftAnnex,
    DraftBundle,
    DraftDocument,
    DraftFigure,
    DraftTable,
    ExportBundle,
    ExportedDocument,
    ExportedFile,
    ExportManifest,
    ScenarioBundle,
)

logger = logging.getLogger(__name__)

# ─── Nombres canónicos (nunca .txt) ───────────────────────────────────────────

_CANONICAL_NAMES: dict[str, str] = {
    "01_resumen_ejecutivo_municipal":  "01_Resumen_Ejecutivo_Municipal.md",
    "02_modelo_tecnico_financiero":    "02_Modelo_Tecnico_Financiero.md",
    "04_coordinacion_metropolitana":   "04_Coordinacion_Metropolitana.md",
    "05_manual_operativo_90_dias":     "05_Manual_Operativo_90_Dias.md",
    "06_guia_ciudadana_separacion":    "06_Guia_Ciudadana_Separacion.md",
    "07_fuentes_trazabilidad":         "07_Fuentes_Y_Trazabilidad.md",
}


def canonical_filename(document_id: str) -> str:
    """Retorna el nombre de archivo canónico. NUNCA termina en .txt."""
    if document_id in _CANONICAL_NAMES:
        return _CANONICAL_NAMES[document_id]
    if document_id.startswith("03_diagnostico_reforma_"):
        municipio = document_id.replace("03_diagnostico_reforma_", "")
        safe = municipio.replace("-", "_").replace(" ", "_").title()
        return f"03_Diagnostico_Juridico_{safe}.md"
    # Fallback seguro — siempre .md
    safe_id = document_id.replace(" ", "_")
    return f"{safe_id}.md"


def build_export_bundle(
    draft_bundle: DraftBundle,
    document_plan: DocumentPlan,
    bundle: ScenarioBundle,
) -> ExportBundle:
    """
    Convierte DraftBundle en ExportBundle con nombres canónicos y manifest.
    Ningún archivo termina en .txt.
    """
    documents: list[ExportedDocument] = []
    blocked:   list[dict] = []
    all_warnings = list(bundle.warnings)

    for doc in draft_bundle.documentos:
        filename = canonical_filename(doc.document_id)

        # Siempre .md, nunca .txt
        assert not filename.endswith(".txt"), (
            f"canonical_filename devolvió .txt para {doc.document_id}"
        )

        source = "template" if doc.is_fallback else "llm"
        doc_warnings: list[str] = []
        if doc.validation_report:
            doc_warnings = [i.message for i in doc.validation_report.issues
                            if i.severity in ("error", "warning")]

        if doc.status == DocumentStatusLevel.bloqueado:
            blocked.append({
                "document_id": doc.document_id,
                "filename":    filename,
                "reason":      doc.blocked_reason or "Bloqueado por validación",
            })

        documents.append(ExportedDocument(
            document_id=doc.document_id,
            filename=filename,
            format="md",
            status=doc.status,
            version="0.1-borrador",
            source=source,
            warnings=doc_warnings,
        ))

    # Specs del plan que nunca llegaron a DraftDocument
    drafted_ids = {d.document_id for d in draft_bundle.documentos}
    for spec in document_plan.specs:
        if spec.document_id not in drafted_ids:
            filename = canonical_filename(spec.document_id)
            blocked.append({
                "document_id": spec.document_id,
                "filename":    filename,
                "reason":      "No redactado en este ciclo",
            })

    # Manifest obligatorio
    manifest = ExportManifest(
        bundle_id=draft_bundle.bundle_id,
        zm=draft_bundle.zm,
        municipios=draft_bundle.municipios,
        version="0.1-borrador",
        files=[ExportedFile(filename=d.filename, format=d.format) for d in documents],
        fuentes_usadas=_extract_fuentes(bundle),
        kpis_incluidos=bundle.kpi_ids(),
        warnings_activos=all_warnings,
        score_datos=bundle.confidence_score * 100,
    )

    export_bundle = ExportBundle(
        bundle_id=draft_bundle.bundle_id,
        zm=draft_bundle.zm,
        municipios=draft_bundle.municipios,
        documents=documents,
        blocked_documents=blocked,
        manifest=manifest,
        warnings=all_warnings,
    )

    logger.info(
        f"ExportBundle construido: {len(documents)} docs, "
        f"{len(blocked)} bloqueados, zm={bundle.zm}"
    )

    return export_bundle


def render_draft_document_as_markdown(doc: DraftDocument) -> str:
    """
    Convierte un DraftDocument a Markdown estructurado.
    Nunca genera .txt plano. Incluye advertencia visible si es template.
    """
    lines = [
        f"# {doc.spec.titulo}",
        "",
        f"**Audiencia:** {', '.join(doc.spec.audiencia)}",
        f"**Decisión que habilita:** {doc.spec.decision_que_habilita}",
        f"**Estado:** `{doc.status.value}`",
        f"**Nivel:** {doc.spec.nivel.value}",
        "",
        "---",
        "",
    ]

    if doc.is_fallback:
        lines += [
            "> ⚠️ **BORRADOR AUTOMÁTICO** — generado por template, no por LLM verificado.",
            "> Este documento requiere revisión editorial antes de ser presentado",
            "> como documento institucional.",
            "",
        ]

    for sec in doc.secciones:
        lines.append(f"## {sec.titulo}")
        lines.append("")
        if sec.contenido:
            lines.append(sec.contenido)
        lines.append("")

        for tabla in sec.tablas:
            _render_table(lines, tabla)

        for fig in sec.figuras:
            _render_figure(lines, fig)

    # Tablas de nivel documento
    for tabla in doc.tablas:
        _render_table(lines, tabla)

    # Figuras de nivel documento
    for fig in doc.figuras:
        _render_figure(lines, fig)

    # Glosario
    if doc.glosario:
        lines += ["## Glosario", ""]
        for termino, definicion in doc.glosario.items():
            lines.append(f"**{termino}:** {definicion}")
        lines.append("")

    # Anexos
    for anx in doc.anexos:
        lines += [f"## Anexo: {anx.titulo}", f"*Tipo: {anx.tipo}*"]
        if anx.fuente:
            lines.append(f"*Fuente: {anx.fuente}*")
        lines += [anx.contenido, ""]

    lines += [
        "---",
        f"*Generado por ÁGORA GOV — ALQUIMIA | Estado: `{doc.status.value}`*",
    ]

    return "\n".join(lines)


def _render_table(lines: list[str], tabla: DraftTable) -> None:
    meta = []
    if tabla.unidad:
        meta.append(f"Unidad: {tabla.unidad}")
    if tabla.periodo:
        meta.append(f"Periodo: {tabla.periodo}")
    meta.append(f"Fuente: {tabla.fuente}")
    lines += [f"**{tabla.titulo}**", f"*{' | '.join(meta)}*", ""]
    for w in tabla.advertencias:
        lines.append(f"> ⚠️ {w}")
    lines.append("")


def _render_figure(lines: list[str], fig: DraftFigure) -> None:
    lines += [
        f"**Figura: {fig.titulo}**",
        f"*Mensaje: {fig.mensaje_principal}*",
        f"*Fuente: {fig.fuente}*",
    ]
    if fig.nota_lectura:
        lines.append(f"*Nota de lectura: {fig.nota_lectura}*")
    lines.append("")


def _extract_fuentes(bundle: ScenarioBundle) -> list[str]:
    fuentes: list[str] = []
    for kpi in bundle.kpis_con_provenance:
        prov = kpi.get("provenance") or {}
        nombre = prov.get("fuente_nombre", "")
        if nombre and nombre not in fuentes:
            fuentes.append(nombre)
    return fuentes
