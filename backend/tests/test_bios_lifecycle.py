"""Tests módulo BIOS — LCA, activos, financiero, sensibilidad."""
from datetime import date
from pathlib import Path

import pytest

from modules.lifecycle.asset_registry import (
    AssetInventory,
    AssetRecord,
    enrich_inventory,
    load_inventory,
    replacement_alerts,
    save_inventory,
)
from modules.lifecycle.co2e_engine import build_co2e_report, calcular_co2e
from modules.lifecycle.financial_model import calcular_ciclo_financiero, calcular_valor_terminal
from modules.lifecycle.lca_factors import load_lca_factors
from modules.lifecycle.pipeline import run_bios_pipeline
from modules.lifecycle.sensitivity import run_sensitivity


def test_lca_factors_have_documented_sources():
    catalog = load_lca_factors()
    assert len(catalog.factores) >= 5
    for f in catalog.factores:
        assert f.fuente
        assert f.anio_referencia >= 2020
        assert f.co2e_evitado_ton > 0


def test_co2e_calculation_by_fraction():
    report = calcular_co2e(
        {"pet": 100.0, "aluminio": 10.0},
        periodo="2026-05",
        fuente_tonelaje="test",
        hermes_disponible=False,
    )
    assert report.co2e_total_ton == pytest.approx(100 * 1.5 + 10 * 9.0)
    assert len(report.por_fraccion) == 2


def test_co2e_report_with_hermes_zero_uses_fallback():
    report = build_co2e_report(use_scenario_fallback=True)
    assert report.co2e_total_ton > 0
    assert report.fuente_tonelaje in {"modelo_BASED_escenario_base", "hermes_kpi_calculator"}


def test_asset_inventory_structure(tmp_path, monkeypatch):
    inv_path = tmp_path / "inventory.json"
    monkeypatch.setattr("modules.lifecycle.asset_registry.inventory_path", lambda: inv_path)
    inv = load_inventory()
    assert "infraestructura_civil" in inv.referencia_vida_util
    assert inv.assets == []


def test_asset_rul_and_alerts(tmp_path, monkeypatch):
    inv_path = tmp_path / "inventory.json"
    monkeypatch.setattr("modules.lifecycle.asset_registry.inventory_path", lambda: inv_path)
    inv = AssetInventory(
        actualizado=date.today().isoformat(),
        referencia_vida_util={"flota": 8},
        assets=[
            AssetRecord(
                asset_id="CAM-001",
                categoria="flota",
                nombre="Camión recolector",
                fecha_adquisicion=date(2018, 1, 1),
                vida_util_anios=8,
            )
        ],
    )
    save_inventory(inv)
    alerts = replacement_alerts(enrich_inventory(inv))
    assert any(a["nivel"] in {"AMARILLO", "ROJO"} for a in alerts)


def test_financial_lifecycle_modelo_based():
    result = calcular_ciclo_financiero()
    assert result["horizonte_anios"] == 10
    assert result["vpn_mxn"] != 0
    assert result["tir_pct"] > 0
    assert result["valor_terminal_mxn"] > 0
    assert result["supuestos"]["fuente"] == "Modelo_BASED.xlsx"


def test_terminal_value_gordon_growth():
    tv = calcular_valor_terminal(1_000_000, 0.20, 0.02)
    assert tv == pytest.approx(1_020_000 / 0.18)


def test_sensitivity_four_variables():
    report = run_sensitivity()
    assert len(report["variables"]) == 4
    assert len(report["escenarios"]) == 12
    vars_seen = {e["variable"] for e in report["escenarios"]}
    assert vars_seen == set(report["variables"])


def test_bios_pipeline_persists_artifacts(tmp_path, monkeypatch):
    env = tmp_path / "environmental"
    assets = tmp_path / "assets"
    lifecycle = tmp_path / "lifecycle"
    env.mkdir()
    assets.mkdir()
    lifecycle.mkdir()

    monkeypatch.setattr("modules.lifecycle.paths.environmental_dir", lambda: env)
    monkeypatch.setattr("modules.lifecycle.paths.assets_dir", lambda: assets)
    monkeypatch.setattr("modules.lifecycle.paths.lifecycle_dir", lambda: lifecycle)
    monkeypatch.setattr(
        "modules.lifecycle.lca_factors.lca_factors_path",
        lambda: env / "lca_factors.json",
    )
    monkeypatch.setattr(
        "modules.lifecycle.co2e_engine.co2e_latest_path",
        lambda: env / "co2e_latest.json",
    )
    monkeypatch.setattr(
        "modules.lifecycle.asset_registry.inventory_path",
        lambda: assets / "inventory.json",
    )
    monkeypatch.setattr(
        "modules.lifecycle.paths.financial_latest_path",
        lambda: lifecycle / "financial_latest.json",
    )
    monkeypatch.setattr(
        "modules.lifecycle.paths.sensitivity_latest_path",
        lambda: lifecycle / "sensitivity_latest.json",
    )

    result = run_bios_pipeline()
    assert (env / "co2e_latest.json").is_file()
    assert (lifecycle / "financial_latest.json").is_file()
    assert (lifecycle / "sensitivity_latest.json").is_file()
    assert result["co2e"]["co2e_total_ton"] > 0
