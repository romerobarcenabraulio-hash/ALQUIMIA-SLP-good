"""
Wave 1 — Integration tests.
Cubre: research_service helpers, survey_builder, centros_acopio repository,
planning builder (Gantt/PERT/RACI), validator Wave 3 (DNA, feedback),
y el pipeline agora completo con 11 documentos en modo fallback.
"""
from __future__ import annotations

import asyncio
import uuid

import pytest

# ─── research_service ─────────────────────────────────────────────────────────

def test_classify_query_all_categories():
    from app.agents.research_service import _classify_query
    assert _classify_query("costo construccion bodega m2") == "costos_construccion"
    assert _classify_query("precio terreno predio") == "costos_terreno"
    assert _classify_query("precio camion recolector flota") == "costos_flota"
    assert _classify_query("costo disposicion relleno tonelada") == "costos_disposicion"
    assert _classify_query("precio PET aluminio reciclado") == "precios_materiales"
    assert _classify_query("reglamento aseo publico municipio") == "reglamentos"
    assert _classify_query("benchmark latam america municipio comparable") == "benchmarks_latam"


def test_domain_tier_known():
    from app.agents.research_service import _tier_for_domain
    tier, conf = _tier_for_domain("inegi.org.mx")
    assert tier == "tier1" and conf >= 0.90

    tier, conf = _tier_for_domain("cmic.org.mx")
    assert tier == "tier2" and conf >= 0.70

    tier, conf = _tier_for_domain("random-blog.wordpress.com")
    assert tier == "tier4" and conf <= 0.50


def test_extract_number_formats():
    from app.agents.research_service import _extract_number
    assert _extract_number("precio $1,234.56 MXN/m2") == 1234.56
    assert _extract_number("costo 2500 pesos por metro") == 2500.0
    assert _extract_number("sin cifras aquí") is None


def test_research_service_offline_returns_empty_findings():
    """Sin SERPER_API_KEY el servicio retorna findings vacíos con advertencia."""
    import os
    from app.agents.research_service import ResearchService

    # Asegurar que no hay key en el entorno de test
    os.environ.pop("SERPER_API_KEY", None)
    svc = ResearchService(api_key=None)

    findings = asyncio.run(svc.investigate("San Luis Potosí", "SLP", "SLP"))
    assert findings.zm == "SLP"
    assert findings.municipio == "San Luis Potosí"
    assert len(findings.advertencias) >= 1
    assert not findings.fuente_serper
    assert findings.queries_ejecutadas == 0


# ─── survey_builder ───────────────────────────────────────────────────────────

def test_survey_builder_base_questions():
    from app.agents.survey_builder import build_survey
    s = build_survey("San Luis Potosí", "SLP")
    assert len(s.preguntas) >= 15
    assert s.municipio == "San Luis Potosí"
    assert s.zm == "SLP"
    assert s.n_secciones() >= 5


def test_survey_builder_risk_questions_added():
    from app.agents.survey_builder import build_survey
    s = build_survey("Soledad", "SLP", riesgos_detectados=["residuos_peligrosos", "tiraderos"])
    ids = [p.texto for p in s.preguntas]
    # deben aparecer las preguntas de riesgo
    assert any("baterías" in t or "pil" in t.lower() for t in ids)
    assert any("tiraderos" in t.lower() or "clandestino" in t.lower() for t in ids)


def test_survey_csv_template_columns():
    from app.agents.survey_builder import build_survey
    from app.agents.survey_pdf import generate_survey_csv_template
    s = build_survey("Querétaro", "QRO")
    csv = generate_survey_csv_template(s)
    lines = csv.strip().splitlines()
    # header + una línea por pregunta
    assert len(lines) == len(s.preguntas) + 1
    assert "pregunta_id" in lines[0]


def test_survey_digital_link():
    from app.agents.survey_builder import build_survey
    from app.agents.survey_pdf import generate_digital_link_stub
    s = build_survey("Monterrey", "MTY")
    link = generate_digital_link_stub(s)
    assert str(s.survey_id) in link
    assert link.startswith("https://")


# ─── centros_acopio repository ────────────────────────────────────────────────

def test_centros_acopio_seed():
    from app.centros_acopio.repository import count, list_centros
    assert count() >= 4


