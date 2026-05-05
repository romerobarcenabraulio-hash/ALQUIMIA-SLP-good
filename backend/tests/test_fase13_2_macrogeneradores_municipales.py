import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.macros.estimator import check_required_variables, estimate_volume
from app.macros.impact import compute_macro_impact
from app.macros.registry import get_default_composition, reset_registry_for_tests
from app.macros.router import router
from app.macros.schemas import (
    FuenteTipoMacro,
    MacroGenerator,
    MacroImpactRequest,
    MacroStatus,
    MacroTipo,
    VariablesEspecificasTipo,
)


def _base_generator(tipo: MacroTipo, municipio: str = "slp") -> MacroGenerator:
    return MacroGenerator(
        generator_id=f"TEST-{tipo.value}",
        nombre=f"Gen {tipo.value}",
        tipo=tipo,
        zm="SLP",
        municipio=municipio,
        ubicacion=None,
        lat=None,
        lon=None,
        actividad_base=None,
        unidad_actividad="benchmark",
        generacion_estimada_ton_dia=0.0,
        composicion=get_default_composition(tipo),
        estacionalidad_mensual=[1.0] * 12,
        dias_operacion_anio=365,
        separacion_actual_pct=0,
        separacion_potencial_pct=60,
        pureza_estimada_pct=80,
        fuente="benchmark_sectorial",
        fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
        confianza=0.5,
        status=MacroStatus.estimado,
        last_verified_at=None,
    )


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/macros")
    return TestClient(app)


def setup_function():
    reset_registry_for_tests()


def test_cada_tipo_requiere_variables_propias():
    tipos = [MacroTipo.hotel, MacroTipo.estadio, MacroTipo.hospital, MacroTipo.universidad]
    for tipo in tipos:
        assert check_required_variables(tipo, {}) != []


def test_generador_temporal_no_es_permanente():
    gen = _base_generator(MacroTipo.evento_masivo)
    gen.variables_tipo = VariablesEspecificasTipo(
        datos={"aforo": 5000, "ocupacion_pct": 0.8, "eventos_mes": 2},
        tipo_referencia="evento_masivo",
    )
    summary = compute_macro_impact("SLP", ["slp"], [gen])

    assert summary.generators[0].es_temporal is True
    assert summary.generators[0].dias_operacion_anio == 24  # 2 eventos/mes * 12 meses


def test_volumen_no_duplica_domiciliario():
    gen = _base_generator(MacroTipo.hotel)
    gen.variables_tipo = VariablesEspecificasTipo(
        datos={"habitaciones": 100, "ocupacion_pct": 70, "noches_promedio": 1},
        tipo_referencia="hotel",
    )
    summary = compute_macro_impact("SLP", ["slp"], [gen])
    g = summary.generators[0]

    assert g.excluir_del_conteo_domiciliario is True
    assert g.calculo_volumen is not None
    assert "no suma RSU domiciliario" in g.calculo_volumen.razon


def test_calculo_volumen_tiene_formula_fuente_unidad_razon():
    calc = estimate_volume(
        MacroTipo.hotel,
        {"habitaciones": 80, "ocupacion_pct": 75, "noches_promedio": 1},
    )
    assert calc.formula
    assert calc.fuente_factor
    assert calc.unidad
    assert calc.periodicidad
    assert calc.razon
    assert len(calc.incertidumbre_rango) == 2
    assert calc.incertidumbre_rango[0] < calc.incertidumbre_rango[1]


def test_hospital_con_regulados_activa_advertencia():
    gen = _base_generator(MacroTipo.hospital)
    gen.variables_tipo = VariablesEspecificasTipo(
        datos={"camas": 120, "consultas_dia": 300, "tiene_residuos_regulados": True},
        tipo_referencia="hospital",
    )
    summary = compute_macro_impact("SLP", ["slp"], [gen])
    g = summary.generators[0]

    assert g.residuos_regulados_detectados
    assert "proveedor autorizado" in g.advertencia_residuos_regulados.lower()
    assert "rsu ordinario" not in g.advertencia_residuos_regulados.lower()
    assert "reciclable" not in g.advertencia_residuos_regulados.lower()


def test_benchmark_no_marcado_como_oficial():
    with pytest.raises(ValueError):
        _ = MacroGenerator(
            generator_id="X",
            nombre="Benchmark verificado",
            tipo=MacroTipo.hotel,
            zm="SLP",
            municipio="slp",
            ubicacion=None,
            lat=None,
            lon=None,
            actividad_base=None,
            unidad_actividad="benchmark",
            generacion_estimada_ton_dia=1.0,
            composicion=get_default_composition(MacroTipo.hotel),
            estacionalidad_mensual=[1.0] * 12,
            dias_operacion_anio=365,
            separacion_actual_pct=0,
            separacion_potencial_pct=60,
            pureza_estimada_pct=80,
            fuente="benchmark",
            fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
            confianza=0.9,
            status=MacroStatus.verificado,
            last_verified_at=None,
        )


def test_endpoint_impact_incluye_calculo_volumen():
    client = _client()
    payload = MacroImpactRequest(
        zm="SLP",
        municipios=["slp"],
        include_registry=False,
        generators=[
            _base_generator(MacroTipo.hotel).model_dump(mode="json")
            | {
                "variables_tipo": {
                    "datos": {"habitaciones": 50, "ocupacion_pct": 70, "noches_promedio": 1},
                    "tipo_referencia": "hotel",
                    "variables_faltantes": [],
                }
            }
        ],
    )

    resp = client.post("/macros/impact", json=payload.model_dump(mode="json"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["generators"][0]["calculo_volumen"]["formula"]
    assert body["generators"][0]["calculo_volumen"]["incertidumbre_rango"][1] > 0
