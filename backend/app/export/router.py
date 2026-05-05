"""Router Fase 13.6: exportación de reporte ejecutivo modelado."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from starlette.requests import Request

from app.access.middleware import get_access_context, verify_rol
from app.access.schemas import RolAcceso
from app.export.generator import build_export_report
from app.export.schemas import ExportRequest, ExportResponse

router = APIRouter()


@router.post("/report", response_model=ExportResponse)
def export_report(req: ExportRequest, request: Request):
    context = get_access_context(request)
    if not verify_rol(context, RolAcceso.tecnico):
        raise HTTPException(
            status_code=403,
            detail="Acceso restringido: se requiere rol técnico o superior para exportar reportes.",
        )
    return build_export_report(req)
