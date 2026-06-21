"""Research kickoff dirigido al crear un tenant.

Cuando se crea un tenant (municipio), este módulo dispara scraping inmediato
y dirigido a ese municipio, en vez de esperar al ciclo periódico del
scheduler. Corre como tarea de fondo: create_tenant responde al instante.

Las fuentes que fallan o no devuelven nada quedan registradas — el panel del
founder muestra qué se obtuvo automáticamente y qué requiere alimentación
humana (PDF). Nunca se finge frescura.
"""

import asyncio
import logging
from typing import Any, Dict

from app.models.web_scraper import ScraperSource
from app.web_scraper.scheduler import scrape_and_store_documents

logger = logging.getLogger(__name__)

# Fuentes que se consultan al crear un tenant, con búsqueda dirigida.
_KICKOFF_SOURCES = [
    ScraperSource.dof,
    ScraperSource.semarnat,
    ScraperSource.cofemer,
    ScraperSource.inegi,
]

# Ventana amplia: al dar de alta un municipio interesa el acervo histórico,
# no solo lo publicado esta semana.
_KICKOFF_DAYS_BACK = 365


def _build_keywords(nombre: str, estado_mx: str) -> list[str]:
    base = [
        "residuos sólidos urbanos",
        "gestión integral de residuos",
        "relleno sanitario",
        "reglamento de limpia",
        "LGPGIR",
        "NOM-083",
    ]
    territorial = [
        f"residuos {nombre}",
        f"reglamento {nombre}",
        f"residuos {estado_mx}",
        f"programa estatal residuos {estado_mx}",
    ]
    return territorial + base


async def run_tenant_research_kickoff(
    tenant_id: str,
    nombre: str,
    estado_mx: str,
    inegi_clave: str,
) -> Dict[str, Any]:
    """Ejecuta el scraping dirigido para un tenant recién creado.

    Abre su propia sesión de DB (corre fuera del request HTTP).
    """
    from app.db.session import get_sync_db

    keywords = _build_keywords(nombre, estado_mx)
    summary: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "fuentes_consultadas": 0,
        "fuentes_con_datos": 0,
        "documentos_nuevos": 0,
        "fuentes_fallidas": [],
    }

    with get_sync_db() as db:
        if db is None:
            logger.warning("kickoff sin DB disponible tenant=%s", tenant_id)
            return summary
        for source in _KICKOFF_SOURCES:
            summary["fuentes_consultadas"] += 1
            try:
                results = await scrape_and_store_documents(
                    db, source, keywords, days_back=_KICKOFF_DAYS_BACK
                )
                nuevos = results.get("documentos_nuevos", 0)
                summary["documentos_nuevos"] += nuevos
                if nuevos or results.get("documentos_encontrados"):
                    summary["fuentes_con_datos"] += 1
                if results.get("errores"):
                    summary["fuentes_fallidas"].append(source.value)
            except Exception as exc:
                logger.warning(
                    "kickoff source %s failed for tenant %s: %s",
                    source.value, tenant_id, exc,
                )
                summary["fuentes_fallidas"].append(source.value)
        logger.info(
            "research kickoff tenant=%s (%s, %s, INEGI %s): %s docs nuevos, "
            "%s/%s fuentes con datos, fallidas=%s",
            tenant_id, nombre, estado_mx, inegi_clave,
            summary["documentos_nuevos"], summary["fuentes_con_datos"],
            summary["fuentes_consultadas"], summary["fuentes_fallidas"],
        )

    return summary


def schedule_tenant_research_kickoff(
    tenant_id: str,
    nombre: str,
    estado_mx: str,
    inegi_clave: str,
) -> None:
    """Encola el kickoff como tarea asyncio sin bloquear el request.

    Si no hay event loop (tests síncronos), se omite silenciosamente.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.info("kickoff omitido (sin event loop) tenant=%s", tenant_id)
        return
    loop.create_task(
        run_tenant_research_kickoff(tenant_id, nombre, estado_mx, inegi_clave)
    )
    logger.info("research kickoff encolado tenant=%s (%s)", tenant_id, nombre)
