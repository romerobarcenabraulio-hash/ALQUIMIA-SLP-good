"""Tests EIDOS — glosario y linter (solo warnings, no bloquean)."""
from __future__ import annotations

from app.agents.eidos_glossary import compact_glossary_for_prompt
from app.agents.eidos_linter import lint_draft_document
from app.agents.prompt_builder import build_agent_prompt
from app.agents.schemas import (
    DocumentNivel,
    DocumentSpec,
    DraftDocument,
    DraftSection,
    ScenarioBundle,
)


def test_compact_glossary_includes_identity():
    block = compact_glossary_for_prompt("ejecutivo-institucional")
    assert "ALQUIMIA" in block
    assert "cadena de custodia" in block
    assert "Registro ejecutivo" in block


def test_prompt_builder_includes_eidos_glossary():
    spec = DocumentSpec(
        document_id="01_test",
        titulo="Test",
        audiencia=["Cabildo"],
        decision_que_habilita="Decidir",
        nivel=DocumentNivel.ejecutivo,
        tono="ejecutivo-institucional",
    )
    bundle = ScenarioBundle(zm="SLP", municipios_activos=["slp"], horizonte_anios=3)
    prompt = build_agent_prompt("ghostwriter", spec, bundle)
    assert "Glosario EIDOS" in prompt.full_prompt()


def test_linter_warns_simulador_rsu():
    draft = DraftDocument(
        document_id="01_resumen_ejecutivo_municipal",
        spec=DocumentSpec(
            document_id="01_resumen_ejecutivo_municipal",
            titulo="Ejecutivo",
            audiencia=["Cabildo"],
            decision_que_habilita="Decidir",
            nivel=DocumentNivel.ejecutivo,
        ),
        secciones=[
            DraftSection(
                section_id="s1",
                titulo="Resumen",
                contenido="El simulador RSU proyecta mejoras.",
            )
        ],
    )
    issues = lint_draft_document(draft)
    assert any(i.code == "EIDOS_TERMINO_NO_CANONICO" for i in issues)
    assert all(i.severity == "warning" for i in issues)


def test_linter_juridico_custodia_vs_trazabilidad():
    draft = DraftDocument(
        document_id="03_diagnostico_reforma_slp",
        spec=DocumentSpec(
            document_id="03_diagnostico_reforma_slp",
            titulo="Jurídico",
            audiencia=["Jurídico"],
            decision_que_habilita="Reforma",
            nivel=DocumentNivel.municipal,
        ),
        secciones=[
            DraftSection(
                section_id="s1",
                titulo="Marco",
                contenido="Se requiere trazabilidad en el reglamento municipal.",
            )
        ],
    )
    issues = lint_draft_document(draft)
    assert any(i.code == "EIDOS_CUSTODIA_VS_TRAZABILIDAD" for i in issues)
