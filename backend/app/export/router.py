"""Router exportación: reporte modelado + PDF ejecutivo de consultoría."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from starlette.requests import Request

from app.access.middleware import get_access_context, verify_rol
from app.access.schemas import RolAcceso
from app.export.generator import build_export_report
from app.export.pdf_renderer import render_executive_pdf
from app.export.schemas import ExecutivePdfRequest, ExportRequest, ExportResponse

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


@router.post("/executive-pdf")
def export_executive_pdf(req: ExecutivePdfRequest):
    """
    Genera PDF ejecutivo Times New Roman desde estado del simulador.
    Acceso abierto (mismo nivel que previsualización de escenario).
    """
    snap = req.snapshot_datos or {}
    manifest = {
        "zm": req.zm,
        "municipio": req.municipio_nombre or req.municipio_id,
        "version": "0.1-borrador-consultoria",
        "score_datos": snap.get("score_datos"),
        "warnings_activos": snap.get("advertencias") or [],
        "fuentes_usadas": snap.get("fuentes_usadas") or [],
        "fecha": date.today().isoformat(),
    }
    package_id = f"sim-{uuid.uuid4().hex[:12]}"
    pdf_bytes, reason = render_executive_pdf(
        manifest=manifest,
        resultados=req.resultados,
        theme_zm=req.zm,
        theme_municipio=req.municipio_nombre or req.municipio_id,
        package_id=package_id,
        module_label=req.module_label or "",
    )
    if not pdf_bytes:
        raise HTTPException(status_code=503, detail=reason or "PDF no disponible")

    slug = (req.municipio_id or req.zm).replace(" ", "_")[:32]
    filename = f"ALQUIMIA_ejecutivo_{slug}_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