def test_centros_acopio_filter_by_zm():
    from app.centros_acopio.repository import list_centros
    slp = list_centros(zm="SLP")
    qro = list_centros(zm="QRO")
    assert len(slp) >= 3
    assert len(qro) >= 1
    assert all(c.zm == "SLP" for c in slp)


def test_centros_acopio_filter_by_material():
    from app.centros_acopio.repository import list_centros
    from app.agents.schemas import CentroAcopioMaterial
    pet_centers = list_centros(zm="SLP", material=CentroAcopioMaterial.pet)
    assert all(CentroAcopioMaterial.pet in c.materiales for c in pet_centers)


def test_centros_acopio_upsert_and_get():
    from app.centros_acopio.repository import upsert, get, delete
    from app.agents.schemas import CentroAcopio, CentroAcopioTipo
    new_id = f"test-{uuid.uuid4().hex[:8]}"
    c = CentroAcopio(
        centro_id=new_id,
        nombre="Test Centro",
        tipo=CentroAcopioTipo.punto_verde,
        direccion="Av. Test 123",
        municipio="Monterrey",
        estado="Nuevo León",
        zm="MTY",
    )
    saved = upsert(c)
    assert saved.centro_id == new_id
    found = get(new_id)
    assert found is not None and found.nombre == "Test Centro"
    delete(new_id)
    assert get(new_id) is None


# ─── planning builder ─────────────────────────────────────────────────────────

def test_gantt_task_count_and_critical():
    from app.planning.builder import build_gantt
    g = build_gantt("San Luis Potosí", "SLP", "scen-001", n_cas_pequeno=2, capex_total=2_000_000)
    assert len(g.tasks) == 15
    criticas = g.ruta_critica()
    assert len(criticas) >= 5
    assert g.costo_total_mxn > 0


def test_gantt_capex_scaling():
    """CAPEX más grande produce tareas con costo más alto."""
    from app.planning.builder import build_gantt
    g1 = build_gantt("SLP", "SLP", "s1", capex_total=1_000_000)
    g2 = build_gantt("SLP", "SLP", "s2", capex_total=3_000_000)
    assert g2.costo_total_mxn > g1.costo_total_mxn


def test_pert_critical_path():
    from app.planning.builder import build_gantt, build_pert
    g = build_gantt("Querétaro", "QRO", "scen-qro", capex_total=2_500_000)
    p = build_pert(g)
    assert p.duracion_total_semanas > 0
    criticos = [n for n in p.nodes if n.es_critico]
    assert len(criticos) >= 4
    # Todos los críticos tienen holgura ~0
    for n in criticos:
        assert abs(n.holgura) < 0.05


def test_pert_all_nodes_have_early_late_times():
    from app.planning.builder import build_gantt, build_pert
    g = build_gantt("MTY", "MTY", "s-mty", capex_total=5_000_000)
    p = build_pert(g)
    for node in p.nodes:
        assert node.tiempo_temprano >= 0
        assert node.tiempo_tardio >= 0
        assert node.holgura >= -0.01  # holgura nunca negativa significativamente


def test_raci_process_count():
    from app.planning.builder import build_raci
    r = build_raci("San Luis Potosí", "SLP", "scen-raci")
    assert len(r.filas) == 15
    # Todos tienen responsable y aprueba
    for fila in r.filas:
        assert fila.responsable
        assert fila.aprueba


# ─── validator Wave 3 ─────────────────────────────────────────────────────────

def test_document_dna_length_and_uniqueness():
    from app.agents.validator import build_document_dna
    dna1 = build_document_dna("slp", "scen-001", "doc-001", "SLP")
    dna2 = build_document_dna("slp", "scen-001", "doc-001", "SLP")
    assert len(dna1) == 12
    # DNA incluye timestamp → siempre único
    assert dna1 != dna2


def test_document_footer_contains_dna():
    from app.agents.validator import stamp_document_footer
    from app.agents.schemas import DocumentSpec, DocumentNivel, DraftDocument
    spec = DocumentSpec(
        document_id="test-doc",
        titulo="Test",
        audiencia=["Equipo"],
        decision_que_habilita="Probar",
        nivel=DocumentNivel.tecnico,
        secciones_obligatorias=["1. Test"],
    )
    draft = DraftDocument(document_id="test-doc", spec=spec)
    footer = stamp_document_footer(draft, "slp", "scen-001", "SLP")
    assert "DNA:" in footer
    assert "SLP" in footer
    assert "ALQUIMIA" in footer


