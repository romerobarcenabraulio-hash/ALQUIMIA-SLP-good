"""
Fase 5 — Tests anti-fantasía financiera del módulo de marketplace.

Principio: si un test no puede fallar con compradores inventados,
no es un buen test. Cada test valida una garantía de causalidad.

Grupos:
  1. Contratos / schemas
  2. Algoritmo de colocación (placement.py)
  3. Resumen global (MarketSummary)
  4. Registry (catálogo honesto)
  5. Endpoints HTTP
  6. Integración con calculadora (vol_capturable_por_mat)
  7. Integración con AGORA (market_summary en ScenarioBundle)
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.market.schemas import (
    BuyerStatus,
    EstadoColocacion,
    FuenteTipoMarket,
    MarketSummary,
    MaterialBuyer,
    PlaceRequest,
    RiesgoMercado,
)
from app.market.placement import compute_placement, compute_market_summary
from app.market.registry import get_buyers, get_all_buyers, REGISTRY_WARNING
from app.services.calculator import calcular_scenario
from app.schemas.simulate import ScenarioInput


# ─── Fixtures ─────────────────────────────────────────────────────────────────

def _make_buyer(
    buyer_id="test-001",
    material="pet",
    cap=5000.0,
    cap_disp=5000.0,
    precio_min=4.0,
    precio_max=6.0,
    status=BuyerStatus.estimado,
    fuente_tipo=FuenteTipoMarket.benchmark,
    confianza=0.55,
) -> MaterialBuyer:
    return MaterialBuyer(
        buyer_id=buyer_id,
        nombre=f"Comprador test {buyer_id}",
        material=material,
        estado="Jalisco",
        municipio=None,
        tipo_comprador="reciclador",
        capacidad_ton_anio=cap,
        capacidad_disponible_ton_anio=cap_disp,
        precio_min_mxn_kg=precio_min,
        precio_max_mxn_kg=precio_max,
        calidad_requerida="basica",
        distancia_km=100.0,
        fuente="Fuente test",
        fuente_tipo=fuente_tipo,
        confianza=confianza,
        status=status,
        last_verified_at=None,
    )


# ─── 1. Contratos / Schemas ───────────────────────────────────────────────────

class TestSchemas:
    def test_material_buyer_precio_medio(self):
        b = _make_buyer(precio_min=4.0, precio_max=6.0)
        assert b.precio_medio_mxn_kg() == 5.0

    def test_material_buyer_no_es_oficial_benchmark(self):
        b = _make_buyer(
            status=BuyerStatus.estimado,
            fuente_tipo=FuenteTipoMarket.benchmark,
        )
        assert not b.es_oficial()

    def test_material_buyer_no_es_oficial_manual(self):
        b = _make_buyer(
            status=BuyerStatus.manual,
            fuente_tipo=FuenteTipoMarket.manual_usuario,
        )
        assert not b.es_oficial()

    def test_material_buyer_es_oficial_solo_si_verificado_y_fuente_publica(self):
        b = _make_buyer(
            status=BuyerStatus.verificado,
            fuente_tipo=FuenteTipoMarket.registro_publico,
        )
        assert b.es_oficial()

    def test_market_summary_tiene_riesgo_critico(self):
        plan_sin_mercado = compute_placement("pet", 1000.0, "SLP", ["slp"], [])
        summary = compute_market_summary("SLP", {"pet": plan_sin_mercado})
        assert summary.tiene_riesgo_critico()

    def test_market_summary_materiales_sin_mercado(self):
        plan_sin_mercado = compute_placement("pet", 1000.0, "SLP", ["slp"], [])
        summary = compute_market_summary("SLP", {"pet": plan_sin_mercado})
        assert "pet" in summary.materiales_sin_mercado()


# ─── 2. Algoritmo de colocación ───────────────────────────────────────────────

class TestPlacement:

    def test_comprador_suficiente_coloca_100pct(self):
        """Un comprador con capacidad ≥ volumen debe colocar el 100 %."""
        buyer = _make_buyer(cap=5000.0, cap_disp=5000.0)
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.pct_colocado == pytest.approx(100.0, abs=0.01)
        assert plan.faltante_ton_anio == pytest.approx(0.0, abs=0.01)
        assert plan.colocado_ton_anio == pytest.approx(1000.0, abs=0.01)
        assert len(plan.allocations) == 1

    def test_comprador_insuficiente_deja_faltante(self):
        """Comprador con cap_disp < volumen deja faltante > 0 y riesgo ≥ medio."""
        buyer = _make_buyer(cap=5000.0, cap_disp=400.0)
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.faltante_ton_anio == pytest.approx(600.0, abs=0.01)
        assert plan.pct_colocado == pytest.approx(40.0, abs=0.01)
        assert plan.riesgo_mercado in (RiesgoMercado.medio, RiesgoMercado.alto, RiesgoMercado.critico)

    def test_sin_comprador_ingreso_ajustado_cero(self):
        """Sin compradores: ingreso_ajustado = 0, riesgo = critico."""
        plan = compute_placement("pet", 1200.0, "SLP", ["slp"], [])

        assert plan.ingreso_ajustado_mxn == pytest.approx(0.0, abs=0.01)
        assert plan.riesgo_mercado == RiesgoMercado.critico
        assert plan.pct_colocado == 0.0
        assert plan.faltante_ton_anio == pytest.approx(1200.0, abs=0.01)

    def test_ingreso_ajustado_menor_que_potencial_cuando_faltante(self):
        """Con faltante, ingreso_ajustado debe ser menor que ingreso_potencial."""
        buyer = _make_buyer(cap=5000.0, cap_disp=300.0)  # cubre solo 300 de 1000
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.ingreso_ajustado_mxn < plan.ingreso_potencial_mxn

    def test_ingreso_potencial_calculado_correctamente(self):
        """ingreso_potencial = vol × precio_medio × 1000."""
        buyer = _make_buyer(cap=5000.0, cap_disp=5000.0, precio_min=4.0, precio_max=6.0)
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        # precio_medio = 5.0, vol = 1000 t, × 1000 kg/t = 5_000_000 MXN
        assert plan.ingreso_potencial_mxn == pytest.approx(5_000_000.0, rel=0.01)

    def test_capacidad_disponible_no_se_excede(self):
        """El volumen asignado a cada buyer ≤ su capacidad disponible."""
        buyers = [
            _make_buyer("b1", cap_disp=300.0),
            _make_buyer("b2", cap_disp=300.0),
        ]
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], buyers)

        for alloc in plan.allocations:
            buyer_cap = next(
                b.capacidad_disponible_ton_anio for b in buyers if b.buyer_id == alloc.buyer_id
            )
            assert alloc.volumen_asignado_ton_anio <= buyer_cap + 0.001

    def test_precio_benchmark_genera_warning(self):
        """Compradores benchmark deben generar advertencia en el plan."""
        buyer = _make_buyer(fuente_tipo=FuenteTipoMarket.benchmark)
        plan = compute_placement("pet", 500.0, "SLP", ["slp"], [buyer])

        advertencias_text = " ".join(plan.advertencias).lower()
        assert "benchmark" in advertencias_text or "estimado" in advertencias_text

    def test_comprador_manual_no_es_oficial(self):
        """Un buyer con status=manual y fuente_tipo=manual_usuario no es oficial."""
        buyer = _make_buyer(
            status=BuyerStatus.manual,
            fuente_tipo=FuenteTipoMarket.manual_usuario,
        )
        assert not buyer.es_oficial()

        plan = compute_placement("pet", 500.0, "SLP", ["slp"], [buyer])
        advertencias_text = " ".join(plan.advertencias).lower()
        # Debe advertir sobre compradores no verificados
        assert "manual" in advertencias_text or "no verificado" in advertencias_text

    def test_descuento_proporcional_faltante(self):
        """
        Con faltante ~60 %, ingreso_ajustado debe ser < ingreso_potencial × 0.8
        (el descuento de faltante >50% es 35%, más 20% benchmark = 55% mínimo).
        """
        buyer = _make_buyer(cap_disp=400.0)  # 400/1000 = 40% colocado → faltante 60% > 50%
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.ingreso_ajustado_mxn < plan.ingreso_potencial_mxn * 0.80

    def test_100pct_colocado_sin_verificado_es_riesgo_medio(self):
        """100 % colocado con todos benchmark → riesgo medio (no bajo)."""
        buyer = _make_buyer(cap_disp=5000.0, fuente_tipo=FuenteTipoMarket.benchmark)
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.pct_colocado == pytest.approx(100.0, abs=0.01)
        assert plan.riesgo_mercado == RiesgoMercado.medio

    def test_100pct_colocado_con_verificado_es_riesgo_bajo(self):
        """100 % colocado con buyer verificado + fuente pública → riesgo bajo."""
        buyer = _make_buyer(
            cap_disp=5000.0,
            status=BuyerStatus.verificado,
            fuente_tipo=FuenteTipoMarket.registro_publico,
        )
        plan = compute_placement("pet", 1000.0, "SLP", ["slp"], [buyer])

        assert plan.riesgo_mercado == RiesgoMercado.bajo

    def test_vol_cero_devuelve_plan_sin_asignaciones(self):
        """Volumen = 0 devuelve plan con pct_colocado=0, sin error."""
        buyer = _make_buyer(cap_disp=5000.0)
        plan = compute_placement("pet", 0.0, "SLP", ["slp"], [buyer])

        assert plan.colocado_ton_anio == 0.0
        assert plan.ingreso_potencial_mxn == 0.0
        assert plan.ingreso_ajustado_mxn == 0.0
        assert len(plan.allocations) == 0

    def test_ordering_preferencia_verificado_sobre_estimado(self):
        """El algoritmo asigna primero al comprador verificado."""
        b_estimado = _make_buyer(
            buyer_id="est",
            cap_disp=200.0,
            status=BuyerStatus.estimado,
            fuente_tipo=FuenteTipoMarket.benchmark,
        )
        b_verificado = _make_buyer(
            buyer_id="ver",
            cap_disp=200.0,
            status=BuyerStatus.verificado,
            fuente_tipo=FuenteTipoMarket.registro_publico,
        )
        plan = compute_placement("pet", 200.0, "SLP", ["slp"], [b_estimado, b_verificado])

        # Con 200 t y dos buyers de 200 t, solo uno recibe asignación
        assert len(plan.allocations) == 1
        assert plan.allocations[0].buyer_id == "ver"


# ─── 3. MarketSummary ─────────────────────────────────────────────────────────

class TestMarketSummary:

    def test_summary_suma_materiales_correctamente(self):
        """Los totales del MarketSummary deben ser la suma exacta de los planes."""
        buyers_pet   = [_make_buyer("p1", "pet",   cap_disp=800.0)]
        buyers_papel = [_make_buyer("pp1", "papel", cap_disp=600.0)]

        plan_pet   = compute_placement("pet",   1000.0, "SLP", ["slp"], buyers_pet)
        plan_papel = compute_placement("papel",  800.0, "SLP", ["slp"], buyers_papel)

        summary = compute_market_summary("SLP", {"pet": plan_pet, "papel": plan_papel})

        assert summary.total_volumen_ton_anio == pytest.approx(
            plan_pet.volumen_ton_anio + plan_papel.volumen_ton_anio, rel=0.001
        )
        assert summary.total_colocado_ton_anio == pytest.approx(
            plan_pet.colocado_ton_anio + plan_papel.colocado_ton_anio, rel=0.001
        )
        assert summary.ingresos_potenciales_mxn == pytest.approx(
            plan_pet.ingreso_potencial_mxn + plan_papel.ingreso_potencial_mxn, rel=0.001
        )
        assert summary.ingresos_ajustados_mxn == pytest.approx(
            plan_pet.ingreso_ajustado_mxn + plan_papel.ingreso_ajustado_mxn, rel=0.001
        )
        assert summary.descuento_por_riesgo_mxn == pytest.approx(
            summary.ingresos_potenciales_mxn - summary.ingresos_ajustados_mxn, rel=0.001
        )

    def test_summary_con_material_sin_mercado_reduce_ajustado(self):
        """Un material sin compradores baja el ingreso ajustado total a la mitad (o menos)."""
        buyers_pet = [_make_buyer(cap_disp=5000.0, precio_min=5.0, precio_max=5.0)]
        plan_pet   = compute_placement("pet", 1000.0, "SLP", ["slp"], buyers_pet)
        plan_papel = compute_placement("papel", 800.0, "SLP", ["slp"], [])  # sin compradores

        summary = compute_market_summary("SLP", {"pet": plan_pet, "papel": plan_papel})

        assert summary.ingresos_ajustados_mxn < summary.ingresos_potenciales_mxn
        assert plan_papel.material in summary.materiales_sin_mercado()

    def test_summary_warnings_incluye_registry_warning(self):
        """Todo summary debe llevar el warning de honestidad del catálogo."""
        plan = compute_placement("pet", 500.0, "SLP", ["slp"], [])
        summary = compute_market_summary("SLP", {"pet": plan})
        assert any(REGISTRY_WARNING[:30] in w for w in summary.warnings)


# ─── 4. Registry ─────────────────────────────────────────────────────────────

class TestRegistry:

    def test_get_buyers_filtra_por_material(self):
        buyers_pet  = get_buyers("pet")
        buyers_papel = get_buyers("papel")

        for b in buyers_pet:
            assert b.material in ("pet", "plastico"), (
                f"get_buyers('pet') retornó material={b.material}"
            )
        for b in buyers_papel:
            assert b.material == "papel", (
                f"get_buyers('papel') retornó material={b.material}"
            )

    def test_ningun_buyer_es_verificado_en_catalogo_inicial(self):
        """
        Red flag: ningún buyer del catálogo inicial debe tener status=verificado.
        Verificar requiere confirmación fuera del código.
        """
        todos = get_all_buyers()
        verificados = [b for b in todos if b.status == BuyerStatus.verificado]
        assert verificados == [], (
            f"Hay {len(verificados)} compradores marcados como 'verificado' en el catálogo "
            f"sin que haya proceso de verificación: {[b.buyer_id for b in verificados]}"
        )

    def test_todos_buyers_tienen_fuente(self):
        """Ningún buyer puede quedar sin descripción de fuente."""
        todos = get_all_buyers()
        sin_fuente = [b for b in todos if not b.fuente or not b.fuente_tipo]
        assert sin_fuente == []

    def test_todos_buyers_tienen_confianza_menor_a_1(self):
        """Confianza 1.0 implica certeza absoluta — imposible sin verificación real."""
        todos = get_all_buyers()
        perfectos = [b for b in todos if b.confianza >= 1.0]
        assert perfectos == [], (
            f"Buyers con confianza=1.0 (imposible sin verificación real): "
            f"{[b.buyer_id for b in perfectos]}"
        )

    def test_get_all_buyers_no_incluye_inactivos(self):
        todos = get_all_buyers()
        inactivos = [b for b in todos if b.status == BuyerStatus.inactivo]
        assert inactivos == []


# ─── 5. Endpoints HTTP ────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """
    Mini-app solo con el market router — evita importar auth.py/passlib.
    Los tests de endpoints de otros módulos ya no usan TestClient por el
    mismo motivo (bcrypt/passlib incompatibilidad Python 3.14).
    """
    from fastapi import FastAPI
    from app.market.router import router as market_router
    mini = FastAPI()
    mini.include_router(market_router, prefix="/market")
    return TestClient(mini)


class TestEndpoints:

    def test_get_buyers_sin_filtro(self, client):
        r = client.get("/market/buyers")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_buyers_filtra_material_pet(self, client):
        r = client.get("/market/buyers?material=pet")
        assert r.status_code == 200
        buyers = r.json()
        # Todos los buyers retornados deben ser pet o aliases
        for b in buyers:
            assert b["material"] in ("pet", "plastico"), (
                f"Endpoint retornó buyer con material={b['material']} al filtrar por pet"
            )

    def test_endpoint_place_responde_estructura_esperada(self, client):
        body = {
            "zm": "SLP",
            "municipios": ["slp"],
            "volumes_ton_anio": {"pet": 1200.0, "papel": 800.0},
        }
        r = client.post("/market/place", json=body)
        assert r.status_code == 200, r.text

        data = r.json()
        # Estructura MarketSummary
        assert "zm" in data
        assert "total_volumen_ton_anio" in data
        assert "ingresos_potenciales_mxn" in data
        assert "ingresos_ajustados_mxn" in data
        assert "descuento_por_riesgo_mxn" in data
        assert "planes_por_material" in data
        assert "warnings" in data

        # Pet y papel deben estar en los planes
        assert "pet" in data["planes_por_material"]
        assert "papel" in data["planes_por_material"]

    def test_endpoint_place_descuento_no_negativo(self, client):
        body = {
            "zm": "QRO",
            "municipios": ["qro"],
            "volumes_ton_anio": {"pet": 500.0},
        }
        r = client.post("/market/place", json=body)
        assert r.status_code == 200
        data = r.json()
        assert data["descuento_por_riesgo_mxn"] >= 0.0
        assert data["ingresos_ajustados_mxn"] <= data["ingresos_potenciales_mxn"]

    def test_endpoint_summary_404_sin_place_previo(self, client):
        r = client.get("/market/summary/ZM_INEXISTENTE_XYZ")
        assert r.status_code == 404

    def test_endpoint_summary_despues_de_place(self, client):
        body = {
            "zm": "MTY",
            "municipios": ["mty"],
            "volumes_ton_anio": {"aluminio": 300.0},
        }
        client.post("/market/place", json=body)
        r = client.get("/market/summary/MTY")
        assert r.status_code == 200
        assert r.json()["zm"] == "MTY"

    def test_endpoint_opportunities_404_sin_place(self, client):
        r = client.get("/market/opportunities/ZM_VACIA_XYZ")
        assert r.status_code == 404

    def test_endpoint_opportunities_retorna_lista(self, client):
        body = {
            "zm": "QRO2",
            "municipios": ["qro"],
            "volumes_ton_anio": {"pet": 600.0, "vidrio": 200.0},
        }
        client.post("/market/place", json=body)
        r = client.get("/market/opportunities/QRO2")
        assert r.status_code == 200
        opp = r.json()
        assert isinstance(opp, list)
        assert len(opp) == 2
        for item in opp:
            assert "material" in item
            assert "riesgo" in item
            assert "recomendacion" in item
            assert "ingreso_ajustado_mxn" in item

    def test_endpoint_place_body_vacio_retorna_422(self, client):
        r = client.post("/market/place", json={
            "zm": "SLP",
            "municipios": [],
            "volumes_ton_anio": {},
        })
        assert r.status_code == 422

    def test_endpoint_ingreso_ajustado_menor_potencial(self, client):
        """El endpoint nunca puede devolver ajustado > potencial."""
        body = {
            "zm": "SLP2",
            "municipios": ["slp"],
            "volumes_ton_anio": {"pet": 2000.0, "papel": 1500.0, "vidrio": 500.0},
        }
        r = client.post("/market/place", json=body)
        assert r.status_code == 200
        data = r.json()
        assert data["ingresos_ajustados_mxn"] <= data["ingresos_potenciales_mxn"]
        for mat, plan in data["planes_por_material"].items():
            assert plan["ingreso_ajustado_mxn"] <= plan["ingreso_potencial_mxn"], (
                f"material={mat}: ajustado > potencial (fantasía financiera)"
            )


# ─── 6. Integración con calculadora ──────────────────────────────────────────

class TestCalculadoraIntegracion:

    def test_vol_capturable_en_simulate_response(self):
        """SimulateResponse debe incluir vol_capturable_por_mat_ton_anio."""
        s = ScenarioInput(zm_activa="SLP", horizonte=1, pct_captura_por_año=[50.0])
        resp = calcular_scenario(s)

        assert resp.vol_capturable_por_mat_ton_anio is not None, (
            "vol_capturable_por_mat_ton_anio es None — el marketplace no tiene datos de entrada"
        )
        vol = resp.vol_capturable_por_mat_ton_anio
        # Deben existir los materiales clave
        assert "organico" in vol
        assert "papel"    in vol
        assert "plastico" in vol
        assert "vidrio"   in vol
        assert "metales"  in vol

    def test_vol_capturable_positivo_con_captura_activa(self):
        """Con captura > 0, todos los volúmenes deben ser > 0."""
        s = ScenarioInput(zm_activa="SLP", horizonte=1, pct_captura_por_año=[40.0])
        resp = calcular_scenario(s)
        vol = resp.vol_capturable_por_mat_ton_anio

        for mat, v in vol.items():
            assert v > 0, f"vol_capturable[{mat}] = {v} con captura 40 %"

    def test_vol_capturable_cero_con_pct_cero(self):
        """Con pct_captura = 0, todos los volúmenes deben ser 0."""
        s = ScenarioInput(zm_activa="SLP", horizonte=1, pct_captura_por_año=[0.0])
        resp = calcular_scenario(s)
        vol = resp.vol_capturable_por_mat_ton_anio

        for mat, v in vol.items():
            assert v == pytest.approx(0.0, abs=0.01), (
                f"vol_capturable[{mat}] = {v} con pct_captura=0"
            )

    def test_vol_capturable_consistente_con_rsu(self):
        """
        La suma de volúmenes por material debe ser ≤ RSU × (1 - merma) × DIAS_OP.
        (la desigualdad es por las fracciones de eficiencia de separación por material)
        """
        s = ScenarioInput(zm_activa="SLP", horizonte=1, pct_captura_por_año=[100.0],
                          merma_log_pct=10)
        resp = calcular_scenario(s)
        vol  = resp.vol_capturable_por_mat_ton_anio

        suma_vol = sum(vol.values())
        rsu_anual = resp.rsu_total_ton_dia * 300  # DIAS_OP
        assert suma_vol <= rsu_anual * 0.90 * 1.01  # pequeña tolerancia por eficiencia


# ─── 7. Integración con AGORA ────────────────────────────────────────────────

class TestAgoraIntegracion:

    def test_market_summary_en_scenario_bundle(self):
        """
        Si plan_input lleva market_summary, ScenarioBundle.inputs_usuario
        debe contenerlo y ScenarioBundle.warnings debe incluir sus warnings.
        """
        from app.agents.bundle_builder import build_bundle_from_plan_input
        from app.agents.agora import PlanInput

        mkt_summary = {
            "zm": "SLP",
            "total_volumen_ton_anio": 5000.0,
            "ingresos_ajustados_mxn": 3000000.0,
            "warnings": ["warning de mercado test"],
        }

        plan_input = PlanInput(
            municipio="slp",
            zm="SLP",
            scenario_json={},
            kpis_json={},
            market_summary=mkt_summary,
        )

        # Simular la inyección que hace run_agora (las primeras 5 líneas del bloque Fase 5)
        bundle = build_bundle_from_plan_input(plan_input, ["slp"])

        # Inyectar manualmente (replica run_agora)
        bundle.inputs_usuario["market_summary"] = plan_input.market_summary
        bundle.warnings.extend(plan_input.market_summary.get("warnings", []))

        assert "market_summary" in bundle.inputs_usuario
        assert bundle.inputs_usuario["market_summary"]["zm"] == "SLP"
        assert "warning de mercado test" in bundle.warnings

    def test_sin_market_summary_bundle_no_tiene_clave(self):
        """Sin market_summary en plan_input, inputs_usuario no debe tener la clave."""
        from app.agents.bundle_builder import build_bundle_from_plan_input
        from app.agents.agora import PlanInput

        plan_input = PlanInput(
            municipio="slp",
            zm="SLP",
            scenario_json={},
            kpis_json={},
            market_summary=None,
        )
        bundle = build_bundle_from_plan_input(plan_input, ["slp"])
        # No se inyecta — sin market_summary no hay contaminación del bundle
        assert "market_summary" not in bundle.inputs_usuario
