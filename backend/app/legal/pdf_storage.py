"""Almacenamiento de PDFs municipales y catálogo de archivos en línea."""
from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.legal.schemas import (
    LegalOfficiality,
    LegalSourceIngestStatus,
    LegalSourceValidationStatus,
    MunicipalLegalSourceManifest,
)

# Coincide con `frontend/public/reglamentos/` y `reglamentos.ts`.
PDF_CATALOG: dict[str, list[str]] = {
    "slp": ["SLP_slp_reglamento_aseo_publico.pdf"],
    "sol": ["SLP_sol_reglamento_aseo_publico_2013.pdf"],
    "mty": ["MTY_mty_monterrey_reglamento_limpia_municipal.pdf"],
    "spg": [
        "MTY_spg_san_pedro_reglamento_aseo_publico.pdf",
        "MTY_spg_san_pedro_reglamento_limpia_sistec_candidate.pdf",
        "MTY_spg_san_pedro_reglamento_ambiental_gaceta118_2009.pdf",
        "MTY_spg_san_pedro_reglamento_zonificacion_usos_suelo.pdf",
    ],
    "gua": ["MTY_gua_guadalupe_reglamento_limpia.pdf"],
    "apo": ["MTY_apo_apodaca_reglamento_proteccion_ambiente_sistec.pdf"],
    "gar": ["MTY_gar_garcia_R-IRMG-3-40_instruccion_interna.pdf"],
    "qro": ["QRO_qro_reglamento_aseo_publico.pdf"],
    "cor": ["QRO_cor_reglamento_ambiente_segob_queretaro_reference.pdf"],
    "gdl": [
        "GDL_gdl_guadalajara_reglamento_gestion_integral_municipio.pdf",
        "GDL_gdl_guadalajara_reglamento_aseo_publico.pdf",
    ],
    "zap": ["GDL_zap_zapopan_reglamento_gestion_integral_residuos.pdf"],
    "cad": ["EXT_cad_cadereyta_reglamento_desarrollo_urbano_portalmunicipal.pdf"],
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def reglamentos_dir() -> Path:
    return repo_root() / "frontend" / "public" / "reglamentos"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _source_id(municipio_id: str, title: str) -> str:
    safe_title = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-")
    while "--" in safe_title:
        safe_title = safe_title.replace("--", "-")
    return f"legal-src-{municipio_id.lower()}-{safe_title[:48] or 'sin-titulo'}"


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def primary_pdf_filename(municipio_id: str, zm: str, original_name: Optional[str] = None) -> str:
    mid = municipio_id.lower()
    catalog = PDF_CATALOG.get(mid)
    if catalog:
        return catalog[0]
    if original_name and original_name.lower().endswith(".pdf"):
        cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", original_name).strip("._")
        if cleaned:
            return cleaned
    return f"{zm.upper()}_{mid}_{mid}_reglamento_upload.pdf"


def existing_pdf_path(municipio_id: str) -> Optional[Path]:
    mid = municipio_id.lower()
    base = reglamentos_dir()
    for name in PDF_CATALOG.get(mid, []):
        path = base / name
        if path.is_file():
            return path
    for path in sorted(base.glob(f"*_{mid}_*.pdf")):
        if path.is_file():
            return path
    return None


def public_pdf_path(filename: str) -> str:
    return f"/reglamentos/{filename}"


def save_municipal_pdf(
    *,
    municipio_id: str,
    zm: str,
    content: bytes,
    original_filename: Optional[str] = None,
) -> tuple[str, Path, str]:
    if not content.startswith(b"%PDF"):
        raise ValueError("El archivo no parece un PDF válido (falta cabecera %PDF).")
    filename = primary_pdf_filename(municipio_id, zm, original_filename)
    target_dir = reglamentos_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / filename
    path.write_bytes(content)
    return filename, path, sha256_bytes(content)


def manifest_from_pdf_file(
    *,
    municipio_id: str,
    zm: str,
    title: str,
    source_authority: str,
    official_url: Optional[str],
    pdf_filename: str,
    checksum: str,
    bytes_size: int,
) -> MunicipalLegalSourceManifest:
    return MunicipalLegalSourceManifest(
        source_id=_source_id(municipio_id, title),
        municipio_id=municipio_id.lower(),
        zm=zm,
        title=title,
        official_url=official_url,
        download_url=public_pdf_path(pdf_filename),
        retrieved_at=_now(),
        ingest_status=LegalSourceIngestStatus.descargado,
        validation_status=LegalSourceValidationStatus.pendiente_validacion_juridica,
        officiality=LegalOfficiality.documento_descargado_no_validado,
        status_http=200,
        content_type="application/pdf",
        checksum_sha256=checksum,
        bytes_size=bytes_size,
        source_authority=source_authority,
        can_enable_education=True,
        can_enable_simulation=True,
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=[
            "PDF cargado en plataforma; no se declara vigencia ni dictamen jurídico.",
            "La validación competente sigue siendo requisito para sanciones y documentos definitivos.",
        ],
        blockers=[
            "Validación jurídica externa requerida antes de tratar sanciones propuestas o documentos definitivos como defendibles.",
        ],
        next_action="Análisis municipal habilitado. Los sistemas internos de ALQUIMIA pueden extraer artículos y proponer adendos.",
    )


def bootstrap_manifest_from_disk(
    municipio_id: str,
    *,
    zm: str,
    title: str,
    source_authority: str,
    official_url: Optional[str],
) -> Optional[MunicipalLegalSourceManifest]:
    path = existing_pdf_path(municipio_id)
    if path is None:
        return None
    content = path.read_bytes()
    return manifest_from_pdf_file(
        municipio_id=municipio_id,
        zm=zm,
        title=title,
        source_authority=source_authority,
        official_url=official_url,
        pdf_filename=path.name,
        checksum=sha256_bytes(content),
        bytes_size=len(content),
    )
