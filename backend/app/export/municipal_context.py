"""
Contexto municipal para PDF — cada municipio es un caso distinto.

El PDF ejecutivo NO es plantilla genérica: se compone desde:
  - Árbol de decisión institucional (simulador)
  - Diagnóstico jurídico del reglamento cargado
  - Investigación web (noticias, programas, reglamentos citados)
  - Grafo causal / reasoning del escenario

Fuente normativa: cursor-rules/INDICE_MAESTRO_ENTREGABLES.md · ÁGORA dossier.
"""
from __future__ import annotations

from typing import Any

_PROGRAMA_KEYWORDS = (
    "programa",
    "reciclaje",
    "limpia",
    "separación",
    "separacion",
    "punto verde",
    "basura cero",
    "concurso",
    "campaña",
    "campana",
    "recuperación",
    "recuperacion",
)
_ANTERIOR_KEYWORDS = (
    "anterior",
    "derogad",
    "abrogad",
    "2020",
    "2021",
    "2022",
    "2023",
    "vigente hasta",
    "sustituy",
    "repeal",
)


def _id_candidates(municipio_id: str, municipio_nombre: str) -> list[str]:
    out: list[str] = []
    for raw in (municipio_id, municipio_nombre):
        if not raw:
            continue
        for val in (raw, raw.lower(), raw.lower().replace(" ", "_")[:50]):
            if val and val not in out:
                out.append(val)
    return out


def _findings_has_content(data: dict[str, Any]) -> bool:
    cats = (
        "noticias_locales",
        "reglamentos",
        "programas_vigentes",
        "benchmarks_latam",
        "papers_academicos",
    )
    return any(data.get(c) for c in cats)


