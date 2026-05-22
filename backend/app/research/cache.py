"""
Caché Postgres de research — reduce llamadas Serper y tokens en ÁGORA.

TTL por defecto: 6 h (alineado a research_service._CACHE_TTL_SEC).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.agents.schemas import ResearchFindings, ResearchItem

logger = logging.getLogger(__name__)

_TTL_HOURS = 6
_CATEGORIES = (
    "costos_construccion",
    "costos_terreno",
    "costos_flota",
    "costos_disposicion",
    "precios_materiales",
    "reglamentos",
    "noticias_locales",
    "benchmarks_latam",
    "papers_academicos",
)


def _row_to_item(row) -> ResearchItem:
    return ResearchItem(
        query=row.query_text or "",
        titulo=row.fuente_titulo or "",
        snippet=(row.snippet or "")[:500],
        url=row.fuente_url,
        domain=row.fuente_dominio or "desconocido",
        domain_tier=f"tier{row.tier_confianza or 4}",
        fecha=None,
        valor_numerico=row.valor_numerico,
        confianza=row.confianza or 0.4,
    )


def load_cached_findings(
    municipio_id: str,
    zm: str,
    municipio_nombre: str,
    *,
    max_age_hours: int = _TTL_HOURS,
) -> Optional[ResearchFindings]:
    """Reconstruye ResearchFindings desde Postgres si hay datos recientes."""
    try:
        from app.db.session import get_sync_db
        from app.models.research import ResearchItem as ResearchItemRow
    except Exception as exc:
        logger.debug("research cache import skip: %s", exc)
        return None

    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    findings = ResearchFindings(zm=zm, municipio=municipio_nombre)
    total = 0

    with get_sync_db() as db:
        if db is None:
            return None
        q = (
            db.query(ResearchItemRow)
            .filter(ResearchItemRow.vigente.is_(True))
            .filter(ResearchItemRow.fecha_consulta >= cutoff)
        )
        if municipio_id:
            q = q.filter(ResearchItemRow.municipio_id == municipio_id)
        rows = q.order_by(ResearchItemRow.confianza.desc()).limit(120).all()
        if not rows:
            return None

        by_cat: dict[str, List[ResearchItem]] = {c: [] for c in _CATEGORIES}
        for row in rows:
            cat = row.categoria if row.categoria in by_cat else "noticias_locales"
            if len(by_cat[cat]) < 5:
                by_cat[cat].append(_row_to_item(row))
                total += 1

        for cat, items in by_cat.items():
            if items:
                setattr(findings, cat, items)

    if total < 3:
        return None

    findings.queries_ejecutadas = 0
    findings.queries_con_resultado = total
    findings.fuente_serper = False
    findings.advertencias.append(
        f"Research desde caché Postgres ({total} ítems, <{max_age_hours}h). "
        "Sin nuevas queries Serper en esta corrida."
    )
    return findings
