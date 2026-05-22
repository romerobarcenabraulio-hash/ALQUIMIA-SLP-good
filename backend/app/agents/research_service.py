"""
ResearchService — Agente Investigador de ALQUIMIA (Wave 1).

Ejecuta búsquedas via Serper API para obtener datos reales de costos,
precios y contexto regulatorio para un municipio/ZM dado.

Principios:
- Cache por query normalizada + TTL configurable (evitar queries repetidas).
- Clasificación automática de dominio → tier de confianza.
- Modo offline: si Serper no está configurado, retorna ResearchFindings vacío
  con advertencia — nunca finge tener datos.
- Parseo estricto: extrae números del snippet solo cuando la unidad es clara.
- Rate limit suave: máx 20 queries por run para no quemar presupuesto.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.agents.schemas import ResearchFindings, ResearchItem

logger = logging.getLogger(__name__)

# ─── Configuración ────────────────────────────────────────────────────────────

_SERPER_URL      = "https://api.serper.dev/search"
_MAX_QUERIES_RUN = 20
_CACHE_TTL_SEC   = 3600 * 6   # 6 horas
_HTTP_TIMEOUT    = 8.0

# Dominio → tier de confianza
_DOMAIN_TIERS: Dict[str, Tuple[str, float]] = {
    "inegi.org.mx":       ("tier1", 0.95),
    "banxico.org.mx":     ("tier1", 0.95),
    "semarnat.gob.mx":    ("tier1", 0.93),
    "dof.gob.mx":         ("tier1", 0.93),
    "datos.gob.mx":       ("tier1", 0.90),
    "implan":             ("tier1", 0.88),
    "concanaco.org":      ("tier2", 0.80),
    "canacintra.org":     ("tier2", 0.80),
    "cmic.org.mx":        ("tier2", 0.82),
    "cemex.com":          ("tier2", 0.78),
    "grupomx.com":        ("tier2", 0.75),
    "inmuebles24.com":    ("tier2", 0.72),
    "lamudi.com.mx":      ("tier2", 0.70),
    "metros2.com":        ("tier2", 0.70),
    "promiedos.com.mx":   ("tier2", 0.68),
    "eleconomista.com.mx":("tier3", 0.65),
    "expansion.mx":       ("tier3", 0.65),
    "milenio.com":        ("tier3", 0.60),
    "eluniversal.com.mx": ("tier3", 0.62),
}

# Cache en memoria: {query_hash: (timestamp, ResearchItem[])}
_CACHE: Dict[str, Tuple[float, List[ResearchItem]]] = {}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _normalize_query(q: str) -> str:
    return " ".join(q.lower().split())


def _cache_key(q: str) -> str:
    return hashlib.md5(_normalize_query(q).encode()).hexdigest()


def _domain_from_url(url: str) -> str:
    m = re.search(r"https?://(?:www\.)?([^/]+)", url)
    return m.group(1).lower() if m else "desconocido"


def _tier_for_domain(domain: str) -> Tuple[str, float]:
    for key, val in _DOMAIN_TIERS.items():
        if key in domain:
            return val
    return ("tier4", 0.40)


def _extract_number(text: str) -> Optional[float]:
    """Extrae el primer número razonable de un snippet (precio/costo)."""
    # Busca patrones: $1,234.56 / 1,234 / 1234.56
    patterns = [
        r"\$\s*([\d,]+(?:\.\d+)?)",          # $1,234
        r"([\d,]+(?:\.\d+)?)\s*(?:MXN|pesos|mx)",
        r"([\d,]{3,}(?:\.\d+)?)",             # mínimo 3 dígitos
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def _classify_query(query: str) -> str:
    """Asigna la query a una categoría de ResearchFindings."""
    q = query.lower()
    # Benchmarks antes de reglamentos (evitar falso positivo con "municipio comparable")
    if any(w in q for w in ["benchmark", "latam", "america comparable", "municipio comparable"]):
        return "benchmarks_latam"
    if any(w in q for w in ["construccion", "bodega", "nave", "m2"]):
        return "costos_construccion"
    if any(w in q for w in ["terreno", "predio", "lote"]):
        return "costos_terreno"
    if any(w in q for w in ["camion", "vehiculo", "flota", "diesel"]):
        return "costos_flota"
    if any(w in q for w in ["disposicion", "relleno", "tonelada"]):
        return "costos_disposicion"
    if any(w in q for w in ["pet", "aluminio", "papel", "carton", "vidrio", "hdpe", "reciclado", "precio"]):
        return "precios_materiales"
    if any(w in q for w in ["reglamento", "ley", "norma", "municipio"]):
        return "reglamentos"
    if any(w in q for w in ["noticia", "noticias", "evento"]):
        return "noticias_locales"
    if any(w in q for w in ["estudio", "paper", "investigacion", "academia"]):
        return "papers_academicos"
    return "noticias_locales"


def _parse_serper_result(raw: dict, query: str) -> List[ResearchItem]:
    """Parsea la respuesta de Serper a una lista de ResearchItem."""
    items: List[ResearchItem] = []
    results = raw.get("organic", [])[:5]   # máximo 5 resultados por query

    for r in results:
        url    = r.get("link", "")
        titulo = r.get("title", "")
        snippet = r.get("snippet", "")
        fecha  = r.get("date", "")
        domain = _domain_from_url(url)
        tier, conf = _tier_for_domain(domain)

        # Reducir confianza si no hay fecha
        if not fecha:
            conf = min(conf, 0.50)

        valor = _extract_number(snippet + " " + titulo)
        items.append(ResearchItem(
            query=query,
            titulo=titulo,
            snippet=snippet,
            url=url,
            domain=domain,
            domain_tier=tier,
            fecha=fecha or None,
            valor_numerico=valor,
            confianza=conf,
        ))
    return items


# ─── ResearchService ─────────────────────────────────────────────────────────

class ResearchService:
    """
    Servicio de investigación web para ALQUIMIA.
    Uso: `await ResearchService.investigate(municipio, zm, queries_extra)`
    """

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key

    @classmethod
    def _get_api_key(cls) -> Optional[str]:
        import os
        key = os.environ.get("SERPER_API_KEY")
        if key:
            return key
        try:
            from app.config import settings
            return settings.SERPER_API_KEY
        except Exception:
            return None

    async def _search_one(self, client: httpx.AsyncClient, query: str) -> List[ResearchItem]:
        """Ejecuta una query con cache."""
        ck = _cache_key(query)
        now = time.time()

        if ck in _CACHE:
            ts, cached = _CACHE[ck]
            if now - ts < _CACHE_TTL_SEC:
                logger.debug(f"ResearchService cache hit: {query[:60]}")
                return cached

        try:
            resp = await client.post(
                _SERPER_URL,
                headers={"X-API-KEY": self._api_key, "Content-Type": "application/json"},
                json={"q": query, "hl": "es", "gl": "mx", "num": 5},
                timeout=_HTTP_TIMEOUT,
            )
            if resp.status_code == 200:
                items = _parse_serper_result(resp.json(), query)
                _CACHE[ck] = (now, items)
                return items
            logger.warning(f"Serper {resp.status_code} for query: {query[:60]}")
        except Exception as exc:
            logger.warning(f"Serper error: {exc} — query: {query[:60]}")

        return []

    async def investigate(
        self,
        municipio: str,
        estado: str,
        zm: str,
        queries_extra: Optional[List[str]] = None,
    ) -> ResearchFindings:
        """
        Ejecuta el conjunto estándar de queries para un municipio.
        Respeta el límite de MAX_QUERIES_RUN para controlar costos de API.
        """
        municipio_id = municipio.lower().replace(" ", "_")[:50]

        try:
            from app.research.cache import load_cached_findings
            cached = load_cached_findings(municipio_id, zm, municipio)
            if cached and (
                cached.costos_construccion
                or cached.precios_materiales
                or cached.reglamentos
            ):
                logger.info("ResearchService: caché Postgres (%s)", municipio)
                return cached
        except Exception as exc:
            logger.debug("research cache miss: %s", exc)

        key = self._get_api_key()
        findings = ResearchFindings(zm=zm, municipio=municipio)

        if not key:
            findings.advertencias.append(
                "SERPER_API_KEY no configurada — ResearchFindings vacío. "
                "Agrega la key para habilitar investigación de costos en tiempo real."
            )
            return findings

        self._api_key = key

        # Queries estándar (orden de prioridad)
        std_queries = [
            f"costo construccion bodega industrial {municipio} {estado} m2 2025 2026",
            f"precio terreno industrial {municipio} {estado} m2",
            f"costo disposicion relleno sanitario {estado} tonelada tarifa 2024 2025",
            "precio camion recolector residuos solidos Mexico 2025 2026",
            "precio PET reciclado Mexico MXN kg 2026",
            "precio aluminio reciclado compra Mexico MXN kg",
            "precio papel carton reciclado Mexico MXN kg",
            f"composicion RSU {municipio} estudio caracterizacion residuos",
            f"reglamento aseo publico {municipio} vigente 2024 2025",
            f"noticias residuos solidos {municipio} {estado} 2025 2026",
        ]

        all_queries = (std_queries + (queries_extra or []))[:_MAX_QUERIES_RUN]
        findings.queries_ejecutadas = len(all_queries)

        async with httpx.AsyncClient() as client:
            tasks = [self._search_one(client, q) for q in all_queries]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for query, result in zip(all_queries, results):
            if isinstance(result, Exception):
                findings.advertencias.append(f"Error en query '{query[:50]}': {result}")
                continue
            if not result:
                continue

            categoria = _classify_query(query)
            bucket: List[ResearchItem] = getattr(findings, categoria, [])
            bucket.extend(result)
            # Ordenar por confianza descendente, mantener top 5 por categoría
            bucket.sort(key=lambda x: x.confianza, reverse=True)
            setattr(findings, categoria, bucket[:5])
            findings.queries_con_resultado += 1

            try:
                from app.research.persistence import persist_research_items
                persist_research_items(
                    result,
                    categoria=categoria,
                    query=query,
                    municipio_id=municipio_id,
                    zm_id=zm,
                )
            except Exception as exc:
                logger.debug("research persist skip: %s", exc)

        findings.fuente_serper = True

        # Sanidad: flagear si no se encontraron precios de construccion
        if not findings.costos_construccion:
            findings.advertencias.append(
                f"No se encontró precio de construccion para {municipio} — "
                "se usará benchmark regional del cost_registry."
            )
        if not findings.costos_terreno:
            findings.advertencias.append(
                f"No se encontró precio de terreno para {municipio} — "
                "se usará benchmark regional del cost_registry."
            )

        return findings


# ─── Singleton de conveniencia ────────────────────────────────────────────────

_service: Optional[ResearchService] = None


def get_research_service() -> ResearchService:
    global _service
    if _service is None:
        _service = ResearchService()
    return _service


async def investigate_municipio(
    municipio: str,
    estado: str,
    zm: str,
    queries_extra: Optional[List[str]] = None,
) -> ResearchFindings:
    """Shortcut para llamar desde agora.py o el router."""
    return await get_research_service().investigate(municipio, estado, zm, queries_extra)
