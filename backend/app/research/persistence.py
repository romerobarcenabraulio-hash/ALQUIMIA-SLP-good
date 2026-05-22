"""
Persistencia de hallazgos Serper → Postgres (graceful si BD no disponible).
"""
from __future__ import annotations

import hashlib
import logging
from datetime import date
from typing import List, Optional

from app.agents.schemas import ResearchItem

logger = logging.getLogger(__name__)

_MATERIAL_KEYS = frozenset({
    "pet", "hdpe", "pead", "plastico", "plastic", "papel", "carton", "cartón",
    "aluminio", "aluminium", "vidrio", "organico", "orgánico", "metal", "metales",
})


def _item_hash(url: str, municipio_id: Optional[str], query: str) -> str:
    key = f"{url}|{municipio_id or ''}|{query[:120]}"
    return hashlib.sha256(key.encode()).hexdigest()


def _infer_material(query: str, categoria: str) -> Optional[str]:
    if categoria != "precios_materiales":
        return None
    q = query.lower()
    for token, mat in [
        ("pet", "pet"),
        ("hdpe", "hdpe"),
        ("pead", "hdpe"),
        ("aluminio", "aluminio"),
        ("papel", "papel"),
        ("carton", "carton"),
        ("cartón", "carton"),
        ("vidrio", "vidrio"),
        ("organico", "organico"),
        ("orgánico", "organico"),
    ]:
        if token in q:
            return mat
    return None


def _tier_to_int(tier: str) -> int:
    if tier.startswith("tier1"):
        return 1
    if tier.startswith("tier2"):
        return 2
    if tier.startswith("tier3"):
        return 3
    return 4


def persist_research_items(
    items: List[ResearchItem],
    *,
    categoria: str,
    query: str,
    municipio_id: Optional[str] = None,
    zm_id: Optional[str] = None,
) -> int:
    """Inserta ítems nuevos; retorna cantidad insertada."""
    try:
        from app.db.session import get_sync_db
        from app.models.research import PriceSeries, ResearchItem as ResearchItemRow
    except Exception as exc:
        logger.debug("research persistence import skip: %s", exc)
        return 0

    inserted = 0
    material = _infer_material(query, categoria)

    with get_sync_db() as db:
        if db is None:
            return 0
        for it in items:
            if not it.url:
                continue
            h = _item_hash(it.url, municipio_id, query)
            exists = db.query(ResearchItemRow.id).filter(ResearchItemRow.hash_canonico == h).first()
            if exists:
                continue
            row = ResearchItemRow(
                municipio_id=municipio_id,
                zm_id=zm_id,
                categoria=categoria,
                material=material,
                query_text=query[:500],
                fuente_url=it.url,
                fuente_titulo=(it.titulo or "")[:300] or None,
                fuente_dominio=(it.domain or "")[:100] or None,
                tier_confianza=_tier_to_int(it.domain_tier or "tier4"),
                confianza=it.confianza,
                valor_numerico=it.valor_numerico,
                unidad="MXN" if categoria == "precios_materiales" and it.valor_numerico else None,
                snippet=(it.snippet or "")[:2000] or None,
                motor_extraccion="serper",
                hash_canonico=h,
            )
            db.add(row)
            inserted += 1

            if material and it.valor_numerico and it.valor_numerico > 0:
                precio_kg = it.valor_numerico
                if precio_kg > 500:
                    precio_kg = precio_kg / 1000
                ps = PriceSeries(
                    material=material,
                    precio_mxn=precio_kg,
                    fecha=date.today(),
                    fuente_url=it.url,
                    tier_confianza=_tier_to_int(it.domain_tier or "tier4"),
                    zm_id=zm_id,
                    municipio_id=municipio_id,
                    research_item_id=row.id,
                )
                try:
                    db.add(ps)
                except Exception:
                    pass
        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning("research persist commit failed: %s", exc)
            return 0
    return inserted
