"""
Perplexity Sonar — DIFERIDO (sin presupuesto API en mayo 2026).

Cuando se active PERPLEXITY_API_KEY, implementar:
  - research_precio_material()
  - research_reglamento_municipal()
  - research_benchmarks_rsu()

Ver: cursor-rules/RESEARCH_INTELLIGENCE_ROADMAP.md

NO invocar este módulo en producción hasta entonces — ResearchService usa solo Serper.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ResearchSynthesis:
    texto: str
    fuente_url: Optional[str]
    confianza: float
    motor: str = "perplexity_deferred"


class PerplexityResearchService:
    """Stub: documenta contrato futuro sin llamadas de red."""

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key

    @classmethod
    def is_configured(cls) -> bool:
        import os
        if os.environ.get("PERPLEXITY_API_KEY"):
            return True
        try:
            from app.config import settings
            return bool(getattr(settings, "PERPLEXITY_API_KEY", None))
        except Exception:
            return False

    async def research_precio_material(
        self, material: str, municipio: str, estado: str
    ) -> ResearchSynthesis:
        raise NotImplementedError(
            "Perplexity deshabilitado — ver RESEARCH_INTELLIGENCE_ROADMAP.md. "
            "Use ResearchService (Serper) y price_series en Postgres."
        )

    async def research_reglamento_municipal(
        self, municipio: str, estado: str
    ) -> ResearchSynthesis:
        raise NotImplementedError("Perplexity deshabilitado — cargue PDF en marco legal M03.")

    async def research_benchmarks_rsu(
        self, poblacion_hab: int, pais: str = "México"
    ) -> List[dict]:
        raise NotImplementedError("Perplexity deshabilitado — use benchmarks_latam en Serper.")


def get_perplexity_service() -> PerplexityResearchService:
    return PerplexityResearchService()
