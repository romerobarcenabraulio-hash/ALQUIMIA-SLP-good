"""Respuesta API mapa calor circularidad ZM (Q-025) — geometría proxy + temática simulada."""

from __future__ import annotations

from typing import Any, Dict, List

from app.city.catalog_debt import CATALOG_SIMULATION_EPOCH
from app.national.catalog import list_zm_municipios
from app.national.schemas import CircularityHeatmapResponse
from app.national.slp_circularity_grid import (
    build_slp_zm_circularity_grid_features,
    sort_features_nearest_city,
)


def build_circularity_heatmap_response(zm_id: str) -> CircularityHeatmapResponse:
    zmu = zm_id.upper()
    methodology = (
        "% circularidad (actual vs proyectado) generados por función determinística sobre "
        "`cve_geoestadistica_proxy` para variación espacial educativa; no encuestas hogares ni balances municipales reales. "
        "Mejoras de escenario proyectadas son orden de magnitud del simulador ALQUIMIA."
    )
    base_disclaimer = (
        "Capa temática SIMULACIÓN — no inventario oficial ni medición en campo. "
        "Ámbito Zona Metropolitana (coordination); cada municipio conserva autoridad propia — "
        "esta vista no sustituye actos municipales ni límites político-administrativos (INEGI MG)."
    )

    if zmu != "SLP":
        return CircularityHeatmapResponse(
            catalog_simulation_epoch=CATALOG_SIMULATION_EPOCH,
            zm_id=zmu,
            version_mgn=None,
            geometry_storage_crs="EPSG:4326",
            metric_calculation_crs_note="Métricas de superficie/distancia en SLP deben usar EPSG:6369; esta respuesta no incluye áreas.",
            geometry_source="none_zm_not_implemented",
            geometry_note=(
                f"Q-025 piloto: rejilla proxy tipo AGEB solo implementada para zm_id=SLP; "
                f"solicitaste {zmu} sin geometría servida."
            ),
            jurisdiction_scope="MetropolitanZone",
            disclaimer=(
                base_disclaimer + " No hay polígonos servidos para esta ZM en esta versión."
            ),
            methodology_summary=methodology,
            feature_count=0,
            geojson=({"type": "FeatureCollection", "features": []}),
        )

    municipios = list_zm_municipios(zmu)
    raw_features: List[Dict[str, Any]] = build_slp_zm_circularity_grid_features(municipios)
    features = sort_features_nearest_city(raw_features)

    geojson: Dict[str, Any] = {"type": "FeatureCollection", "features": features}

    return CircularityHeatmapResponse(
        catalog_simulation_epoch=CATALOG_SIMULATION_EPOCH,
        zm_id=zmu,
        version_mgn=None,
        geometry_storage_crs="EPSG:4326",
        metric_calculation_crs_note=(
            "Polígonos almacenados en WGS84 (EPSG:4326). Para áreas/distancias en territorio SLP usar EPSG:6369 en pipeline futuro."
        ),
        geometry_source="alquimia_grid_proxy_pending_mgn_inegi_ageb",
        geometry_note=(
            "Los polígonos son una rejilla rectangular proxy por municipio para UX Mapbox; "
            "deben sustituirse por capa AGEB urbana del Marco Geoestadístico Nacional INEGI con "
            "version_mgn y CVE geoestadísticos oficiales antes de comunicar granularidad 'AGEB real'."
        ),
        jurisdiction_scope="MetropolitanZone",
        disclaimer=(
            base_disclaimer
            + " Geometría NO es AGEB INEGI hasta ingestión MGN. Claves `cve_geoestadistica_proxy` no son tablas censales."
        ),
        methodology_summary=methodology,
        feature_count=len(features),
        geojson=geojson,
    )
