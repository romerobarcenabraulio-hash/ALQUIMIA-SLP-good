"""Operational bibliography registry for ALQUIMIA research.

This module keeps bibliography as structured evidence. It does not decide truth
with an LLM and it does not turn comparable evidence into a local study.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

EvidenceScope = Literal["municipal", "zm", "state", "national", "comparable", "benchmark"]
EvidenceUse = Literal["supports", "contextualizes", "feeds_calculation", "cannot_support"]
EvidenceOrigin = Literal["database", "fallback_reference"]
Stage = Literal["validation", "planning", "execution"]


class BibliographyRegistryRecord(BaseModel):
    id: str
    origin: EvidenceOrigin
    source_table: str
    institution: str
    title: str
    url: str | None = None
    published_at: str | None = None
    consulted_at: str
    municipio_id: str | None = None
    zm_id: str | None = None
    module_id: str
    stage: Stage
    category: str
    evidence_scope: EvidenceScope
    evidence_use: EvidenceUse
    confidence: float
    method: str
    claim_can_support: str
    claim_cannot_support: str
    limitations: list[str] = Field(default_factory=list)
    chicago_citation: str


class BibliographyCoverage(BaseModel):
    total_records: int
    by_stage: dict[str, int]
    by_module: dict[str, int]
    by_scope: dict[str, int]
    missing_modules: list[str]
    calculation_ready_modules: list[str]


class BibliographyRecommendation(BaseModel):
    record: BibliographyRegistryRecord
    score: int
    tag: Literal["local", "comparable", "benchmark", "solo_contexto", "no_usable"]
    explanation: str


EXPECTED_MODULES = [
    "M00", "M00B", "M01", "M02", "M03", "M03B", "M04", "M05", "M06", "M07",
    "M08", "M09", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17",
    "M18", "M19", "M20", "M21",
]

MODULE_STAGE: dict[str, Stage] = {
    **{module: "validation" for module in ["M00", "M00B", "M01", "M02", "M03", "M03B", "M04", "M13", "M14", "M15"]},
    **{module: "planning" for module in ["M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12"]},
    **{module: "execution" for module in ["M16", "M17", "M18", "M19", "M20", "M21"]},
}

CATEGORY_MODULE: dict[str, str] = {
    "reglamentos": "M03B",
    "precios_materiales": "M10",
    "costos_disposicion": "M04",
    "costos_flota": "M13",
    "costos_construccion": "M13",
    "costos_terreno": "M13",
    "noticias_locales": "M00B",
    "programas": "M00B",
    "benchmarks_latam": "M01",
    "papers_academicos": "M01",
}


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _date_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def _domain_institution(url: str | None, fallback: str | None = None) -> str:
    if fallback:
        return fallback
    if not url:
        return "Fuente bibliografica pendiente"
    clean = url.replace("https://", "").replace("http://", "").split("/")[0]
    return clean.replace("www.", "")


def _chicago(institution: str, title: str, published_at: str | None, url: str | None, consulted_at: str) -> str:
    date_label = published_at or "s.f."
    url_part = f" {url}." if url else ""
    return f'{institution}. "{title}." {date_label}.{url_part} Consultado el {consulted_at}.'


def _scope_for_research_item(item: Any, target_municipio_id: str | None = None) -> EvidenceScope:
    category = str(getattr(item, "categoria", "") or "").lower()
    municipio_id = getattr(item, "municipio_id", None)
    zm_id = getattr(item, "zm_id", None)
    if "benchmark" in category:
        return "benchmark"
    if municipio_id:
        return "municipal" if not target_municipio_id or municipio_id == target_municipio_id else "comparable"
    if zm_id:
        return "zm"
    if category in {"papers_academicos"}:
        return "national"
    return "national"


def _use_for_scope(scope: EvidenceScope, category: str) -> EvidenceUse:
    if scope == "municipal":
        return "supports"
    if category == "precios_materiales":
        return "feeds_calculation"
    if scope in {"benchmark", "national", "state", "zm", "comparable"}:
        return "contextualizes"
    return "cannot_support"


def _limitations(scope: EvidenceScope, use: EvidenceUse) -> list[str]:
    limitations: list[str] = []
    if scope == "zm":
        limitations.append("Alcance ZM; no sustituye dato municipal.")
    if scope in {"state", "national", "comparable", "benchmark"}:
        limitations.append("No soporta afirmacion municipal directa.")
    if scope == "benchmark":
        limitations.append("Benchmark; no desbloquea estudio local.")
    if use == "feeds_calculation":
        limitations.append("Puede alimentar calculo trazable; no es precio oficial ni contrato.")
    return limitations


def _record(
    *,
    id: str,
    origin: EvidenceOrigin,
    source_table: str,
    institution: str,
    title: str,
    url: str | None,
    published_at: str | None,
    consulted_at: str | None,
    municipio_id: str | None,
    zm_id: str | None,
    module_id: str,
    category: str,
    scope: EvidenceScope,
    confidence: float,
    method: str,
) -> BibliographyRegistryRecord:
    consulted = consulted_at or _today()
    use = _use_for_scope(scope, category)
    limitations = _limitations(scope, use)
    stage = MODULE_STAGE.get(module_id, "validation")
    return BibliographyRegistryRecord(
        id=id,
        origin=origin,
        source_table=source_table,
        institution=institution,
        title=title,
        url=url,
        published_at=published_at,
        consulted_at=consulted,
        municipio_id=municipio_id,
        zm_id=zm_id,
        module_id=module_id,
        stage=stage,
        category=category,
        evidence_scope=scope,
        evidence_use=use,
        confidence=max(0.0, min(1.0, confidence)),
        method=method,
        claim_can_support=(
            "Claim municipal del mismo alcance con revision humana."
            if use == "supports"
            else "Calculo trazable o contexto comparable, segun etiqueta."
        ),
        claim_cannot_support=(
            "No convierte evidencia comparable, ZM, nacional o benchmark en estudio local."
            if use != "supports"
            else "No declara oficialidad automatica ni sustituye aprobacion humana."
        ),
        limitations=limitations,
        chicago_citation=_chicago(institution, title, published_at, url, consulted),
    )


def fallback_bibliography_records(target_municipio_id: str | None = None) -> list[BibliographyRegistryRecord]:
    """Minimum public corpus used when database is unavailable or empty."""
    return [
        _record(
            id="fallback:inegi:censo-2020",
            origin="fallback_reference",
            source_table="fallback_public_corpus",
            institution="INEGI",
            title="Censo de Poblacion y Vivienda 2020",
            url="https://www.inegi.org.mx/programas/ccpv/2020/",
            published_at="2020",
            consulted_at=_today(),
            municipio_id=target_municipio_id,
            zm_id=None,
            module_id="M01",
            category="demografia",
            scope="municipal" if target_municipio_id else "national",
            confidence=0.86,
            method="fuente_publica_investigada",
        ),
        _record(
            id="fallback:semarnat:dbgirsu-2020",
            origin="fallback_reference",
            source_table="fallback_public_corpus",
            institution="SEMARNAT",
            title="Diagnostico Basico para la Gestion Integral de los Residuos 2020",
            url="https://www.gob.mx/semarnat/documentos/diagnostico-basico-para-la-gestion-integral-de-los-residuos-2020",
            published_at="2020",
            consulted_at=_today(),
            municipio_id=None,
            zm_id=None,
            module_id="M01",
            category="benchmarks_nacionales",
            scope="benchmark",
            confidence=0.72,
            method="benchmark_nacional_para_calculo",
        ),
        _record(
            id="fallback:material-price-research:rsu",
            origin="fallback_reference",
            source_table="fallback_public_corpus",
            institution="ALQUIMIA",
            title="Investigacion de precios RSU por material",
            url=None,
            published_at="2026",
            consulted_at=_today(),
            municipio_id=None,
            zm_id=None,
            module_id="M10",
            category="precios_materiales",
            scope="benchmark",
            confidence=0.55,
            method="repositorio_bibliografico_para_mix_de_precios",
        ),
    ]


def records_from_database(db: Any, target_municipio_id: str | None = None, zm_id: str | None = None) -> list[BibliographyRegistryRecord]:
    if db is None:
        return []
    try:
        from app.models.research import PriceSeries, RegulatorySource, ResearchItem
    except Exception:
        return []

    records: list[BibliographyRegistryRecord] = []
    try:
        q = db.query(ResearchItem).filter(ResearchItem.vigente.is_(True))
        if target_municipio_id:
            q = q.filter((ResearchItem.municipio_id == target_municipio_id) | (ResearchItem.municipio_id.is_(None)))
        if zm_id:
            q = q.filter((ResearchItem.zm_id == zm_id) | (ResearchItem.zm_id.is_(None)))
        for item in q.order_by(ResearchItem.fecha_consulta.desc()).limit(250):
            category = str(item.categoria or "research")
            module_id = CATEGORY_MODULE.get(category, "M00B")
            scope = _scope_for_research_item(item, target_municipio_id)
            records.append(_record(
                id=f"research_items:{item.id}",
                origin="database",
                source_table="research_items",
                institution=_domain_institution(item.fuente_url, item.fuente_dominio),
                title=item.fuente_titulo or item.query_text or category,
                url=item.fuente_url,
                published_at=_date_str(item.fecha_publicacion),
                consulted_at=_date_str(item.fecha_consulta),
                municipio_id=item.municipio_id,
                zm_id=item.zm_id,
                module_id=module_id,
                category=category,
                scope=scope,
                confidence=float(item.confianza if item.confianza is not None else (item.tier_confianza or 3) / 5),
                method=f"research_cache:{item.motor_extraccion}",
            ))
    except Exception:
        pass

    try:
        pq = db.query(PriceSeries)
        if target_municipio_id:
            pq = pq.filter((PriceSeries.municipio_id == target_municipio_id) | (PriceSeries.municipio_id.is_(None)))
        for price in pq.order_by(PriceSeries.fecha.desc()).limit(120):
            scope: EvidenceScope = "municipal" if price.municipio_id == target_municipio_id and target_municipio_id else "benchmark"
            records.append(_record(
                id=f"price_series:{price.id}",
                origin="database",
                source_table="price_series",
                institution=_domain_institution(price.fuente_url),
                title=f"Precio de material {price.material}",
                url=price.fuente_url,
                published_at=_date_str(price.fecha),
                consulted_at=_date_str(price.fecha),
                municipio_id=price.municipio_id,
                zm_id=price.zm_id,
                module_id="M10",
                category="precios_materiales",
                scope=scope,
                confidence=float((price.tier_confianza or 3) / 5),
                method="price_series_para_mix_ponderado",
            ))
    except Exception:
        pass

    try:
        rq = db.query(RegulatorySource)
        if target_municipio_id:
            rq = rq.filter(RegulatorySource.municipio_id == target_municipio_id)
        for source in rq.order_by(RegulatorySource.fecha_carga.desc()).limit(80):
            records.append(_record(
                id=f"regulatory_sources:{source.id}",
                origin="database",
                source_table="regulatory_sources",
                institution="Municipio o gaceta oficial",
                title=source.titulo or "Reglamento o fuente normativa",
                url=source.fuente_url,
                published_at=_date_str(source.dof_fecha),
                consulted_at=_date_str(source.fecha_carga),
                municipio_id=source.municipio_id,
                zm_id=None,
                module_id="M03B",
                category="reglamentos",
                scope="municipal",
                confidence=0.9 if source.estado_vigencia == "vigente" else 0.65,
                method="fuente_normativa_registrada",
            ))
    except Exception:
        pass

    return records


def collect_bibliography_records(
    db: Any,
    *,
    municipio_id: str | None = None,
    zm_id: str | None = None,
    include_fallback: bool = True,
) -> list[BibliographyRegistryRecord]:
    records = records_from_database(db, municipio_id, zm_id)
    if include_fallback:
        existing = {record.id for record in records}
        records.extend(record for record in fallback_bibliography_records(municipio_id) if record.id not in existing)
    return records


def build_coverage(records: list[BibliographyRegistryRecord]) -> BibliographyCoverage:
    by_stage: dict[str, int] = {}
    by_module: dict[str, int] = {}
    by_scope: dict[str, int] = {}
    for record in records:
        by_stage[record.stage] = by_stage.get(record.stage, 0) + 1
        by_module[record.module_id] = by_module.get(record.module_id, 0) + 1
        by_scope[record.evidence_scope] = by_scope.get(record.evidence_scope, 0) + 1
    missing = [module for module in EXPECTED_MODULES if module not in by_module]
    calculation_ready = sorted({
        record.module_id
        for record in records
        if record.evidence_use in {"feeds_calculation", "supports"} and record.confidence >= 0.5
    })
    return BibliographyCoverage(
        total_records=len(records),
        by_stage=by_stage,
        by_module=by_module,
        by_scope=by_scope,
        missing_modules=missing,
        calculation_ready_modules=calculation_ready,
    )


def _score(record: BibliographyRegistryRecord, municipio_id: str | None, module_id: str | None) -> int:
    score = int(record.confidence * 25)
    if module_id and record.module_id == module_id:
        score += 25
    elif module_id:
        score -= 10
    if record.evidence_scope == "municipal" and record.municipio_id == municipio_id:
        score += 40
    elif record.evidence_scope == "benchmark":
        score += 8
    elif record.evidence_scope in {"national", "state", "zm", "comparable"}:
        score += 12
    if record.evidence_use == "feeds_calculation":
        score += 12
    return max(0, min(100, score))


def build_recommendations(
    records: list[BibliographyRegistryRecord],
    *,
    municipio_id: str | None = None,
    module_id: str | None = None,
    limit: int = 20,
) -> list[BibliographyRecommendation]:
    recommendations: list[BibliographyRecommendation] = []
    for record in records:
        score = _score(record, municipio_id, module_id)
        if record.evidence_scope == "municipal" and record.municipio_id == municipio_id:
            tag = "local"
            explanation = "Fuente local: puede soportar el claim de su mismo alcance con revision humana."
        elif record.evidence_scope == "benchmark":
            tag = "benchmark"
            explanation = "Benchmark: puede alimentar contexto o calculo trazable, no sustituye estudio local."
        elif record.evidence_scope in {"state", "national", "zm", "comparable"}:
            tag = "comparable" if score >= 35 else "solo_contexto"
            explanation = "Evidencia comparable: ayuda a aproximar y contextualizar; no afirma verdad municipal."
        else:
            tag = "no_usable"
            explanation = "No usable para claims hasta completar fuente, metodo y alcance."
        recommendations.append(BibliographyRecommendation(record=record, score=score, tag=tag, explanation=explanation))
    return sorted(recommendations, key=lambda item: item.score, reverse=True)[:limit]
