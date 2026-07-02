"""Router exportación: reporte modelado + PDF consultoría por documento + cobertura Excel."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response, StreamingResponse
from starlette.requests import Request
from sqlalchemy.orm import Session

from app.access.middleware import get_access_context, verify_rol
from app.access.schemas import RolAcceso
from app.export.document_blueprints import get_blueprint
from app.export.generator import build_export_report
from app.export.expediente_pdf_renderer import render_expediente_inspeccion_pdf
from app.export.pdf_renderer import render_consulting_document_pdf, render_master_index_pdf
from app.export.schemas import (
    ExecutivePdfRequest,
    ExpedientePdfRequest,
    ExportRequest,
    ExportResponse,
    IndexPdfRequest,
)
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.national.export_excel import CoberturaExcelBuilder
from app.national.coverage import coverage_for_municipio
from app.national.catalog import ZM_CATALOG
from app.national.schemas import CoverageStage
from app.services.municipal_alert_service import MunicipalAlertService
from app.legal.repository import ZM_MUNICIPIOS

router = APIRouter()


def _manifest_from_request(zm: str, municipio_id: str, municipio_nombre: str, snap: dict) -> dict:
    return {
        "zm": zm,
        "municipio": municipio_nombre or municipio_id,
        "version": "0.1-borrador-consultoria",
        "score_datos": snap.get("score_datos"),
        "warnings_activos": snap.get("advertencias") or [],
        "fuentes_usadas": snap.get("fuentes_usadas") or [],
        "fecha": date.today().isoformat(),
    }


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
async def export_executive_pdf(req: ExecutivePdfRequest):
    """
    PDF consultoría con portada + índice + estructura del blueprint.
    document_id: 01_resumen_ejecutivo_municipal (default) u otro ID canónico.
    """
    doc_id = req.document_id or "01_resumen_ejecutivo_municipal"
    if get_blueprint(doc_id) is None:
        raise HTTPException(status_code=400, detail=f"document_id desconocido: {doc_id}")

    snap = req.snapshot_datos or {}
    manifest = _manifest_from_request(req.zm, req.municipio_id, req.municipio_nombre, snap)
    package_id = f"sim-{uuid.uuid4().hex[:12]}"

    from app.export.municipal_context import merge_municipal_context
    from app.export.executive_narrative import generate_executive_draft

    ctx = merge_municipal_context(
        req.municipio_id,
        req.contexto_municipal,
        zm=req.zm,
        municipio_nombre=req.municipio_nombre,
    )

    draft_ejecutivo = None
    if doc_id == "01_resumen_ejecutivo_municipal":
        draft_ejecutivo = await generate_executive_draft(req, ctx)

    pdf_bytes, reason = render_consulting_document_pdf(
        document_id=doc_id,
        manifest=manifest,
        resultados=req.resultados,
        theme_zm=req.zm,
        theme_municipio=req.municipio_nombre or req.municipio_id,
        package_id=package_id,
        module_label=req.module_label or "",
        contexto_municipal=ctx,
        draft_ejecutivo=draft_ejecutivo,
    )
    if not pdf_bytes:
        raise HTTPException(status_code=503, detail=reason or "PDF no disponible")

    bp = get_blueprint(doc_id)
    codigo = bp.codigo if bp else "01"
    slug = (req.municipio_id or req.zm).replace(" ", "_")[:32]
    filename = f"ALQUIMIA_{codigo}_{slug}_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/index-pdf")
def export_index_pdf(req: IndexPdfRequest):
    """Índice maestro del paquete (documento 00) — inventario 01–11."""
    snap = req.snapshot_datos or {}
    manifest = _manifest_from_request(req.zm, req.municipio_id, req.municipio_nombre, snap)
    package_id = f"idx-{uuid.uuid4().hex[:12]}"
    pdf_bytes, reason = render_master_index_pdf(
        manifest=manifest,
        theme_zm=req.zm,
        theme_municipio=req.municipio_nombre or req.municipio_id,
        package_id=package_id,
    )
    if not pdf_bytes:
        raise HTTPException(status_code=503, detail=reason or "PDF no disponible")

    slug = (req.municipio_id or req.zm).replace(" ", "_")[:32]
    filename = f"ALQUIMIA_00_indice_maestro_{slug}_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/expediente-pdf")
def export_expediente_pdf(req: ExpedientePdfRequest):
    """Acta de inspección predial — doc 12 · Times New Roman · portada + índice."""
    eid = str(req.expediente.get("expediente_id") or "expediente")
    pdf_bytes, reason = render_expediente_inspeccion_pdf(
        predio=req.predio,
        inspeccion=req.inspeccion,
        expediente=req.expediente,
        zm=req.zm,
        package_id=eid,
    )
    if not pdf_bytes:
        raise HTTPException(status_code=503, detail=reason or "PDF no disponible")

    filename = f"ALQUIMIA_12_expediente_{eid[:24]}_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _map_coverage_to_status(coverage_stage: CoverageStage) -> str:
    """Map coverage stage to VERDE/AMARILLO/ROJO"""
    from app.national.schemas import CoverageStage
    if coverage_stage in [CoverageStage.legal_verificado, CoverageStage.operacion_modelada, CoverageStage.implementacion_activa]:
        return "verificado"
    elif coverage_stage in [CoverageStage.legal_localizado, CoverageStage.datos_certificados, CoverageStage.contrato_identificado]:
        return "localizado"
    else:
        return "estimado"


@router.get("/cobertura-excel")
def export_cobertura_excel(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Exporta semáforo de cobertura a Excel

    Incluye:
    - Resumen nacional (VERDE/AMARILLO/ROJO counts)
    - Detalle por municipio con todos los campos
    - Histórico de alertas
    """
    try:
        builder = CoberturaExcelBuilder()

        # Query all municipios and their coverage status
        municipios_data = []
        verde_count = 0
        amarillo_count = 0
        rojo_count = 0

        for zm_id in ZM_CATALOG.keys():
            for municipio_id in ZM_MUNICIPIOS.get(zm_id, []):
                coverage = coverage_for_municipio(municipio_id)
                alerts, _ = MunicipalAlertService.list_alerts(db, municipio_id=municipio_id, unresolved_only=True, limit=1000)

                # Determine overall status
                overall_status = _map_coverage_to_status(coverage.coverage_status)
                if overall_status == "verificado":
                    verde_count += 1
                    status_color = "verificado"
                elif overall_status == "localizado":
                    amarillo_count += 1
                    status_color = "localizado"
                else:
                    if coverage.agora_bloqueado:
                        rojo_count += 1
                        status_color = "bloqueado"
                    else:
                        amarillo_count += 1
                        status_color = "estimado"

                # Build municipio row
                municipio_dict = {
                    "municipio_id": municipio_id,
                    "nombre": ZM_CATALOG[zm_id].nombre if municipio_id == zm_id else municipio_id,
                    "estado_general": status_color,
                    "demografia": coverage.demografia.value,
                    "rsu": coverage.rsu.value,
                    "legal": coverage.legal.value,
                    "contrato": coverage.contrato.value,
                    "presupuesto": coverage.presupuesto.value,
                    "operacion": coverage.operacion.value,
                    "rsu_ton_dia": None,
                    "per_capita": None,
                    "agora_bloqueado": coverage.agora_bloqueado,
                    "siguiente_accion": coverage.siguiente_accion,
                }
                municipios_data.append(municipio_dict)

        # Query alerts for last 30 days
        alerts_data = []
        alerts_all, _ = MunicipalAlertService.list_alerts(db, limit=10000)
        for alert in alerts_all:
            alert_dict = {
                "municipio_id": alert.municipio_id,
                "alert_type": alert.alert_type.value,
                "severity": alert.severity.value,
                "title": alert.title,
                "description": alert.description,
                "created_at": alert.created_at,
                "acknowledged": bool(alert.acknowledged),
                "resolved": bool(alert.resolved),
            }
            alerts_data.append(alert_dict)

        # Build Excel sheets
        builder.build_summary_sheet(verde_count, amarillo_count, rojo_count)
        builder.add_municipios_sheet(municipios_data)
        builder.add_alerts_sheet(alerts_data)

        excel_bytes = builder.to_bytes()

        return StreamingResponse(
            iter([excel_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=cobertura_municipal_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}.xlsx"},
        )

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Excel export requires openpyxl library (not installed in this environment)",
        )
