"""
Router: /legal/*

Principio: Una ZM no es un municipio.
La autoridad legal vive municipio por municipio.

── Endpoints por municipio individual ──────────────────────────────────────────
GET  /legal/{municipio}/diagnostic          → LegalDiagnostic
GET  /legal/{municipio}/strategy            → ReformStrategyOutput
PUT  /legal/{municipio}/verificar           → marcar verificado (admin)
POST /legal/{municipio}/upload-pdf         → subir PDF y habilitar análisis

── Endpoints ZM-level (agregación + coordinación) ──────────────────────────────
GET  /legal/zm/{zm}/municipios              → List[LegalStatusHub]
GET  /legal/zm/{zm}/paquete                 → PaqueteMetropolitano (2 capas)

── Hub global ──────────────────────────────────────────────────────────────────
GET  /legal/hub                             → List[LegalStatusHub] (todos)
"""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile

from app.legal.diagnostic import build_diagnostic, build_municipal_legal_context
from app.legal.metropolitan import build_paquete_metropolitano
from app.legal.reform_strategy import select_strategy
from app.legal.regulatory_structure import (
    build_municipal_legal_insertion_map,
    reject_zm_normative_insertion,
)
from app.legal.repository import get_repo
from app.legal.zm_context import execute_zm_context
from app.legal.source_ingest import (
    ingest_municipal_legal_source,
    locate_municipal_legal_source,
    pdf_ingested_for_analysis,
    reject_zm_legal_source,
    upload_municipal_pdf_bytes,
)
from app.legal.schemas import (
    LegalPdfUploadResponse,
    LegalSourceIngestRequest,
    LegalVerificarRequest,
    LegalDiagnostic, LegalStatusHub, PaqueteMetropolitano,
    MunicipalLegalContext,
    MunicipalLegalInsertionMap,
    MunicipalLegalSourceManifest,
    Reglamento, ReformStrategyOutput,
)
from app.routers.auth import UserInfo, get_current_user

router = APIRouter()


def _to_hub(municipio_id: str) -> LegalStatusHub | None:
    diag = build_diagnostic(municipio_id)
    if diag is None:
        return None
    strat = select_strategy(diag)
    repo  = get_repo()
    return LegalStatusHub(
        municipio_id=municipio_id,
        municipio_nombre=repo.get_municipio_nombre(municipio_id),
        zm=diag.zm,
        score_legal=diag.score_legal,
        estrategia=strat.estrategia,
        plazo_meses=strat.plazo_meses,
        agora_bloqueado=diag.agora_bloqueado,
        brecha_critica=diag.brecha_critica,
        verificado=not diag.agora_bloqueado,
    )


# ─── Hub global ───────────────────────────────────────────────────────────────

@router.get("/hub", response_model=list[LegalStatusHub])
async def get_hub() -> list[LegalStatusHub]:
    """Vista resumen de todos los municipios (17) a través de las 3 ZMs."""
    repo   = get_repo()
    result = [h for m in repo.all_municipios() if (h := _to_hub(m)) is not None]
    return result


# ─── Por municipio individual ─────────────────────────────────────────────────

@router.get("/{municipio}/source-manifest", response_model=MunicipalLegalSourceManifest)
async def get_source_manifest(municipio: str) -> MunicipalLegalSourceManifest:
    from app.legal.dynamic_municipio import ensure_municipio_registered

    mid = municipio.lower()
    manifest = locate_municipal_legal_source(mid)
    if manifest is None:
        ensured = ensure_municipio_registered(municipio_id=mid)
        if ensured:
            manifest = locate_municipal_legal_source(ensured)
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"Municipio '{municipio}' no encontrado")
    return manifest


@router.post("/{municipio}/source-manifest", response_model=MunicipalLegalSourceManifest)
async def post_source_manifest(
    municipio: str,
    request: LegalSourceIngestRequest,
) -> MunicipalLegalSourceManifest:
    try:
        manifest = ingest_municipal_legal_source(municipio.lower(), request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"Municipio '{municipio}' no encontrado")
    return manifest


