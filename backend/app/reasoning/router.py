"""Endpoints de Fase 7: ReasoningGraph."""
from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, HTTPException

from app.reasoning.explanations import explain_decision
from app.reasoning.graph_builder import build_reasoning_graph
from app.reasoning.schemas import DecisionExplanation, ExplainRequest, ReasoningGraph, ReasoningGraphRequest


router = APIRouter()
_graphs: Dict[str, ReasoningGraph] = {}


@router.post("/graph", response_model=ReasoningGraph)
def create_graph(body: ReasoningGraphRequest):
    graph = build_reasoning_graph(body)
    _graphs[graph.scenario_id] = graph
    return graph


@router.get("/graph/{scenario_id}", response_model=ReasoningGraph)
def get_graph(scenario_id: str):
    if scenario_id not in _graphs:
        raise HTTPException(status_code=404, detail=f"ReasoningGraph no encontrado: {scenario_id}")
    return _graphs[scenario_id]


@router.post("/explain", response_model=DecisionExplanation)
def explain(body: ExplainRequest):
    graph = body.graph
    if graph is None and body.scenario_id:
        graph = _graphs.get(body.scenario_id)
    if graph is None:
        raise HTTPException(status_code=422, detail="Proveer graph o scenario_id existente.")
    return explain_decision(graph, decision_id=body.decision_id, pregunta=body.pregunta)

