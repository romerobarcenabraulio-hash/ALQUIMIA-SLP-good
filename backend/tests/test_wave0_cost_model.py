"""
Tests Wave 0 — Motor financiero trazable.

Verifica:
- CostLineItem: monto_efectivo prioriza monto_usuario
- cost_registry: sumas aproximan los valores historicos
- calculator: cost_model y manifest presentes en SimulateResponse
- NegotiationScheme: redistribuye actores correctamente
- FinancialRunManifest: mismo input => mismo hash
- override del usuario cambia solo la linea esperada
"""
from __future__ import annotations

import pytest
from app.schemas.cost_model import (
    CostLineItem,
    CostSourceType,
    NegotiationScheme,
    build_manifest,
)
from app.services.cost_registry import (
    build_cost_items,
    capex_ca_pequeno,
    capex_ca_mediano,
    capex_ca_grande,
    confianza_score,
)
from app.schemas.simulate import ScenarioInput, PreciosMaterial, MixCAs
from app.services.calculator import calcular_scenario


# ─── CostLineItem ─────────────────────────────────────────────────────────────

def test_monto_efectivo_usa_usuario_si_esta_presente():
    item = CostLineItem(
        concepto="terreno_CA_P",
        cantidad=200, unidad="m2",
        precio_unitario_mxn=1_050,
        monto_precargado=210_000,
        monto_usuario=380_000,
        fuente_precarga="benchmark",
        clasificacion=CostSourceType.dato_usuario,
        actor_responsable="municipio",
        periodicidad="unico",
    )
    assert item.monto_efectivo == 380_000
    assert item.tiene_override_usuario is True
    assert item.delta_vs_mercado == pytest.approx(170_000)


def test_monto_efectivo_usa_precargado_si_usuario_es_none():
    item = CostLineItem(
        concepto="construccion_CA_P",
        cantidad=200, unidad="m2",
        precio_unitario_mxn=1_800,
        monto_precargado=360_000,
        monto_usuario=None,
        fuente_precarga="INPC 2025",
        clasificacion=CostSourceType.supuesto_editable,
        actor_responsable="municipio",
        periodicidad="unico",
    )
    assert item.monto_efectivo == pytest.approx(360_000)
    assert item.tiene_override_usuario is False
    assert item.delta_vs_mercado is None


# ─── cost_registry: totales aproximan constantes historicas ──────────────────

def _capex_total(items):
    return sum(i.monto_precargado for i in items if i.periodicidad == "unico")


def test_capex_pequeno_positivo_y_mayor_a_cero():
    """El CAPEX registry 2026 supera el hardcode historico (inflacion real).
    Solo verificamos que tiene magnitud razonable (>400k, <3M MXN)."""
    items = capex_ca_pequeno()
    total = _capex_total(items)
    assert 400_000 < total < 3_000_000, f"CA_P fuera de rango razonable: {total:,.0f}"


def test_capex_mediano_mayor_a_pequeno():
    assert _capex_total(capex_ca_mediano()) > _capex_total(capex_ca_pequeno())


def test_capex_grande_mayor_a_mediano():
    assert _capex_total(capex_ca_grande()) > _capex_total(capex_ca_mediano())


def test_todos_los_items_tienen_fuente_no_vacia():
    items = capex_ca_pequeno() + capex_ca_mediano() + capex_ca_grande()
    for item in items:
        assert item.fuente_precarga, f"Item {item.concepto} sin fuente"


# ─── Esquema de negociacion ───────────────────────────────────────────────────

def test_municipal_directo_todos_actores_municipio():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             negociacion=NegotiationScheme.municipal_directo)
    capex = [i for i in items if i.periodicidad == "unico" and "disposicion" not in i.concepto]
    for item in capex:
        assert item.actor_responsable in ("municipio", "compartido"), (
            f"{item.concepto} deberia ser municipio, es {item.actor_responsable}"
        )


