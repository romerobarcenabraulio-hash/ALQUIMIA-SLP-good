"""
Tests del Motor Jurídico Municipal — Fase 1.5

Principio verificado: Una ZM no es un municipio.

Cubre:
  - 20 municipios individuales (SLP×4, QRO×4, MTY×9, GDL×3)
  - build_diagnostic: campos, rangos, coherencia
  - select_strategy: reglas A/B/C/D
  - gates ÁGORA por municipio
  - PaqueteMetropolitano: dos capas, oleadas, municipios líderes
  - Repository: verificación, upsert, lookup por ZM
"""
import pytest

from app.legal.diagnostic import build_diagnostic, build_municipal_legal_context
from app.legal.metropolitan import build_paquete_metropolitano
from app.legal.reform_strategy import select_strategy
from app.legal.repository import get_repo, ZM_MUNICIPIOS, MUNICIPIO_NOMBRES
from app.legal.schemas import (
    EstadoArticulo, ReformEstrategia, Criticidad,
)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_repo():
    import app.legal.repository as mod
    mod._repo = None
    yield
    mod._repo = None


# ─── Inventario del repositorio ───────────────────────────────────────────────

class TestRepositorioInventario:

    def test_total_municipios(self):
        """Debe haber exactamente 20 municipios seedeados (incl. ZM Guadalajara)."""
        repo = get_repo()
        assert len(repo.all_municipios()) == 20

    def test_zm_slp_tiene_4_municipios(self):
        assert len(ZM_MUNICIPIOS["SLP"]) == 4
        for m in ["slp", "sol", "csp", "vip"]:
            assert m in ZM_MUNICIPIOS["SLP"]

    def test_zm_qro_tiene_4_municipios(self):
        assert len(ZM_MUNICIPIOS["QRO"]) == 4
        for m in ["qro", "cor", "mar", "hui"]:
            assert m in ZM_MUNICIPIOS["QRO"]

    def test_zm_mty_tiene_9_municipios(self):
        assert len(ZM_MUNICIPIOS["MTY"]) == 9
        for m in ["mty", "spg", "snl", "gua", "apo", "sca", "gar", "esc", "jua"]:
            assert m in ZM_MUNICIPIOS["MTY"]

    def test_zm_gdl_tiene_3_municipios(self):
        assert len(ZM_MUNICIPIOS["GDL"]) == 3
        for m in ["gdl", "zap", "tla"]:
            assert m in ZM_MUNICIPIOS["GDL"]

    def test_todos_municipios_tienen_nombre(self):
        for m_id in get_repo().all_municipios():
            assert m_id in MUNICIPIO_NOMBRES, f"{m_id} sin nombre"

    def test_get_municipios_by_zm(self):
        repo = get_repo()
        assert set(repo.get_municipios_by_zm("SLP")) == {"slp", "sol", "csp", "vip"}
        assert set(repo.get_municipios_by_zm("QRO")) == {"qro", "cor", "mar", "hui"}
        assert len(repo.get_municipios_by_zm("MTY")) == 9
        assert set(repo.get_municipios_by_zm("GDL")) == {"gdl", "zap", "tla"}

    def test_zm_desconocida_retorna_lista_vacia(self):
        repo = get_repo()
        assert repo.get_municipios_by_zm("XYZ") == []

    def test_get_zm_for_municipio(self):
        repo = get_repo()
        assert repo.get_zm_for_municipio("slp") == "SLP"
        assert repo.get_zm_for_municipio("spg") == "MTY"
        assert repo.get_zm_for_municipio("hui") == "QRO"
        assert repo.get_zm_for_municipio("gdl") == "GDL"
        assert repo.get_zm_for_municipio("xxx") is None


# ─── Diagnóstico — todos los municipios ──────────────────────────────────────

ALL_MUNICIPIOS = (
    ZM_MUNICIPIOS["SLP"] + ZM_MUNICIPIOS["QRO"] + ZM_MUNICIPIOS["MTY"] + ZM_MUNICIPIOS["GDL"]
)


