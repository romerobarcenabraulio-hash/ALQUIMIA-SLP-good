"""Cobertura nacional por municipio."""
from __future__ import annotations

import hashlib
from typing import List

from app.legal.diagnostic import build_diagnostic
from app.legal.repository import get_repo
from app.legal.source_ingest import locate_municipal_legal_source, pdf_ingested_for_analysis
from app.legal.schemas import LegalSourceIngestStatus
from app.national.catalog import get_profile, list_zm_municipios
from app.national.schemas import CoverageStage, CoverageStatus, LegalSource, SourceStatus


def _checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def legal_source_for_municipio(municipio_id: str) -> LegalSource | None:
    repo = get_repo()
    reg = repo.get_reglamento(municipio_id)
    if reg is None:
        return None
    articulos = repo.get_articulos(municipio_id)
    manifest = locate_municipal_legal_source(municipio_id)
    if manifest and pdf_ingested_for_analysis(manifest):
        status = SourceStatus.verificado
    elif manifest and manifest.ingest_status == LegalSourceIngestStatus.localizado:
        status = SourceStatus.localizado
    elif reg.fuente != "No disponible":
        status = SourceStatus.localizado
    else:
        status = SourceStatus.no_disponible
    checksum_input = f"{reg.municipio_id}|{reg.nombre}|{reg.version}|{reg.fecha_publicacion}|{reg.fuente}"
    return LegalSource(
        legal_source_id=f"legal:{reg.municipio_id}:{reg.version}",
        municipio_id=reg.municipio_id,
        titulo=reg.nombre,
        tipo="reglamento_limpia",
        fuente=reg.fuente,
        url=reg.url,
        fecha_publicacion=reg.fecha_publicacion,
        fecha_verificacion="2026-05-18" if status == SourceStatus.verificado else None,
        version=reg.version,
        checksum=_checksum(checksum_input),
        status=status,
        articulos_indexados=len(articulos),
    )


def coverage_for_municipio(municipio_id: str) -> CoverageStatus:
    profile = get_profile(municipio_id)
    legal = legal_source_for_municipio(municipio_id)
    diag = build_diagnostic(municipio_id)
    bloqueos: List[str] = []

    demografia = SourceStatus.estimado if profile else SourceStatus.no_disponible
    rsu = SourceStatus.estimado if profile and profile.rsu_ton_dia is not None else SourceStatus.no_disponible
    presupuesto = SourceStatus.estimado if profile and profile.presupuesto_mxn is not None else SourceStatus.no_disponible
    contrato = profile.concesion_status if profile else SourceStatus.no_disponible

    if legal is None:
        legal_status = SourceStatus.no_disponible
        bloqueos.append("Sin reglamento municipal localizado.")
    else:
        legal_status = legal.status
        if legal.status != SourceStatus.verificado:
            bloqueos.append("Sin PDF municipal cargado; el análisis jurídico permanece bloqueado.")

    if diag and diag.agora_bloqueado:
        bloqueos.append(f"Gate juridico activo para {municipio_id}: {diag.reglamento_nombre}.")

    if legal_status == SourceStatus.verificado:
        stage = CoverageStage.legal_verificado
    elif legal_status == SourceStatus.localizado:
        stage = CoverageStage.legal_localizado
    elif demografia != SourceStatus.no_disponible:
        stage = CoverageStage.datos_basicos
    else:
        stage = CoverageStage.no_iniciado

    return CoverageStatus(
        municipio_id=municipio_id.lower(),
        demografia=demografia,
        rsu=rsu,
        legal=legal_status,
        contrato=contrato,
        presupuesto=presupuesto,
        operacion=SourceStatus.estimado if profile and profile.dependencia_responsable else SourceStatus.no_disponible,
        documentos=SourceStatus.bloqueado if bloqueos else SourceStatus.estimado,
        bloqueos=list(dict.fromkeys(bloqueos)),
        siguiente_accion=(
            "Verificar fuente/version legal municipal."
            if legal_status != SourceStatus.verificado
            else "Completar presupuesto, contrato y operacion municipal."
        ),
        coverage_status=stage,
        agora_bloqueado=bool(bloqueos),
    )


def coverage_for_zm(zm_id: str) -> List[CoverageStatus]:
    return [coverage_for_municipio(m) for m in list_zm_municipios(zm_id)]

