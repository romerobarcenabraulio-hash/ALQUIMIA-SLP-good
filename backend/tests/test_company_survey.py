"""§2 Company survey — per-giro question bank + deterministic estimation engine."""
from __future__ import annotations

import pytest

from app.empresa.company_survey import (
    GIRO_CATALOG,
    GIRO_QUESTION_BANK,
    estimate_generation,
    get_questions,
)


def test_giro_catalog_has_required_sectors():
    required = {"722511", "721111", "461110", "621111", "611111", "236110", "432210", "000000"}
    assert required.issubset(GIRO_CATALOG)


def test_giro_catalog_compositions_sum_to_one():
    for code, giro in GIRO_CATALOG.items():
        total = sum(giro["composicion"].values())
        assert abs(total - 1.0) <= 0.02, f"Composición de {code} suma {total}"


def test_every_giro_has_question_bank():
    for code in GIRO_CATALOG:
        qs = get_questions(code)
        assert len(qs) >= 1, f"Giro {code} sin preguntas"


def test_questions_have_required_fields():
    for code, questions in GIRO_QUESTION_BANK.items():
        for q in questions:
            assert "pregunta_id" in q, f"{code}: falta pregunta_id"
            assert "texto" in q, f"{code}: falta texto"
            assert "tipo" in q, f"{code}: falta tipo"
            assert "obligatoria" in q, f"{code}: falta obligatoria"


def test_unknown_giro_falls_back_to_generic():
    qs = get_questions("999999")
    assert qs == get_questions("000000")


# --- estimate_generation ---

def test_restaurante_estimation():
    result = estimate_generation("722511", {"cubiertos_por_dia": 100})
    # 100 cubiertos × 182.5 kg = 18,250 kg/año
    assert result["kg_rsu_anual"] == pytest.approx(18250.0, rel=0.01)
    assert result["ton_rsu_anual"] == pytest.approx(18.25, rel=0.01)
    assert result["semaforo"] == "ROJO"  # ≥ 10 ton → gran generador
    assert result["gran_generador_advisory"] is not None
    assert "organico" in result["composicion_kg"]
    assert result["driver_field"] == "cubiertos_por_dia"
    assert result["driver_value"] == 100.0


def test_hotel_adjusts_for_occupancy():
    result_full = estimate_generation("721111", {"habitaciones": 100, "ocupacion_promedio_pct": 100})
    result_half = estimate_generation("721111", {"habitaciones": 100, "ocupacion_promedio_pct": 50})
    assert result_full["kg_rsu_anual"] == pytest.approx(result_half["kg_rsu_anual"] * 2, rel=0.01)


def test_hotel_default_occupancy_applied():
    result_explicit = estimate_generation("721111", {"habitaciones": 50, "ocupacion_promedio_pct": 65})
    result_default = estimate_generation("721111", {"habitaciones": 50})
    assert result_explicit["kg_rsu_anual"] == pytest.approx(result_default["kg_rsu_anual"], rel=0.01)


def test_small_business_semaforo_verde():
    # 2 empleados × 120 kg = 240 kg < 400 kg threshold
    result = estimate_generation("000000", {"empleados": 2})
    assert result["semaforo"] == "VERDE"
    assert result["gran_generador_advisory"] is None


def test_medium_business_semaforo_amarillo():
    # ~5 empleados × 120 = 600 kg → AMARILLO (≥400, <10000)
    result = estimate_generation("000000", {"empleados": 5})
    assert result["semaforo"] == "AMARILLO"


def test_estimation_includes_provenance():
    result = estimate_generation("461110", {"m2_piso_venta": 200})
    p = result["provenance"]
    assert p["metodo"] == "factor_por_unidad_determinista"
    assert "fuente_factor" in p
    assert "factor_aplicado_kg_por_unidad" in p
    assert result["disclaimer"] != ""


def test_zero_driver_value_returns_zero():
    result = estimate_generation("722511", {"cubiertos_por_dia": 0})
    assert result["kg_rsu_anual"] == 0.0
    assert result["ton_rsu_anual"] == 0.0


def test_unknown_giro_uses_empleados_fallback():
    result = estimate_generation("999999", {"empleados": 10})
    assert result["giro_codigo"] == "000000"
    assert result["kg_rsu_anual"] == pytest.approx(1200.0, rel=0.01)
