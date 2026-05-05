"""Tests del motor de cálculo."""
import pytest
from app.schemas.simulate import ScenarioInput, PreciosMaterial, MixCAs
from app.services.calculator import calcular_scenario


def make_scenario(**kwargs):
    defaults = dict(
        zm_activa="SLP",
        municipios_activos=["slp", "sol"],
        horizonte=3,
        pct_captura_por_año=[20, 45, 70],
        precios=PreciosMaterial(),
        merma_log_pct=10,
        mix_cas=MixCAs(P=3, M=0, G=0),
        wacc=20,
        tipo_cambio=17.10,
        precio_carbono_esc="voluntario",
        gen_percapita=0.90,
        mes_inicio=1,
        costo_com_social=600000,
        subsidio_federal=0,
        cap_camion_ton=12,
        distancia_relleno=25,
    )
    defaults.update(kwargs)
    return ScenarioInput(**defaults)


def test_basic_calculation():
    s   = make_scenario()
    res = calcular_scenario(s)
    assert res.rsu_total_ton_dia > 0
    assert res.ingresos_brutos > 0
    assert len(res.serie_anual) == 3


def test_tir_positive():
    s   = make_scenario(horizonte=3)
    res = calcular_scenario(s)
    assert res.tir > 50, f"TIR esperada >50%, got {res.tir}"


def test_co2e_positive():
    s   = make_scenario()
    res = calcular_scenario(s)
    assert res.co2e_evitadas > 0


def test_horizonte_5():
    s   = make_scenario(horizonte=5, pct_captura_por_año=[20, 45, 70, 90, 100])
    res = calcular_scenario(s)
    assert len(res.serie_anual) == 5
    assert res.serie_anual[-1]["pct_captura"] == 100


def test_mty_larger_than_slp():
    slp = calcular_scenario(make_scenario(zm_activa="SLP"))
    mty = calcular_scenario(make_scenario(zm_activa="MTY"))
    assert mty.ingresos_brutos > slp.ingresos_brutos


def test_higher_prices_higher_income():
    base = make_scenario()
    alto = make_scenario(precios=PreciosMaterial(pet=12.0, aluminio=40.0, papel=5.0,
                                                  vidrio=5.0, hdpe=15.0, organico=3.0))
    r_base = calcular_scenario(base)
    r_alto = calcular_scenario(alto)
    assert r_alto.ingresos_brutos > r_base.ingresos_brutos


def test_score_politico_range():
    s   = make_scenario()
    res = calcular_scenario(s)
    assert 0 <= res.score_politico <= 100


def test_vpn_present():
    s   = make_scenario()
    res = calcular_scenario(s)
    assert isinstance(res.vpn, float)
