"""
Q-010-EXEC — Textos legales en exportaciones ÁGORA.

Deben mantenerse alineados con frontend/src/lib/simulationDisclaimer.ts
(AGORA_EXPORT_COVER_DISCLAIMER, EXPORT_LIABILITY_WAIVER).
"""

from __future__ import annotations

# Copia espejo de simulationDisclaimer.ts (sin importar TS desde Python).
AGORA_EXPORT_COVER_DISCLAIMER = (
    "⚠️ BORRADOR — SIMULACIÓN ALQUIMIA · NO OFICIAL\n\n"
    "Este documento fue generado automáticamente como insumo de análisis y planeación municipal. "
    "No constituye dictamen jurídico, acto de autoridad, resolución administrativa, propuesta de ley "
    "oficial ni asesoría legal certificada. Las cifras, proyecciones y referencias normativas son "
    "estimaciones del modelo; no sustituyen estudios oficiales ni instrumentos jurídicos firmados. "
    "Requiere revisión por profesionista con cédula vigente antes de cualquier uso oficial. "
    "— ALQUIMIA · Plataforma de Simulación de Circularidad Municipal"
)

EXPORT_LIABILITY_WAIVER = (
    "ALQUIMIA no asume responsabilidad por decisiones de política pública, contrataciones, sanciones "
    "ni reformas reglamentarias adoptadas con base en los resultados de esta simulación. "
    "Los datos de INEGI y reglamentos municipales referenciados se reproducen como marco informativo; "
    "su uso específico requiere verificación en fuente oficial."
)


def wrap_agora_markdown(body: str) -> str:
    """Prefija portada legal y añade pie en cada .md exportado por ÁGORA."""
    trimmed = body.strip()
    return (
        f"{AGORA_EXPORT_COVER_DISCLAIMER}\n\n---\n\n{trimmed}\n\n---\n\n{EXPORT_LIABILITY_WAIVER}\n"
    )
