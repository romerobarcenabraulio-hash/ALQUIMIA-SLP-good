"""Contratos del grafo causal de Fase 7."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    input = "input"
    source = "source"
    assumption = "assumption"
    formula = "formula"
    kpi = "kpi"
    risk = "risk"
    decision = "decision"
    document = "document"
    action = "action"
    warning = "warning"


class EdgeRelation(str, Enum):
    uses = "uses"
    calculates = "calculates"
    increases = "increases"
    decreases = "decreases"
    blocks = "blocks"
    enables = "enables"
    warns = "warns"
    documents = "documents"
    recommends = "recommends"
    depends_on = "depends_on"
    supports = "supports"
    contextualizes = "contextualizes"
    cannot_support = "cannot_support"


class CausalNode(BaseModel):
    node_id: str
    type: NodeType
    label: str
    value: Any = None
    unit: Optional[str] = None
    source_id: Optional[str] = None
    source_type: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    status: str = "ok"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CausalEdge(BaseModel):
    edge_id: str = Field(default_factory=lambda: str(uuid4()))
    from_node: str
    to_node: str
    relation: EdgeRelation
    formula: Optional[str] = None
    direction: Optional[str] = None
    weight: float = Field(default=1.0, ge=0)
    explanation: str


class ReasoningGraph(BaseModel):
    scenario_id: str = Field(default_factory=lambda: str(uuid4()))
    zm: str
    municipios: List[str] = Field(default_factory=list)
    nodes: List[CausalNode] = Field(default_factory=list)
    edges: List[CausalEdge] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def node_ids(self) -> set[str]:
        return {n.node_id for n in self.nodes}


class DecisionExplanation(BaseModel):
    decision_id: str
    pregunta: str
    respuesta_corta: str
    evidencia: List[str] = Field(default_factory=list)
    calculos: List[str] = Field(default_factory=list)
    riesgos: List[str] = Field(default_factory=list)
    documentos_afectados: List[str] = Field(default_factory=list)
    siguiente_accion: str
    graph_node_ids: List[str] = Field(default_factory=list)


class ReasoningGraphRequest(BaseModel):
    scenario_id: Optional[str] = None
    zm: str
    municipios: List[str] = Field(default_factory=list)
    scenario: Dict[str, Any] = Field(default_factory=dict)
    resultados: Dict[str, Any] = Field(default_factory=dict)
    data_provenance: Optional[Dict[str, Any]] = None
    market_summary: Optional[Dict[str, Any]] = None
    macro_impact_summary: Optional[Dict[str, Any]] = None
    legal_summary: Optional[Dict[str, Any]] = None
    evidence_recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ExplainRequest(BaseModel):
    scenario_id: Optional[str] = None
    graph: Optional[ReasoningGraph] = None
    decision_id: Optional[str] = None
    pregunta: Optional[str] = None
