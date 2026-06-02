"""
Router /research — consulta caché Postgres (sin Serper, sin tokens).
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/research", tags=["research"])


class ResearchCacheSummary(BaseModel):
    municipio_id: Optional[str]
    zm_id: Optional[str]
    total_items: int
    por_categoria: dict
    precios_recientes: List[dict]
    mensaje: str


class BibliographyRegistryResponse(BaseModel):
    records: List[dict]
    record_count: int
    source: str
    deterministic: bool
    llm_used: bool


class BibliographyCoverageResponse(BaseModel):
    coverage: dict
    source: str
    deterministic: bool
    llm_used: bool


class BibliographyRecommendationsResponse(BaseModel):
    recommendations: List[dict]
    recommendation_count: int
    deterministic: bool
    llm_used: bool


class ClaimLedgerResponse(BaseModel):
    claims: List[dict]
    claim_count: int
    rule: str


@router.get("/findings")
async def research_findings(
    municipio_id: str = Query(..., min_length=1),
    zm_id: str = Query(""),
    municipio_nombre: str = Query(""),
    estado: str = Query(""),
    refresh: bool = Query(False, description="Disparar Investigador (Serper) si caché insuficiente"),
):
    """
    ResearchFindings para PDF y simulador — caché Postgres o Serper bajo demanda.
    """
    from app.agents.schemas import ResearchFindings
    from app.export.municipal_context import resolve_research_findings

    zm = zm_id or "ZM"
    nombre = municipio_nombre or municipio_id

    if refresh and municipio_nombre:
        try:
            from app.agents.research_service import investigate_municipio

            findings = await investigate_municipio(municipio_nombre, estado, zm)
            return findings.model_dump(mode="json")
        except Exception as exc:
            return ResearchFindings(
                zm=zm,
                municipio=nombre,
                advertencias=[f"Investigador no disponible: {exc}"],
            ).model_dump(mode="json")

    data = resolve_research_findings(municipio_id, zm, nombre, None)
    if data:
        return data

    return ResearchFindings(
        zm=zm,
        municipio=nombre,
        advertencias=["Sin hallazgos en caché — use refresh=1 o configure SERPER_API_KEY."],
    ).model_dump(mode="json")


@router.get("/cache/summary", response_model=ResearchCacheSummary)
def research_cache_summary(
    municipio_id: Optional[str] = Query(None),
    zm_id: Optional[str] = Query(None),
    max_age_hours: int = Query(6, ge=1, le=168),
):
    """Resumen de hallazgos en DB — útil antes de disparar Serper o ÁGORA."""
    try:
        from app.db.session import get_sync_db
        from app.models.research import PriceSeries, ResearchItem
        from datetime import datetime, timedelta, timezone
    except Exception as exc:
        return ResearchCacheSummary(
            municipio_id=municipio_id,
            zm_id=zm_id,
            total_items=0,
            por_categoria={},
            precios_recientes=[],
            mensaje=f"BD no disponible: {exc}",
        )

    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    por_cat: dict = {}
    precios: List[dict] = []

    with get_sync_db() as db:
        if db is None:
            return ResearchCacheSummary(
                municipio_id=municipio_id,
                zm_id=zm_id,
                total_items=0,
                por_categoria={},
                precios_recientes=[],
                mensaje="PostgreSQL no configurado.",
            )
        q = db.query(ResearchItem).filter(
            ResearchItem.vigente.is_(True),
            ResearchItem.fecha_consulta >= cutoff,
        )
        if municipio_id:
            q = q.filter(ResearchItem.municipio_id == municipio_id)
        if zm_id:
            q = q.filter(ResearchItem.zm_id == zm_id)
        rows = q.all()
        for r in rows:
            por_cat[r.categoria] = por_cat.get(r.categoria, 0) + 1

        pq = db.query(PriceSeries).order_by(PriceSeries.fecha.desc())
        if municipio_id:
            pq = pq.filter(PriceSeries.municipio_id == municipio_id)
        for ps in pq.limit(12):
            precios.append({
                "material": ps.material,
                "precio_mxn_kg": ps.precio_mxn,
                "fecha": str(ps.fecha),
                "fuente_url": ps.fuente_url,
            })

    total = sum(por_cat.values())
    msg = (
        f"{total} hallazgos en caché (<{max_age_hours}h). "
        "ÁGORA puede omitir Serper si total ≥ 3."
        if total >= 3
        else "Caché insuficiente — configure SERPER_API_KEY y ejecute investigación."
    )
    return ResearchCacheSummary(
        municipio_id=municipio_id,
        zm_id=zm_id,
        total_items=total,
        por_categoria=por_cat,
        precios_recientes=precios,
        mensaje=msg,
    )


@router.get("/bibliography", response_model=BibliographyRegistryResponse)
def bibliography_registry(
    municipio_id: Optional[str] = Query(None),
    zm_id: Optional[str] = Query(None),
    include_fallback: bool = Query(True),
    module_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
):
    """Registro operativo de bibliografia investigada/calculable.

    No usa LLM y no convierte benchmark en estudio local. Si la BD no tiene
    entradas, devuelve corpus publico minimo para que el sistema no navegue a
    ciegas.
    """
    from app.research.bibliography_registry import collect_bibliography_records

    try:
        from app.db.session import get_sync_db
    except Exception:
        get_sync_db = None  # type: ignore[assignment]

    records = []
    source = "fallback_reference"
    if get_sync_db is not None:
        with get_sync_db() as db:
            records = collect_bibliography_records(db, municipio_id=municipio_id, zm_id=zm_id, include_fallback=include_fallback)
            source = "database+fallback" if db is not None else "fallback_reference"
    else:
        records = collect_bibliography_records(None, municipio_id=municipio_id, zm_id=zm_id, include_fallback=include_fallback)
    if module_id:
        records = [record for record in records if record.module_id == module_id]
    if stage:
        records = [record for record in records if record.stage == stage]
    return BibliographyRegistryResponse(
        records=[record.model_dump(mode="json") for record in records],
        record_count=len(records),
        source=source,
        deterministic=True,
        llm_used=False,
    )


@router.get("/bibliography/coverage", response_model=BibliographyCoverageResponse)
def bibliography_coverage(
    municipio_id: Optional[str] = Query(None),
    zm_id: Optional[str] = Query(None),
    include_fallback: bool = Query(True),
):
    """Cobertura bibliografica por etapa/modulo/alcance."""
    from app.research.bibliography_registry import build_coverage, collect_bibliography_records

    try:
        from app.db.session import get_sync_db
    except Exception:
        get_sync_db = None  # type: ignore[assignment]

    records = []
    source = "fallback_reference"
    if get_sync_db is not None:
        with get_sync_db() as db:
            records = collect_bibliography_records(db, municipio_id=municipio_id, zm_id=zm_id, include_fallback=include_fallback)
            source = "database+fallback" if db is not None else "fallback_reference"
    else:
        records = collect_bibliography_records(None, municipio_id=municipio_id, zm_id=zm_id, include_fallback=include_fallback)
    coverage = build_coverage(records)
    return BibliographyCoverageResponse(
        coverage=coverage.model_dump(mode="json"),
        source=source,
        deterministic=True,
        llm_used=False,
    )


@router.get("/bibliography/recommendations", response_model=BibliographyRecommendationsResponse)
def bibliography_recommendations(
    municipio_id: Optional[str] = Query(None),
    zm_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=80),
):
    """Recomendador deterministico de evidencia compatible."""
    from app.research.bibliography_registry import build_recommendations, collect_bibliography_records

    try:
        from app.db.session import get_sync_db
    except Exception:
        get_sync_db = None  # type: ignore[assignment]

    if get_sync_db is not None:
        with get_sync_db() as db:
            records = collect_bibliography_records(db, municipio_id=municipio_id, zm_id=zm_id, include_fallback=True)
    else:
        records = collect_bibliography_records(None, municipio_id=municipio_id, zm_id=zm_id, include_fallback=True)
    recommendations = build_recommendations(records, municipio_id=municipio_id, module_id=module_id, limit=limit)
    return BibliographyRecommendationsResponse(
        recommendations=[item.model_dump(mode="json") for item in recommendations],
        recommendation_count=len(recommendations),
        deterministic=True,
        llm_used=False,
    )


@router.get("/bibliography/claim-ledger", response_model=ClaimLedgerResponse)
def bibliography_claim_ledger(
    municipio_id: Optional[str] = Query(None),
    zm_id: Optional[str] = Query(None),
):
    """Ledger minimo de claims derivados de bibliografia.

    Cada fila declara que puede y que no puede soportar. Si una cifra no puede
    entrar por esta via, debe quedar como brecha o calculo trazable.
    """
    from app.research.bibliography_registry import collect_bibliography_records

    try:
        from app.db.session import get_sync_db
    except Exception:
        get_sync_db = None  # type: ignore[assignment]

    if get_sync_db is not None:
        with get_sync_db() as db:
            records = collect_bibliography_records(db, municipio_id=municipio_id, zm_id=zm_id, include_fallback=True)
    else:
        records = collect_bibliography_records(None, municipio_id=municipio_id, zm_id=zm_id, include_fallback=True)
    claims = [
        {
            "record_id": record.id,
            "module_id": record.module_id,
            "stage": record.stage,
            "source": record.institution,
            "claim_can_support": record.claim_can_support,
            "claim_cannot_support": record.claim_cannot_support,
            "scope": record.evidence_scope,
            "method": record.method,
            "confidence": record.confidence,
            "citation": record.chicago_citation,
            "limitations": record.limitations,
        }
        for record in records
    ]
    return ClaimLedgerResponse(
        claims=claims,
        claim_count=len(claims),
        rule="Cero cifra sin fuente; comparable, ZM o benchmark no sustituyen estudio local.",
    )


@router.get("/antecedentes")
async def antecedentes_reportaje(
    municipio_id: str = Query(..., min_length=1),
    zm_id: str = Query(""),
    municipio_nombre: str = Query(""),
    estado: str = Query(""),
    refresh: bool = Query(
        False,
        description="Forzar investigación Serper al cambiar municipio",
    ),
):
    """
    Reportaje de antecedentes RSU — timeline + síntesis por municipio.
    Se dispara automáticamente desde el simulador al cambiar ciudad.
    """
    from app.research.antecedentes_service import generate_antecedentes_reportaje

    nombre = municipio_nombre or municipio_id
    reportaje = await generate_antecedentes_reportaje(
        municipio_id=municipio_id,
        municipio_nombre=nombre,
        estado=estado,
        zm_id=zm_id or "ZM",
        refresh=refresh,
    )
    return reportaje.model_dump(mode="json")