def _research_item_dict(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        return {
            "titulo": item.get("titulo") or item.get("title") or "",
            "domain": item.get("domain") or item.get("fuente") or "",
            "snippet": (item.get("snippet") or "")[:200],
            "url": item.get("url") or "",
            "fecha": item.get("fecha"),
            "confianza": item.get("confianza"),
        }
    return {
        "titulo": getattr(item, "titulo", "") or "",
        "domain": getattr(item, "domain", "") or "",
        "snippet": (getattr(item, "snippet", "") or "")[:200],
        "url": getattr(item, "url", "") or "",
        "fecha": getattr(item, "fecha", None),
        "confianza": getattr(item, "confianza", None),
    }


def _text_blob(item: dict[str, Any]) -> str:
    return f"{item.get('titulo', '')} {item.get('snippet', '')}".lower()


def _apply_research_findings(ctx: dict[str, Any], findings: dict[str, Any]) -> None:
    """Mapea ResearchFindings → noticias, programas vigentes/anteriores, reglamentos citados."""
    noticias = [_research_item_dict(i) for i in (findings.get("noticias_locales") or [])[:6]]
    programas: list[dict[str, Any]] = []
    reglamentos: list[dict[str, Any]] = []
    anteriores: list[dict[str, Any]] = []

    for item in findings.get("reglamentos") or []:
        d = _research_item_dict(item)
        blob = _text_blob(d)
        if any(k in blob for k in _ANTERIOR_KEYWORDS):
            anteriores.append(d)
        elif any(k in blob for k in _PROGRAMA_KEYWORDS):
            programas.append(d)
        else:
            reglamentos.append(d)

    for cat in ("benchmarks_latam", "papers_academicos"):
        for item in findings.get(cat) or []:
            d = _research_item_dict(item)
            blob = _text_blob(d)
            if any(k in blob for k in _PROGRAMA_KEYWORDS):
                (anteriores if any(k in blob for k in _ANTERIOR_KEYWORDS) else programas).append(d)

    if not ctx.get("noticias_locales") and noticias:
        ctx["noticias_locales"] = noticias
    elif noticias:
        ctx["noticias_locales"] = (ctx.get("noticias_locales") or []) + noticias

    if not ctx.get("programas_vigentes") and programas:
        ctx["programas_vigentes"] = programas[:5]
    if not ctx.get("reglamentos_citados") and reglamentos:
        ctx["reglamentos_citados"] = reglamentos[:5]
    if not ctx.get("programas_anteriores") and anteriores:
        ctx["programas_anteriores"] = anteriores[:4]

    ctx["research_meta"] = {
        "generated_at": findings.get("generated_at"),
        "queries_con_resultado": findings.get("queries_con_resultado", 0),
        "fuente_serper": findings.get("fuente_serper", False),
        "advertencias": (findings.get("advertencias") or [])[:2],
    }


def resolve_research_findings(
    municipio_id: str,
    zm: str,
    municipio_nombre: str,
    payload_findings: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Caché Postgres por municipio; respeta hallazgos ya enviados por el cliente."""
    if payload_findings and _findings_has_content(payload_findings):
        return payload_findings

    try:
        from app.research.cache import load_cached_findings

        for cid in _id_candidates(municipio_id, municipio_nombre):
            cached = load_cached_findings(cid, zm, municipio_nombre or cid)
            if cached:
                return cached.model_dump(mode="json")
    except Exception:
        pass

    return payload_findings if payload_findings else None


def _lines_arbol(arbol: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    mapping = [
        ("tienepresupuesto", "¿Presupuesto propio para CAPEX/OPEX?", {True: "Sí", False: "No"}),
        ("existeConcesionario", "¿Existe concesionario de recolección?", {True: "Sí", False: "No"}),
        ("aceptaRenegociar", "¿Acepta renegociar contrato/concesión?", {True: "Sí", False: "No"}),
    ]
    for key, label, labels in mapping:
        val = arbol.get(key)
        if val is None:
            lines.append(f"• {label} pendiente de respuesta en simulador.")
        else:
            lines.append(f"• {label} {labels.get(val, str(val))}.")
    camino = arbol.get("camino_recomendado") or arbol.get("esquema_recomendado")
    if camino:
        lines.append(f"• Camino institucional sugerido: {camino}.")
    return lines


def _lines_legal(diag: dict[str, Any]) -> list[str]:
    if not diag:
        return ["• Sin diagnóstico jurídico — suba el PDF del reglamento municipal."]
    lines = [
        f"• Reglamento analizado: {diag.get('reglamento_nombre', 'pendiente')}.",
        f"• Versión declarada: {diag.get('reglamento_version', '—')}.",
        f"• Score legal (matriz 12 arts.): {diag.get('score_legal', 'N/D')}/100.",
        f"• Brechas críticas (alta): {diag.get('brecha_critica', 'N/D')}.",
    ]
    if diag.get("brecha_critica_texto"):
        lines.append(f"• Brecha principal: {diag['brecha_critica_texto']}.")
    if diag.get("estrategia_reforma"):
        lines.append(f"• Estrategia de reforma sugerida: {diag['estrategia_reforma']}.")
    if diag.get("next_action"):
        lines.append(f"• Acción jurídica siguiente: {diag['next_action']}.")
    return lines


def _lines_noticias_programas(ctx: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    noticias = ctx.get("noticias_locales") or []
    programas = ctx.get("programas_vigentes") or []
    reglamentos = ctx.get("reglamentos_citados") or []

    if noticias:
        lines.append("Noticias y contexto político-local (Investigador):")
        for n in noticias[:4]:
            tit = (n.get("titulo") or n.get("title") or "")[:100]
            dom = n.get("domain") or n.get("fuente") or "fuente web"
            lines.append(f"  – {tit} ({dom})")
    else:
        lines.append("• Noticias locales: pendiente de enriquecimiento Investigador o carga manual.")

    if programas:
        lines.append("Programas y esquemas vigentes o recientes:")
        for p in programas[:4]:
            tit = (p.get("titulo") if isinstance(p, dict) else str(p))[:100]
            dom = p.get("domain", "") if isinstance(p, dict) else ""
            lines.append(f"  – {tit}" + (f" ({dom})" if dom else ""))
    anteriores = ctx.get("programas_anteriores") or []
    if anteriores:
        lines.append("Programas o marcos normativos anteriores:")
        for p in anteriores[:3]:
            tit = (p.get("titulo") if isinstance(p, dict) else str(p))[:100]
            lines.append(f"  – {tit}")
    if reglamentos:
        lines.append("Reglamentos citados en investigación web:")
        for r in reglamentos[:3]:
            tit = (r.get("titulo") if isinstance(r, dict) else str(r))[:100]
            dom = r.get("domain", "") if isinstance(r, dict) else ""
            lines.append(f"  – {tit}" + (f" ({dom})" if dom else ""))
    meta = ctx.get("research_meta") or {}
    if meta.get("queries_con_resultado"):
        fuente = "Serper en vivo" if meta.get("fuente_serper") else "caché Investigador"
        lines.append(
            f"• Investigación: {meta['queries_con_resultado']} hallazgos ({fuente})."
        )
    return lines


def _lines_reasoning(graph: dict[str, Any]) -> list[str]:
    if not graph:
        return []
    lines = ["Grafo causal del escenario (decisiones modeladas):"]
    for node in (graph.get("nodes") or [])[:5]:
        label = node.get("label") or node.get("id") or "nodo"
        expl = (node.get("explanation") or "")[:140]
        lines.append(f"  – {label}: {expl}" if expl else f"  – {label}")
    for w in (graph.get("warnings") or [])[:3]:
        lines.append(f"  ⚠ {w}")
    return lines


def merge_municipal_context(
    municipio_id: str,
    payload: dict[str, Any] | None,
    *,
    zm: str = "",
    municipio_nombre: str = "",
) -> dict[str, Any]:
    """
    Enriquece contexto del cliente con diagnóstico legal y ResearchFindings (Investigador).
    """
    ctx: dict[str, Any] = dict(payload or {})
    ctx.setdefault("municipio_id", municipio_id)
    if municipio_nombre:
        ctx.setdefault("municipio_nombre", municipio_nombre)
    if zm:
        ctx.setdefault("zm", zm)

    payload_rf = ctx.get("research_findings")
    if isinstance(payload_rf, dict):
        findings = resolve_research_findings(
            municipio_id,
            zm or str(ctx.get("zm") or ""),
            municipio_nombre or str(ctx.get("municipio_nombre") or ""),
            payload_rf,
        )
    else:
        findings = resolve_research_findings(
            municipio_id,
            zm or str(ctx.get("zm") or ""),
            municipio_nombre or str(ctx.get("municipio_nombre") or ""),
            None,
        )
    if findings:
        _apply_research_findings(ctx, findings)

    try:
        from app.legal.diagnostic import build_diagnostic
        from app.legal.reform_strategy import select_strategy

        diag = build_diagnostic(municipio_id.lower())
        if diag:
            strat = select_strategy(diag)
            arts = ", ".join(strat.articulos_clave[:4]) if strat.articulos_clave else ""
            ctx["legal"] = {
                "reglamento_nombre": diag.reglamento_nombre,
                "reglamento_version": diag.reglamento_version,
                "score_legal": diag.score_legal,
                "brecha_critica": diag.brecha_critica,
                "brecha_critica_texto": f"{diag.brecha_critica} artículos de alta criticidad"
                + (f" ({arts})" if arts else ""),
                "estrategia_reforma": f"{strat.nombre} ({strat.estrategia.value})",
                "next_action": diag.next_action,
                "agora_bloqueado": diag.agora_bloqueado,
            }
    except Exception:
        pass

    return ctx


def narrative_blocks(ctx: dict[str, Any]) -> list[tuple[str, list[str]]]:
    """Secciones (título, párrafos) para el PDF — orden SCQA municipal."""
    municipio = ctx.get("municipio_nombre") or ctx.get("municipio_id") or "Municipio"
    estado = ctx.get("estado_nombre") or ""
    header = f"Contexto exclusivo — {municipio}" + (f", {estado}" if estado else "")

    intro = [
        "Este documento se compone para un solo municipio. No reutiliza narrativa de SLP, "
        "Querétaro, Monterrey ni Guadalajara salvo cita explícita con fuente aplicable.",
        "La lectura integra árbol de decisión institucional, reglamento analizado, "
        "noticias/programas locales y el grafo causal del escenario modelado.",
    ]
    if ctx.get("datos_estimados"):
        intro.append(
            "Los parámetros demográficos/RSU marcados como estimados provienen de INEGI "
            "y supuestos nacionales — requieren validación local antes de Cabildo."
        )

    blocks: list[tuple[str, list[str]]] = [
        (header, intro),
        ("Árbol de decisión institucional", _lines_arbol(ctx.get("arbol_decision") or {})),
        ("Reglamento y brechas normativas", _lines_legal(ctx.get("legal") or {})),
        ("Noticias, programas y marco local", _lines_noticias_programas(ctx)),
    ]

    reasoning_lines = _lines_reasoning(ctx.get("reasoning_graph") or {})
    if reasoning_lines:
        blocks.append(("Grafo causal del escenario", reasoning_lines))

    implicacion = ctx.get("implicacion_decision")
    if implicacion:
        blocks.append(("Implicación para la decisión", [str(implicacion)]))

    return blocks
