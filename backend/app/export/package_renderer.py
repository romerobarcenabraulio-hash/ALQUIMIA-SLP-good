"""
Fase 4 — package_renderer.py

Orquestador del pipeline de exportación profesional.

Flujo:
  PackageRecord + ExportBundle + DraftBundle
    → RenderedAsset[] (DOCX × N, XLSX × 2, PDF × 1)
    → render_report.json
    → professional_package.zip (manifest + render_report + todos los assets)

Separación de responsabilidades:
  ÁGORA            → produce contenido estructurado (DraftBundle)
  package_store    → persiste artefactos y ZIP base
  package_renderer → renderiza formatos institucionales
  router           → expone descarga

Reglas:
  - Nunca modifica DraftBundle ni ExportBundle.
  - Un fallo de PDF NO detiene DOCX/XLSX.
  - Documentos bloqueados se registran en RenderReport, no se incluyen como "ok".
  - professional_package.zip incluye analisis/ + implementacion/ + README.txt
"""
from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import zipfile
from datetime import date
from pathlib import Path
from typing import Optional

from app.export.schemas import (
    BlockedAsset,
    DocumentTheme,
    RenderedAsset,
    RenderReport,
)

logger = logging.getLogger(__name__)

PACKAGES_DIR = Path(os.environ.get("ALQUIMIA_PACKAGES_DIR", "/tmp/alquimia_packages"))


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _save_asset(
    pkg_dir: Path,
    filename: str,
    data: bytes,
    package_id: str,
    source_doc_id: Optional[str] = None,
    fmt: str = "bin",
    mime: str = "application/octet-stream",
    status: str = "ok",
    warnings: Optional[list[str]] = None,
) -> RenderedAsset:
    path = pkg_dir / filename
    path.write_bytes(data)
    return RenderedAsset(
        package_id=package_id,
        source_document_id=source_doc_id,
        filename=filename,
        format=fmt,
        mime_type=mime,
        path=str(path),
        checksum=_sha256(data),
        size_bytes=len(data),
        status=status,
        warnings=warnings or [],
    )


# ─── Orquestador ──────────────────────────────────────────────────────────────

