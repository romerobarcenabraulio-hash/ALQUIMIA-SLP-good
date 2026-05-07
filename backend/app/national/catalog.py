"""Catalogo territorial nacional incremental."""
from __future__ import annotations

from copy import deepcopy
from typing import Dict, List, Optional

from app.legal.repository import MUNICIPIO_NOMBRES, ZM_MUNICIPIOS
from app.national.rsu_demographics_seed import (
    DEFAULT_GEN_PER_CAPITA_KG_DIA,
    DISPOSAL_CO2E_T_PER_T_RSU_DIA,
    demo_tuple,
    provenance_block,
)
from app.national.schemas import EstadoCatalog, MunicipioProfile, SourceStatus, ZonaMetropolitanaCatalog


ESTADOS: Dict[str, EstadoCatalog] = {
    "SLP": EstadoCatalog(estado_id="24", nombre="San Luis Potosi", abreviatura="SLP", region="Centro-Bajio"),
    "QRO": EstadoCatalog(estado_id="22", nombre="Queretaro", abreviatura="QRO", region="Centro-Bajio"),
    "NL": EstadoCatalog(estado_id="19", nombre="Nuevo Leon", abreviatura="NL", region="Noreste"),
    "JAL": EstadoCatalog(estado_id="14", nombre="Jalisco", abreviatura="JAL", region="Occidente"),
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
    "GDL": ZonaMetropolitanaCatalog(
        zm_id="GDL",
        nombre="Zona Metropolitana de Guadalajara",
        estado_principal="JAL",
        municipios=ZM_MUNICIPIOS["GDL"],
        fuente="Catalogo interno incremental; validar con fuentes oficiales y Navigator",
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
            demo = demo_tuple(municipio_id)
            poblacion = demo[0] if demo else None
            lat = demo[1] if demo else None
            lng = demo[2] if demo else None
            gen_pc = DEFAULT_GEN_PER_CAPITA_KG_DIA if demo else None
            rsu_td = (
                round((poblacion * gen_pc) / 1000.0, 2)
                if poblacion is not None and gen_pc is not None
                else None
            )
            co2e_d = (
                round(rsu_td * DISPOSAL_CO2E_T_PER_T_RSU_DIA, 4)
                if rsu_td is not None
                else None
            )
            base_prov = {
                "tipo": "estimado",
                "fuente": "catalogo_incremental_alquimia",
                "advertencia": "Completar con fuentes oficiales municipales/INEGI antes de documentar como verificado.",
            }
            merged_prov = {**base_prov, **provenance_block()} if demo else base_prov

            _PROFILE_SEEDS[municipio_id] = MunicipioProfile(
                municipio_id=municipio_id,
                clave_inegi=f"{ESTADOS[estado].estado_id}{inegi:03d}",
                nombre=MUNICIPIO_NOMBRES.get(municipio_id, municipio_id.upper()),
                estado=estado,
                zm_id=zm_id,
                poblacion=poblacion,
                viviendas=None,
                rsu_ton_dia=rsu_td,
                gen_per_capita=gen_pc,
                presupuesto_mxn=None,
                dependencia_responsable=None,
                concesion_status=SourceStatus.no_disponible,
                data_provenance=merged_prov,
                lat=lat,
                lng=lng,
                co2e_disposal_ton_dia=co2e_d,
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

