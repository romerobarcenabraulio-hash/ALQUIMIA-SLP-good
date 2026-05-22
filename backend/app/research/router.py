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
