"""
Fase 3C — package_store.py

Persistencia de paquetes ÁGORA: PackageRecord + DownloadAsset + ZIP descargable.

El store usa dos capas:
  - Memoria:  dict[package_id, PackageRecord] — acceso rápido en proceso vivo
  - Disco:    PACKAGES_DIR/{package_id}/      — recuperabilidad entre reinicios

Estructura de disco por paquete:
  {package_id}/
    package_record.json   ← metadatos sin ExportBundle completo
    manifest.json         ← ExportManifest serializado
    files/
      01_Resumen_Ejecutivo_Municipal.md
      02_Modelo_Tecnico_Financiero.md
      ... (un .md por ExportedDocument)
    package.zip           ← ZIP con todos los archivos anteriores

Reglas:
  - Ningún archivo .txt en disco ni en ZIP
  - manifest.json siempre incluido en ZIP
  - checksum = SHA-256 del package.zip
  - Warnings y DataProvenance sobreviven a persistencia
"""
from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.agents.schemas import (
    DownloadAsset,
    ExportBundle,
    PackageRecord,
)
from app.legal.agora_export_disclaimers import wrap_agora_markdown

logger = logging.getLogger(__name__)

# Directorio base para paquetes — configurable via env
PACKAGES_DIR = Path(os.environ.get("ALQUIMIA_PACKAGES_DIR", "/tmp/alquimia_packages"))

# ─── Store en memoria ─────────────────────────────────────────────────────────
_records: dict[str, PackageRecord] = {}
_assets:  dict[str, list[DownloadAsset]] = {}   # package_id → lista de assets


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _build_zip(files_dir: Path, manifest_path: Path) -> bytes:
    """
    Construye ZIP con todos los archivos del paquete.
    Nunca incluye .txt — la validación ya lo garantiza upstream.
    """
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # manifest siempre en raíz del ZIP
        if manifest_path.exists():
            zf.write(manifest_path, "manifest.json")
        # documentos en files/
        if files_dir.exists():
            for file_path in sorted(files_dir.iterdir()):
                if file_path.suffix in (".md", ".json") and file_path.is_file():
                    assert not file_path.name.endswith(".txt"), (
                        f"Archivo .txt detectado en files/: {file_path.name}"
                    )
                    zf.write(file_path, f"files/{file_path.name}")
    buffer.seek(0)
    return buffer.read()


def _render_content(doc, draft_bundle) -> bytes:
    """
    Renderiza el contenido de un ExportedDocument a bytes markdown.
    Usa DraftDocument si está disponible; fallback a stub auditado.
    """
    from app.agents.exporter import render_draft_document_as_markdown

    if draft_bundle:
        draft_doc = draft_bundle.documento_por_id(doc.document_id)
        if draft_doc and draft_doc.secciones:
            raw = render_draft_document_as_markdown(draft_doc)
            return wrap_agora_markdown(raw).encode("utf-8")

    # Stub de trazabilidad: deja claro que el doc requiere contenido real
    lines = [
        f"# {doc.filename}",
        "",
        f"**Estado:** `{doc.status.value}`",
        f"**Fuente:** `{doc.source}`",
        f"**Versión:** `{doc.version}`",
        "",
        "> ⚠️ El contenido estructurado no está disponible en este ciclo.",
        "> Documento registrado en ExportBundle — pendiente de redacción completa.",
        "",
    ]
    text = "\n".join(lines)
    return wrap_agora_markdown(text).encode("utf-8")


# ─── API pública ──────────────────────────────────────────────────────────────

