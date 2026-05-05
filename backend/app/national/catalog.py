"""Catalogo territorial nacional incremental."""
from __future__ import annotations

from copy import deepcopy
from typing import Dict, List, Optional

from app.legal.repository import MUNICIPIO_NOMBRES, ZM_MUNICIPIOS
from app.national.schemas import EstadoCatalog, MunicipioProfile, SourceStatus, ZonaMetropolitanaCatalog


ESTADOS: Dict[str, EstadoCatalog] = {
    "SLP": EstadoCatalog(estado_id="24", nombre="San Luis Potosi", abreviatura="SLP", region="Centro-Bajio"),
    "QRO": EstadoCatalog(estado_id="22", nombre="Queretaro", abreviatura="QRO", region="Centro-Bajio"),
    "NL": EstadoCatalog(estado_id="19", nombre="Nuevo Leon", abreviatura="NL", region="Noreste"),
}

ZM_CATALOG: Dict[str, ZonaMetropolitanaCatalog] = {
    "SLP": ZonaMetropolitanaCatalog(
        zm_id="SLP",
        nombre="Zona Metropolitana de San Luis Potosi",
        estado_principal="SLP",
        municipios=ZM_MUNICIPIOS["SLP"],
        fuente="Catalogo interno incremental; no usa documentos historicos SLP como verdad",
        status=SourceStatus.estimado,
    ),
    "QRO": ZonaMetropolitanaCatalog(
        zm_id="QRO",
        nombre="Zona Metropolitana de Queretaro",
        estado_principal="QRO",
        municipios=ZM_MUNICIPIOS["QRO"],
        fuente="Catalogo interno incremental",
        status=SourceStatus.estimado,
    ),
    "MTY": ZonaMetropolitanaCatalog(
        zm_id="MTY",
        nombre="Zona Metropolitana de Monterrey",
        estado_principal="NL",
        municipios=ZM_MUNICIPIOS["MTY"],
        fuente="Catalogo interno incremental",
        status=SourceStatus.estimado,
    ),
}

_PROFILE_SEEDS: Dict[str, MunicipioProfile] = {}


def _seed_profiles() -> None:
    if _PROFILE_SEEDS:
        return
    inegi = 1
    for zm_id, municipios in ZM_MUNICIPIOS.items():
        estado = ZM_CATALOG[zm_id].estado_principal
        for municipio_id in municipios:
            _PROFILE_SEEDS[municipio_id] = MunicipioProfile(
                municipio_id=municipio_id,
                clave_inegi=f"{ESTADOS[estado].estado_id}{inegi:03d}",
                nombre=MUNICIPIO_NOMBRES.get(municipio_id, municipio_id.upper()),
                estado=estado,
                zm_id=zm_id,
                poblacion=None,
                viviendas=None,
                rsu_ton_dia=None,
                gen_per_capita=None,
                presupuesto_mxn=None,
                dependencia_responsable=None,
                concesion_status=SourceStatus.no_disponible,
                data_provenance={
                    "tipo": "estimado",
                    "fuente": "catalogo_incremental_alquimia",
                    "advertencia": "Completar con fuentes oficiales municipales/INEGI antes de documentar como verificado.",
                },
            )
            inegi += 1


def list_estados() -> List[EstadoCatalog]:
    return deepcopy(list(ESTADOS.values()))


def get_zm(zm_id: str) -> Optional[ZonaMetropolitanaCatalog]:
    return deepcopy(ZM_CATALOG.get(zm_id.upper()))


def list_zm_municipios(zm_id: str) -> List[str]:
    zm = get_zm(zm_id)
    return list(zm.municipios) if zm else []


def get_profile(municipio_id: str) -> Optional[MunicipioProfile]:
    _seed_profiles()
    return deepcopy(_PROFILE_SEEDS.get(municipio_id.lower()))


def add_or_update_profile(profile: MunicipioProfile) -> MunicipioProfile:
    _seed_profiles()
    _PROFILE_SEEDS[profile.municipio_id.lower()] = profile
    if profile.zm_id.upper() not in ZM_CATALOG:
        ZM_CATALOG[profile.zm_id.upper()] = ZonaMetropolitanaCatalog(
            zm_id=profile.zm_id.upper(),
            nombre=f"Region {profile.zm_id.upper()}",
            estado_principal=profile.estado,
            municipios=[profile.municipio_id.lower()],
            fuente="alta_usuario",
            status=SourceStatus.estimado,
        )
    elif profile.municipio_id.lower() not in ZM_CATALOG[profile.zm_id.upper()].municipios:
        ZM_CATALOG[profile.zm_id.upper()].municipios.append(profile.municipio_id.lower())
    return deepcopy(profile)

