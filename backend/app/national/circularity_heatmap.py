"""Respuesta API mapa calor circularidad ZM (Q-025) — geometría proxy + temática simulada."""

from __future__ import annotations

from typing import Any, Dict, List

from app.city.catalog_debt import CATALOG_SIMULATION_EPOCH
from app.national.catalog import get_zm, list_zm_municipios
from app.national.schemas import CircularityHeatmapResponse
from app.national.zm_circularity_grid import (
    build_zm_circularity_grid_features,
    sort_features_nearest_ref,
    zm_reference_point,
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

    if get_zm(zmu) is None:
        return CircularityHeatmapResponse(
            catalog_simulation_epoch=CATALOG_SIMULATION_EPOCH,
            zm_id=zmu,
            version_mgn=None,
            geometry_storage_crs="EPSG:4326",
            metric_calculation_crs_note=(
                "Métricas de superficie/distancia en territorio MX (ZM centro-norte) deben usar EPSG:6369; "
                "esta respuesta no incluye áreas calculadas."
            ),
            geometry_source="none_unknown_zm",
            geometry_note=f"ZM `{zmu}` no está en el catálogo ALQUIMIA.",
            jurisdiction_scope="MetropolitanZone",
            disclaimer=base_disclaimer + " Sin geometría: ZM desconocida.",
            methodology_summary=methodology,
            feature_count=0,
            geojson={"type": "FeatureCollection", "features": []},
        )

    municipios = list_zm_municipios(zmu)
    raw_features: List[Dict[str, Any]] = build_zm_circularity_grid_features(zmu, municipios)
    ref_lat, ref_lng = zm_reference_point(municipios)
    features = sort_features_nearest_ref(raw_features, ref_lat, ref_lng)
    geojson: Dict[str, Any] = {"type": "FeatureCollection", "features": features}

    return CircularityHeatmapResponse(
        catalog_simulation_epoch=CATALOG_SIMULATION_EPOCH,
        zm_id=zmu,
        version_mgn=None,
        geometry_storage_crs="EPSG:4326",
        metric_calculation_crs_note=(
            "Polígonos en WGS84 (EPSG:4326). Para áreas/distancias métricas en SLP, NL, QRO o JAL usar EPSG:6369 "
            "(Navigator); esta respuesta no computa superficies."
        ),
        geometry_source="alquimia_grid_proxy_pending_mgn_inegi_ageb",
        geometry_note=(
            "Los polígonos son rejilla rectangular proxy por municipio (todas las ZM sembradas en catálogo); "
            "sustituir por AGEB MGN INEGI con version_mgn antes de declarar granularidad geoestadística oficial."
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
