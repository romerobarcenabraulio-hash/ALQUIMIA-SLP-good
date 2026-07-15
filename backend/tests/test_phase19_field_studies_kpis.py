import json
from pathlib import Path

from app.automation.field_studies import (
    FIELD_STUDIES,
    GATE_FIELD_STUDY_REQUIREMENTS,
    M00B_HERMES_PIPELINE,
    MODULE_DEFENSIBILITY_RULES,
    WAVE_ONE_KPIS,
    gate_gap_summary,
    kpi_contracts,
)


def test_phase19_defines_six_field_study_contracts_with_gate_cost_owner_and_evidence():
    assert set(FIELD_STUDIES) == {
        "estudio_cuarteo",
        "estudio_rutas",
        "censo_pepenadores",
        "auditoria_infraestructura",
        "estudio_juridico",
        "estudio_psp",
    }
    for study in FIELD_STUDIES.values():
        assert study["estimated_cost_mxn"]["min"] > 0
        assert study["responsible"]
        assert study["estimated_duration"]
        assert study["gate"] in {"G1", "G2"}
        assert study["criticality"] in {"critico", "recomendado", "opcional"}
        assert study["evidence_required"]
        assert study["schema"]


def test_phase19_gate_gap_summary_marks_missing_local_study_as_gap_not_truth():
    gaps = gate_gap_summary(set(), "G1")
    assert {gap["study_id"] for gap in gaps} == {"estudio_cuarteo", "censo_pepenadores", "estudio_juridico"}
    assert all(gap["status"] == "brecha_critica" for gap in gaps)
    assert all("No convertir benchmark en verdad municipal" in gap["message"] for gap in gaps)

    g2_gaps = gate_gap_summary({"estudio_rutas", "auditoria_infraestructura"}, "G2")
    assert g2_gaps == [
        {
            "study_id": "estudio_psp",
            "gate": "G2",
            "criticality": "recomendado",
            "status": "brecha_recomendada",
            "message": "Falta estudio local: Estudio de aceptación a pago por servicio / PSP. No convertir benchmark en verdad municipal.",
            "evidence_required": FIELD_STUDIES["estudio_psp"]["evidence_required"],
        }
    ]


def test_phase19_m00b_pipeline_declares_sources_confidence_fallback_and_forbidden_inference():
    assert len(M00B_HERMES_PIPELINE) >= 8
    for step in M00B_HERMES_PIPELINE:
        assert step["sources"]
        assert step["method"]
        assert step["confidence"] in {"verified_official", "verified_secondary", "inferred", "manual_required"}
        assert step["fallback"] == "manual_required"
        assert "must_not_infer" in step
    cabildo = next(step for step in M00B_HERMES_PIPELINE if step["field_group"] == "cabildo")
    assert "partido_como_variable_aprendible" in cabildo["must_not_infer"]


def test_phase19_wave_one_kpis_are_contracts_with_standard_source_module_and_gate():
    contracts = kpi_contracts()
    assert {kpi["kpi_id"] for kpi in contracts} == set(WAVE_ONE_KPIS)
    for kpi in contracts:
        assert kpi["definition"]
        assert kpi["formula"]
        assert kpi["required_source"]
        assert kpi["confidence"] == "missing_local_study_until_evidence"
        assert kpi["module_id"] in {
            "city_baseline",
            "capacidad_institucional",
            "logistica",
            "infraestructura",
            "social_diagnostico",
        }
        assert kpi["gate"] in {"G1", "G2"}


def test_phase19_registry_and_standards_include_wave_one_without_creating_local_values():
    registry = json.loads((Path(__file__).resolve().parents[2] / "docs" / "architecture" / "capability_registry.json").read_text())
    modules = {module["module_id"]: module for module in registry["modules"]}
    assert registry["phase19"]["no_local_study_policy"] == "show_critical_gap_not_municipal_truth"
    assert "technical_defensibility_rule" in modules["city_baseline"]
    assert "technical_defensibility_rule" in modules["marco_legal"]
    assert any(cap["capability_id"] == "kpi_sdg_11_6_1" for cap in modules["city_baseline"]["sub_capabilities"])
    assert any(cap["capability_id"] == "kpi_gri_302_1_energia" for cap in modules["logistica"]["sub_capabilities"])
    assert all(
        cap.get("confidence_until_evidence") == "missing_local_study_until_evidence"
        for module in modules.values()
        for cap in module.get("sub_capabilities", [])
        if cap.get("type") == "kpi_wave_one"
    )

    standards = json.loads((Path(__file__).resolve().parents[2] / "docs" / "architecture" / "standards_map.json").read_text())
    standards_by_module = {module["module_id"]: {s["code"] for s in module.get("standards", [])} for module in standards["modules"]}
    assert "SDG 11.6.1" in standards_by_module["M01"]
    assert "Wasteaware ISWM Benchmark Indicators" in standards_by_module["M01"]
    assert "GRI 302-1" in standards_by_module["M08"]
    assert "GRI 303-2" in standards_by_module["M06"]
    assert "GRI 408-1" in standards_by_module["M02C"]


def test_phase19_modules_distinguish_benchmark_inference_and_local_study():
    required_modules = {"city_baseline", "marco_legal", "infraestructura", "logistica", "costos_programa", "esquema_concesion", "escenarios_financieros"}
    assert required_modules.issubset(MODULE_DEFENSIBILITY_RULES)
    assert "benchmark" in MODULE_DEFENSIBILITY_RULES["city_baseline"]
    assert "no dictamen" in MODULE_DEFENSIBILITY_RULES["marco_legal"]
