"""Explicaciones derivadas del grafo causal."""
from __future__ import annotations

from app.reasoning.schemas import DecisionExplanation, EdgeRelation, ReasoningGraph


def explain_decision(graph: ReasoningGraph, decision_id: str | None = None, pregunta: str | None = None) -> DecisionExplanation:
    query = (decision_id or pregunta or "rsu_total").lower()
    if "mercado" in query or "comprador" in query or "ingreso" in query:
        target = "risk:market_colocacion"
        return _build(graph, "market_income", pregunta or "Por que baja el ingreso defendible?", target)
    if "camion" in query or "ruta" in query:
        target = "decision:camionaje"
        return _build(graph, "camionaje", pregunta or "Por que cambia el camionaje?", target)
    if "jurid" in query or "bloque" in query:
        target = "risk:legal_bloqueo"
        return _build(graph, "legal_block", pregunta or "Por que se bloquea el documento juridico?", target)
    if "macro" in query:
        target = "input:macrogeneradores"
        return _build(graph, "macros", pregunta or "Por que un macrogenerador cambia el escenario?", target)
    return _build(graph, "rsu_total", pregunta or "Por que cambio este numero?", "kpi:rsu_total_ton_dia")


def _build(graph: ReasoningGraph, decision_id: str, pregunta: str, target_node: str) -> DecisionExplanation:
    node_ids = graph.node_ids()
    linked_edges = [
        e for e in graph.edges
        if e.to_node == target_node or e.from_node == target_node
    ]
    linked_nodes = [target_node] if target_node in node_ids else []
    for edge in linked_edges:
        linked_nodes.extend([edge.from_node, edge.to_node])
    linked_nodes = list(dict.fromkeys([n for n in linked_nodes if n in node_ids]))

    if not linked_nodes:
        linked_nodes = [n.node_id for n in graph.nodes[:3]]

    calculos = [e.formula for e in linked_edges if e.formula]
    evidencia = [e.explanation for e in linked_edges]
    riesgos = [
        n.label for n in graph.nodes
        if n.node_id in linked_nodes and n.type.value in ("risk", "warning")
    ]
    documentos = [
        n.label for n in graph.nodes
        if n.type.value == "document" and any(
            e.relation == EdgeRelation.documents and e.to_node == n.node_id and e.from_node in linked_nodes
            for e in graph.edges
        )
    ]

    return DecisionExplanation(
        decision_id=decision_id,
        pregunta=pregunta,
        respuesta_corta=(
            "La respuesta se deriva de la cadena causal conectada a "
            f"{target_node}; revisar nodos y formulas asociados."
        ),
        evidencia=evidencia[:6],
        calculos=list(dict.fromkeys(calculos))[:4],
        riesgos=riesgos[:4],
        documentos_afectados=documentos[:4],
        siguiente_accion="Verificar fuentes de baja confianza y recalcular el escenario antes de documentar.",
        graph_node_ids=linked_nodes,
    )