def test_revision_feedback_for_empty_doc():
    from app.agents.validator import build_revision_feedback
    from app.agents.schemas import (
        DocumentSpec, DocumentNivel, DraftDocument,
        ScenarioBundle,
    )
    spec = DocumentSpec(
        document_id="empty-doc",
        titulo="Doc vacío",
        audiencia=["Regidores"],
        decision_que_habilita="Probar feedback",
        nivel=DocumentNivel.ejecutivo,
        secciones_obligatorias=["1. Contenido"],
    )
    draft = DraftDocument(document_id="empty-doc", spec=spec)  # sin secciones
    bundle = ScenarioBundle(
        zm="SLP", municipios_activos=["slp"],
        horizonte_anios=5,
    )
    feedback = build_revision_feedback(draft, bundle)
    assert len(feedback) >= 1
    assert any(fb.severity == "error" for fb in feedback)


def test_format_feedback_for_llm():
    from app.agents.validator import build_revision_feedback, format_feedback_for_llm
    from app.agents.schemas import (
        DocumentSpec, DocumentNivel, DraftDocument, ScenarioBundle,
    )
    spec = DocumentSpec(
        document_id="d2",
        titulo="Doc",
        audiencia=["Tesorería"],
        decision_que_habilita="Validar",
        nivel=DocumentNivel.financiero,
        secciones_obligatorias=["1. Datos"],
    )
    draft = DraftDocument(document_id="d2", spec=spec)
    bundle = ScenarioBundle(zm="QRO", municipios_activos=["qro"], horizonte_anios=5)
    feedback = build_revision_feedback(draft, bundle)
    text = format_feedback_for_llm(feedback)
    if feedback:
        assert "Validador" in text
        assert "corrección" in text.lower() or "correcciones" in text.lower()


# ─── agora pipeline completo con 11 docs ─────────────────────────────────────

def test_agora_pipeline_produces_logistics_docs():
    """El pipeline en modo fallback genera los 4 documentos logísticos."""
    from app.agents.agora import PlanInput, run_agora

    plan = PlanInput(
        municipio="San Luis Potosí",
        zm="SLP",
        scenario_json={"gen_percapita_kg_dia": 0.9, "n_cas_pequeno": 1},
        kpis_json={"tir": 18.0, "vpn": 2_000_000, "payback_meses": 48,
                   "empleos_directos": 10, "co2e_evitadas": 4000},
    )
    output = asyncio.run(run_agora(plan))
    eb = output.export_bundle
    doc_ids = [d.document_id for d in eb.documents]

    assert "08_plan_rutas_recoleccion"           in doc_ids
    assert "09_dimensionamiento_flota"            in doc_ids
    assert "10_segmentacion_territorial"          in doc_ids
    assert "11_cadena_suministro_comercializacion" in doc_ids


def test_agora_logistics_docs_have_sections():
    """Los 4 agentes logísticos producen secciones, no documentos vacíos."""
    from app.agents.agora import PlanInput, run_agora

    plan = PlanInput(
        municipio="Monterrey",
        zm="MTY",
        scenario_json={"gen_percapita_kg_dia": 1.1, "n_cas_mediano": 1},
        kpis_json={"tir": 22.0, "vpn": 5_000_000, "payback_meses": 36,
                   "empleos_directos": 25, "co2e_evitadas": 12000},
    )
    output = asyncio.run(run_agora(plan))
    db = output.draft_bundle
    logistics_ids = {
        "08_plan_rutas_recoleccion",
        "09_dimensionamiento_flota",
        "10_segmentacion_territorial",
        "11_cadena_suministro_comercializacion",
    }
    for doc in db.documentos:
        if doc.document_id in logistics_ids:
            assert len(doc.secciones) >= 3, (
                f"{doc.document_id} tiene {len(doc.secciones)} secciones — mínimo 3"
            )


def test_agora_total_doc_count():
    """El pipeline siempre produce 9 documentos (7 base + 4 logísticos - 2 bloqueados por legal)."""
    from app.agents.agora import PlanInput, run_agora

    plan = PlanInput(
        municipio="Querétaro",
        zm="QRO",
        scenario_json={},
        kpis_json={"tir": 15.0, "vpn": 1_500_000, "payback_meses": 60,
                   "empleos_directos": 8, "co2e_evitadas": 3000},
    )
    output = asyncio.run(run_agora(plan))
    assert len(output.export_bundle.documents) == 9
