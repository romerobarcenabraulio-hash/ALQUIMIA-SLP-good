import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.implementation.router import router
from app.implementation.schemas import ImplementationSource, TerritorialPlanRequest
from app.implementation.territorial import build_territorial_implementation_plan


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/implementation")
    return TestClient(app)


def _source(confidence: float = 0.7) -> ImplementationSource:
    return ImplementationSource(
        source_id="territorial-test-source",
        name="Supuestos territoriales trazables",
        organization="ALQUIMIA QA",
        source_type="propuesta_tecnica_no_oficial",
        confidence=confidence,
        explanation="Fuente de prueba para plan territorial; no oficializa colonias.",
    )


def _request(**overrides) -> TerritorialPlanRequest:
    data = {
        "city_id": "SLP",
        "municipios": ["slp", "sol", "csp", "vip"],
        "horizon_years": 5,
        "start_month": 1,
        "current_capture_pct": 4,
        "target_capture_pct": 70,
        "rsu_total_ton_day": 1119.6,
        "available_capacity_ton_day": 900,
        "source": _source(),
    }
    data.update(overrides)
    return TerritorialPlanRequest(**data)


def test_planes_3_5_7_recalculan_calendario_y_zonas():
    plan3 = build_territorial_implementation_plan(_request(horizon_years=3))
    plan5 = build_territorial_implementation_plan(_request(horizon_years=5))
    plan7 = build_territorial_implementation_plan(_request(horizon_years=7))

    assert plan3.horizon_years == 3
    assert plan5.horizon_years == 5
    assert plan7.horizon_years == 7
    assert len(plan3.zones) == 3
    assert len(plan5.zones) == 4
    assert len(plan7.zones) == 4
    assert plan3.zones[0].end_month < plan7.zones[0].end_month


def test_cada_zona_tiene_municipio_colonias_trimestre_fase_y_razon():
    plan = build_territorial_implementation_plan(_request())

    assert plan.status in ("ready", "warning")
    for zone in plan.zones:
        assert zone.municipio_id
        assert zone.colonias
        assert zone.start_quarter.startswith("Anio")
        assert zone.phase_label
        assert zone.territorial_reason
        assert zone.help_text
        assert all(colony.municipio_id == zone.municipio_id for colony in zone.colonias)


def test_colonias_son_propuestas_no_oficiales():
    plan = build_territorial_implementation_plan(_request())

    assert plan.zones
    for zone in plan.zones:
        assert all(colony.official_status == "propuesta_no_oficial" for colony in zone.colonias)


def test_meta_incompatible_genera_warning_de_capacidad():
    plan = build_territorial_implementation_plan(
        _request(horizon_years=3, target_capture_pct=90, available_capacity_ton_day=100)
    )

    assert plan.status == "warning"
    joined = " ".join(plan.warnings).lower()
    assert "capacidad" in joined
    assert "3 anios" in joined
    assert any(zone.status == "condicionada" for zone in plan.zones)


def test_falta_dato_critico_bloquea_sin_zonas():
    plan = build_territorial_implementation_plan(_request(rsu_total_ton_day=0))

    assert plan.status == "blocked"
    assert plan.zones == []
    assert plan.blockers
    assert plan.next_action


def test_municipios_vacios_devuelven_bloqueo_de_dominio_no_422():
    response = _client().post(
        "/implementation/territorial-plan",
        json=_request(municipios=[]).model_dump(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["zones"] == []
    assert "municipio" in " ".join(payload["blockers"]).lower()
    assert payload["next_action"]


def test_resultados_incluyen_formula_fuente_unidad_ayuda_y_anexo():
    plan = build_territorial_implementation_plan(_request())

    assert plan.timeline_help_text
    assert plan.decision_help_text
    assert plan.calculation_annex
    for item in plan.calculation_annex:
        assert item.calculation_name
        assert item.formula
        assert item.unit
        assert item.source.source_id == "territorial-test-source"
        assert item.explanation


def test_no_mezcla_zm_como_municipio_ni_residuos_regulados():
    plan = build_territorial_implementation_plan(_request())

    assert plan.geography_scope == "city_zm"
    assert plan.legal_scope_note
    assert plan.rsu_scope == "rsu_municipal"
    assert all(zone.municipio_id != plan.city_id for zone in plan.zones)


def test_texto_no_toca_sanciones_multas_documentos_oficiales():
    plan = build_territorial_implementation_plan(_request())

    text = " ".join(
        [
            plan.timeline_help_text,
            plan.decision_help_text,
            plan.next_action,
            " ".join(plan.warnings),
            " ".join(zone.help_text for zone in plan.zones),
            " ".join(colony.reason for zone in plan.zones for colony in zone.colonias),
        ]
    ).lower()
    for forbidden in ("multa", "sancion", "infraccion", "documento oficial"):
        assert forbidden not in text


def test_endpoint_territorial_plan_observable():
    response = _client().post(
        "/implementation/territorial-plan",
        json=_request().model_dump(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["city_id"] == "SLP"
    assert payload["zones"]
    assert payload["calculation_annex"]
    assert payload["timeline_help_text"]
