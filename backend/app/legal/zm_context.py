"""Handlers ZM que no requieren autenticación — permiten tests sin cadena auth/jose."""
from __future__ import annotations

from fastapi import HTTPException

from app.legal.repository import get_repo


def execute_zm_context(zm: str) -> None:
    """Siempre lanza HTTPException 404 o 400 (nunca retorna)."""
    repo = get_repo()
    if not repo.get_municipios_by_zm(zm.upper()):
        raise HTTPException(status_code=404, detail=f"ZM '{zm}' no encontrada")
    raise HTTPException(
        status_code=400,
        detail={
            "ok": False,
            "zm": zm.upper(),
            "error": (
                "Zona metropolitana sin contexto legal único: la ZM coordina interoperabilidad y convenios; "
                "el reglamento y la titularidad sancionatoria viven en cada municipio."
            ),
            "next_action": (
                "Usar GET /legal/{municipio}/context una vez por cada municipio_id de la ZM; "
                "no usar la ZM como autoridad jurídica única."
            ),
        },
    )
