"""Constructor deterministico del ReasoningGraph."""
from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from app.reasoning.schemas import (
    CausalEdge,
    CausalNode,
    EdgeRelation,
    NodeType,
    ReasoningGraph,
    ReasoningGraphRequest,
)


KPI_UNITS = {
    "rsu_total_ton_dia": "t/dia",
    "co2e_evitadas_anual": "tCO2e/año",
    "co2e_evitadas_horizonte": "tCO2e",
    "ocupacion_cas": "%",
    "camiones_requeridos": "camiones",
    "ingresos_brutos": "MXN",
    "ebitda": "MXN",
    "vpn": "MXN",
    "tir": "%",
}


def _node_id(prefix: str, key: str) -> str:
    return f"{prefix}:{str(key).lower().replace(' ', '_')}"


def _add_node(nodes: dict[str, CausalNode], node: CausalNode) -> None:
    nodes[node.node_id] = node


def _source_from_kpi(kpi: dict) -> CausalNode:
    prov = kpi.get("provenance") or {}
    kpi_id = kpi.get("kpi_id", "kpi_desconocido")
    return CausalNode(
        node_id=_node_id("source", kpi_id),
        type=NodeType.source,
        label=prov.get("fuente_nombre") or f"Fuente para {kpi_id}",
        value=prov.get("fuente_url"),
        unit=None,
        source_id=kpi_id,
        source_type=prov.get("tipo", "no_disponible"),
        confidence=float(prov.get("confianza", 0.0) or 0.0),
        status=prov.get("tipo", "no_disponible"),
        metadata=prov,
    )


def _iter_provenance_kpis(data_provenance: Optional[Dict[str, Any]]) -> Iterable[dict]:
    if not data_provenance:
        return []
    return data_provenance.get("kpis", []) or []


