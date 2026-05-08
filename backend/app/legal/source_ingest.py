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
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=[
            "No hay URL oficial localizada para este municipio.",
            "La ausencia de fuente legal municipal no bloquea educación ni simulación.",
        ],
        blockers=[
            "Sanciones propuestas y documentos definitivos quedan restringidos hasta localizar fuente oficial municipal y validar jurídicamente.",
        ],
        next_action="Localizar reglamento en sitio municipal, periódico oficial estatal, Orden Jurídico Nacional o portal de transparencia.",
    )


def locate_municipal_legal_source(municipio_id: str) -> Optional[MunicipalLegalSourceManifest]:
    """Localiza una fuente configurada por municipio sin asumir vigencia ni validación."""
    repo = get_repo()
    reg = repo.get_reglamento(municipio_id.lower())
    if reg is None:
        return None
    if not reg.url:
        return _manifest_no_disponible(municipio_id)

    return MunicipalLegalSourceManifest(
        source_id=_source_id(municipio_id, reg.nombre),
        municipio_id=municipio_id.lower(),
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
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=[
            "Fuente localizada por municipio; no se declara vigente ni validada.",
            "Documento legal tratado como insumo pendiente de validación jurídica competente.",
        ],
        blockers=[
            "Validación jurídica externa requerida antes de tratar sanciones propuestas o documentos definitivos como defendibles.",
        ],
        next_action="Descargar archivo oficial, registrar checksum y solicitar validación jurídica competente.",
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
        return _manifest_no_disponible(municipio_id)

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
    blockers = ["Validación jurídica externa requerida antes de tratar sanciones propuestas o documentos definitivos como defendibles."]
    next_action = "Enviar fuente y manifest a revisión jurídica competente."

    if ingest_status == LegalSourceIngestStatus.no_disponible:
        warnings.append("La descarga/localización falló o no produjo archivo verificable.")
        blockers = [
            "Sanciones propuestas y documentos definitivos quedan restringidos hasta localizar fuente oficial municipal y validar jurídicamente.",
        ]
        next_action = "Reintentar desde fuente oficial municipal, periódico oficial, Orden Jurídico Nacional o transparencia."

    return MunicipalLegalSourceManifest(
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
        can_enable_sanctions=False,
        can_generate_official_document=False,
        warnings=warnings,
        blockers=blockers,
        next_action=next_action,
    )


def reject_zm_legal_source(zm: str) -> dict:
    return {
        "ok": False,
        "zm": zm.upper(),
        "error": "Una ZM no puede producir una fuente legal municipal única.",
        "next_action": "Consultar o registrar fuentes por municipio individual dentro de la ZM.",
    }
