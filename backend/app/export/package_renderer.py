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
  - Ningún asset .txt.
  - professional_package.zip siempre incluye manifest.json y render_report.json.
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
            f"ÁGORA GOV — ALQUIMIA  |  ZM {zm}  |  {today}  |  v{version}"
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

    # ── 3. XLSX Gantt ─────────────────────────────────────────────────────────
    try:
        xlsx_gantt = render_gantt_xlsx(
            manifest=manifest, resultados=resultados,
            theme_zm=zm, theme_municipio=municipio,
        )
        asset = _save_asset(
            render_dir, "06_Plan_De_Implementacion_Gantt.xlsx", xlsx_gantt, package_id,
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
            filename="06_Plan_De_Implementacion_Gantt.xlsx", format="xlsx",
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
                render_dir, "08_Reporte_Ejecutivo.pdf", pdf_bytes, package_id,
                source_doc_id="01_resumen_ejecutivo_municipal",
                fmt="pdf",
                mime="application/pdf",
            )
            rendered.append(asset)
            logger.info(f"PDF ejecutivo generado: {len(pdf_bytes)} bytes")
        else:
            blocked.append(BlockedAsset(
                filename="08_Reporte_Ejecutivo.pdf", format="pdf",
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

    # ── 6. professional_package.zip ───────────────────────────────────────────
    zip_bytes = _build_professional_zip(pkg_dir, render_dir, report_bytes)
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


def _build_professional_zip(
    pkg_dir: Path,
    render_dir: Path,
    report_bytes: bytes,
) -> bytes:
    """
    Construye professional_package.zip con:
      manifest.json           (raíz)
      render_report.json      (raíz)
      rendered/               (todos los DOCX/XLSX/PDF)
    Nunca incluye .txt.
    """
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
