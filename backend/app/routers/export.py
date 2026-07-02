"""Router para exportar reportes municipales — ALQ-18"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone

from app.db.session import get_db
from app.routers.auth import get_current_user
from app.national.export_excel import CoberturaExcelBuilder
from app.national.coverage import coverage_for_municipio
from app.national.catalog import ZM_CATALOG
from app.national.schemas import CoverageStage, SourceStatus
from app.services.municipal_alert_service import MunicipalAlertService
from app.legal.repository import ZM_MUNICIPIOS
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/export", tags=["export"])


def _map_coverage_to_status(coverage_stage: CoverageStage) -> str:
    """Map coverage stage to VERDE/AMARILLO/ROJO"""
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
