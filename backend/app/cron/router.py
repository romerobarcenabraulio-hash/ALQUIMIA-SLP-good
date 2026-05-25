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

from app.cron.jobs import job_logistics_daily_summary, job_weekly_status
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


@router.get("/manifest")
def cron_manifest() -> dict[str, Any]:
    """Manifest público de jobs (sin secret)."""
    cfg = _load_cron_config()
    return {
        "agent": "HERMES+KRONOS",
        "jobs": cfg.get("jobs", {}),
        "auth": "Header X-Cron-Secret = CRON_SECRET env",
    }


@router.post("/logistics-daily-summary", dependencies=[Depends(verify_cron_secret)])
def cron_logistics_daily_summary(
    body: LogisticsCronRequest | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """19:00 MX — HERMES daily_summary + AURUM AC sync."""
    req = body or LogisticsCronRequest()
    return job_logistics_daily_summary(
        municipio_id=req.municipio_id,
        zm_id=req.zm_id,
        fecha=req.fecha,
        persist_db=req.persist_db,
        db=db,
        use_google_routes=req.use_google_routes,
    )


@router.post("/weekly-status", dependencies=[Depends(verify_cron_secret)])
def cron_weekly_status(
    municipio_id: str | None = Query("slp"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Semanal — genera weekly_status KRONOS."""
    return job_weekly_status(municipio_id=municipio_id, db=db)
