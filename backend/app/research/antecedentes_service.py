"""
Reportaje automático de antecedentes municipales — research Serper + caché Postgres.
"""
from __future__ import annotations

import hashlib
import re
from typing import List, Optional

from app.agents.schemas import ResearchFindings, ResearchItem
from app.research.antecedentes_schemas import (
    AntecedenteEvento,
    AntecedenteFuente,
    AntecedentesReportaje,
)


def _tier_label(domain_tier: str, confianza: float) -> str:
    if domain_tier == "tier1" or confianza >= 0.85:
        return "T1"
    if domain_tier == "tier2" or confianza >= 0.70:
        return "T2"
    if confianza >= 0.50:
        return "T3"
    return "T4"


def _extract_year(text: str) -> Optional[int]:
    for m in re.finditer(r"\b(19[89]\d|20[0-2]\d)\b", text):
        y = int(m.group(1))
        if 1970 <= y <= 2030:
            return y
    return None


def _tipo_from_query(query: str, snippet: str) -> str:
    q = (query + " " + snippet).lower()
    if any(w in q for w in ["concesión", "concesion", "red ambiental", "operador", "privatiz"]):
        return "concesion"
    if any(w in q for w in ["reglamento", "decreto", "cabildo", "norma", "ley"]):
        return "norma"
    if any(w in q for w in ["relleno", "sanitario", "tiradero", "disposición", "disposicion"]):
        return "infraestructura"
    if any(w in q for w in ["reciclaje", "separación", "separacion", "programa", "campaña", "campana"]):
        return "programa"
    if any(w in q for w in ["camionetero", "informal", "recolector"]):
        return "operador"
    if any(w in q for w in ["tonelada", "por ciento", "porcentaje", "captura"]):
        return "indicador"
    return "contexto"


def _item_to_fuente(item: ResearchItem) -> AntecedenteFuente:
    tier = _tier_label(getattr(item, "domain_tier", "tier4"), item.confianza)
    return AntecedenteFuente(
        url=item.url,
        titulo=item.titulo,
        tier=tier,  # type: ignore[arg-type]
        confianza=item.confianza,
    )


def _evento_from_item(item: ResearchItem, query: str, municipio_id: str, idx: int) -> AntecedenteEvento:
    text = f"{item.titulo or ''} {item.snippet or ''}"
    anio = _extract_year(text)
    tipo = _tipo_from_query(query, text)
    resumen = (item.snippet or item.titulo or "").strip()
    if len(resumen) > 320:
        resumen = resumen[:317] + "…"
    conf = item.confianza
    verificar = conf < 0.65 or _tier_label(getattr(item, "domain_tier", "tier4"), conf) in ("T3", "T4")
    eid = hashlib.md5(f"{municipio_id}-{item.url}-{idx}".encode()).hexdigest()[:12]
    return AntecedenteEvento(
        evento_id=eid,
        anio=anio,
        tipo=tipo,  # type: ignore[arg-type]
        titulo=(item.titulo or "Hallazgo documentado")[:200],
        resumen=resumen or "Sin extracto disponible.",
        fuentes=[_item_to_fuente(item)],
        confianza=conf,
        verificar=verificar,
    )


def _collect_items(findings: ResearchFindings) -> List[tuple[str, ResearchItem]]:
    out: List[tuple[str, ResearchItem]] = []
    for cat in (
        "reglamentos",
        "noticias_locales",
        "papers_academicos",
        "benchmarks_latam",
    ):
        for item in getattr(findings, cat, []) or []:
            out.append((cat, item))
    return out


def _build_sintesis(nombre: str, eventos: List[AntecedenteEvento], advertencias: List[str]) -> str:
    if not eventos:
        if advertencias:
            return (
                f"No se localizaron antecedentes verificables en línea para {nombre}. "
                "Revise vacíos documentales y complemente con archivo municipal."
            )
        return f"Antecedentes de {nombre}: sin hallazgos en caché ni investigación reciente."
    tipos = {e.tipo for e in eventos}
    partes = [f"Para {nombre} se documentaron {len(eventos)} hitos"]
    if "concesion" in tipos or "operador" in tipos:
        partes.append("con esquema concesional u operadores relevantes")
    if "programa" in tipos or "campaña" in tipos:
        partes.append("y programas/campañas de reciclaje o separación")
    partes.append(
        "— insumo para línea base y teoría de cambio; no sustituye acto de autoridad."
    )
    return " ".join(partes)