def save_package(
    package_id: str,
    export_bundle: ExportBundle,
    draft_bundle=None,
) -> PackageRecord:
    """
    Persiste ExportBundle a disco y memoria.
    Retorna PackageRecord con checksum del ZIP.
    """
    pkg_dir   = PACKAGES_DIR / package_id
    files_dir = pkg_dir / "files"
    pkg_dir.mkdir(parents=True, exist_ok=True)
    files_dir.mkdir(exist_ok=True)

    assets: list[DownloadAsset] = []

    # ── 1. Documentos individuales ────────────────────────────────────────────
    for doc in export_bundle.documents:
        content_bytes = _render_content(doc, draft_bundle)
        file_path     = files_dir / doc.filename

        assert not doc.filename.endswith(".txt"), (
            f"ExportBundle contiene .txt: {doc.filename}"
        )
        file_path.write_bytes(content_bytes)

        assets.append(DownloadAsset(
            package_id=package_id,
            filename=doc.filename,
            mime_type="text/markdown",
            path=str(file_path),
            checksum=_sha256(content_bytes),
            size_bytes=len(content_bytes),
        ))

    # ── 2. manifest.json ──────────────────────────────────────────────────────
    manifest_data  = (export_bundle.manifest.model_dump()
                      if export_bundle.manifest else {})
    manifest_bytes = json.dumps(
        manifest_data, ensure_ascii=False, indent=2, default=str
    ).encode()
    manifest_path  = pkg_dir / "manifest.json"
    manifest_path.write_bytes(manifest_bytes)

    assets.append(DownloadAsset(
        package_id=package_id,
        filename="manifest.json",
        mime_type="application/json",
        path=str(manifest_path),
        checksum=_sha256(manifest_bytes),
        size_bytes=len(manifest_bytes),
    ))

    # ── 3. ZIP ────────────────────────────────────────────────────────────────
    zip_bytes = _build_zip(files_dir, manifest_path)
    zip_path  = pkg_dir / "package.zip"
    zip_path.write_bytes(zip_bytes)
    zip_checksum = _sha256(zip_bytes)

    assets.append(DownloadAsset(
        package_id=package_id,
        filename="package.zip",
        mime_type="application/zip",
        path=str(zip_path),
        checksum=zip_checksum,
        size_bytes=len(zip_bytes),
    ))

    # ── 4. PackageRecord ──────────────────────────────────────────────────────
    docs = export_bundle.documents
    record = PackageRecord(
        package_id=package_id,
        scenario_id=export_bundle.bundle_id,
        zm=export_bundle.zm,
        municipios=export_bundle.municipios,
        version=docs[0].version if docs else "0.1-borrador",
        status="completed",
        manifest_path=str(manifest_path),
        zip_path=str(zip_path),
        checksum=zip_checksum,
        warnings=export_bundle.warnings,
        n_documents=len(docs),
        n_defendibles=len(export_bundle.documents_defendibles()),
        n_bloqueados=len(export_bundle.documents_bloqueados()),
    )

    # ── 5. Serializar PackageRecord a disco (sin embed de ExportBundle) ───────
    record_bytes = json.dumps(
        record.model_dump(), ensure_ascii=False, indent=2, default=str
    ).encode()
    (pkg_dir / "package_record.json").write_bytes(record_bytes)

    # ── 6. Guardar en memoria ─────────────────────────────────────────────────
    _records[package_id] = record
    _assets[package_id]  = assets

    logger.info(
        f"PackageRecord persistido: {package_id} | zm={record.zm} | "
        f"{record.n_documents} docs | ZIP={record.checksum[:8]}..."
    )
    return record


def get_record(package_id: str) -> Optional[PackageRecord]:
    """Recupera PackageRecord de memoria o disco."""
    if package_id in _records:
        return _records[package_id]

    # Intentar cargar de disco
    record_file = PACKAGES_DIR / package_id / "package_record.json"
    if record_file.exists():
        data   = json.loads(record_file.read_bytes())
        record = PackageRecord(**data)
        _records[package_id] = record
        return record

    return None


def get_manifest(package_id: str) -> Optional[dict]:
    """Retorna el manifest.json como dict."""
    manifest_file = PACKAGES_DIR / package_id / "manifest.json"
    if manifest_file.exists():
        return json.loads(manifest_file.read_bytes())
    return None


def get_zip_bytes(package_id: str) -> Optional[bytes]:
    """Retorna los bytes del package.zip para descarga directa."""
    zip_file = PACKAGES_DIR / package_id / "package.zip"
    if zip_file.exists():
        return zip_file.read_bytes()
    return None


def get_assets(package_id: str) -> list[DownloadAsset]:
    """Retorna todos los DownloadAssets del paquete."""
    return _assets.get(package_id, [])


def list_packages() -> list[PackageRecord]:
    """Lista todos los PackageRecords en memoria."""
    return list(_records.values())
