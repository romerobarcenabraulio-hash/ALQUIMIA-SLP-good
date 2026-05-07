"""Construye respuesta agregada para mapa RSU / huella aproximada (catálogo piloto)."""

from __future__ import annotations

from app.city.catalog_debt import CATALOG_SIMULATION_EPOCH
from app.national.catalog import get_profile, list_zm_municipios
from app.national.rsu_demographics_seed import DEFAULT_GEN_PER_CAPITA_KG_DIA, DISPOSAL_CO2E_T_PER_T_RSU_DIA
from app.national.schemas import RsuFootprintMapFeature, RsuFootprintMapResponse


def build_rsu_footprint_map_response() -> RsuFootprintMapResponse:
    features: list[RsuFootprintMapFeature] = []
    for zm_id in ("SLP", "QRO", "MTY", "GDL"):
        for municipio_id in list_zm_municipios(zm_id):
            p = get_profile(municipio_id)
            if (
                p is None
                or p.lat is None
                or p.lng is None
                or p.poblacion is None
                or p.rsu_ton_dia is None
            ):
                continue
            gen = float(p.gen_per_capita or DEFAULT_GEN_PER_CAPITA_KG_DIA)
            co2e = float(
                p.co2e_disposal_ton_dia
                if p.co2e_disposal_ton_dia is not None
                else p.rsu_ton_dia * DISPOSAL_CO2E_T_PER_T_RSU_DIA
            )
            features.append(
                RsuFootprintMapFeature(
                    municipio_id=p.municipio_id,
                    nombre=p.nombre,
                    estado=p.estado,
                    zm_id=p.zm_id,
                    poblacion=int(p.poblacion),
                    gen_per_capita_kg_dia=round(gen, 3),
                    rsu_ton_dia=float(p.rsu_ton_dia),
                    co2e_disposal_ton_dia=round(co2e, 5),
                    lat=float(p.lat),
                    lng=float(p.lng),
                )
            )

    features.sort(key=lambda f: f.municipio_id)

    methodology = (
        "Generación RSU diaria ≈ población × gen_per_capita (kg/hab/día) / 1000. "
        f"Huella orden de magnitud (disposición/gestión simplificada) ≈ rsu_ton_día × {DISPOSAL_CO2E_T_PER_T_RSU_DIA} "
        "t CO2e por t RSU (valor ilustrativo; no inventario GEI oficial)."
    )
    disclaimer = (
        "Vista piloto: municipios cargados en el catálogo ALQUIMIA (ZM SLP, QRO, Monterrey y Guadalajara). "
        "No representa todo México ni límites INEGI/MGN. Coordenadas y población son aproximaciones "
        "para educación y simulación — no para multas, obligaciones regulatorias ni reporting oficial."
    )

    return RsuFootprintMapResponse(
        catalog_simulation_epoch=CATALOG_SIMULATION_EPOCH,
        feature_count=len(features),
        features=features,
        methodology_summary=methodology,
        disclaimer=disclaimer,
    )
