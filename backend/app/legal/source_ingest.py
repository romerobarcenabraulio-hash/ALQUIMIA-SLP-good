"""Fase 11.0: ingesta/localización de fuentes legales oficiales por municipio."""
from __future__ import annotations

import base64
import binascii
import hashlib
from datetime import datetime, timezone
from typing import Optional

from app.legal.repository import get_repo
from app.legal.schemas import (
    LegalOfficiality,
    LegalSourceIngestRequest,
    LegalSourceIngestStatus,
    LegalSourceValidationStatus,
    MunicipalLegalSourceManifest,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _source_id(municipio_id: str, title: str) -> str:
    safe_title = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-")
    while "--" in safe_title:
        safe_title = safe_title.replace("--", "-")
    return f"legal-src-{municipio_id.lower()}-{safe_title[:48] or 'sin-titulo'}"


def pdf_ingested_for_analysis(manifest: MunicipalLegalSourceManifest) -> bool:
    """True cuando hay PDF en plataforma (descargado o verificado)."""
    return manifest.ingest_status in (
        LegalSourceIngestStatus.descargado,
        LegalSourceIngestStatus.verified,
    )


def _manifest_no_disponible(municipio_id: str) -> Optional[MunicipalLegalSourceManifest]:
    repo = get_repo()
    reg = repo.get_reglamento(municipio_id)
    if reg is None:
        return None
    return MunicipalLegalSourceManifest(
        source_id=f"legal-src-{municipio_id.lower()}-no-disponible",
        municipio_id=municipio_id.lower(),
        zm=reg.zm,
        title="Fuente legal municipal no disponible",
        official_url=None,
        download_url=None,
        retrieved_at=_now(),
        ingest_status=LegalSourceIngestStatus.no_disponible,
        validation_status=LegalSourceValidationStatus.no_disponible,
        officiality=LegalOfficiality.fuente_localizada_no_validada,
        status_http=None,
        content_type=None,
        checksum_sha256=None,
        bytes_size=None,
        source_authority="Municipio no localizado",
        can_enable_education=True,
        can_enable_simulation=False,
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=[
            "No hay PDF municipal cargado en la plataforma.",
            "Sin PDF no se habilita el análisis jurídico municipal.",
        ],
        blockers=[
            "Suba el PDF del reglamento municipal para habilitar diagnóstico y análisis.",
            "Sanciones propuestas y documentos definitivos siguen restringidos hasta validación jurídica competente.",
        ],
        next_action="Subir PDF del reglamento en el apartado «Alimentar reglamento» o localizar fuente oficial.",
    )


def locate_municipal_legal_source(municipio_id: str) -> Optional[MunicipalLegalSourceManifest]:
    """Manifiesto por municipio: primero PDF en plataforma, luego URL/localizado."""
    repo = get_repo()
    mid = municipio_id.lower()
    stored = repo.get_source_manifest(mid)
    if stored is not None:
        return stored

    reg = repo.get_reglamento(mid)
    if reg is None:
        return None
    if not reg.url:
        return _manifest_no_disponible(mid)

    return MunicipalLegalSourceManifest(
        source_id=_source_id(mid, reg.nombre),
        municipio_id=mid,
        zm=reg.zm,
        title=reg.nombre,
        official_url=reg.url,
        download_url=reg.url,
        retrieved_at=_now(),
        ingest_status=LegalSourceIngestStatus.localizado,
        validation_status=LegalSourceValidationStatus.pendiente_validacion_juridica,
        officiality=LegalOfficiality.fuente_localizada_no_validada,
        status_http=None,
        content_type=None,
        checksum_sha256=None,
        bytes_size=None,
        source_authority=reg.fuente,
        can_enable_education=True,
        can_enable_simulation=False,
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=[
            "Hay referencia oficial, pero aún no hay PDF cargado en la plataforma.",
            "Sin PDF no se habilita el análisis jurídico municipal.",
        ],
        blockers=[
            "Suba el PDF del reglamento para habilitar diagnóstico y análisis.",
            "Validación jurídica externa requerida antes de tratar sanciones propuestas o documentos definitivos como defendibles.",
        ],
        next_action="Subir PDF del reglamento en el apartado «Alimentar reglamento».",
    )


def ingest_municipal_legal_source(
    municipio_id: str,
    request: LegalSourceIngestRequest,
) -> Optional[MunicipalLegalSourceManifest]:
    """
    Registra manifest de localización o descarga. No hace red externa.

    Si se adjuntan bytes en content_base64, el status pasa a descargado y se
    calcula checksum SHA-256 de bytes. Descargar no valida vigencia.
    """
    repo = get_repo()
    reg = repo.get_reglamento(municipio_id.lower())
    if reg is None:
        return None

    title = request.title or reg.nombre
    official_url = request.official_url or reg.url
    download_url = request.download_url or official_url
    source_authority = request.source_authority or reg.fuente or "Fuente oficial municipal pendiente"

    if not official_url and not request.content_base64:
        manifest = _manifest_no_disponible(municipio_id.lower())
        if manifest is not None:
            repo.set_source_manifest(municipio_id.lower(), manifest)
        return manifest

    checksum = None
    bytes_size = None
    ingest_status = LegalSourceIngestStatus.localizado
    officiality = LegalOfficiality.fuente_localizada_no_validada

    if request.content_base64:
        try:
            content = base64.b64decode(request.content_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("content_base64 inválido; no se puede calcular checksum legal") from exc
        checksum = hashlib.sha256(content).hexdigest()
        bytes_size = len(content)
        ingest_status = LegalSourceIngestStatus.descargado
        officiality = LegalOfficiality.documento_descargado_no_validado

    status_http = request.status_http
    if status_http is not None and not (200 <= status_http < 300):
        ingest_status = LegalSourceIngestStatus.no_disponible
        checksum = None
        bytes_size = None

    warnings = [
        "Manifest municipal registrado sin declarar vigencia ni dictamen.",
        "Una descarga exitosa no equivale a validación jurídica competente.",
    ]
    blockers = [
        "Validación jurídica externa requerida antes de tratar sanciones propuestas o documentos definitivos como defendibles.",
    ]
    next_action = "Enviar fuente y manifest a revisión jurídica competente."
    can_enable_simulation = ingest_status == LegalSourceIngestStatus.descargado

    if ingest_status == LegalSourceIngestStatus.no_disponible:
        warnings = [
            "No hay PDF municipal cargado en la plataforma.",
            "Sin PDF no se habilita el análisis jurídico municipal.",
        ]
        blockers = [
            "Suba el PDF del reglamento municipal para habilitar diagnóstico y análisis.",
            "Sanciones propuestas y documentos definitivos quedan restringidos hasta localizar fuente oficial municipal y validar jurídicamente.",
        ]
        next_action = "Subir PDF del reglamento en el apartado «Alimentar reglamento»."
        can_enable_simulation = False
    elif ingest_status == LegalSourceIngestStatus.localizado:
        warnings.append("Hay URL de referencia, pero falta PDF en plataforma para análisis.")
        blockers.insert(0, "Suba el PDF del reglamento para habilitar diagnóstico y análisis.")
        next_action = "Subir PDF del reglamento en el apartado «Alimentar reglamento»."
        can_enable_simulation = False
    elif ingest_status == LegalSourceIngestStatus.descargado:
        next_action = "Análisis municipal habilitado. Los agentes ALQUIMIA pueden extraer artículos y proponer adendos."

    manifest = MunicipalLegalSourceManifest(
        source_id=_source_id(municipio_id, title),
        municipio_id=municipio_id.lower(),
        zm=reg.zm,
        title=title,
        official_url=official_url,
        download_url=download_url,
        retrieved_at=_now(),
        ingest_status=ingest_status,
        validation_status=(
            LegalSourceValidationStatus.no_disponible
            if ingest_status == LegalSourceIngestStatus.no_disponible
            else LegalSourceValidationStatus.pendiente_validacion_juridica
        ),
        officiality=officiality,
        status_http=status_http,
        content_type=request.content_type,
        checksum_sha256=checksum,
        bytes_size=bytes_size,
        source_authority=source_authority,
        can_enable_education=True,
        can_enable_simulation=can_enable_simulation,
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=warnings,
        blockers=blockers,
        next_action=next_action,
    )
    repo.set_source_manifest(municipio_id.lower(), manifest)
    return manifest


def upload_municipal_pdf_bytes(
    municipio_id: str,
    content: bytes,
    *,
    original_filename: Optional[str] = None,
) -> Optional[MunicipalLegalSourceManifest]:
    """Guarda PDF en disco, registra manifiesto descargado y habilita análisis."""
    return get_repo().upload_municipal_pdf(
        municipio_id.lower(),
        content,
        original_filename=original_filename,
    )


def reject_zm_legal_source(zm: str) -> dict:
    return {
        "ok": False,
        "zm": zm.upper(),
        "error": "Una ZM no puede producir una fuente legal municipal única.",
        "next_action": "Consultar o registrar fuentes por municipio individual dentro de la ZM.",
    }
