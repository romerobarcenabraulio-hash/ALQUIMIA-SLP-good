"""Router para exportar reportes municipales — ALQ-18"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone

from app.db.session import get_db
from app.routers.auth import get_current_user
from app.national.export_excel import CoberturaExcelBuilder
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/export", tags=["export"])


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

        # TODO: Query real data from DB
        # For now, scaffold only
        verde_count = 0
        amarillo_count = 0
        rojo_count = 0

        builder.build_summary_sheet(verde_count, amarillo_count, rojo_count)
        builder.add_municipios_sheet([])
        builder.add_alerts_sheet([])

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