class TestCLCExpositorMunicipal:

    def test_disclaimers_y_next_actions_unicos_longitud(self):
        disc: set[str] = set()
        acts: set[str] = set()
        for m_id in sorted(get_repo().all_municipios()):
            d = build_diagnostic(m_id)
            assert d is not None
            assert len(d.legal_disclaimer) <= 220, (m_id, d.legal_disclaimer)
            assert "brecha" in d.legal_disclaimer.lower()
            assert "dictamen" in d.legal_disclaimer.lower() and "alquimia" in d.legal_disclaimer.lower()
            disc.add(d.legal_disclaimer)
            acts.add(d.next_action)
        assert len(disc) == 20
        assert len(acts) == 20


class TestDiagnosticoTodos:

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_retorna_diagnostico(self, m_id):
        d = build_diagnostic(m_id)
        assert d is not None, f"{m_id}: debe retornar diagnóstico"

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_tiene_12_articulos(self, m_id):
        d = build_diagnostic(m_id)
        assert len(d.articulos) == 12, f"{m_id}: esperado 12, got {len(d.articulos)}"

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_score_en_rango(self, m_id):
        d = build_diagnostic(m_id)
        assert 0 <= d.score_legal <= 100, f"{m_id}: score={d.score_legal}"

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_brecha_critica_leq_brecha_total(self, m_id):
        d = build_diagnostic(m_id)
        assert d.brecha_critica <= d.brecha_total, f"{m_id}"

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_fecha_diagnostico_iso(self, m_id):
        d = build_diagnostic(m_id)
        assert len(d.fecha_diagnostico) == 10

    def test_desconocido_retorna_none(self):
        assert build_diagnostic("xyz") is None


# ─── Gates ÁGORA por municipio ────────────────────────────────────────────────

class TestGatesAgora:

    # Verificados → no bloqueados
    @pytest.mark.parametrize("m_id", ["qro", "mty", "spg"])
    def test_municipios_verificados_no_bloqueados(self, m_id):
        d = build_diagnostic(m_id)
        assert d.agora_bloqueado is False, f"{m_id} debería estar desbloqueado"

    # Sin verificar → bloqueados
    @pytest.mark.parametrize("m_id", [
        "slp", "sol", "csp", "vip",          # ZM SLP
        "cor", "mar", "hui",                   # ZM QRO (menos qro)
        "snl", "gua", "apo", "sca",           # ZM MTY
        "gar", "esc", "jua",
    ])
    def test_municipios_no_verificados_bloqueados(self, m_id):
        d = build_diagnostic(m_id)
        assert d.agora_bloqueado is True, f"{m_id} debería estar bloqueado"

    def test_verificar_slp_desbloquea_agora(self):
        repo = get_repo()
        assert build_diagnostic("slp").agora_bloqueado is True
        repo.set_verificado("slp", True)
        assert build_diagnostic("slp").agora_bloqueado is False

    def test_verificar_sol_no_afecta_slp(self):
        """Municipios son independientes — verificar uno no afecta al otro."""
        repo = get_repo()
        repo.set_verificado("sol", True)
        assert build_diagnostic("slp").agora_bloqueado is True   # SLP sigue bloqueado
        assert build_diagnostic("sol").agora_bloqueado is False  # SOL desbloqueado

    def test_desverificar_qro(self):
        repo = get_repo()
        assert build_diagnostic("qro").agora_bloqueado is False
        repo.set_verificado("qro", False)
        assert build_diagnostic("qro").agora_bloqueado is True

    def test_zm_no_es_municipio_gate(self):
        """
        El gate no se puede verificar a nivel ZM: verificar 'slp' no
        desbloquea toda la ZM SLP — cada municipio es independiente.
        """
        repo = get_repo()
        repo.set_verificado("slp", True)
        # sol sigue bloqueado
        assert build_diagnostic("sol").agora_bloqueado is True
        assert build_diagnostic("csp").agora_bloqueado is True
        assert build_diagnostic("vip").agora_bloqueado is True


# ─── Fase 11.1: Contexto legal municipal endurecido ─────────────────────────

