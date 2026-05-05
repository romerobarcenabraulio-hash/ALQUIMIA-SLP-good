"""
Tests Fase 2.5 — Integración DataProvenance en el flujo real del simulador.

Estos tests fallan si DataProvenance es solo decorativa:

1. test_simulate_incluye_data_provenance
   → /simulate debe retornar data_provenance en la respuesta.

2. test_provenance_cambia_con_zm
   → SLP y QRO tienen poblaciones distintas; el provenance debe reflejar la ZM correcta.

3. test_manual_fallback_no_es_oficial_en_simulate
   → Si el registry usó fallback/manual, data_provenance no puede tener tipo=oficial
     en KPIs críticos.

4. test_kpi_critico_sin_provenance_falla
   → Un KPI calculado desde ZM_DATA hardcoded (sin snapshot) debe tener
     data_provenance=None (modo offline) — esto es honesto, pero el test
     documenta que el calculador SÍ acepta y propaga el snapshot cuando lo recibe.

5. test_agora_request_acepta_data_provenance
   → GeneratePlanRequest acepta el campo data_provenance.

6. test_calcular_con_snapshot_usa_valores_registry
   → calcular_scenario con snapshot usa población INEGI, no ZM_DATA hardcoded.

7. test_calcular_sin_snapshot_usa_zm_data
   → calcular_scenario sin snapshot usa ZM_DATA (modo offline compatible).

8. test_snapshot_zm_slp_diferente_de_qro
   → El snapshot de SLP y QRO tienen KPIs distintos (prueba que cambia con ZM).
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch

from app.schemas.simulate import ScenarioInput, SimulateResponse
from app.schemas.generate_plan import GeneratePlanRequest
from app.services.calculator import calcular_scenario
from app.data.registry import DataRegistry
from app.data.schemas import FuenteTipo, SnapshotDatos, KPIConProvenance, DataProvenance


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_registry():
    DataRegistry._instance = None
    yield
    DataRegistry._instance = None


def make_scenario(zm: str = "SLP") -> ScenarioInput:
    return ScenarioInput(
        zm_activa=zm,
        horizonte=2,
        pct_captura_por_año=[20, 45, 70, 90, 100],
    )


def make_snapshot(zm: str = "SLP", pop: float = 1_200_000) -> SnapshotDatos:
    """Crea un SnapshotDatos mínimo para tests."""
    return SnapshotDatos(
        zm=zm,
        timestamp="2026-04-28T00:00:00+00:00",
        kpis=[
            KPIConProvenance(
                kpi_id="poblacion_total",
                kpi_label=f"Población total ZM {zm}",
                valor=pop,
                unidad="habitantes",
                provenance=DataProvenance(
                    tipo=FuenteTipo.certificado,
                    fuente_nombre="INEGI Censo 2020",
                    fuente_organismo="INEGI",
                    confianza=0.93,
                    requiere_clave_api=False,
                ),
            ),
            KPIConProvenance(
                kpi_id="gen_percapita_kg_dia",
                kpi_label="Generación per cápita",
                valor=0.90,
                unidad="kg/hab/día",
                provenance=DataProvenance(
                    tipo=FuenteTipo.certificado,
                    fuente_nombre="SEMARNAT DBGIR 2021",
                    fuente_organismo="SEMARNAT",
                    confianza=0.82,
                    requiere_clave_api=False,
                ),
            ),
            KPIConProvenance(
                kpi_id="tipo_cambio_mxn_usd",
                kpi_label="Tipo de cambio",
                valor=17.50,
                unidad="MXN/USD",
                provenance=DataProvenance(
                    tipo=FuenteTipo.oficial,
                    fuente_nombre="Banxico SIE SF43718",
                    fuente_organismo="Banco de México",
                    confianza=0.97,
                    requiere_clave_api=False,
                ),
            ),
        ],
        advertencias=[],
        score_datos=88,
        bloquea_agora=False,
    )


# ─── Test 1: /simulate incluye data_provenance ────────────────────────────────

class TestSimulateConProvenance:

    @pytest.mark.asyncio
    async def test_simulate_incluye_data_provenance_cuando_registry_responde(self):
        """
        Cuando DataRegistry retorna un snapshot, calcular_scenario lo incluye
        en SimulateResponse.data_provenance.
        """
        s = make_scenario("SLP")
        snapshot = await DataRegistry.instance().snapshot("SLP")
        result = calcular_scenario(s, snapshot=snapshot)

        assert result.data_provenance is not None, (
            "calcular_scenario con snapshot debe incluir data_provenance en la respuesta. "
            "DataProvenance no está conectado al flujo del calculador."
        )

    def test_simulate_sin_snapshot_data_provenance_es_none(self):
        """
        Sin snapshot (modo offline), data_provenance debe ser None.
        Esto es honesto — no simula provenance falso.
        """
        s = make_scenario("SLP")
        result = calcular_scenario(s, snapshot=None)
        assert result.data_provenance is None, (
            "calcular_scenario sin snapshot no debe inventar data_provenance."
        )

    @pytest.mark.asyncio
    async def test_data_provenance_tiene_zm_correcta(self):
        """El data_provenance debe contener la ZM del cálculo."""
        s = make_scenario("QRO")
        snapshot = await DataRegistry.instance().snapshot("QRO")
        result = calcular_scenario(s, snapshot=snapshot)

        assert result.data_provenance is not None
        assert result.data_provenance["zm"] == "QRO", (
            "data_provenance.zm debe ser 'QRO', no otra ZM."
        )

    @pytest.mark.asyncio
    async def test_provenance_cambia_con_zm(self):
        """
        Snapshots de SLP y QRO deben tener ZMs distintas.
        Esto prueba que cambiar ZM cambia el provenance.
        """
        snap_slp = await DataRegistry.instance().snapshot("SLP")
        snap_qro = await DataRegistry.instance().snapshot("QRO")

        assert snap_slp.zm == "SLP"
        assert snap_qro.zm == "QRO"
        assert snap_slp.zm != snap_qro.zm

        # Poblaciones también deben ser distintas
        pop_slp = next((k.valor for k in snap_slp.kpis if k.kpi_id == "poblacion_total"), None)
        pop_qro = next((k.valor for k in snap_qro.kpis if k.kpi_id == "poblacion_total"), None)
        assert pop_slp != pop_qro, "SLP y QRO deben tener poblaciones distintas en el snapshot"


# ─── Test 2: Fallback no es oficial en SimulateResponse ──────────────────────

class TestProvenanceHonestoEnSimulate:

    @pytest.mark.asyncio
    async def test_kpis_offline_no_son_oficial_en_data_provenance(self):
        """
        En el data_provenance de la respuesta, los KPIs de adapters offline
        (INEGI Censo, SEMARNAT) no deben aparecer como tipo=oficial.
        """
        s = make_scenario("SLP")
        snapshot = await DataRegistry.instance().snapshot("SLP")
        result = calcular_scenario(s, snapshot=snapshot)

        assert result.data_provenance is not None
        for kpi in result.data_provenance["kpis"]:
            # Banxico SÍ puede ser oficial si respondió (excluir)
            if kpi["kpi_id"] == "tipo_cambio_mxn_usd":
                continue
            tipo = kpi["provenance"]["tipo"]
            assert tipo != "oficial", (
                f"KPI {kpi['kpi_id']} tiene tipo=oficial en data_provenance, "
                f"pero es de un adapter offline (Censo/DBGIR/normales). "
                f"No debe presentarse como oficial sin API verificada."
            )

    def test_fallback_kpi_confianza_baja_en_provenance(self):
        """
        Si calcular_scenario usa fallback, data_provenance debe reflejar
        confianza < 0.55 para los KPIs fallback.
        """
        from app.data.schemas import FuenteTipo as FT, SnapshotDatos, KPIConProvenance, DataProvenance, AdvertenciaKPI
        snapshot_fallback = SnapshotDatos(
            zm="XYZ",
            timestamp="2026-01-01T00:00:00+00:00",
            kpis=[KPIConProvenance(
                kpi_id="poblacion_total",
                kpi_label="Población total",
                valor=1_000_000,
                unidad="habitantes",
                provenance=DataProvenance(
                    tipo=FT.manual,
                    fuente_nombre="Fallback ALQUIMIA",
                    fuente_organismo="ALQUIMIA",
                    confianza=0.45,
                    requiere_clave_api=False,
                ),
            )],
            advertencias=[],
            score_datos=45,
            bloquea_agora=False,
        )
        s = make_scenario("SLP")
        result = calcular_scenario(s, snapshot=snapshot_fallback)

        assert result.data_provenance is not None
        pob_kpi = next(
            (k for k in result.data_provenance["kpis"] if k["kpi_id"] == "poblacion_total"),
            None
        )
        if pob_kpi:
            assert pob_kpi["provenance"]["confianza"] <= 0.55, (
                f"Fallback KPI confianza debería ser <= 0.55, "
                f"got {pob_kpi['provenance']['confianza']}"
            )


# ─── Test 3: calcular_scenario usa valores del snapshot ──────────────────────

class TestCalculadorUsaSnapshot:

    def test_calcular_con_snapshot_usa_poblacion_registry(self):
        """
        Si el snapshot provee poblacion_total=999999, el calculador debe
        usar 999999, no el ZM_DATA hardcodeado.
        """
        snapshot = make_snapshot("SLP", pop=999_999)
        s = make_scenario("SLP")
        result = calcular_scenario(s, snapshot=snapshot)

        assert result.pob_activa == 999_999, (
            f"calcular_scenario debe usar la población del snapshot (999999), "
            f"pero usó {result.pob_activa}. ZM_DATA hardcoded no debe tener prioridad sobre registry."
        )

    def test_calcular_sin_snapshot_usa_zm_data(self):
        """
        Sin snapshot, el calculador usa ZM_DATA (retrocompatibilidad).
        SLP en ZM_DATA tiene pop=1_243_980.
        """
        from app.services.calculator import ZM_DATA
        s = make_scenario("SLP")
        result = calcular_scenario(s, snapshot=None)

        expected_pop = ZM_DATA["SLP"]["pop"]
        assert result.pob_activa == expected_pop, (
            f"Sin snapshot, debe usar ZM_DATA SLP pop={expected_pop}, "
            f"pero got {result.pob_activa}"
        )

    def test_calcular_con_snapshot_no_disponible_usa_fallback_interno(self):
        """
        Si el snapshot tiene tipo=no_disponible para un KPI, calcular_scenario
        debe usar el valor hardcodeado de ZM_DATA, no None.
        """
        from app.data.schemas import FuenteTipo as FT, SnapshotDatos, KPIConProvenance, DataProvenance, AdvertenciaKPI
        snapshot_sin_pop = SnapshotDatos(
            zm="SLP",
            timestamp="2026-01-01T00:00:00+00:00",
            kpis=[KPIConProvenance(
                kpi_id="poblacion_total",
                kpi_label="Población total",
                valor=None,
                unidad="habitantes",
                provenance=DataProvenance(
                    tipo=FT.no_disponible,
                    fuente_nombre="no disponible",
                    fuente_organismo="test",
                    confianza=0.0,
                    requiere_clave_api=False,
                ),
            )],
            advertencias=[],
            score_datos=0,
            bloquea_agora=True,
        )
        from app.services.calculator import ZM_DATA
        s = make_scenario("SLP")
        result = calcular_scenario(s, snapshot=snapshot_sin_pop)

        # Debe caer al ZM_DATA, no a None/0
        assert result.pob_activa == ZM_DATA["SLP"]["pop"], (
            "Con KPI no_disponible en snapshot, debe usar ZM_DATA como fallback interno."
        )
        assert result.pob_activa > 0, "pob_activa no puede ser 0 o None con fallback interno"


# ─── Test 4: ÁGORA recibe data_provenance ────────────────────────────────────

class TestAgoraRecibeProvenance:

    def test_generate_plan_request_acepta_data_provenance(self):
        """
        GeneratePlanRequest debe aceptar el campo data_provenance
        (dict con el snapshot serializado del frontend).
        """
        req = GeneratePlanRequest(
            municipio="slp",
            zm="SLP",
            scenario=ScenarioInput(),
            data_provenance={
                "zm": "SLP",
                "timestamp": "2026-04-28T00:00:00Z",
                "kpis": [],
                "advertencias": [],
                "score_datos": 85,
                "bloquea_agora": False,
            },
        )
        assert req.data_provenance is not None
        assert req.data_provenance["zm"] == "SLP"
        assert req.data_provenance["score_datos"] == 85

    def test_generate_plan_request_data_provenance_opcional(self):
        """data_provenance es opcional — no debe fallar si no se provee."""
        req = GeneratePlanRequest(
            municipio="slp",
            zm="SLP",
            scenario=ScenarioInput(),
        )
        assert req.data_provenance is None

    def test_generate_plan_request_con_advertencias_bloqueantes(self):
        """
        Cuando data_provenance tiene advertencias con bloquea_agora=True,
        el request debe aceptarlo (el gate de datos advierte, no bloquea ÁGORA).
        """
        req = GeneratePlanRequest(
            municipio="slp",
            zm="SLP",
            scenario=ScenarioInput(),
            data_provenance={
                "zm": "SLP",
                "timestamp": "2026-04-28T00:00:00Z",
                "kpis": [],
                "advertencias": [
                    {
                        "kpi_id": "poblacion_total",
                        "kpi_label": "Población total ZM",
                        "tipo": "no_disponible",
                        "advertencia": "Sin datos para esta ZM.",
                        "bloquea_agora": True,
                    }
                ],
                "score_datos": 0,
                "bloquea_agora": True,
            },
        )
        # Debe aceptarlo — el gate de datos solo advierte, no levanta 422
        assert req.data_provenance["bloquea_agora"] is True
        assert len(req.data_provenance["advertencias"]) == 1


# ─── Test 5: SimulateResponse tiene campo data_provenance ────────────────────

class TestSimulateResponseSchema:

    def test_simulate_response_tiene_campo_data_provenance(self):
        """
        SimulateResponse debe tener el campo data_provenance en su schema.
        """
        import inspect
        fields = SimulateResponse.model_fields
        assert "data_provenance" in fields, (
            "SimulateResponse no tiene el campo data_provenance. "
            "Fase 2.5 requiere este campo para conectar provenance al flujo de simulación."
        )

    def test_simulate_response_data_provenance_es_opcional(self):
        """data_provenance debe ser Optional — no romper respuestas offline."""
        fields = SimulateResponse.model_fields
        field = fields["data_provenance"]
        # En Pydantic v2, Optional fields tienen default=None
        assert field.default is None, (
            "data_provenance debe tener default=None para compatibilidad offline."
        )

    def test_calcular_retorna_simulate_response_valido_sin_snapshot(self):
        """calcular_scenario sin snapshot retorna SimulateResponse válido."""
        s = make_scenario("MTY")
        result = calcular_scenario(s)
        assert isinstance(result, SimulateResponse)
        assert result.pob_activa > 0
        assert result.rsu_total_ton_dia > 0
        assert result.data_provenance is None
