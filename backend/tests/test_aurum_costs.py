"""Tests AURUM — estructura Decimal, HERMES consumer, indicadores, publisher KRONOS."""
from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from modules.planning.budget.cost_structure import (
    build_cost_structure,
    build_capex_lines,
    compute_non_quality_costs,
)
from modules.planning.budget.efficiency import (
    calculate_efficiency_indicators,
    semaforo_costo_ton,
    UMBRAL_COSTO_TON_MXN,
)
from modules.planning.budget.hermes_consumer import (
    aggregate_hermes_logistics,
    load_hermes_feed,
)
from modules.planning.budget.kronos_publisher import (
    build_ac_update,
    load_latest_ac_update,
    publish_ac_update,
)
from modules.planning.budget.pipeline import run_aurum_pipeline
from modules.planning.budget.schemas import HermesDailyFeed, NonQualityCosts, _d


def test_capex_uses_decimal_not_float():
    lines = build_capex_lines(n_recicladoras=2, ca_mix={"P": 1, "M": 0, "G": 0})
    for line in lines:
        assert isinstance(line.monto_mxn, Decimal)
    total = sum(line.monto_mxn for line in lines)
    assert isinstance(total, Decimal)


def test_capex_recicladoras_baseline():
    lines = build_capex_lines(n_recicladoras=5, ca_mix={"P": 0, "M": 0, "G": 0})
    recic = [l for l in lines if l.componente == "recicladoras"]
    assert len(recic) == 5
    assert recic[0].monto_mxn == _d("16200000")


def test_cost_structure_totals_are_decimal():
    structure = build_cost_structure("slp")
    assert isinstance(structure.capex_total, Decimal)
    assert isinstance(structure.opex_mensual_total, Decimal)
    assert structure.capex_total > Decimal("100000000")


def test_non_quality_costs_formula():
    nc = compute_non_quality_costs(
        peso_origen_ton=_d("10"),
        peso_recicladora_ton=_d("9.5"),
        ton_rechazadas=_d("0.2"),
        horas_inactivas=_d("4"),
        ton_no_valorizadas=_d("1"),
    )
    assert nc.merma_logistica == _d("0.5") * _d("2500")
    assert nc.total == (
        nc.merma_logistica
        + nc.rechazo_contaminacion
        + nc.tiempo_muerto_flota
        + nc.costo_relleno_evitable
    )


def test_semaforo_costo_ton_verde():
    assert semaforo_costo_ton(_d("800"), UMBRAL_COSTO_TON_MXN) == "VERDE"


def test_semaforo_costo_ton_amarillo():
    assert semaforo_costo_ton(_d("950"), UMBRAL_COSTO_TON_MXN) == "AMARILLO"


def test_semaforo_costo_ton_rojo():
    assert semaforo_costo_ton(_d("1100"), UMBRAL_COSTO_TON_MXN) == "ROJO"


def test_efficiency_indicators_regression():
    ind = calculate_efficiency_indicators(
        costo_logistico_total=_d("8500"),
        tonelaje_total=_d("10"),
        opex_mes=_d("278316"),
        viviendas_activas=224_000,
        capex_total=_d("150000000"),
        ebitda_anual=_d("85000000"),
        no_calidad=NonQualityCosts(
            merma_logistica=_d("1250"),
            rechazo_contaminacion=_d("360"),
            tiempo_muerto_flota=_d("740"),
            costo_relleno_evitable=_d("420"),
        ),
        ingreso_bruto=_d("361000000"),
    )
    assert ind.costo_por_tonelada == _d("850.00")
    assert ind.costo_por_vivienda == _d("1.24")
    assert ind.payback_simple_anios == _d("1.76")
    assert ind.semaforo_costo_ton == "VERDE"
    assert ind.alerta_roja_no_calidad is False


def test_alerta_roja_no_calidad():
    ind = calculate_efficiency_indicators(
        costo_logistico_total=_d("1000"),
        tonelaje_total=_d("1"),
        opex_mes=_d("100000"),
        viviendas_activas=1000,
        capex_total=_d("1000000"),
        ebitda_anual=_d("100000"),
        no_calidad=NonQualityCosts(
            merma_logistica=_d("30000000"),
            rechazo_contaminacion=Decimal("0"),
            tiempo_muerto_flota=Decimal("0"),
            costo_relleno_evitable=Decimal("0"),
        ),
        ingreso_bruto=_d("100000000"),
    )
    assert ind.alerta_roja_no_calidad is True


