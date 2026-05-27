"""Endpoints cron — protegidos con CRON_SECRET."""
from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.cron.jobs import (
    job_geo_denue_nacional_sync,
    job_geo_depot_report,
    job_geo_places_estado_rotation,
    job_logistics_daily_summary,
    job_weekly_status,
)
from app.db.session import get_db
from app.repo_paths import repo_root

router = APIRouter()


def _load_cron_config() -> dict[str, Any]:
    path = repo_root() / "config" / "cron.json"
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def verify_cron_secret(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")) -> None:
    from app.config import settings

    expected = (os.getenv("CRON_SECRET") or settings.CRON_SECRET or "").strip()
    if not expected:
        raise HTTPException(
            503,
            "CRON_SECRET no configurado en el servidor — definir en Render env vars",
        )
    if not x_cron_secret or x_cron_secret.strip() != expected:
        raise HTTPException(401, "X-Cron-Secret inválido")


class LogisticsCronRequest(BaseModel):
    municipio_id: str = Field("slp", min_length=2, max_length=64)
    zm_id: str | None = "zm_slp"
    fecha: date | None = None
    persist_db: bool = True
    use_google_routes: bool = False
    municipio_ids: list[str] | None = None
    zm_ids: list[str] | None = None


class GeoSyncCronRequest(BaseModel):
    batch_size: int | None = Field(None, ge=1, le=250)
    force_bootstrap: bool = False


@router.get("/manifest")
def cron_manifest() -> dict[str, Any]:
    cfg = _load_cron_config()
    return {
        "agent": "HERMES+KRONOS+GEO",
        "jobs": cfg.get("jobs", {}),
        "auth": "Header X-Cron-Secret = CRON_SECRET env",
    }


@router.post("/logistics-daily-summary", dependencies=[Depends(verify_cron_secret)])
def cron_logistics_daily_summary(
    body: LogisticsCronRequest | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    req = body or LogisticsCronRequest()
    zm_ids = req.zm_ids
    if not zm_ids and not req.municipio_ids:
        zm_ids = [z.strip() for z in os.getenv("HERMES_ZM_IDS", "SLP,QRO,MTY").split(",") if z.strip()]
    return job_logistics_daily_summary(
        municipio_id=req.municipio_id,
        zm_id=req.zm_id,
        fecha=req.fecha,
        persist_db=req.persist_db,
        db=db,
        use_google_routes=req.use_google_routes,
        municipio_ids=req.municipio_ids,
        zm_ids=zm_ids if not req.municipio_ids else None,
    )


@router.post("/geo-denue-nacional-sync", dependencies=[Depends(verify_cron_secret)])
def cron_geo_denue_nacional_sync(
    body: GeoSyncCronRequest | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    req = body or GeoSyncCronRequest()
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    return job_geo_denue_nacional_sync(
        db=db,
        batch_size=req.batch_size,
        force=req.force_bootstrap,
    )


class GeoPlacesRotationRequest(BaseModel):
    estado_id: str | None = None
    force: bool = False


@router.post("/geo-places-estado-rotation", dependencies=[Depends(verify_cron_secret)])
def cron_geo_places_rotation(
    body: GeoPlacesRotationRequest | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """DENUE + Places + candidato operador para un estado (rotación diaria)."""
    req = body or GeoPlacesRotationRequest()
    return job_geo_places_estado_rotation(db=db, estado_id=req.estado_id, force=req.force)


@router.post("/geo-depot-report", dependencies=[Depends(verify_cron_secret)])
def cron_geo_depot_report(db: Session = Depends(get_db)) -> dict[str, Any]:
    return job_geo_depot_report(db=db)


@router.post("/weekly-status", dependencies=[Depends(verify_cron_secret)])
def cron_weekly_status(
    municipio_id: str | None = Query("slp"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return job_weekly_status(municipio_id=municipio_id, db=db)