def render_package(
    package_id: str,
    resultados: Optional[dict] = None,
    fecha_inicio: Optional[date] = None,
) -> RenderReport:
    """
    Lee el paquete persistido y produce todos los assets profesionales.

    package_id: job_id / package_id del PackageRecord en disco
    resultados: KPIs del simulador (opcional — si falta, celdas N/D en XLSX)

    Retorna RenderReport con lista de assets generados y bloqueados.
    """
    from app.export.document_renderer import render_docx
    from app.export.spreadsheet_renderer import render_financial_xlsx, render_gantt_xlsx
    from app.export.pdf_renderer import render_executive_pdf

    pkg_dir    = PACKAGES_DIR / package_id
    render_dir = pkg_dir / "rendered"
    render_dir.mkdir(parents=True, exist_ok=True)

    # ── Leer datos del paquete ────────────────────────────────────────────────
    manifest = _load_manifest(pkg_dir)
    if manifest is None:
        return RenderReport(
            package_id=package_id,
            errors=["manifest.json no encontrado — paquete no inicializado"],
            qa_status="failed",
        )

    zm         = manifest.get("zm", "")
    municipios = manifest.get("municipios") or []
    municipio  = municipios[0] if municipios else zm
    today      = date.today().isoformat()
    version    = manifest.get("version", "0.1-borrador")

    theme = DocumentTheme(
        zm=zm,
        municipio=municipio,
        date=today,
        version=version,
        footer_text=(
            f"paquete documental — ALQUIMIA  |  ZM {zm}  |  {today}  |  v{version}"
        ),
    )

    rendered:  list[RenderedAsset] = []
    blocked:   list[BlockedAsset]  = []
    warnings:  list[str]           = list(manifest.get("warnings_activos") or [])
    errors:    list[str]           = []

    # ── 1. DOCX por cada documento .md en files/ ──────────────────────────────
    files_dir = pkg_dir / "files"
    if files_dir.exists():
        for md_file in sorted(files_dir.glob("*.md")):
            stem = md_file.stem   # e.g. "01_Resumen_Ejecutivo_Municipal"
            docx_filename = f"{stem}.docx"

            try:
                md_content = md_file.read_text(encoding="utf-8")
                doc_meta   = _extract_doc_meta(md_content, stem, zm, municipio)

                # Documentos bloqueados → se registran en rendered Y en blocked_assets
                is_bloqueado = doc_meta.get("is_bloqueado", False)
                doc_status   = "bloqueado" if is_bloqueado else "ok"

                # ── ClaimLedger: buscar {stem}_claims.json junto al .md ─────
                claim_ledger_rows = None
                doc_warnings = list(doc_meta.get("warnings", []))
                claims_file = files_dir / f"{stem}_claims.json"
                if claims_file.exists():
                    try:
                        claims_data = json.loads(claims_file.read_text(encoding="utf-8"))
                        claim_ledger_rows = [
                            (c.get("afirmacion", ""), c.get("tipo", ""), c.get("evidencia", ""))
                            for c in claims_data
                        ]
                        logger.info(f"ClaimLedger cargado: {stem} ({len(claim_ledger_rows)} afirmaciones)")
                    except Exception as ce:
                        msg = f"ClaimLedger encontrado pero no parseable ({stem}): {ce}"
                        doc_warnings.append(msg)
                        warnings.append(msg)
                else:
                    # Limitación documentada: sin ClaimLedger en disco no podemos ligar
                    # afirmaciones a evidencia. No es bloqueante pero debe quedar registrado.
                    limitation_msg = (
                        f"[{stem}] ClaimLedger no encontrado en disco "
                        f"({stem}_claims.json ausente) — "
                        "trazabilidad de afirmaciones numéricas no disponible para este documento. "
                        "Evidencia no puede ser ligada al DOCX exportado."
                    )
                    doc_warnings.append(limitation_msg)
                    warnings.append(limitation_msg)

                docx_bytes = render_docx(
                    md_content        = md_content,
                    theme             = theme,
                    doc_meta          = doc_meta,
                    package_id        = package_id,
                    claim_ledger_rows = claim_ledger_rows,
                )
                asset = _save_asset(
                    render_dir, docx_filename, docx_bytes, package_id,
                    source_doc_id=stem,
                    fmt="docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    status=doc_status,
                    warnings=doc_warnings,
                )
                rendered.append(asset)

                # Documentos con estado "bloqueado" se añaden también a blocked_assets
                # para que n_bloqueados() y qa_status los reflejen correctamente.
                if is_bloqueado:
                    block_reason = (
                        doc_meta.get("warnings", [""])[0]
                        if doc_meta.get("warnings")
                        else "Documento con estado bloqueado — ClaimLedger sin verificar"
                    )
                    blocked.append(BlockedAsset(
                        filename=docx_filename,
                        format="docx",
                        reason=block_reason,
                        code="DOC_ESTADO_BLOQUEADO",
                    ))

                logger.info(f"DOCX generado: {docx_filename} ({len(docx_bytes)} bytes, {doc_status})")

            except Exception as e:
                err_msg = f"Error al renderizar DOCX {docx_filename}: {e}"
                logger.error(err_msg)
                errors.append(err_msg)
                blocked.append(BlockedAsset(
                    filename=docx_filename, format="docx",
                    reason=str(e), code="DOCX_RENDER_ERROR",
                ))

    else:
        blocked.append(BlockedAsset(
            filename="*.docx", format="docx",
            reason="Directorio files/ no encontrado — paquete no tiene documentos persistidos",
            code="FILES_DIR_MISSING",
        ))

    # ── 2. XLSX Modelo Financiero ─────────────────────────────────────────────
    try:
        xlsx_fin = render_financial_xlsx(
            manifest=manifest, resultados=resultados,
            theme_zm=zm, theme_municipio=municipio, package_id=package_id,
        )
        asset = _save_asset(
            render_dir, "05_Modelo_Financiero_CFO.xlsx", xlsx_fin, package_id,
            source_doc_id="02_modelo_tecnico_financiero",
            fmt="xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        rendered.append(asset)
        logger.info(f"XLSX financiero generado: {len(xlsx_fin)} bytes")
    except Exception as e:
        err_msg = f"Error al renderizar XLSX financiero: {e}"
        logger.error(err_msg)
        errors.append(err_msg)
        blocked.append(BlockedAsset(
            filename="05_Modelo_Financiero_CFO.xlsx", format="xlsx",
            reason=str(e), code="XLSX_FINANCIAL_ERROR",
        ))

    # ── Gantt Maestro (fuente única para ZIP implementacion/) ─────────────────
    gantt_plan = None
    hierarchy = []
    gantt_params = {}
    try:
        from app.export.portfolio_structure import resolve_gantt_params
        from app.planning.builder import build_gantt, build_pert, build_raci
        from app.export.gantt_hierarchy import build_hierarchy

        gantt_params = resolve_gantt_params(manifest, resultados)
        gantt_plan = build_gantt(**gantt_params)
        start_date = fecha_inicio or date.today()
        hierarchy = build_hierarchy(gantt_plan, start_date)
    except Exception as e:
        logger.warning("Gantt Maestro no disponible para portafolio: %s", e)

    # ── 3. XLSX Gantt ─────────────────────────────────────────────────────────
    try:
        xlsx_gantt = render_gantt_xlsx(
            manifest=manifest, resultados=resultados,
            theme_zm=zm, theme_municipio=municipio,
            gantt_plan=gantt_plan,
        )
        asset = _save_asset(
            render_dir, "Gantt_Maestro.xlsx", xlsx_gantt, package_id,
            source_doc_id="05_manual_operativo_90_dias",
            fmt="xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        rendered.append(asset)
        logger.info(f"XLSX Gantt generado: {len(xlsx_gantt)} bytes")
    except Exception as e:
        err_msg = f"Error al renderizar XLSX Gantt: {e}"
        logger.error(err_msg)
        errors.append(err_msg)
        blocked.append(BlockedAsset(
            filename="Gantt_Maestro.xlsx", format="xlsx",
            reason=str(e), code="XLSX_GANTT_ERROR",
        ))

    # ── 4. PDF ejecutivo (falla → bloquear sin detener pipeline) ─────────────
    try:
        pdf_bytes, pdf_reason = render_executive_pdf(
            manifest=manifest, resultados=resultados,
            theme_zm=zm, theme_municipio=municipio, package_id=package_id,
        )
        if pdf_bytes:
            asset = _save_asset(
                render_dir, "00_Resumen_Ejecutivo.pdf", pdf_bytes, package_id,
                source_doc_id="01_resumen_ejecutivo_municipal",
                fmt="pdf",
                mime="application/pdf",
            )
            rendered.append(asset)
            logger.info(f"PDF ejecutivo generado: {len(pdf_bytes)} bytes")
        else:
            blocked.append(BlockedAsset(
                filename="00_Resumen_Ejecutivo.pdf", format="pdf",
                reason=pdf_reason or "PDF bloqueado sin razón registrada",
                code="PDF_BLOQUEADO",
            ))
            warnings.append(f"PDF ejecutivo no generado: {pdf_reason}")
    except Exception as e:
        reason = f"Excepción en PDF renderer: {e}"
        logger.warning(reason)
        blocked.append(BlockedAsset(
            filename="08_Reporte_Ejecutivo.pdf", format="pdf",
            reason=reason, code="PDF_EXCEPTION",
        ))
        warnings.append(reason)

    # ── 5. render_report.json ─────────────────────────────────────────────────
    n_ok = sum(1 for a in rendered if a.status == "ok")
    qa_status = (
        "ok"      if len(blocked) == 0
        else "partial" if n_ok > 0
        else "failed"
    )

    report = RenderReport(
        package_id=package_id,
        rendered_assets=rendered,
        blocked_assets=blocked,
        warnings=warnings,
        errors=errors,
        qa_status=qa_status,
    )

    report_bytes = json.dumps(
        report.model_dump(), ensure_ascii=False, indent=2, default=str
    ).encode()
    (render_dir / "render_report.json").write_bytes(report_bytes)

    # ── 6. professional_package.zip (analisis + implementacion) ───────────────
    docx_by_stem: dict[str, bytes] = {}
    if files_dir.exists():
        for md_file in sorted(files_dir.glob("*.md")):
            stem = md_file.stem
            docx_path = render_dir / f"{stem}.docx"
            if docx_path.exists():
                docx_by_stem[stem] = docx_path.read_bytes()

    md_by_stem: dict[str, str] = {}
    if files_dir.exists():
        for md_file in sorted(files_dir.glob("*.md")):
            md_by_stem[md_file.stem] = md_file.read_text(encoding="utf-8")

    zip_bytes = _build_portfolio_zip(
        pkg_dir=pkg_dir,
        render_dir=render_dir,
        report_bytes=report_bytes,
        manifest=manifest,
        theme=theme,
        rendered=rendered,
        docx_by_stem=docx_by_stem,
        md_by_stem=md_by_stem,
        gantt_plan=gantt_plan,
        hierarchy=hierarchy,
        gantt_params=gantt_params,
        fecha_inicio=fecha_inicio or date.today(),
        resultados=resultados,
    )
    zip_path  = pkg_dir / "professional_package.zip"
    zip_path.write_bytes(zip_bytes)
    zip_ck    = _sha256(zip_bytes)

    logger.info(
        f"professional_package.zip: {len(zip_bytes)} bytes | "
        f"checksum={zip_ck[:8]}… | {len(rendered)} assets | {len(blocked)} bloqueados"
    )

    return report


def _load_manifest(pkg_dir: Path) -> Optional[dict]:
    manifest_file = pkg_dir / "manifest.json"
    if not manifest_file.exists():
        return None
    try:
        return json.loads(manifest_file.read_bytes())
    except Exception:
        return None


def _extract_doc_meta(md_content: str, stem: str, zm: str, municipio: str) -> dict:
    """
    Extrae metadata del contenido Markdown.
    Busca líneas de header con **Audiencia:**, **Estado:**, etc.
    """
    meta: dict = {
        "document_id": stem,
        "titulo":      stem.replace("_", " "),
        "zm":          zm,
        "municipio":   municipio,
        "audiencia":   [],
        "decision":    "",
        "status":      "borrador",
        "source":      "template",
        "version":     "0.1-borrador",
        "is_fallback": False,
        "is_bloqueado": False,
        "warnings":    [],
        "fuentes":     [],
    }

    for line in md_content.splitlines():
        stripped = line.strip()
        if stripped.startswith("**Audiencia:**"):
            meta["audiencia"] = [stripped.replace("**Audiencia:**", "").strip()]
        elif stripped.startswith("**Decisión que habilita:**"):
            meta["decision"] = stripped.replace("**Decisión que habilita:**", "").strip()
        elif stripped.startswith("**Estado:**"):
            raw = stripped.replace("**Estado:**", "").strip().strip("`")
            meta["status"] = raw
            meta["is_bloqueado"] = raw == "bloqueado"
        elif stripped.startswith("**Fuente:**"):
            raw = stripped.replace("**Fuente:**", "").strip().strip("`")
            meta["source"] = raw if raw else "template"
        elif stripped.startswith("**Versión:**"):
            meta["version"] = stripped.replace("**Versión:**", "").strip().strip("`")
        elif "BORRADOR AUTOMÁTICO" in stripped or "template" in stripped.lower():
            meta["is_fallback"] = True
        elif stripped.startswith("> ⚠️") or stripped.startswith("> ⚠"):
            meta["warnings"].append(stripped.lstrip("> ⚠️").strip())

    return meta


def _build_portfolio_zip(
    pkg_dir: Path,
    render_dir: Path,
    report_bytes: bytes,
    manifest: dict,
    theme: DocumentTheme,
    rendered: list[RenderedAsset],
    docx_by_stem: dict[str, bytes],
    md_by_stem: dict[str, str],
    gantt_plan: object | None,
    hierarchy: list,
    gantt_params: dict,
    fecha_inicio: date,
    resultados: dict | None,
) -> bytes:
    """
    Construye professional_package.zip con dos carpetas madre:
      analisis/       — diagnóstico y decisión
      implementacion/ — Gantt Fase → Etapa → Actividad
    """
    from app.export.activity_kit_builder import (
        build_activity_checklist_pdf,
        build_activity_readme,
        build_etapa_checklist_pdf,
        build_etapa_readme_pdf,
        build_fase_readme_pdf,
        build_guia_analisis_pdf,
        build_guia_implementacion_pdf,
        build_pert_summary_pdf,
        build_raci_summary_pdf,
        build_root_readme,
        build_tool_docx,
        build_tool_xlsx,
    )
    from app.export.clickup_gantt_exporter import generate_clickup_csv
    from app.export.paquete_analisis_pdf import build_paquete_analisis_pdf
    from app.export.portfolio_structure import (
        analisis_folder,
        doc_matches_etapa,
        etapa_herramientas,
        is_analisis_doc,
    )
    from app.planning.builder import build_pert, build_raci

    municipio = theme.municipio
    zm = theme.zm
    ctx = {"municipio": municipio, "zm": zm, "fecha": theme.date}
    n_etapas = sum(len(f.etapas) for f in hierarchy) if hierarchy else 0

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # ── Raíz ──────────────────────────────────────────────────────────────
        zf.writestr("README.txt", build_root_readme(municipio, zm, len(hierarchy), n_etapas))

        # ── analisis/ ─────────────────────────────────────────────────────────
        guia_a = build_guia_analisis_pdf(municipio, zm)
        if guia_a:
            zf.writestr("analisis/00_Guia_Analisis.pdf", guia_a)

        analisis_sections: list[tuple[str, str]] = []
        for stem, docx_bytes in sorted(docx_by_stem.items()):
            if not is_analisis_doc(stem):
                continue
            folder = analisis_folder(stem)
            zf.writestr(f"analisis/{folder}/{stem}.docx", docx_bytes)
            if stem in md_by_stem:
                analisis_sections.append((stem.replace("_", " "), md_by_stem[stem]))

        # PDF ejecutivo + XLSX financiero en analisis
        for asset in rendered:
            if asset.filename == "00_Resumen_Ejecutivo.pdf" and asset.status == "ok":
                pdf_path = render_dir / asset.filename
                if pdf_path.exists():
                    zf.writestr("analisis/01_Resumen_Ejecutivo/00_Resumen_Ejecutivo.pdf", pdf_path.read_bytes())
            if asset.filename == "05_Modelo_Financiero_CFO.xlsx":
                xlsx_path = render_dir / asset.filename
                if xlsx_path.exists():
                    zf.writestr(
                        "analisis/02_Modelo_Tecnico_Financiero/Modelo_Financiero_CFO.xlsx",
                        xlsx_path.read_bytes(),
                    )

        if analisis_sections:
            paquete_pdf = build_paquete_analisis_pdf(analisis_sections, theme)
            if paquete_pdf:
                zf.writestr("analisis/00_Paquete_Integral_Analisis.pdf", paquete_pdf)

        # ── implementacion/00_Maestro ─────────────────────────────────────────
        guia_i = build_guia_implementacion_pdf(municipio, zm, hierarchy)
        if guia_i:
            zf.writestr("implementacion/00_Maestro/00_Guia_Implementacion.pdf", guia_i)

        manifest_path = pkg_dir / "manifest.json"
        if manifest_path.exists():
            zf.write(manifest_path, "implementacion/00_Maestro/manifest.json")
        zf.writestr("implementacion/00_Maestro/render_report.json", report_bytes.decode())

        gantt_path = render_dir / "Gantt_Maestro.xlsx"
        if gantt_path.exists():
            zf.writestr("implementacion/00_Maestro/Gantt_Maestro.xlsx", gantt_path.read_bytes())

        if gantt_plan is not None:
            clickup = generate_clickup_csv(gantt_plan, hierarchy, fecha_inicio)
            zf.writestr("implementacion/00_Maestro/Gantt_ClickUp_Import.csv", clickup)
            try:
                pert = build_pert(gantt_plan)
                pert_pdf = build_pert_summary_pdf(pert)
                if pert_pdf:
                    zf.writestr("implementacion/00_Maestro/PERT_Ruta_Critica.pdf", pert_pdf)
            except Exception:
                pass

        try:
            raci = build_raci(
                gantt_params.get("municipio", municipio),
                gantt_params.get("zm", zm),
                gantt_params.get("scenario_id", "export"),
            )
            raci_pdf = build_raci_summary_pdf(raci)
            if raci_pdf:
                zf.writestr("implementacion/00_Maestro/Matriz_RACI.pdf", raci_pdf)
        except Exception:
            pass

        # ── implementacion/ por fase → etapa → actividad ──────────────────────
        for fase in hierarchy:
            fase_base = f"implementacion/{fase.slug}"
            fase_pdf = build_fase_readme_pdf(fase)
            if fase_pdf:
                zf.writestr(f"{fase_base}/FASE_README.pdf", fase_pdf)

            for etapa in fase.etapas:
                etapa_base = f"{fase_base}/{etapa.slug}"
                etapa_pdf = build_etapa_readme_pdf(etapa)
                if etapa_pdf:
                    zf.writestr(f"{etapa_base}/ETAPA_README.pdf", etapa_pdf)

                # entregables
                ent_names: list[str] = []
                for stem, docx_bytes in docx_by_stem.items():
                    if doc_matches_etapa(stem, etapa.task_id):
                        zf.writestr(f"{etapa_base}/entregables/{stem}.docx", docx_bytes)
                        ent_names.append(stem)

                # herramientas de etapa
                etapa_chk = build_etapa_checklist_pdf(etapa, ent_names)
                if etapa_chk:
                    zf.writestr(
                        f"{etapa_base}/herramientas/Checklist_Etapa_{etapa.task_id}.pdf",
                        etapa_chk,
                    )
                for tool_id in etapa_herramientas(etapa.task_id):
                    tool_docx = build_tool_docx(tool_id, ctx)
                    if tool_docx:
                        fname = tool_id.replace("_", " ").title().replace(" ", "_") + ".docx"
                        zf.writestr(f"{etapa_base}/herramientas/{fname}", tool_docx)
                    tool_xlsx = build_tool_xlsx(tool_id, ctx)
                    if tool_xlsx:
                        fname = tool_id.replace("_", " ").title().replace(" ", "_") + ".xlsx"
                        zf.writestr(f"{etapa_base}/herramientas/{fname}", tool_xlsx)

                # actividades diarias
                for act in etapa.actividades:
                    act_base = f"{etapa_base}/actividades/{act.slug}"
                    zf.writestr(
                        act_base + "/README.txt",
                        build_activity_readme(act, etapa, fase, municipio, zm),
                    )
                    act_chk = build_activity_checklist_pdf(act, etapa)
                    if act_chk:
                        zf.writestr(f"{act_base}/checklist.pdf", act_chk)

        # Docs operativos (05–11) también en implementacion si no mapeados
        for stem, docx_bytes in docx_by_stem.items():
            if is_analisis_doc(stem):
                continue
            already = any(
                doc_matches_etapa(stem, e.task_id)
                for f in hierarchy for e in f.etapas
            )
            if not already:
                zf.writestr(f"implementacion/00_Maestro/entregables/{stem}.docx", docx_bytes)

    buf.seek(0)
    return buf.read()


def _build_professional_zip(
    pkg_dir: Path,
    render_dir: Path,
    report_bytes: bytes,
) -> bytes:
    """Legacy flat ZIP — conservado para compatibilidad interna."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:

        # manifest.json
        manifest_path = pkg_dir / "manifest.json"
        if manifest_path.exists():
            zf.write(manifest_path, "manifest.json")

        # render_report.json (en memoria, por si aún no está en disco)
        zf.writestr("render_report.json", report_bytes.decode())

        # assets renderizados
        if render_dir.exists():
            for asset_file in sorted(render_dir.iterdir()):
                if asset_file.is_file() and asset_file.name != "render_report.json":
                    ext = asset_file.suffix.lower()
                    if ext in (".docx", ".xlsx", ".pdf", ".json"):
                        assert ext != ".txt", f"Asset .txt detectado: {asset_file.name}"
                        zf.write(asset_file, f"rendered/{asset_file.name}")

    buf.seek(0)
    return buf.read()


def get_render_report(package_id: str) -> Optional[dict]:
    """Lee render_report.json desde disco."""
    report_file = PACKAGES_DIR / package_id / "rendered" / "render_report.json"
    if report_file.exists():
        return json.loads(report_file.read_bytes())
    return None


def get_professional_zip_bytes(package_id: str) -> Optional[bytes]:
    """Retorna bytes del professional_package.zip."""
    zip_file = PACKAGES_DIR / package_id / "professional_package.zip"
    if zip_file.exists():
        return zip_file.read_bytes()
    return None
