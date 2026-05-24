"""Tests unitarios — contexto municipal PDF."""
from app.export.municipal_context import merge_municipal_context, narrative_blocks


def test_narrative_includes_arbol_and_legal():
    ctx = {
        "municipio_nombre": "Monterrey",
        "arbol_decision": {
            "tienepresupuesto": True,
            "camino_recomendado": "Esquema A",
        },
        "legal": {
            "reglamento_nombre": "Reglamento de Limpia",
            "score_legal": 72,
            "brecha_critica": 1,
            "estrategia_reforma": "Reforma puntual (A)",
        },
    }
    blocks = narrative_blocks(ctx)
    flat = " ".join(line for _, lines in blocks for line in lines)
    assert "Monterrey" in flat
    assert "Esquema A" in flat
    assert "Reglamento de Limpia" in flat


def test_apply_research_findings_splits_programas():
    from app.export.municipal_context import _apply_research_findings

    ctx: dict = {}
    _apply_research_findings(ctx, {
        "noticias_locales": [
            {"titulo": "Controversia basura", "domain": "milenio.com", "snippet": "cabildo"},
        ],
        "reglamentos": [
            {"titulo": "Programa municipal de reciclaje 2025", "domain": "gob.mx", "snippet": "vigente"},
            {"titulo": "Reglamento de aseo 2018 derogado", "domain": "dof.gob.mx", "snippet": "anterior"},
        ],
        "queries_con_resultado": 3,
        "fuente_serper": False,
    })
    assert len(ctx["noticias_locales"]) == 1
    assert ctx["programas_vigentes"][0]["titulo"].startswith("Programa")
    assert ctx["programas_anteriores"][0]["titulo"].startswith("Reglamento")
    assert ctx["research_meta"]["queries_con_resultado"] == 3


def test_merge_preserves_client_payload():
    payload = {"noticias_locales": [{"titulo": "Nota local"}]}
    merged = merge_municipal_context("28028", payload)
    assert merged["noticias_locales"][0]["titulo"] == "Nota local"
    assert merged["municipio_id"] == "28028"
