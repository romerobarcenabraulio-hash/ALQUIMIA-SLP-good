"""Endpoints nacionales de Fase 8."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException

from app.national.catalog import get_profile, get_zm, list_estados, list_zm_municipios
from app.national.coverage import coverage_for_municipio, coverage_for_zm, legal_source_for_municipio
from app.national.legal_ingest import upsert_municipio_profile
from app.national.circularity_heatmap import build_circularity_heatmap_response
from app.national.rsu_footprint_map import build_rsu_footprint_map_response
from app.national.schemas import (
    CircularityHeatmapResponse,
    CoverageStatus,
    EstadoCatalog,
    LegalSource,
    MunicipioProfile,
    RsuFootprintMapResponse,
)


router = APIRouter()


@router.get("/estados", response_model=list[EstadoCatalog])
def estados():
    return list_estados()


@router.get("/zm/{zm_id}/municipios", response_model=list[MunicipioProfile])
def municipios_zm(zm_id: str):
    zm = get_zm(zm_id)
    if zm is None:
        raise HTTPException(status_code=404, detail=f"ZM no encontrada: {zm_id}")
    return [p for m in list_zm_municipios(zm_id) if (p := get_profile(m)) is not None]


@router.get("/municipios/{municipio_id}/profile", response_model=MunicipioProfile)
def municipio_profile(municipio_id: str):
    profile = get_profile(municipio_id)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Municipio no encontrado: {municipio_id}")
    return profile


@router.post("/municipios", response_model=MunicipioProfile)
def create_or_update_profile(profile: MunicipioProfile):
    return upsert_municipio_profile(profile)


@router.get("/municipios/{municipio_id}/coverage", response_model=CoverageStatus)
def municipio_coverage(municipio_id: str):
    return coverage_for_municipio(municipio_id)


@router.get("/legal/municipios/{municipio_id}/sources", response_model=list[LegalSource])
def municipio_legal_sources(municipio_id: str):
    source = legal_source_for_municipio(municipio_id)
    return [source] if source else []


@router.post("/legal/municipios/{municipio_id}/verify", response_model=CoverageStatus)
def verify_municipio_legal(municipio_id: str):
    from app.legal.repository import get_repo

    ok = get_repo().set_verificado(municipio_id.lower(), True)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Municipio no encontrado: {municipio_id}")
    return coverage_for_municipio(municipio_id)


@router.get("/legal/zm/{zm_id}/coverage", response_model=list[CoverageStatus])
def zm_legal_coverage(zm_id: str):
    if get_zm(zm_id) is None:
        raise HTTPException(status_code=404, detail=f"ZM no encontrada: {zm_id}")
    return coverage_for_zm(zm_id)


@router.get("/map/rsu-footprint", response_model=RsuFootprintMapResponse)
def rsu_footprint_map():
    """GeoJSON-friendly payload para mapa RSU (piloto catálogo ALQUIMIA)."""
    return build_rsu_footprint_map_response()


@router.get("/map/zm/{zm_id}/circularity-heatmap", response_model=CircularityHeatmapResponse)
def circularity_heatmap_zm(zm_id: str):
    """Mapa calor circularidad (simulador) sobre rejilla proxy — ZM SLP piloto Q-025."""
    return build_circularity_heatmap_response(zm_id)


@router.get("/municipios/{municipio_id}/pdf-ejecutivo")
def municipio_pdf_ejecutivo(municipio_id: str):
    """PDF ejecutivo municipal — diagnóstico RSU con procedencia por cifra (ALQ-15)."""
    from fastapi.responses import Response  # noqa: PLC0415
    from app.national.pdf_ejecutivo import build_pdf_ejecutivo_municipal  # noqa: PLC0415

    profile = get_profile(municipio_id)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Municipio no encontrado: {municipio_id}")

    coverage = coverage_for_municipio(municipio_id)

    pdf_bytes, err = build_pdf_ejecutivo_municipal(profile, coverage)
    if err or not pdf_bytes:
        raise HTTPException(status_code=500, detail=err or "Error generando PDF")

    filename = f"ALQUIMIA_RSU_{municipio_id}_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _date_today() -> str:
    from datetime import date
    return date.today().isoformat()

