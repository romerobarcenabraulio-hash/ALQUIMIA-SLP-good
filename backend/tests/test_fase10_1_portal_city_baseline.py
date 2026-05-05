from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.city.router import router
from app.city.repository import baseline_for, journey_for
from pydantic import ValidationError

from app.city.schemas import CircularityBaseline, PortalEntry
from app.data.schemas import DataProvenance, FuenteTipo
from app.data.registry import DataRegistry


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/city")
    return TestClient(app)


def test_portal_entries_generate_distinct_journeys():
    city_journey = journey_for(PortalEntry.city_plan)
    org_journey = journey_for(PortalEntry.organization)

    assert city_journey[0].module_id == "city_baseline"
    assert org_journey[0].module_id == "organization_profile"
    assert city_journey[0].audience_mode == "city_team"
    assert org_journey[0].audience_mode == "organization"
    assert [s.module_id for s in city_journey] != [s.module_id for s in org_journey]
    assert any("residuos regulados" in s.decision for s in org_journey)
    blocked = next(s for s in org_journey if s.status == "blocked")
    assert blocked.blocker
    assert blocked.next_action


def test_decision_modules_expose_decision_evidence_status_and_next_action():
    modules = journey_for(PortalEntry.city_plan)

    assert len(modules) >= 6
    for module in modules:
        assert module.module_id
        assert module.label
        assert module.decision
        assert module.evidence
        assert module.status in {"ready", "blocked"}
        assert module.next_action


def test_audience_change_changes_modules_not_city_context_or_baseline_contract():
    client = _client()

    city_context = client.get("/city/SLP/context").json()
    baseline = client.get("/city/SLP/baseline").json()
    city_modules = client.get("/city/journey/steps?entry=city_plan").json()
    org_modules = client.get("/city/journey/steps?entry=organization").json()

    assert city_context["city_id"] == "SLP"
    assert baseline["city_id"] == "SLP"
    assert city_modules[0]["audience_mode"] == "city_team"
    assert org_modules[0]["audience_mode"] == "organization"
    assert {m["module_id"] for m in city_modules} != {m["module_id"] for m in org_modules}


def test_city_context_keeps_city_zm_and_municipal_legal_scopes_separate():
    res = _client().get("/city/SLP/context")

    assert res.status_code == 200
    payload = res.json()
    assert payload["geography_scope"] == "city_zm"
    assert payload["audience_mode"] == "city_team"
    assert "por municipio" in payload["legal_notice"]
    assert payload["municipios"]
    assert {m["legal_scope"] for m in payload["municipios"]} == {"municipio"}


def test_baseline_requires_source_confidence_uncertainty_and_is_not_official():
    res = _client().get("/city/SLP/baseline")

    assert res.status_code == 200
    payload = res.json()
    assert payload["rsu_scope"] == "rsu_municipal"
    assert payload["official_status"] == "estimated_not_official"
    assert payload["provenance"]["tipo"] == "estimado"
    assert payload["confidence"] > 0
    assert payload["uncertainty_pct_points"] > 0
    assert payload["warnings"]
    assert "no oficial" in " ".join(payload["warnings"]).lower()


def test_unknown_city_blocks_baseline_instead_of_reusing_previous_city():
    client = _client()

    ok = client.get("/city/SLP/baseline")
    blocked = client.get("/city/NOPE/baseline")

    assert ok.status_code == 200
    assert blocked.status_code == 404
    assert blocked.json()["detail"] != ok.json()["city_id"]


def test_changing_city_produces_city_specific_baseline():
    client = _client()

    slp = client.get("/city/SLP/baseline").json()
    qro = client.get("/city/QRO/baseline").json()

    assert slp["city_id"] == "SLP"
    assert qro["city_id"] == "QRO"
    assert slp["current_circularity_pct"] != qro["current_circularity_pct"]
    assert slp["city_name"] != qro["city_name"]


@pytest.mark.asyncio
async def test_baseline_repository_uses_snapshot_but_keeps_estimated_status():
    snapshot = await DataRegistry.instance().snapshot("MTY")
    baseline = baseline_for("MTY", snapshot)

    assert baseline is not None
    assert baseline.city_id == "MTY"
    assert baseline.rsu_total_ton_day_est > 0
    assert baseline.official_status == "estimated_not_official"
    assert baseline.provenance.tipo.value == "estimado"


def test_baseline_without_source_is_blocked_by_contract():
    with pytest.raises(ValidationError):
        CircularityBaseline(
            city_id="SLP",
            city_name="Zona Metropolitana de San Luis Potosi",
            current_circularity_pct=4.0,
            material_recovery_ton_day_est=40.0,
            rsu_total_ton_day_est=1000.0,
            confidence=0.4,
            uncertainty_pct_points=3.0,
            provenance=DataProvenance(
                tipo=FuenteTipo.estimado,
                fuente_nombre="",
                fuente_organismo="",
                confianza=0.4,
                requiere_clave_api=False,
            ),
            warnings=["Baseline estimada, no oficial."],
            interpretation="Baseline actual estimada.",
        )
