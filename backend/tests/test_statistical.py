"""Tests modelos estadísticos — sin BD ni APIs."""
from app.statistical.io_multipliers import derrama_multiplier
from app.statistical.monte_carlo import run_monte_carlo
from app.statistical.pert_analysis import analyze_pert
from app.statistical.schemas import MonteCarloRequest, PertAnalysisRequest, PertTaskInput


def test_pert_expected_and_variance():
    res = analyze_pert(PertAnalysisRequest(
        tareas=[
            PertTaskInput(id="t1", optimista_dias=5, probable_dias=10, pesimista_dias=20),
        ],
        tareas_criticas_ids=["t1"],
    ))
    assert res.tareas[0].esperado_dias == 10.83
    assert res.varianza_proyecto > 0
    assert res.ic90_proyecto_alto > res.duracion_proyecto_esperada


def test_monte_carlo_percentiles_ordered():
    res = run_monte_carlo(MonteCarloRequest(
        iteraciones=1000,
        usar_price_series_db=False,
        toneladas_anuales_base=50_000,
    ))
    assert res.ingreso_anual_mxn.p10 <= res.ingreso_anual_mxn.p50 <= res.ingreso_anual_mxn.p90


def test_io_multiplier_above_one():
    d = derrama_multiplier(100)
    assert d["multiplicador_total"] > 1.0
    assert d["empleos_indirectos"] > 0
