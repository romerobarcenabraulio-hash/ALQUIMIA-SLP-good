"""
Fase 6 - tests de causalidad para macrogeneradores.

Un macrogenerador solo cuenta si cambia volumen, logistica, marketplace o
documentos AGORA con trazabilidad explicita.
"""
from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.agents.agora import PlanInput
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.macros.impact import compute_macro_impact
from app.macros.registry import configure_storage, list_generators, reset_registry_for_tests
from app.macros.router import router
from app.macros.schemas import (
    FuenteTipoMacro,
    MacroGenerator,
    MacroStatus,
    MacroTipo,
)


def _macro(
    generator_id: str = "TEST-MAC-001",
    zm: str = "SLP",
    municipio: str | None = "slp",
    status: MacroStatus = MacroStatus.estimado,
    fuente_tipo: FuenteTipoMacro = FuenteTipoMacro.benchmark_sectorial,
    ton_dia: float = 10.0,
    composicion: dict | None = None,
    estacionalidad: list[float] | None = None,
    lat: float | None = 22.15,
    lon: float | None = -100.98,
) -> MacroGenerator:
    return MacroGenerator(
        generator_id=generator_id,
        nombre=f"Macro test {generator_id}",
        tipo=MacroTipo.mercado_publico,
        zm=zm,
        municipio=municipio,
        ubicacion="Ubicacion test" if lat is not None and lon is not None else None,
        lat=lat,
        lon=lon,
        actividad_base=1000,
        unidad_actividad="usuarios_dia",
        generacion_estimada_ton_dia=ton_dia,
        composicion=composicion or {
            "organico": 0.70,
            "papel": 0.05,
            "plastico": 0.15,
            "vidrio": 0.03,
            "aluminio": 0.02,
            "otros": 0.05,
        },
        estacionalidad_mensual=estacionalidad or [1.0] * 12,
        dias_operacion_anio=300,
        separacion_actual_pct=5,
        separacion_potencial_pct=60,
        pureza_estimada_pct=80,
        fuente="Benchmark test no oficial",
        fuente_tipo=fuente_tipo,
        confianza=0.45,
        status=status,
    )


def test_generador_activo_aumenta_volumen():
    summary = compute_macro_impact("SLP", ["slp"], [_macro()])

    assert summary.generators_count == 1
    assert summary.total_ton_anio == pytest.approx(3000.0)
    assert summary.volumen_por_material["organico"] > 0
    assert summary.impacto_camiones["camiones_adicionales_sugeridos"] > 0


def test_generador_inactivo_no_altera_resultados():
    summary = compute_macro_impact("SLP", ["slp"], [_macro(status=MacroStatus.inactivo)])

    assert summary.generators_count == 0
    assert summary.total_ton_anio == 0
    assert summary.volumen_por_material == {}


def test_generador_sin_municipio_no_entra_a_calculo_municipal():
    summary = compute_macro_impact("SLP", ["slp"], [_macro(municipio=None)])

    assert summary.generators_count == 0
    assert summary.total_ton_anio == 0
    assert any("no tiene municipio" in w for w in summary.warnings)


def test_benchmark_y_manual_generan_warning():
    manual = _macro(
        generator_id="TEST-MANUAL",
        status=MacroStatus.manual,
        fuente_tipo=FuenteTipoMacro.manual_usuario,
    )
    summary = compute_macro_impact("SLP", ["slp"], [manual])
    text = " ".join(summary.warnings).lower()

    assert "manual_usuario" in text
    assert "requiere verificacion" in text


def test_composicion_altera_volumen_por_material():
    organico = _macro(generator_id="ORG", composicion={"organico": 1.0})
    plastico = _macro(generator_id="PLA", composicion={"plastico": 1.0})

    s_org = compute_macro_impact("SLP", ["slp"], [organico])
    s_pla = compute_macro_impact("SLP", ["slp"], [plastico])

    assert s_org.volumen_por_material.get("organico", 0) > 0
    assert s_org.volumen_por_material.get("plastico", 0) == 0
    assert s_pla.volumen_por_material.get("plastico", 0) > 0


def test_estacionalidad_cambia_volumen_anual():
    base = _macro(generator_id="BASE", estacionalidad=[1.0] * 12)
    alta = _macro(generator_id="ALTA", estacionalidad=[1.5] * 12)

    s_base = compute_macro_impact("SLP", ["slp"], [base])
    s_alta = compute_macro_impact("SLP", ["slp"], [alta])

    assert s_alta.total_ton_anio == pytest.approx(s_base.total_ton_anio * 1.5)


def test_macrogenerador_con_ubicacion_genera_recomendacion_logistica():
    summary = compute_macro_impact("SLP", ["slp"], [_macro(lat=22.1, lon=-100.9)])

    assert summary.plans[0].ruta_sugerida is not None
    assert "Ruta dedicada" in summary.plans[0].ruta_sugerida


def test_macrogenerador_sin_ubicacion_bloquea_ruta_especifica():
    summary = compute_macro_impact("SLP", ["slp"], [_macro(lat=None, lon=None)])

    assert summary.plans[0].ruta_sugerida is None
    assert any("no se puede prometer ruta" in w for w in summary.warnings)