def build_reasoning_graph(request: ReasoningGraphRequest) -> ReasoningGraph:
    nodes: dict[str, CausalNode] = {}
    edges: list[CausalEdge] = []
    warnings = list(request.warnings)
    scenario_id = request.scenario_id or f"{request.zm.upper()}-reasoning"

    for key, value in request.scenario.items():
        _add_node(nodes, CausalNode(
            node_id=_node_id("input", key),
            type=NodeType.input,
            label=str(key),
            value=value,
            source_type="usuario",
            confidence=1.0,
            status="usuario",
        ))

    for kpi in _iter_provenance_kpis(request.data_provenance):
        kpi_id = kpi.get("kpi_id", "")
        source_node = _source_from_kpi(kpi)
        _add_node(nodes, source_node)
        kpi_node_id = _node_id("kpi", kpi_id)
        _add_node(nodes, CausalNode(
            node_id=kpi_node_id,
            type=NodeType.kpi,
            label=kpi.get("kpi_label") or kpi_id,
            value=kpi.get("valor"),
            unit=kpi.get("unidad"),
            source_id=source_node.node_id,
            source_type=source_node.source_type,
            confidence=source_node.confidence,
            status=source_node.status,
        ))
        edges.append(CausalEdge(
            from_node=source_node.node_id,
            to_node=kpi_node_id,
            relation=EdgeRelation.uses,
            explanation=f"{kpi_id} usa la fuente {source_node.label}.",
        ))

    formula_rsu = CausalNode(
        node_id="formula:rsu_total",
        type=NodeType.formula,
        label="RSU total",
        value="poblacion_activa * gen_percapita / 1000",
        source_type="formula",
        confidence=1.0,
        status="calculado",
    )
    _add_node(nodes, formula_rsu)
    for dep in ("input:zm_activa", "input:municipios_activos", "kpi:gen_percapita_kg_dia"):
        if dep in nodes:
            edges.append(CausalEdge(
                from_node=dep,
                to_node=formula_rsu.node_id,
                relation=EdgeRelation.uses,
                formula=str(formula_rsu.value),
                explanation="El volumen RSU depende de geografia activa y generacion per capita.",
            ))

    for kpi_id, value in request.resultados.items():
        if kpi_id not in KPI_UNITS and kpi_id not in ("camiones_requeridos",):
            continue
        kpi_node_id = _node_id("kpi", kpi_id)
        _add_node(nodes, CausalNode(
            node_id=kpi_node_id,
            type=NodeType.kpi,
            label=kpi_id,
            value=value,
            unit=KPI_UNITS.get(kpi_id),
            source_id="formula:simulador",
            source_type="calculado",
            confidence=0.75,
            status="calculado",
        ))
        if kpi_id == "rsu_total_ton_dia":
            edges.append(CausalEdge(
                from_node=formula_rsu.node_id,
                to_node=kpi_node_id,
                relation=EdgeRelation.calculates,
                formula=str(formula_rsu.value),
                explanation="La formula de RSU total calcula toneladas por dia.",
            ))

    if "rsu_total_ton_dia" in request.resultados and "ocupacion_cas" in request.resultados:
        decision_id = "decision:capacidad_ca"
        _add_node(nodes, CausalNode(
            node_id=decision_id,
            type=NodeType.decision,
            label="Dimensionar centros de acopio",
            value=request.resultados.get("ocupacion_cas"),
            unit="%",
            source_type="calculado",
            confidence=0.75,
            status="decision",
        ))
        edges.append(CausalEdge(
            from_node="kpi:rsu_total_ton_dia",
            to_node=decision_id,
            relation=EdgeRelation.enables,
            explanation="El volumen RSU condiciona capacidad requerida de centros de acopio.",
        ))
        edges.append(CausalEdge(
            from_node="kpi:ocupacion_cas",
            to_node=decision_id,
            relation=EdgeRelation.calculates,
            explanation="La ocupacion de CAs define si hace falta ampliar capacidad.",
        ))

    if "camiones_requeridos" in request.resultados:
        decision_id = "decision:camionaje"
        _add_node(nodes, CausalNode(
            node_id=decision_id,
            type=NodeType.decision,
            label="Dimensionar camionaje",
            value=request.resultados.get("camiones_requeridos"),
            source_type="calculado",
            confidence=0.75,
            status="decision",
        ))
        edges.append(CausalEdge(
            from_node="kpi:camiones_requeridos",
            to_node=decision_id,
            relation=EdgeRelation.calculates,
            explanation="El volumen por material calcula camionaje requerido.",
        ))

    if request.market_summary:
        _attach_market(request.market_summary, nodes, edges, warnings)
    if request.macro_impact_summary:
        _attach_macros(request.macro_impact_summary, nodes, edges, warnings)
    if request.legal_summary:
        _attach_legal(request.legal_summary, nodes, edges, warnings)
    if request.evidence_recommendations:
        _attach_evidence_recommendations(request.evidence_recommendations, nodes, edges)

    for idx, warning in enumerate(warnings):
        warning_id = _node_id("warning", idx)
        _add_node(nodes, CausalNode(
            node_id=warning_id,
            type=NodeType.warning,
            label=str(warning)[:100],
            value=warning,
            source_type="sistema",
            confidence=0.7,
            status="warning",
        ))

    _attach_documents(nodes, edges)
    return ReasoningGraph(
        scenario_id=scenario_id,
        zm=request.zm.upper(),
        municipios=request.municipios,
        nodes=list(nodes.values()),
        edges=edges,
        warnings=warnings,
    )


def _attach_market(market: Dict[str, Any], nodes: dict[str, CausalNode], edges: list[CausalEdge], warnings: list[str]) -> None:
    market_id = "risk:market_colocacion"
    _add_node(nodes, CausalNode(
        node_id=market_id,
        type=NodeType.risk,
        label="Riesgo de colocacion",
        value=market.get("pct_colocado_global"),
        unit="%",
        source_type="market_summary",
        confidence=0.55,
        status="riesgo",
        metadata={"faltante": market.get("total_faltante_ton_anio")},
    ))
    if "kpi:ingresos_brutos" in nodes:
        edges.append(CausalEdge(
            from_node=market_id,
            to_node="kpi:ingresos_brutos",
            relation=EdgeRelation.decreases,
            formula="ingreso_ajustado = ingreso_potencial - descuento_por_riesgo",
            explanation="La falta de comprador reduce el ingreso defendible.",
        ))
    if market.get("warnings"):
        warnings.extend(market["warnings"])


def _attach_macros(macros: Dict[str, Any], nodes: dict[str, CausalNode], edges: list[CausalEdge], warnings: list[str]) -> None:
    macro_id = "input:macrogeneradores"
    _add_node(nodes, CausalNode(
        node_id=macro_id,
        type=NodeType.input,
        label="Macrogeneradores activos",
        value=macros.get("generators_count"),
        source_type="macro_impact_summary",
        confidence=0.55,
        status="estimado",
        metadata=macros.get("provenance", {}),
    ))
    for target in ("kpi:rsu_total_ton_dia", "decision:camionaje", "risk:market_colocacion"):
        if target in nodes:
            edges.append(CausalEdge(
                from_node=macro_id,
                to_node=target,
                relation=EdgeRelation.increases,
                formula="ton_dia * dias_operacion_anio * estacionalidad",
                explanation="Los macrogeneradores agregan volumen recuperable y presion logistica.",
            ))
    if macros.get("warnings"):
        warnings.extend(macros["warnings"])


