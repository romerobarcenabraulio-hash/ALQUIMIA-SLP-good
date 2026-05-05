"""Endpoints nacionales de Fase 8."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.national.catalog import get_profile, get_zm, list_estados, list_zm_municipios
from app.national.coverage import coverage_for_municipio, coverage_for_zm, legal_source_for_municipio
from app.national.legal_ingest import upsert_municipio_profile
from app.national.schemas import CoverageStatus, EstadoCatalog, LegalSource, MunicipioProfile


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

