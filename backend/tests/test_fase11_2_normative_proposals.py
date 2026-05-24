import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.legal.regulatory_structure import build_municipal_legal_insertion_map
from app.legal.router import router
from app.legal.schemas import NormativeTechnique


@pytest.fixture(autouse=True)
def reset_repo():
    import app.legal.repository as mod
    mod._repo = None
    yield
    mod._repo = None


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/legal")
    return TestClient(app)


def _suggested_texts(insertion_map):
    return " ".join(proposal.texto_base_sugerido.lower() for proposal in insertion_map.proposals)


def test_municipio_con_reglamento_localizado_genera_propuesta_expositiva_no_definitiva():
    insertion_map = build_municipal_legal_insertion_map("qro")

    assert insertion_map is not None
    assert insertion_map.legal_scope == "municipio"
    assert insertion_map.municipio_id == "qro"
    assert insertion_map.source_manifest.municipio_id == "qro"
    assert insertion_map.validation_status == "pendiente_validacion_juridica"
    assert insertion_map.proposals
    assert insertion_map.validation_gate.blocks_sanctions is True
    assert insertion_map.validation_gate.blocks_definitive_document is True
    assert all(proposal.requiere_validacion_juridica for proposal in insertion_map.proposals)
    assert all(proposal.is_definitive is False for proposal in insertion_map.proposals)
    assert all(proposal.residuos_scope == "rsu_municipal" for proposal in insertion_map.proposals)


def test_municipio_sin_pdf_bloquea_sanciones_salida_definitiva_y_propuesta_normativa():
    insertion_map = build_municipal_legal_insertion_map("csp")

    assert insertion_map is not None
    assert insertion_map.municipio_id == "csp"
    assert insertion_map.source_manifest.ingest_status == "no_disponible"
    assert insertion_map.proposals == []
    assert insertion_map.validation_gate.blocks_sanctions is True
    assert insertion_map.validation_gate.blocks_definitive_document is True
    assert insertion_map.validation_gate.can_continue_education is True
    assert insertion_map.blockers
    assert "fuente municipal" in " ".join(insertion_map.blockers).lower() or "pdf" in " ".join(insertion_map.blockers).lower()
    assert insertion_map.next_action


def test_zm_no_genera_propuesta_normativa_unica():
    response = _client().get("/legal/zm/SLP/insertion-map")

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["ok"] is False
    assert detail["zm"] == "SLP"
    assert "municipio" in detail["next_action"].lower()


def test_propuesta_con_numeracion_bis_ter_requiere_validacion_juridica():
    insertion_map = build_municipal_legal_insertion_map("slp")

    assert insertion_map is not None
    numbered = [
        proposal
        for proposal in insertion_map.proposals
        if "Bis" in proposal.numeracion_sugerida or "Ter" in proposal.numeracion_sugerida
    ]
    assert numbered
    assert all(proposal.requiere_validacion_juridica for proposal in numbered)
    assert all(proposal.legal_validation_gate.requires_jurist_review for proposal in numbered)


def test_lineamiento_tecnico_no_sustituye_reforma_reglamentaria():
    insertion_map = build_municipal_legal_insertion_map("qro")

    assert insertion_map is not None
    lineamiento = next(
        proposal
        for proposal in insertion_map.proposals
        if proposal.tecnica_sugerida == NormativeTechnique.lineamiento_tecnico
    )
    assert lineamiento.does_not_replace_regulatory_reform is True
    assert lineamiento.requiere_validacion_juridica is True
    assert "no sustituye reforma reglamentaria" in lineamiento.justificacion.lower()
    assert lineamiento.legal_validation_gate.blocks_sanctions is True


def test_transitorios_se_distinguen_de_obligaciones_permanentes():
    insertion_map = build_municipal_legal_insertion_map("qro")

    assert insertion_map is not None
    transitorio = next(
        proposal
        for proposal in insertion_map.proposals
        if proposal.tecnica_sugerida == NormativeTechnique.transitorio
    )
    assert transitorio.is_permanent_obligation is False
    assert "transitorios" in transitorio.ubicacion_probable.lower()
    assert "obligaciones permanentes" in transitorio.justificacion.lower()


def test_textos_sugeridos_no_usan_lenguaje_de_dictamen_o_aprobacion():
    for municipio_id in ("slp", "qro"):
        insertion_map = build_municipal_legal_insertion_map(municipio_id)
        assert insertion_map is not None
        texts = _suggested_texts(insertion_map)
        for forbidden in ("dictamen", "oficial", "aprobado", "vigente", "sancionara"):
            assert forbidden not in texts


def test_endpoint_insertion_map_observable_para_dos_municipios_con_titulos_distintos():
    client = _client()

    slp = client.get("/legal/slp/insertion-map")
    qro = client.get("/legal/qro/insertion-map")

    assert slp.status_code == 200
    assert qro.status_code == 200
    slp_payload = slp.json()
    qro_payload = qro.json()
    assert slp_payload["municipio_id"] == "slp"
    assert qro_payload["municipio_id"] == "qro"
    assert slp_payload["reglamento_titulo"] != qro_payload["reglamento_titulo"]
    assert slp_payload["source_manifest"]["municipio_id"] == "slp"
    assert qro_payload["source_manifest"]["municipio_id"] == "qro"
    assert slp_payload["validation_gate"]["blocks_sanctions"] is True
    assert qro_payload["validation_gate"]["blocks_definitive_document"] is True
