"""Router HTTP ÁGORA — descarga ZIP del plan municipal (Q-023)."""

from __future__ import annotations

import io
import logging

from fastapi import APIRouter, HTTPException
from starlette.responses import StreamingResponse

from app.agora.pipeline import generate_plan_zip
from app.agora.schemas import PlanRequest

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/generate-plan",
    response_class=StreamingResponse,
    summary="Generar paquete ZIP con 7 documentos markdown ÁGORA (Claude)",
)
async def generate_plan(
    body: PlanRequest,
) -> StreamingResponse:
    """Genera los 7 documentos en paralelo y devuelve un ZIP único."""
    try:
        data, fname = await generate_plan_zip(body)
    except RuntimeError as e:
        hint = str(e)
        logger.warning("agora_generate_plan_blocked: %s", hint)
        if "ANTHROPIC_API_KEY" in hint.upper():
            raise HTTPException(status_code=503, detail=hint) from e
        raise HTTPException(status_code=502, detail=hint) from e
    except Exception as e:  # noqa: BLE001
        logger.exception("agora_generate_plan_unexpected")
        raise HTTPException(status_code=502, detail=f"No se ensambló el paquete: {e!s}") from e

    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
