"""§3 ObligationMatrix — giro × jurisdiction legal obligation checklist."""
from __future__ import annotations

from app.empresa.obligation_matrix import (
    FEDERAL_OBLIGATIONS,
    GIRO_OBLIGATIONS,
    STATE_OBLIGATIONS,
    get_obligations,
)


def test_federal_obligations_always_included():
    result = get_obligations("000000", "SLP")
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    for fed in FEDERAL_OBLIGATIONS:
        if fed["aplica_si_kg"] is None:
            assert fed["obligation_id"] in ids


def test_threshold_obligations_excluded_below_threshold():
    # Gran Generador obligations require ≥10,000 kg; 500 kg should exclude them
    result = get_obligations("000000", "SLP", kg_rsu_anual=500)
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "fed_lgpgir_plan_manejo" not in ids
    assert "fed_coa_semarnat" not in ids


def test_threshold_obligations_included_above_threshold():
    result = get_obligations("000000", "SLP", kg_rsu_anual=15_000)
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "fed_lgpgir_plan_manejo" in ids
    assert "fed_coa_semarnat" in ids


def test_giro_specific_obligation_restaurante():
    result = get_obligations("722511", "SLP")
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "giro_restaurante_aceite" in ids


def test_giro_specific_obligation_medico():
    result = get_obligations("621111", "SLP")
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "giro_medico_rpbi" in ids


def test_giro_specific_obligation_construccion():
    result = get_obligations("236110", "JAL")
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "giro_construccion_rcd" in ids


def test_state_slp_obligation_included():
    result = get_obligations("461110", "SLP", kg_rsu_anual=500)
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "slp_ley_ecologia" in ids


def test_state_slp_obligation_excluded_below_state_threshold():
    # SLP requires 400 kg/año threshold
    result = get_obligations("461110", "SLP", kg_rsu_anual=100)
    ids = {o["obligation_id"] for o in result["obligaciones"]}
    assert "slp_ley_ecologia" not in ids


def test_unknown_state_returns_only_federal_and_giro():
    result = get_obligations("461110", "ZZZ")
    # Should have federal + giro-specific (461110 has none), no state
    state_obs = [o for o in result["obligaciones"] if o["jurisdiccion"] == "estatal"]
    assert state_obs == []


def test_no_duplicate_obligations():
    result = get_obligations("722511", "SLP", kg_rsu_anual=15_000)
    ids = [o["obligation_id"] for o in result["obligaciones"]]
    assert len(ids) == len(set(ids))


def test_sorted_by_priority():
    result = get_obligations("722511", "SLP", kg_rsu_anual=15_000)
    priorities = [o["prioridad"] for o in result["obligaciones"]]
    assert priorities == sorted(priorities)


def test_result_structure():
    result = get_obligations("000000", "CDMX", kg_rsu_anual=1000)
    assert "obligaciones" in result
    assert "total" in result
    assert "prioridad_alta" in result
    assert "disclaimer" in result
    assert result["total"] == len(result["obligaciones"])
    assert result["prioridad_alta"] == sum(1 for o in result["obligaciones"] if o["prioridad"] == 1)


def test_each_obligation_has_required_fields():
    result = get_obligations("722511", "CDMX", kg_rsu_anual=5000)
    for ob in result["obligaciones"]:
        assert "obligation_id" in ob
        assert "norm" in ob
        assert "descripcion" in ob
        assert "jurisdiccion" in ob
        assert "cumplimiento" in ob
        assert isinstance(ob["cumplimiento"], list)
        assert len(ob["cumplimiento"]) >= 1
