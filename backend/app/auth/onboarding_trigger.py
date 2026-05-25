"""Dispara investigación y antecedentes tras completar onboarding con PDF."""
from __future__ import annotations

import asyncio
import logging

from app.models.user_account import UserAccount

logger = logging.getLogger(__name__)


async def kickoff_municipal_analysis(user: UserAccount) -> None:
    """Arranca agentes con el PDF ya cargado — 'arrastrar el lápiz'."""
    if not user.municipio_id or not user.municipio_nombre:
        logger.info("kickoff omitido: usuario %s sin municipio", user.email)
        return

    mid = user.municipio_id.lower()
    nombre = user.municipio_nombre
    estado = user.estado_mx or ""
    zm = user.zm or "ZM"

    try:
        from app.legal.diagnostic import build_diagnostic

        diag = build_diagnostic(mid)
        if diag:
            logger.info(
                "Diagnóstico jurídico listo para %s — score=%s bloqueado=%s",
                mid,
                diag.score_legal,
                diag.agora_bloqueado,
            )
    except Exception as exc:
        logger.warning("Diagnóstico post-onboarding falló para %s: %s", mid, exc)

    try:
        from app.agents.research_service import investigate_municipio

        findings = await investigate_municipio(nombre, estado, zm)
        logger.info(
            "Investigador disparado para %s — %d items",
            mid,
            len(findings.reglamentos) + len(findings.noticias_locales),
        )
    except Exception as exc:
        logger.warning("Investigador post-onboarding falló para %s: %s", mid, exc)

    try:
        from app.research.antecedentes_service import generate_antecedentes_reportaje

        reportaje = await generate_antecedentes_reportaje(
            municipio_id=mid,
            municipio_nombre=nombre,
            estado=estado,
            zm_id=zm,
            refresh=True,
        )
        logger.info(
            "Antecedentes generados para %s — %d eventos",
            mid,
            len(reportaje.eventos),
        )
    except Exception as exc:
        logger.warning("Antecedentes post-onboarding falló para %s: %s", mid, exc)


def schedule_kickoff(user: UserAccount) -> None:
    """Fire-and-forget en el event loop activo."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(kickoff_municipal_analysis(user))
    except RuntimeError:
        asyncio.run(kickoff_municipal_analysis(user))