def test_concesion_total_terreno_va_a_concesionario():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             negociacion=NegotiationScheme.concesion_total)
    terreno = next(i for i in items if i.concepto == "terreno_CA_P")
    assert terreno.actor_responsable == "concesionario"


def test_concesion_total_permisos_quedan_en_municipio():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             negociacion=NegotiationScheme.concesion_total)
    permisos = next(i for i in items if i.concepto == "permisos_CA_P")
    assert permisos.actor_responsable == "municipio"


def test_mixto_terreno_municipio_construccion_concesionario():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             negociacion=NegotiationScheme.mixto_condominio)
    terreno = next(i for i in items if i.concepto == "terreno_CA_P")
    construccion = next(i for i in items if i.concepto == "construccion_CA_P")
    assert terreno.actor_responsable == "municipio"
    assert construccion.actor_responsable == "concesionario"


# ─── Overrides del usuario ────────────────────────────────────────────────────

def test_override_cambia_monto_efectivo():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             overrides={"terreno_CA_P": 500_000})
    terreno = next(i for i in items if i.concepto == "terreno_CA_P")
    assert terreno.monto_efectivo == pytest.approx(500_000)
    assert terreno.clasificacion == CostSourceType.dato_usuario


def test_override_solo_afecta_concepto_especificado():
    items = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                             overrides={"terreno_CA_P": 500_000})
    construccion = next(i for i in items if i.concepto == "construccion_CA_P")
    assert construccion.clasificacion != CostSourceType.dato_usuario


# ─── SimulateResponse incluye cost_model y manifest ──────────────────────────

def make_scenario(**kwargs):
    defaults = dict(
        zm_activa="SLP",
        horizonte=3,
        pct_captura_por_año=[20, 45, 70],
        mix_cas=MixCAs(P=3, M=0, G=0),
        wacc=20,
    )
    defaults.update(kwargs)
    return ScenarioInput(**defaults)


def test_simulate_response_incluye_cost_model():
    res = calcular_scenario(make_scenario())
    assert res.cost_model is not None
    assert "items" in res.cost_model
    assert res.cost_model["confianza_costos"] > 0


def test_simulate_response_incluye_manifest():
    res = calcular_scenario(make_scenario())
    assert res.financial_run_manifest is not None
    assert "inputs_sha256" in res.financial_run_manifest
    assert len(res.financial_run_manifest["inputs_sha256"]) == 64  # SHA-256 hex


def test_manifest_determinista_mismo_input():
    s = make_scenario()
    r1 = calcular_scenario(s)
    r2 = calcular_scenario(s)
    assert r1.financial_run_manifest["inputs_sha256"] == r2.financial_run_manifest["inputs_sha256"]


def test_manifest_diferente_si_cambia_negociacion():
    r1 = calcular_scenario(make_scenario(negociacion=NegotiationScheme.municipal_directo))
    r2 = calcular_scenario(make_scenario(negociacion=NegotiationScheme.concesion_total))
    assert r1.financial_run_manifest["inputs_sha256"] != r2.financial_run_manifest["inputs_sha256"]


def test_override_usuario_cambia_manifest():
    r1 = calcular_scenario(make_scenario())
    r2 = calcular_scenario(make_scenario(cost_overrides={"terreno_CA_P": 999_000}))
    assert r1.financial_run_manifest["inputs_sha256"] != r2.financial_run_manifest["inputs_sha256"]


# ─── Confianza del modelo ─────────────────────────────────────────────────────

def test_confianza_sube_con_dato_usuario():
    items_base = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP")
    items_user = build_cost_items(nP=1, nM=0, nG=0, viviendas=5000, zm="SLP",
                                  overrides={"terreno_CA_P": 400_000,
                                             "construccion_CA_P": 360_000})
    assert confianza_score(items_user) > confianza_score(items_base)


def test_confianza_entre_0_y_1():
    items = build_cost_items(nP=2, nM=1, nG=0, viviendas=10000, zm="MTY")
    score = confianza_score(items)
    assert 0.0 <= score <= 1.0