def test_load_hermes_feed_from_fixture():
    fixture = Path(__file__).resolve().parents[2] / "data" / "logistics" / "daily_summary" / "2026-05-22.json"
    if not fixture.is_file():
        pytest.skip("Fixture HERMES no disponible")
    feed = load_hermes_feed(fixture)
    assert feed is not None
    assert feed.municipio_id == "slp"
    assert isinstance(feed.costo_logistico, Decimal)
    assert feed.costo_logistico == _d("1034.7")


def test_aggregate_hermes_logistics():
    feeds = [
        HermesDailyFeed(
            date="2026-05-21",
            municipio_id="slp",
            costo_logistico=_d("1000"),
            km_totales=_d("20"),
            tonelaje_total=_d("5"),
            merma_logistica_pct=_d("2.5"),
            fuente="test",
        ),
        HermesDailyFeed(
            date="2026-05-22",
            municipio_id="slp",
            costo_logistico=_d("1034.7"),
            km_totales=_d("21.73"),
            tonelaje_total=_d("0"),
            merma_logistica_pct=_d("2.5"),
            fuente="test",
        ),
    ]
    agg = aggregate_hermes_logistics(feeds)
    assert agg["costo_logistico_total"] == _d("2034.7")
    assert agg["dias"] == _d("2")


def test_publish_ac_update(tmp_path, monkeypatch):
    monkeypatch.setattr("modules.planning.budget.kronos_publisher.costs_data_dir", lambda: tmp_path)
    structure = build_cost_structure("slp", fecha=date(2026, 5, 25))
    from modules.planning.budget.efficiency import indicators_from_structure

    ind = indicators_from_structure(
        structure,
        costo_logistico_acumulado=_d("5000"),
        tonelaje_acumulado=_d("10"),
    )
    payload = build_ac_update(
        structure,
        costo_logistico_acumulado=_d("5000"),
        hermes_dias=3,
        indicadores=ind,
    )
    path = publish_ac_update(payload)
    assert path.is_file()
    event = json.loads(path.read_text(encoding="utf-8"))
    assert event["topic"] == "alquimia/events/planning/ac_update"
    assert event["municipio_id"] == "slp"


def test_municipal_context_reads_polis_profile():
    from modules.planning.budget.municipal_context import load_municipal_params

    params = load_municipal_params("slp")
    assert params["fuente"].startswith("polis_profile:")
    assert params["viviendas_activas"] == 224_000
    assert params["ca_mix"] == {"P": 7, "M": 7, "G": 4}
    assert params["n_recicladoras"] == 5


def test_pipeline_end_to_end(tmp_path, monkeypatch):
    monkeypatch.setattr("modules.planning.budget.pipeline.costs_data_dir", lambda: tmp_path)
    monkeypatch.setattr(
        "modules.planning.budget.kronos_publisher.costs_data_dir",
        lambda: tmp_path,
    )
    monkeypatch.setattr(
        "modules.planning.budget.report_templates.reports_dir",
        lambda: tmp_path / "reports",
    )
    monkeypatch.setattr(
        "modules.planning.budget.report_templates.templates_dir",
        lambda: tmp_path / "reports" / "templates",
    )

    result = run_aurum_pipeline("slp", fecha=date(2026, 5, 25), lookback_days=30)
    assert result["ok"] is True
    assert result["ac_topic"] == "alquimia/events/planning/ac_update"
    assert "indicadores" in result
    assert (tmp_path / "ac_latest.json").is_file()
    assert (tmp_path / "cost_structure_latest.json").is_file()

    monkeypatch.setattr("modules.planning.budget.kronos_publisher.costs_data_dir", lambda: tmp_path)
    latest = load_latest_ac_update()
    assert latest is not None
    assert latest["topic"] == "alquimia/events/planning/ac_update"