@router.post("/{municipio}/upload-pdf", response_model=LegalPdfUploadResponse)
async def upload_municipio_pdf(
    municipio: str,
    file: UploadFile = File(...),
) -> LegalPdfUploadResponse:
    """
    Sube el PDF del reglamento municipal.

    Regla de producto: sin PDF no hay análisis. Al cargar el archivo se habilita
    el municipio para diagnóstico y dispara la instantánea de análisis jurídico.
    """
    content_type = (file.content_type or "").lower()
    if content_type not in {"application/pdf", "application/octet-stream", "binary/octet-stream"}:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo PDF está vacío.")
    from app.legal.dynamic_municipio import ensure_municipio_registered

    ensure_municipio_registered(municipio_id=municipio.lower())
    try:
        manifest = upload_municipal_pdf_bytes(
            municipio.lower(),
            content,
            original_filename=file.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if manifest is None:
        raise HTTPException(status_code=404, detail=f"Municipio '{municipio}' no encontrado")

    diag = build_diagnostic(municipio.lower())
    if diag is None:
        raise HTTPException(status_code=500, detail="PDF cargado pero no se pudo generar diagnóstico.")

    habilitado = pdf_ingested_for_analysis(manifest) and not diag.agora_bloqueado
    return LegalPdfUploadResponse(
        ok=True,
        municipio_id=municipio.lower(),
        municipio_habilitado=habilitado,
        analysis_ready=habilitado,
        manifest=manifest,
        diagnostic=diag,
        message=(
            "PDF registrado. Análisis jurídico municipal habilitado."
            if habilitado
            else "PDF registrado, pero el municipio sigue bloqueado para análisis."
        ),
    )


@router.get("/{municipio}/diagnostic", response_model=LegalDiagnostic)
async def get_diagnostic(municipio: str) -> LegalDiagnostic:
    diag = build_diagnostic(municipio.lower())
    if diag is None:
        raise HTTPException(
            status_code=404,
            detail=f"No hay reglamento registrado para municipio '{municipio}'",
        )
    return diag


@router.get("/{municipio}/context", response_model=MunicipalLegalContext)
async def get_municipal_context(municipio: str) -> MunicipalLegalContext:
    context = build_municipal_legal_context(municipio.lower())
    if context is None:
        raise HTTPException(
            status_code=404,
            detail=f"No hay contexto legal municipal para municipio '{municipio}'",
        )
    return context


@router.get("/{municipio}/insertion-map", response_model=MunicipalLegalInsertionMap)
async def get_municipal_insertion_map(municipio: str) -> MunicipalLegalInsertionMap:
    insertion_map = build_municipal_legal_insertion_map(municipio.lower())
    if insertion_map is None:
        raise HTTPException(
            status_code=404,
            detail=f"No hay mapa de inserción normativa para municipio '{municipio}'",
        )
    return insertion_map


@router.get("/{municipio}/strategy", response_model=ReformStrategyOutput)
async def get_strategy(municipio: str) -> ReformStrategyOutput:
    diag = build_diagnostic(municipio.lower())
    if diag is None:
        raise HTTPException(status_code=404, detail=f"Municipio '{municipio}' no encontrado")
    return select_strategy(diag)


@router.put("/{municipio}/verificar")
async def verificar_reglamento(
    municipio: str,
    verificado: bool = True,
    payload: LegalVerificarRequest | None = Body(default=None),
    user: UserInfo = Depends(get_current_user),
) -> dict:
    """Marca bandera verificado en memoria tras revisión institucional (no auditoría persistente hasta ADR BD).

    Proceso humano esperado: persona con mandato registra revisión del reglamento frente al POE o fuente oficial,
    con evidencia mínima (URL, checksum, memo). ``justification`` y ``evidence_ref`` sirven sólo como nota manual
    de trazabilidad en la respuesta hasta existir libro de auditoría persistente enlazado a ``PUT`` y a
    ``can_enable_sanctions`` en el front.
    """
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede verificar reglamentos")
    ok = get_repo().set_verificado(municipio.lower(), verificado)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Municipio '{municipio}' no encontrado")
    out: dict = {
        "ok": True,
        "municipio": municipio.lower(),
        "verificado": verificado,
        "agora_bloqueado": not verificado,
    }
    if payload is not None:
        out["trace"] = {
            "has_justification": bool(payload.justification and payload.justification.strip()),
            "has_evidence_ref": bool(payload.evidence_ref and payload.evidence_ref.strip()),
        }
    return out


@router.post("/{municipio}/reglamento")
async def upsert_reglamento(
    municipio: str,
    reg: Reglamento,
    user: UserInfo = Depends(get_current_user),
) -> dict:
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede actualizar reglamentos")
    reg.municipio_id = municipio.lower()
    get_repo().upsert_reglamento(reg)
    return {"ok": True, "municipio": municipio.lower(), "version": reg.version}


# ─── ZM-level (agregación) ────────────────────────────────────────────────────

@router.get("/zm/{zm}/municipios", response_model=list[LegalStatusHub])
async def get_municipios_zm(zm: str) -> list[LegalStatusHub]:
    """Todos los municipios de una ZM con su status legal individual."""
    repo       = get_repo()
    municipios = repo.get_municipios_by_zm(zm.upper())
    if not municipios:
        raise HTTPException(status_code=404, detail=f"ZM '{zm}' no encontrada")
    return [h for m in municipios if (h := _to_hub(m)) is not None]


@router.get("/zm/{zm}/paquete", response_model=PaqueteMetropolitano)
async def get_paquete_zm(zm: str) -> PaqueteMetropolitano:
    """
    Paquete metropolitano en dos capas:
      1. paquete_municipal — diagnóstico individual por municipio
      2. paquete_metropolitano — coordinación regional (convenio marco, oleadas, etc.)
    """
    repo       = get_repo()
    municipios = repo.get_municipios_by_zm(zm.upper())
    if not municipios:
        raise HTTPException(status_code=404, detail=f"ZM '{zm}' no encontrada")
    return build_paquete_metropolitano(zm.upper(), municipios)


@router.get("/zm/{zm}/context")
def get_zm_context(zm: str) -> None:
    execute_zm_context(zm)


@router.get("/zm/{zm}/source-manifest")
async def get_zm_source_manifest(zm: str) -> dict:
    repo = get_repo()
    if not repo.get_municipios_by_zm(zm.upper()):
        raise HTTPException(status_code=404, detail=f"ZM '{zm}' no encontrada")
    zm_detail = reject_zm_legal_source(zm)
    if isinstance(zm_detail, dict):
        zm_detail = {
            **zm_detail,
            "reason": (
                "No se ingiere manifiesto legal a nivel único ZM (Navigator): los documentos locales se "
                "registran municipalmente; este 400 preserva ese alcance."
            ),
        }
    raise HTTPException(status_code=400, detail=zm_detail)


@router.get("/zm/{zm}/insertion-map")
async def get_zm_insertion_map(zm: str) -> dict:
    repo = get_repo()
    if not repo.get_municipios_by_zm(zm.upper()):
        raise HTTPException(status_code=404, detail=f"ZM '{zm}' no encontrada")
    ins_detail = reject_zm_normative_insertion(zm)
    if isinstance(ins_detail, dict):
        ins_detail = {
            **ins_detail,
            "reason": (
                "Inserción normativa sólo puede evaluarse por municipio activo en simulación; la ZM agrega "
                "coordinación, no texto reglamentario sustitutivo."
            ),
        }
    raise HTTPException(status_code=400, detail=ins_detail)