def _attach_legal(legal: Dict[str, Any], nodes: dict[str, CausalNode], edges: list[CausalEdge], warnings: list[str]) -> None:
    if not legal.get("agora_bloqueado") and not legal.get("bloqueados"):
        return
    legal_id = "risk:legal_bloqueo"
    _add_node(nodes, CausalNode(
        node_id=legal_id,
        type=NodeType.risk,
        label="Bloqueo juridico",
        value=legal,
        source_type="legal_diagnostic",
        confidence=0.8,
        status="bloqueado",
    ))
    doc_id = "document:paquete_juridico"
    _add_node(nodes, CausalNode(
        node_id=doc_id,
        type=NodeType.document,
        label="Paquete juridico municipal",
        status="bloqueado",
        source_type="agora",
        confidence=0.8,
    ))
    edges.append(CausalEdge(
        from_node=legal_id,
        to_node=doc_id,
        relation=EdgeRelation.blocks,
        explanation="El diagnostico juridico bloquea documentos legales hasta verificar fuente.",
    ))
    warnings.append("Documento juridico bloqueado por diagnostico legal.")


def _attach_documents(nodes: dict[str, CausalNode], edges: list[CausalEdge]) -> None:
    docs = {
        "document:resumen_ejecutivo": "Resumen ejecutivo",
        "document:modelo_financiero": "Modelo tecnico-financiero",
        "document:plan_operativo": "Plan operativo",
    }
    for doc_id, label in docs.items():
        _add_node(nodes, CausalNode(
            node_id=doc_id,
            type=NodeType.document,
            label=label,
            source_type="agora",
            confidence=0.75,
            status="documentable",
        ))
    for kpi_id in ("kpi:rsu_total_ton_dia", "kpi:ingresos_brutos", "kpi:co2e_evitadas_anual"):
        if kpi_id in nodes:
            edges.append(CausalEdge(
                from_node=kpi_id,
                to_node="document:resumen_ejecutivo",
                relation=EdgeRelation.documents,
                explanation="El KPI debe citarse con trazabilidad en el resumen ejecutivo.",
            ))


def _attach_evidence_recommendations(
    recommendations: list[Dict[str, Any]],
    nodes: dict[str, CausalNode],
    edges: list[CausalEdge],
) -> None:
    for index, item in enumerate(recommendations[:12]):
        record = item.get("record") or {}
        tag = item.get("tag") or "no_usable"
        source_id = _node_id("source", record.get("id") or f"bibliografia_{index}")
        claim_id = _node_id("kpi", record.get("claim_id") or f"claim_bibliografia_{index}")
        _add_node(nodes, CausalNode(
            node_id=source_id,
            type=NodeType.source,
            label=record.get("title") or "Fuente bibliografica compatible",
            value=record.get("institution"),
            source_id=record.get("id"),
            source_type=f"bibliography_{tag}",
            confidence=(item.get("score") or {}).get("total", 0) / 100,
            status=tag,
            metadata={
                "territorial_scope": record.get("territorial_scope"),
                "method": record.get("method"),
                "unsupported_claim": item.get("unsupported_claim"),
            },
        ))
        if claim_id not in nodes:
            _add_node(nodes, CausalNode(
                node_id=claim_id,
                type=NodeType.kpi,
                label=record.get("claim_label") or "Claim bibliografico",
                source_id=source_id,
                source_type="bibliography_claim",
                confidence=(item.get("score") or {}).get("total", 0) / 100,
                status="bibliography_context",
            ))
        if tag == "local":
            relation = EdgeRelation.supports
        elif tag in {"comparable", "benchmark", "solo_contexto"}:
            relation = EdgeRelation.contextualizes
        else:
            relation = EdgeRelation.cannot_support
        edges.append(CausalEdge(
            from_node=source_id,
            to_node=claim_id,
            relation=relation,
            explanation=item.get("explanation") or "La fuente se evalua por compatibilidad bibliografica deterministica.",
        ))
