"""Cuota diaria Google APIs — config/api_limits.json + contador Neon."""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.google.config import load_api_limits
from app.models.geo import ApiUsageDaily

logger = logging.getLogger(__name__)

SERVICE_ALIASES = {
    "geocoding": "google_geocoding",
    "google_geocoding": "google_geocoding",
    "routes": "google_routes",
    "google_routes": "google_routes",
    "places": "google_geocoding",
    "google_places": "google_geocoding",
    "route_matrix": "google_routes_matrix",
    "google_routes_matrix": "google_routes_matrix",
}


def _normalize_service(service_key: str) -> str:
    return SERVICE_ALIASES.get(service_key, service_key)


def _service_config(service_key: str) -> dict[str, Any]:
    limits = load_api_limits()
    services = limits.get("services") or {}
    return services.get(_normalize_service(service_key)) or {}


def _get_count(db: Session | None, usage_date: date, service_key: str) -> int:
    if db is None:
        return 0
    row = (
        db.query(ApiUsageDaily)
        .filter(
            ApiUsageDaily.usage_date == usage_date,
            ApiUsageDaily.service_key == _normalize_service(service_key),
        )
        .first()
    )
    return row.call_count if row else 0


def check_quota(db: Session | None, service_key: str, *, units: int = 1) -> dict[str, Any]:
    """Retorna allowed, pct_used, hard_stop, warn."""
    cfg = _service_config(service_key)
    daily_quota = int(cfg.get("daily_quota") or 0)
    if daily_quota <= 0:
        return {"allowed": True, "pct_used": 0.0, "hard_stop": False, "warn": False, "service": service_key}

    today = date.today()
    used = _get_count(db, today, service_key)
    projected = used + units
    pct = round(projected / daily_quota, 4)
    warn_at = float(cfg.get("warn_at_pct") or 0.85)
    hard_at = float(cfg.get("hard_stop_at_pct") or 0.98)
    hard_stop = pct >= hard_at
    warn = pct >= warn_at
    return {
        "allowed": not hard_stop,
        "pct_used": pct,
        "hard_stop": hard_stop,
        "warn": warn,
        "service": _normalize_service(service_key),
        "used": used,
        "daily_quota": daily_quota,
        "fallback": cfg.get("fallback"),
    }


def record_usage(db: Session | None, service_key: str, *, units: int = 1) -> None:
    if db is None or units <= 0:
        return
    today = date.today()
    sk = _normalize_service(service_key)
    row = (
        db.query(ApiUsageDaily)
        .filter(ApiUsageDaily.usage_date == today, ApiUsageDaily.service_key == sk)
        .first()
    )
    if row:
        row.call_count += units
    else:
        db.add(ApiUsageDaily(usage_date=today, service_key=sk, call_count=units))
    db.flush()


def quota_summary(db: Session | None) -> dict[str, Any]:
    limits = load_api_limits()
    services = limits.get("services") or {}
    today = date.today()
    out: dict[str, Any] = {}
    for key in services:
        cfg = services[key]
        quota = int(cfg.get("daily_quota") or 0)
        used = _get_count(db, today, key)
        pct = round(used / quota * 100, 2) if quota else 0.0
        out[key] = {"used": used, "daily_quota": quota, "pct_used": pct}
    return out