def _default_vacios() -> List[str]:
    return [
        "Contrato o convenio de operación vigente (PDF) — [VERIFICAR archivo municipal]",
        "Actas de cabildo sobre programas RSU históricos",
        "Serie toneladas recicladas vs. confinadas (auditable)",
    ]


def _default_lecciones(eventos: List[AntecedenteEvento]) -> List[str]:
    lecciones = [
        "Antes de diseñar separación en origen, mapear operador/concesión vigente.",
        "Programas sin métrica de captura tienden a repetirse sin aprendizaje institucional.",
    ]
    if any(e.tipo == "concesion" for e in eventos):
        lecciones.append(
            "Esquema concesional concentra recolección; valorización exige cláusulas contractuales explícitas."
        )
    return lecciones[:4]


def build_reportaje_from_findings(
    findings: ResearchFindings,
    municipio_id: str,
    zm_id: str,
    municipio_nombre: str,
    estado: str,
) -> AntecedentesReportaje:
    pairs = _collect_items(findings)
    eventos: List[AntecedenteEvento] = []
    seen_urls: set[str] = set()
    for idx, (_cat, item) in enumerate(pairs):
        if not item.url or item.url in seen_urls:
            continue
        seen_urls.add(item.url)
        q = getattr(item, "query", "") or ""
        eventos.append(_evento_from_item(item, q, municipio_id, idx))

    eventos.sort(key=lambda e: (e.anio is None, -(e.anio or 0), -e.confianza))
    eventos = eventos[:12]

    score = min(1.0, len(eventos) / 8.0) if eventos else 0.0
    if any(e.confianza >= 0.75 for e in eventos):
        score = min(1.0, score + 0.15)

    advertencias = list(findings.advertencias or [])
    if not eventos:
        advertencias.append(
            "Sin eventos en timeline — configure SERPER_API_KEY o enriquezca caché research."
        )

    return AntecedentesReportaje(
        municipio_id=municipio_id,
        zm_id=zm_id,
        municipio_nombre=municipio_nombre,
        estado=estado,
        sintesis=_build_sintesis(municipio_nombre, eventos, advertencias),
        eventos=eventos,
        vacios_documentales=_default_vacios(),
        lecciones=_default_lecciones(eventos),
        score_completitud=round(score, 2),
        advertencias=advertencias,
        fuente_serper=bool(findings.fuente_serper),
        queries_ejecutadas=findings.queries_ejecutadas,
    )


def antecedentes_queries(municipio: str, estado: str) -> List[str]:
    est = estado.strip()
    return [
        f"programa reciclaje residuos sólidos {municipio} {est}",
        f"concesión aseo público {municipio} {est} operador",
        f"historia manejo basura {municipio} {est}",
        f"reglamento aseo {municipio} reforma decreto cabildo",
        f"relleno sanitario {municipio} {est}",
        f"separación origen {municipio} campaña",
        f"camioneteros recolectores informales {municipio}",
    ]


async def generate_antecedentes_reportaje(
    municipio_id: str,
    municipio_nombre: str,
    estado: str,
    zm_id: str,
    refresh: bool = False,
) -> AntecedentesReportaje:
    from app.agents.research_service import investigate_municipio

    mid = municipio_id.lower().strip()
    nombre = municipio_nombre.strip() or mid
    zm = zm_id or "ZM"

    if not refresh:
        try:
            from app.research.cache import load_cached_findings

            cached = load_cached_findings(mid, zm, nombre)
            if cached and _collect_items(cached):
                return build_reportaje_from_findings(cached, mid, zm, nombre, estado)
        except Exception:
            pass

    extra = antecedentes_queries(nombre, estado)
    findings = await investigate_municipio(nombre, estado, zm, queries_extra=extra)
    return build_reportaje_from_findings(findings, mid, zm, nombre, estado)
