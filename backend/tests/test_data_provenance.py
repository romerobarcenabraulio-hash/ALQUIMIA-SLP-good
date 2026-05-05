"""
Tests Fase 2 — DataProvenance layer.

Reglas que estos tests verifican:
  1. Ningún KPI se presenta como tipo=oficial sin fuente verificable en esta sesión.
  2. Los adapters nunca lanzan excepciones.
  3. Los fallbacks son honestos (tipo=manual o estimado, nunca oficial/certificado).
  4. El score_datos refleja la confianza real.
  5. Los KPIs críticos ausentes bloquean ÁGORA.
  6. FuenteStatus no reporta disponible=True si requiere_clave=True.
  7. El Banxico adapter usa tipo=estimado cuando la API no responde (mocked).
  8. El SnapshotDatos incluye advertencias para todo KPI con tipo < certificado.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch

from app.data.schemas import FuenteTipo, KPIConProvenance, SnapshotDatos
from app.data.adapters.banxico  import BanxicoAdapter
from app.data.adapters.inegi    import InegiAdapter
from app.data.adapters.semarnat import SemarnatAdapter
from app.data.adapters.smn      import SmnAdapter
from app.data.adapters.fallback import FallbackAdapter
from app.data.registry import DataRegistry, _score_datos, _bloquea_agora


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_registry():
    """Reinicia el singleton del registry entre tests."""
    DataRegistry._instance = None
    yield
    DataRegistry._instance = None


# ─────────────────────────────────────────────────────────────────────────────
# Clase 1: Contratos de adapters individuales
# ─────────────────────────────────────────────────────────────────────────────

class TestAdapterContracts:
    """Todo adapter debe cumplir el contrato de BaseAdapter."""

    @pytest.mark.asyncio
    async def test_inegi_no_lanza_excepcion(self):
        adapter = InegiAdapter()
        result = await adapter.fetch("SLP")
        assert isinstance(result, list)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_inegi_zm_desconocida_no_lanza(self):
        adapter = InegiAdapter()
        result = await adapter.fetch("XYZ_INEXISTENTE")
        assert isinstance(result, list)
        assert len(result) > 0
        # Todos deben ser no_disponible
        for kpi in result:
            assert kpi.provenance.tipo == FuenteTipo.no_disponible
            assert kpi.valor is None

    @pytest.mark.asyncio
    async def test_semarnat_no_lanza_excepcion(self):
        adapter = SemarnatAdapter()
        result = await adapter.fetch("SLP")
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_smn_no_lanza_excepcion(self):
        adapter = SmnAdapter()
        result = await adapter.fetch("MTY")
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_fallback_no_lanza_excepcion(self):
        adapter = FallbackAdapter()
        result = await adapter.fetch("QRO")
        assert isinstance(result, list)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_banxico_no_lanza_excepcion_aunque_api_falle(self):
        """Banxico debe manejar errores de red sin propagar excepción."""
        adapter = BanxicoAdapter()
        with patch("app.data.adapters.banxico.httpx.AsyncClient", side_effect=Exception("Network error")):
            result = await adapter.fetch("SLP")
        assert isinstance(result, list)
        assert len(result) == 1
        kpi = result[0]
        assert kpi.kpi_id == "tipo_cambio_mxn_usd"
        # Debe ser estimado, no oficial
        assert kpi.provenance.tipo == FuenteTipo.estimado
        assert kpi.provenance.confianza < 0.90

    @pytest.mark.asyncio
    async def test_banxico_fallback_tiene_advertencia(self):
        """Cuando Banxico falla, el fallback debe incluir advertencia visible."""
        adapter = BanxicoAdapter()
        with patch("app.data.adapters.banxico.httpx.AsyncClient", side_effect=ConnectionError("timeout")):
            result = await adapter.fetch("SLP")
        kpi = result[0]
        assert kpi.provenance.advertencia is not None
        assert len(kpi.provenance.advertencia) > 20  # No vacía ni trivial


# ─────────────────────────────────────────────────────────────────────────────
# Clase 2: Regla central — nunca tipo=oficial sin verificación
# ─────────────────────────────────────────────────────────────────────────────

class TestNuncaOficialSinVerificacion:
    """
    Regla: tipo=oficial solo cuando la fuente fue consultada en esta sesión
    y respondió con 200 + datos válidos.
    Adapters con datos hardcoded (Censo, DBGIR, normales) NO pueden ser oficial.
    """

    @pytest.mark.asyncio
    async def test_inegi_censo_es_certificado_no_oficial(self):
        """El Censo INEGI es publicación offline → certificado, no oficial."""
        adapter = InegiAdapter()
        kpis = await adapter.fetch("SLP")
        for kpi in kpis:
            if kpi.valor is not None:
                assert kpi.provenance.tipo != FuenteTipo.oficial, (
                    f"KPI {kpi.kpi_id} reporta tipo=oficial pero Censo 2020 "
                    f"es publicación offline — debe ser certificado."
                )

    @pytest.mark.asyncio
    async def test_semarnat_dbgir_es_certificado_no_oficial(self):
        adapter = SemarnatAdapter()
        kpis = await adapter.fetch("SLP")
        for kpi in kpis:
            if kpi.valor is not None:
                assert kpi.provenance.tipo != FuenteTipo.oficial, (
                    f"SEMARNAT DBGIR es publicación offline — no puede ser oficial."
                )

    @pytest.mark.asyncio
    async def test_smn_normales_son_certificado_no_oficial(self):
        adapter = SmnAdapter()
        kpis = await adapter.fetch("SLP")
        for kpi in kpis:
            if kpi.valor is not None:
                assert kpi.provenance.tipo != FuenteTipo.oficial, (
                    f"Normales climatológicas son publicación offline — no puede ser oficial."
                )

    @pytest.mark.asyncio
    async def test_fallback_nunca_es_oficial_ni_certificado(self):
        """El fallback estático SOLO puede ser manual o estimado."""
        adapter = FallbackAdapter()
        kpis = await adapter.fetch("SLP")
        for kpi in kpis:
            assert kpi.provenance.tipo in (
                FuenteTipo.manual, FuenteTipo.estimado, FuenteTipo.no_disponible
            ), (
                f"FallbackAdapter KPI {kpi.kpi_id} tiene tipo "
                f"{kpi.provenance.tipo} — no permitido para fallback estático."
            )

    @pytest.mark.asyncio
    async def test_fallback_confianza_maxima_es_baja(self):
        """El fallback no puede reportar confianza alta."""
        adapter = FallbackAdapter()
        kpis = await adapter.fetch("QRO")
        for kpi in kpis:
            assert kpi.provenance.confianza <= 0.55, (
                f"FallbackAdapter KPI {kpi.kpi_id} tiene confianza "
                f"{kpi.provenance.confianza:.2f} — máximo permitido: 0.55"
            )

    @pytest.mark.asyncio
    async def test_banxico_api_exitosa_puede_ser_oficial(self):
        """
        Excepción: si Banxico responde con 200 + datos, SÍ puede ser oficial.
        Mockeamos el AsyncClient completo para simular respuesta exitosa.
        """
        from unittest.mock import MagicMock
        fake_response = MagicMock()
        fake_response.status_code = 200
        fake_response.json.return_value = {
            "bmx": {
                "series": [{
                    "datos": [{"dato": "17.50", "fecha": "2025-01-15"}]
                }]
            }
        }
        # El adapter usa: async with httpx.AsyncClient(...) as client: r = await client.get(...)
        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(return_value=fake_response)
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_ctx.__aexit__ = AsyncMock(return_value=None)

        adapter = BanxicoAdapter()
        with patch("app.data.adapters.banxico.httpx.AsyncClient", return_value=mock_ctx):
            kpis = await adapter.fetch("SLP")
        kpi = kpis[0]
        # confianza >= 0.90 → _provenance_ok devuelve oficial
        assert kpi.provenance.tipo == FuenteTipo.oficial
        assert abs(kpi.valor - 17.50) < 0.001


# ─────────────────────────────────────────────────────────────────────────────
# Clase 3: INEGI valores correctos
# ─────────────────────────────────────────────────────────────────────────────

class TestInegiValores:

    @pytest.mark.asyncio
    @pytest.mark.parametrize("zm,poblacion", [
        ("SLP", 1_243_980),
        ("QRO", 1_404_306),
        ("MTY", 5_341_171),
    ])
    async def test_poblacion_correcta(self, zm, poblacion):
        adapter = InegiAdapter()
        kpis = await adapter.fetch(zm)
        pob = next(k for k in kpis if k.kpi_id == "poblacion_total")
        assert pob.valor == poblacion

    @pytest.mark.asyncio
    async def test_confianza_minima_censo(self):
        adapter = InegiAdapter()
        kpis = await adapter.fetch("SLP")
        for kpi in kpis:
            if kpi.valor is not None:
                assert kpi.provenance.confianza >= 0.90, (
                    f"Censo INEGI debería tener confianza >= 0.90, "
                    f"kpi={kpi.kpi_id} tiene {kpi.provenance.confianza}"
                )


# ─────────────────────────────────────────────────────────────────────────────
# Clase 4: SEMARNAT valores correctos
# ─────────────────────────────────────────────────────────────────────────────

class TestSemarnatValores:

    @pytest.mark.asyncio
    @pytest.mark.parametrize("zm,esperado", [
        ("SLP", 0.90),
        ("QRO", 0.95),
        ("MTY", 1.05),
    ])
    async def test_gen_percapita_correcta(self, zm, esperado):
        adapter = SemarnatAdapter()
        kpis = await adapter.fetch(zm)
        gen = next(k for k in kpis if k.kpi_id == "gen_percapita_kg_dia")
        assert abs(gen.valor - esperado) < 0.001

    @pytest.mark.asyncio
    async def test_composicion_suma_uno(self):
        adapter = SemarnatAdapter()
        kpis = await adapter.fetch("SLP")
        comp = next(k for k in kpis if k.kpi_id == "composicion_rsu")
        total = sum(comp.valor.values())
        assert abs(total - 1.0) < 0.001, f"Composición suma {total:.3f} ≠ 1.0"

    @pytest.mark.asyncio
    async def test_zm_desconocida_usa_valor_nacional(self):
        """ZM no catalogada → valor nacional promedio, tipo=estimado."""
        adapter = SemarnatAdapter()
        kpis = await adapter.fetch("ABC_DESCONOCIDO")
        gen = next(k for k in kpis if k.kpi_id == "gen_percapita_kg_dia")
        assert gen.valor is not None
        assert gen.provenance.tipo == FuenteTipo.estimado
        assert gen.provenance.confianza < 0.70


# ─────────────────────────────────────────────────────────────────────────────
# Clase 5: DataRegistry — integración y honestidad
# ─────────────────────────────────────────────────────────────────────────────

class TestDataRegistry:

    @pytest.mark.asyncio
    async def test_snapshot_slp_incluye_kpis_basicos(self):
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("SLP")
        kpi_ids = {k.kpi_id for k in snapshot.kpis}
        assert "poblacion_total"      in kpi_ids
        assert "gen_percapita_kg_dia" in kpi_ids
        assert "composicion_rsu"      in kpi_ids
        assert "tipo_cambio_mxn_usd"  in kpi_ids

    @pytest.mark.asyncio
    async def test_snapshot_retorna_tipo_str_enum_valido(self):
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("QRO")
        for kpi in snapshot.kpis:
            assert kpi.provenance.tipo in list(FuenteTipo), (
                f"KPI {kpi.kpi_id} tiene tipo inválido: {kpi.provenance.tipo}"
            )

    @pytest.mark.asyncio
    async def test_snapshot_tiene_score_entre_0_y_100(self):
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("MTY")
        assert 0 <= snapshot.score_datos <= 100

    @pytest.mark.asyncio
    async def test_snapshot_zm_desconocida_no_lanza(self):
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("ZM_INEXISTENTE")
        assert isinstance(snapshot, SnapshotDatos)
        assert snapshot.zm == "ZM_INEXISTENTE"

    @pytest.mark.asyncio
    async def test_fuentes_status_tiene_adapters(self):
        registry = DataRegistry.instance()
        fuentes = registry.fuentes_status()
        assert len(fuentes) >= 4
        ids = {f.id for f in fuentes}
        assert "inegi_poblacion"   in ids
        assert "semarnat_rsu"      in ids
        assert "banxico_tipo_cambio" in ids
        assert "smn_clima"         in ids

    @pytest.mark.asyncio
    async def test_registry_prefiere_mayor_confianza(self):
        """
        Si dos adapters proveen el mismo KPI, el registry debe elegir
        el de mayor prioridad de tipo (o mayor confianza si igual tipo).
        INEGI Censo (certificado, 0.93) > Fallback (manual, 0.45).
        """
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("SLP")
        pob = next(k for k in snapshot.kpis if k.kpi_id == "poblacion_total")
        # Debe ser certificado (INEGI), no manual (fallback)
        assert pob.provenance.tipo in (FuenteTipo.certificado, FuenteTipo.oficial), (
            f"poblacion_total debería ser certificado desde INEGI, "
            f"pero es {pob.provenance.tipo}"
        )

    @pytest.mark.asyncio
    async def test_snapshot_no_tiene_tipo_oficial_hardcoded(self):
        """
        Sin Banxico real disponible (API puede fallar en CI),
        los datos hardcoded NUNCA deben ser oficial.
        Este test verifica adapters offline específicamente.
        """
        registry = DataRegistry.instance()
        snapshot = await registry.snapshot("SLP")
        for kpi in snapshot.kpis:
            # Banxico puede ser oficial si la API respondió — lo excluimos
            if kpi.kpi_id == "tipo_cambio_mxn_usd":
                continue
            # Todos los demás son hardcoded → máximo certificado
            assert kpi.provenance.tipo != FuenteTipo.oficial, (
                f"KPI {kpi.kpi_id} es oficial pero no viene de API verificada"
            )


# ─────────────────────────────────────────────────────────────────────────────
# Clase 6: Lógica interna de score y bloqueo ÁGORA
# ─────────────────────────────────────────────────────────────────────────────

class TestScoreYBloqueo:

    def _make_kpi(self, kpi_id: str, tipo: FuenteTipo, confianza: float, valor=1.0):
        from app.data.schemas import DataProvenance
        return KPIConProvenance(
            kpi_id=kpi_id,
            kpi_label=kpi_id,
            valor=valor,
            unidad="u",
            provenance=DataProvenance(
                tipo=tipo,
                fuente_nombre="test",
                fuente_organismo="test",
                confianza=confianza,
                requiere_clave_api=False,
            ),
        )

    def test_score_cero_cuando_sin_valores(self):
        kpis = [self._make_kpi("x", FuenteTipo.no_disponible, 0.0, valor=None)]
        assert _score_datos(kpis) == 0

    def test_score_alto_con_confianza_alta(self):
        kpis = [
            self._make_kpi("a", FuenteTipo.certificado, 0.93),
            self._make_kpi("b", FuenteTipo.certificado, 0.88),
        ]
        score = _score_datos(kpis)
        assert score >= 85

    def test_bloquea_agora_cuando_poblacion_no_disponible(self):
        kpis = [
            self._make_kpi("poblacion_total", FuenteTipo.no_disponible, 0.0, valor=None),
            self._make_kpi("gen_percapita_kg_dia", FuenteTipo.certificado, 0.82),
        ]
        assert _bloquea_agora(kpis) is True

    def test_no_bloquea_agora_cuando_criticos_disponibles(self):
        kpis = [
            self._make_kpi("poblacion_total",      FuenteTipo.certificado, 0.93),
            self._make_kpi("gen_percapita_kg_dia", FuenteTipo.certificado, 0.82),
        ]
        assert _bloquea_agora(kpis) is False

    def test_bloquea_agora_cuando_confianza_critica_baja(self):
        """Confianza < 0.60 en KPI crítico → bloquea."""
        kpis = [
            self._make_kpi("poblacion_total",      FuenteTipo.manual, 0.40),
            self._make_kpi("gen_percapita_kg_dia", FuenteTipo.certificado, 0.82),
        ]
        assert _bloquea_agora(kpis) is True

    def test_no_bloquea_por_kpis_no_criticos(self):
        """Solo los KPIs críticos pueden bloquear ÁGORA."""
        kpis = [
            self._make_kpi("poblacion_total",      FuenteTipo.certificado, 0.93),
            self._make_kpi("gen_percapita_kg_dia", FuenteTipo.certificado, 0.82),
            self._make_kpi("tipo_cambio_mxn_usd",  FuenteTipo.no_disponible, 0.0, valor=None),
        ]
        assert _bloquea_agora(kpis) is False


# ─────────────────────────────────────────────────────────────────────────────
# Clase 7: FuenteStatus honesto
# ─────────────────────────────────────────────────────────────────────────────

class TestFuenteStatusHonesto:
    """
    El status de cada fuente debe reportar disponibilidad honesta.
    """

    def test_adapters_sin_clave_reportan_disponible(self):
        registry = DataRegistry.instance()
        for fuente in registry.fuentes_status():
            if not fuente.requiere_clave:
                assert fuente.disponible is True, (
                    f"Adapter {fuente.id} no requiere clave pero reporta disponible=False"
                )

    def test_adapters_con_clave_reportan_no_disponible(self):
        registry = DataRegistry.instance()
        for fuente in registry.fuentes_status():
            if fuente.requiere_clave:
                assert fuente.disponible is False, (
                    f"Adapter {fuente.id} requiere clave pero reporta disponible=True"
                )

    def test_tipo_maximo_de_adapters_offline(self):
        """
        Adapters que no hacen llamadas en tiempo real no pueden tener
        tipo_maximo=oficial.
        """
        registry = DataRegistry.instance()
        offline_ids = {"inegi_poblacion", "semarnat_rsu", "smn_clima", "fallback_estatico"}
        for fuente in registry.fuentes_status():
            if fuente.id in offline_ids:
                assert fuente.tipo_maximo != FuenteTipo.oficial, (
                    f"Adapter offline {fuente.id} reporta tipo_maximo=oficial"
                )