class TestFase111LegalMunicipal:

    def test_diagnostico_incluye_manifest_y_validacion_por_municipio(self):
        d = build_diagnostic("slp")
        assert d.legal_scope == "municipio"
        assert d.jurisdiction_scope == "Municipality"
        assert d.source_manifest.municipio_id == "slp"
        assert d.source_manifest.zm == "SLP"
        assert d.legal_validation_status == "pendiente_validacion_juridica"
        assert d.officiality == "fuente_localizada_no_validada"
        assert "dictamen" in d.legal_disclaimer.lower() and "alquimia" in d.legal_disclaimer.lower()

    def test_municipio_sin_fuente_queda_pendiente_y_bloquea_sanciones_no_simulacion(self):
        d = build_diagnostic("sol")
        assert d.source_manifest.ingest_status == "no_disponible"
        assert d.legal_validation_status == "no_disponible"
        assert d.can_enable_education is True
        assert d.can_enable_simulation is True
        assert d.can_enable_sanctions is False
        assert d.can_generate_official_document is False
        assert d.sanctions_blocked_reason
        assert d.official_document_blocked_reason

    def test_fuente_localizada_no_habilita_sanciones_sin_validacion_competente(self):
        d = build_diagnostic("qro")
        assert d.source_manifest.ingest_status == "localizado"
        assert d.legal_validation_status == "pendiente_validacion_juridica"
        assert d.can_enable_sanctions is False
        assert d.can_generate_official_document is False
        assert "externa" in d.sanctions_blocked_reason.lower()

    def test_contexto_municipal_tiene_obligaciones_limites_bloqueos_y_accion(self):
        c = build_municipal_legal_context("qro")
        assert c is not None
        assert c.legal_scope == "municipio"
        assert c.jurisdiction_scope == "Municipality"
        assert c.municipio_id == "qro"
        assert c.zm == "QRO"
        assert c.source_manifest.municipio_id == "qro"
        assert c.obligaciones
        assert c.limites
        assert c.bloqueos
        assert c.next_action
        assert c.can_enable_education is True
        assert c.can_enable_simulation is True
        assert c.can_enable_sanctions is False

    def test_zm_no_sustituye_contexto_municipal(self):
        slp = build_municipal_legal_context("slp")
        sol = build_municipal_legal_context("sol")
        assert slp is not None and sol is not None
        assert slp.source_manifest.municipio_id == "slp"
        assert sol.source_manifest.municipio_id == "sol"
        assert slp.source_manifest.ingest_status != sol.source_manifest.ingest_status

    def test_endpoint_zm_context_rechaza_contexto_legal_unico(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        from app.legal.router import router

        app = FastAPI()
        app.include_router(router, prefix="/legal")
        res = TestClient(app).get("/legal/zm/SLP/context")

        assert res.status_code == 400
        detail = res.json()["detail"]
        assert detail["ok"] is False
        assert "ZM" in detail["error"]
        assert "/legal/{municipio}/context" in detail["next_action"]

    def test_convenio_metropolitano_no_es_reglamento_municipal(self):
        p = build_paquete_metropolitano("SLP", ZM_MUNICIPIOS["SLP"])
        coord = p.paquete_metropolitano
        assert hasattr(coord, "convenio_marco_zm")
        assert not hasattr(coord, "source_manifest")
        for dm in p.paquete_municipal:
            assert dm.diagnostic.source_manifest.municipio_id == dm.municipio_id


# ─── Estrategia de reforma ────────────────────────────────────────────────────

class TestEstrategias:

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_retorna_estrategia_valida(self, m_id):
        d = build_diagnostic(m_id)
        s = select_strategy(d)
        assert s.estrategia in (
            ReformEstrategia.A, ReformEstrategia.B,
            ReformEstrategia.C, ReformEstrategia.D
        )

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_plazo_positivo(self, m_id):
        d = build_diagnostic(m_id)
        s = select_strategy(d)
        assert s.plazo_meses > 0

    @pytest.mark.parametrize("m_id", ALL_MUNICIPIOS)
    def test_articulos_clave_formato(self, m_id):
        d = build_diagnostic(m_id)
        s = select_strategy(d)
        for num in s.articulos_clave:
            assert num.startswith("Art."), f"{m_id}: artículo clave inesperado '{num}'"

    def test_spg_estrategia_optima(self):
        """San Pedro Garza García: el reglamento más completo → A o B."""
        d = build_diagnostic("spg")
        s = select_strategy(d)
        assert s.estrategia in (ReformEstrategia.A, ReformEstrategia.B)
        assert s.agora_bloqueado is False

    def test_micro_municipios_estrategia_alta(self):
        """Micro-municipios sin reglamento → estrategia C o D."""
        for m_id in ["csp", "vip", "hui", "jua"]:
            d = build_diagnostic(m_id)
            s = select_strategy(d)
            assert s.estrategia in (ReformEstrategia.C, ReformEstrategia.D), \
                f"{m_id}: esperado C/D, got {s.estrategia}"

    def test_motivo_bloqueo_cuando_bloqueado(self):
        """Municipios bloqueados deben tener motivo explicado."""
        for m_id in ["slp", "sol", "csp"]:
            d = build_diagnostic(m_id)
            s = select_strategy(d)
            assert s.motivo_bloqueo is not None, f"{m_id}: falta motivo_bloqueo"
            assert len(s.motivo_bloqueo) > 10

    def test_sin_motivo_cuando_verificado(self):
        for m_id in ["qro", "mty", "spg"]:
            d = build_diagnostic(m_id)
            s = select_strategy(d)
            assert s.motivo_bloqueo is None, f"{m_id}: no debería tener motivo"

    def test_regla_D(self):
        """Brecha crítica >= 3 + bloqueado → D."""
        import copy
        d = build_diagnostic("slp")
        d2 = copy.copy(d)
        object.__setattr__(d2, "brecha_critica", 3)
        object.__setattr__(d2, "agora_bloqueado", True)
        assert select_strategy(d2).estrategia == ReformEstrategia.D

    def test_regla_C(self):
        """Brecha total >= 8 + no bloqueado → C."""
        import copy
        d = build_diagnostic("slp")
        d2 = copy.copy(d)
        object.__setattr__(d2, "brecha_total", 9)
        object.__setattr__(d2, "agora_bloqueado", False)
        object.__setattr__(d2, "brecha_critica", 2)
        assert select_strategy(d2).estrategia == ReformEstrategia.C

    def test_regla_A(self):
        """Score alto + brecha baja → A."""
        import copy
        d = build_diagnostic("spg")
        d2 = copy.copy(d)
        object.__setattr__(d2, "brecha_total", 0)
        object.__setattr__(d2, "score_legal", 95)
        object.__setattr__(d2, "agora_bloqueado", False)
        assert select_strategy(d2).estrategia == ReformEstrategia.A


# ─── Paquete Metropolitano ────────────────────────────────────────────────────

class TestPaqueteMetropolitano:

    @pytest.mark.parametrize("zm,n", [("SLP", 4), ("QRO", 4), ("MTY", 9)])
    def test_total_municipios(self, zm, n):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        assert p.total_municipios == n

    @pytest.mark.parametrize("zm", ["SLP", "QRO", "MTY"])
    def test_paquete_municipal_completo(self, zm):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        assert len(p.paquete_municipal) == len(ZM_MUNICIPIOS[zm])

    @pytest.mark.parametrize("zm", ["SLP", "QRO", "MTY"])
    def test_score_zm_en_rango(self, zm):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        assert 0 <= p.score_legal_zm <= 100

    def test_slp_zm_tiene_bloqueados(self):
        p = build_paquete_metropolitano("SLP", ZM_MUNICIPIOS["SLP"])
        assert p.municipios_bloqueados == 4  # todos bloqueados en SLP ZM

    def test_qro_zm_capital_desbloqueado(self):
        p = build_paquete_metropolitano("QRO", ZM_MUNICIPIOS["QRO"])
        # qro está verificado → solo 3 bloqueados (cor, mar, hui)
        assert p.municipios_bloqueados == 3

    def test_mty_score_mayor_que_slp(self):
        p_mty = build_paquete_metropolitano("MTY", ZM_MUNICIPIOS["MTY"])
        p_slp = build_paquete_metropolitano("SLP", ZM_MUNICIPIOS["SLP"])
        assert p_mty.score_legal_zm > p_slp.score_legal_zm

    @pytest.mark.parametrize("zm", ["SLP", "QRO", "MTY"])
    def test_paquete_metropolitano_tiene_oleadas(self, zm):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        coord = p.paquete_metropolitano
        assert len(coord.oleadas) > 0
        for o in coord.oleadas:
            assert o.numero > 0
            assert o.mes_inicio < o.mes_fin
            assert len(o.municipios) > 0

    @pytest.mark.parametrize("zm", ["SLP", "QRO", "MTY"])
    def test_municipios_lider_en_zm(self, zm):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        for lider in p.paquete_metropolitano.municipios_lider:
            assert lider in ZM_MUNICIPIOS[zm], f"{zm}: líder '{lider}' no en ZM"

    def test_mty_convenio_firmado(self):
        p = build_paquete_metropolitano("MTY", ZM_MUNICIPIOS["MTY"])
        assert p.paquete_metropolitano.convenio_marco_zm == "firmado"

    def test_slp_convenio_pendiente(self):
        p = build_paquete_metropolitano("SLP", ZM_MUNICIPIOS["SLP"])
        assert p.paquete_metropolitano.convenio_marco_zm == "pendiente"

    def test_municipios_bloqueados_en_capa_2(self):
        """La capa metropolitana lista correctamente los municipios bloqueados."""
        p = build_paquete_metropolitano("SLP", ZM_MUNICIPIOS["SLP"])
        bloqueados_ids = p.paquete_metropolitano.municipios_bloqueados
        assert set(bloqueados_ids) == {"slp", "sol", "csp", "vip"}

    def test_no_mezcla_convenio_con_reglamento(self):
        """
        Verificar que la capa metropolitana tiene campos propios distintos
        a los del reglamento municipal. Principio: no mezclar.
        """
        p = build_paquete_metropolitano("MTY", ZM_MUNICIPIOS["MTY"])
        coord = p.paquete_metropolitano
        # La capa metro tiene convenio_marco_zm, no reglamento_nombre
        assert hasattr(coord, "convenio_marco_zm")
        assert hasattr(coord, "oleadas")
        assert not hasattr(coord, "reglamento_nombre")
        # La capa municipal tiene reglamento por municipio
        for dm in p.paquete_municipal:
            assert hasattr(dm.diagnostic, "reglamento_nombre")

    @pytest.mark.parametrize("zm", ["SLP", "QRO", "MTY"])
    def test_nota_no_vacia(self, zm):
        p = build_paquete_metropolitano(zm, ZM_MUNICIPIOS[zm])
        assert len(p.paquete_metropolitano.nota) > 20


# ─── Repository ──────────────────────────────────────────────────────────────

class TestRepository:

    def test_upsert_cambia_version(self):
        from app.legal.schemas import Reglamento
        repo = get_repo()
        reg_nuevo = Reglamento(
            municipio_id="qro", zm="QRO",
            nombre="Reglamento QRO actualizado",
            version="2024-X", fecha_publicacion="2024-06-01",
            fuente="POE", verificado=True, requiere_revision_juridica=False,
        )
        repo.upsert_reglamento(reg_nuevo)
        assert repo.get_reglamento("qro").version == "2024-X"

    def test_upsert_preserva_otros_municipios(self):
        """Actualizar un municipio no afecta a los demás."""
        from app.legal.schemas import Reglamento
        repo = get_repo()
        qro_v_orig = repo.get_reglamento("qro").version
        repo.upsert_reglamento(Reglamento(
            municipio_id="slp", zm="SLP",
            nombre="Reforma SLP 2024", version="2024-Z",
            fecha_publicacion="2024-01-01", fuente="POE",
            verificado=True, requiere_revision_juridica=False,
        ))
        assert repo.get_reglamento("qro").version == qro_v_orig

    def test_set_verificado_retorna_false_si_no_existe(self):
        repo = get_repo()
        assert repo.set_verificado("xxx", True) is False

    def test_municipio_nombre_legible(self):
        repo = get_repo()
        assert "Potosí" in repo.get_municipio_nombre("slp") or "Luis" in repo.get_municipio_nombre("slp")
        assert "Pedro" in repo.get_municipio_nombre("spg")
        assert "Querétaro" in repo.get_municipio_nombre("qro")