def test_si_fase5_existe_placement_cambia_con_volumen_incremental():
    small = compute_macro_impact("SLP", ["slp"], [_macro(generator_id="SMALL", ton_dia=1.0)])
    large = compute_macro_impact("SLP", ["slp"], [_macro(generator_id="LARGE", ton_dia=20.0)])

    assert small.impacto_market is not None
    assert large.impacto_market is not None
    assert large.impacto_market["total_volumen_ton_anio"] > small.impacto_market["total_volumen_ton_anio"]


def test_agora_payload_incluye_macro_impact_summary():
    macro_summary = compute_macro_impact("SLP", ["slp"], [_macro()])
    plan_input = PlanInput(
        municipio="SLP",
        zm="SLP",
        scenario_json={"zm": "SLP"},
        kpis_json={},
        macro_impact_summary=macro_summary.model_dump(),
    )
    bundle = build_bundle_from_plan_input(plan_input, municipios_activos=["slp"])
    bundle.inputs_usuario["macro_impact_summary"] = plan_input.macro_impact_summary

    assert "macro_impact_summary" in bundle.inputs_usuario
    assert bundle.inputs_usuario["macro_impact_summary"]["generators_count"] == 1


def test_qro_mty_slp_no_comparten_generadores_por_accidente():
    slp = list_generators(zm="SLP")
    qro = list_generators(zm="QRO")
    mty = list_generators(zm="MTY")

    assert slp
    assert qro
    assert mty
    assert {g.zm for g in slp} == {"SLP"}
    assert {g.zm for g in qro} == {"QRO"}
    assert {g.zm for g in mty} == {"MTY"}
    assert not ({g.generator_id for g in slp} & {g.generator_id for g in qro})


def test_endpoints_macros_basicos():
    app = FastAPI()
    app.include_router(router, prefix="/macros")
    client = TestClient(app)

    r = client.get("/macros/generators?zm=SLP")
    assert r.status_code == 200
    assert all(g["zm"] == "SLP" for g in r.json())

    body = {
        "zm": "SLP",
        "municipios": ["slp"],
        "generators": [_macro(generator_id="REQ-ONLY").model_dump()],
        "include_registry": False,
    }
    impact = client.post("/macros/impact", json=body)
    assert impact.status_code == 200
    assert impact.json()["generators_count"] == 1

    stored = client.get("/macros/summary/SLP")
    assert stored.status_code == 200
    assert stored.json()["generators_count"] == 1


def test_fase61_persistencia_sobrevive_reload(tmp_path):
    configure_storage(tmp_path, reset=True)
    app = FastAPI()
    app.include_router(router, prefix="/macros")
    client = TestClient(app)
    generator = _macro(generator_id="PERSIST-001").model_dump(mode="json")

    created = client.post("/macros/generators", json=generator)
    assert created.status_code == 200

    configure_storage(tmp_path, reset=False)
    persisted_ids = {g.generator_id for g in list_generators(zm="SLP")}

    assert "PERSIST-001" in persisted_ids
    reset_registry_for_tests()


def test_fase61_bloquea_generator_id_duplicado(tmp_path):
    configure_storage(tmp_path, reset=True)
    app = FastAPI()
    app.include_router(router, prefix="/macros")
    client = TestClient(app)
    generator = _macro(generator_id="DUP-001").model_dump(mode="json")

    assert client.post("/macros/generators", json=generator).status_code == 200
    duplicated = client.post("/macros/generators", json=generator)

    assert duplicated.status_code == 409
    reset_registry_for_tests()


def test_fase61_valida_composicion_y_estacionalidad():
    with pytest.raises(ValueError):
        _macro(composicion={"organico": 0.4, "plastico": 0.4})

    with pytest.raises(ValueError):
        _macro(estacionalidad=[1.0] * 11)


def test_fase61_fuente_manual_no_puede_parecer_oficial():
    with pytest.raises(ValueError):
        MacroGenerator(
            **{
                **_macro(status=MacroStatus.manual, fuente_tipo=FuenteTipoMacro.manual_usuario).model_dump(),
                "generator_id": "BAD-MANUAL",
                "confianza": 0.9,
            }
        )

    with pytest.raises(ValueError):
        MacroGenerator(
            **{
                **_macro().model_dump(),
                "generator_id": "BAD-VER",
                "status": MacroStatus.verificado,
                "fuente_tipo": FuenteTipoMacro.benchmark_sectorial,
                "confianza": 0.9,
            }
        )


def test_fase61_patch_persiste_edicion_avanzada(tmp_path):
    configure_storage(tmp_path, reset=True)
    app = FastAPI()
    app.include_router(router, prefix="/macros")
    client = TestClient(app)
    generator = _macro(generator_id="PATCH-001").model_dump(mode="json")
    assert client.post("/macros/generators", json=generator).status_code == 200

    patch = client.patch(
        "/macros/generators/PATCH-001",
        json={
            "generacion_estimada_ton_dia": 12.5,
            "composicion": {
                "organico": 0.5,
                "papel": 0.1,
                "plastico": 0.2,
                "vidrio": 0.1,
                "aluminio": 0.05,
                "otros": 0.05,
            },
            "estacionalidad_mensual": [1.2] * 12,
        },
    )

    assert patch.status_code == 200
    configure_storage(tmp_path, reset=False)
    stored = next(g for g in list_generators(zm="SLP") if g.generator_id == "PATCH-001")
    assert stored.generacion_estimada_ton_dia == 12.5
    assert stored.composicion["organico"] == 0.5
    assert stored.estacionalidad_mensual == [1.2] * 12
    reset_registry_for_tests()
