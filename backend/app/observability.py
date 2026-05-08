"""Observabilidad mínima: request id, logs JSON sin PII, health profundo."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from starlette.requests import Request

_access_log = logging.getLogger("alquimia.access")

PROCESS_START_MONO = time.monotonic()


def process_uptime_seconds() -> int:
    return int(time.monotonic() - PROCESS_START_MONO)


def app_version_from_env(default: str) -> str:
    v = (os.getenv("APP_VERSION") or "").strip()
    return v if v else default


def get_app_environment() -> str:
    raw = (os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or "development").strip().lower()
    if raw in ("production", "prod"):
        return "production"
    return raw or "development"


def _hide_gdl_options() -> bool:
    return os.getenv("ALQUIMIA_HIDE_GDL", "").strip() == "1"


def deep_health_checks() -> dict:
    """Payload parcial sin status global (lo arma el caller)."""

    checks: dict = {"city_repository": "fail", "legal_paquete_zms": {}, "agora_pipeline": "fail"}

    # city_repository
    try:
        from app.city.repository import list_city_options

        opts = list_city_options()
        checks["city_repository"] = "ok" if len(opts) >= 3 else "fail"
    except Exception:
        checks["city_repository"] = "fail"

    # legal_paquete_zms
    try:
        from app.legal.metropolitan import build_paquete_metropolitano
        from app.legal.repository import ZM_MUNICIPIOS

        zms_payload: dict[str, str] = {}
        for zm in ("SLP", "MTY", "QRO", "GDL"):
            if zm == "GDL" and _hide_gdl_options():
                zms_payload[zm] = "skip"
                continue
            muns = ZM_MUNICIPIOS.get(zm)
            if not muns:
                zms_payload[zm] = "fail"
                continue
            pkg = build_paquete_metropolitano(zm, list(muns))
            zms_payload[zm] = "ok" if len(pkg.paquete_municipal) == len(muns) else "fail"
        checks["legal_paquete_zms"] = zms_payload
    except Exception:
        checks["legal_paquete_zms"] = {
            k: ("skip" if k == "GDL" and _hide_gdl_options() else "fail") for k in ("SLP", "MTY", "QRO", "GDL")
        }

    # agora_pipeline — válida sólo configuración (sin llamadas a modelo)
    relax = os.getenv("HEALTH_DEEP_RELAX_AGORA", "").strip() == "1"
    api_key = (settings.ANTHROPIC_API_KEY or "").strip()
    placeholders = {"", "tu_anthropic_api_key_aqui"}
    if api_key and api_key not in placeholders:
        checks["agora_pipeline"] = "ok"
    elif relax:
        checks["agora_pipeline"] = "ok"
    else:
        checks["agora_pipeline"] = "fail"

    return checks


def deep_health_should_pass(checks: dict) -> bool:
    if checks.get("city_repository") != "ok":
        return False
    if checks.get("agora_pipeline") != "ok":
        return False
    zm = checks.get("legal_paquete_zms") or {}
    for k in ("SLP", "MTY", "QRO", "GDL"):
        status = zm.get(k, "fail")
        if status == "skip":
            continue
        if status != "ok":
            return False
    return True


def build_deep_health_payload(*, api_version_fallback: str) -> tuple[dict, int]:
    env = get_app_environment()
    version = app_version_from_env(api_version_fallback)
    checks = deep_health_checks()
    overall_ok = deep_health_should_pass(checks)
    body = {
        "status": "ok" if overall_ok else "fail",
        "environment": env,
        "version": version,
        "uptime_seconds": process_uptime_seconds(),
        "checks": checks,
    }
    status_code = 200 if overall_ok else 503
    return body, status_code


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Añade X-Request-ID y escribe una línea JSON por respuesta (sin IP ni emails)."""

    SKIP_PATH_METHODS = {("/health", "GET"), ("/health", "HEAD"), ("/health/deep", "GET"), ("/health/deep", "HEAD")}

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        inbound = request.headers.get("x-request-id") or ""
        rid = inbound.strip() or str(uuid.uuid4())
        ua = request.headers.get("user-agent") or ""
        ua_hash = hashlib.sha256(ua.encode("utf-8")).hexdigest()[:16]

        start = time.perf_counter()
        response = await call_next(request)

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        response.headers["X-Request-ID"] = rid

        path = request.url.path
        meth = request.method.upper()
        if (path, meth) not in self.SKIP_PATH_METHODS:
            line = json.dumps(
                {
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "request_id": rid,
                    "method": meth,
                    "path": path,
                    "status": response.status_code,
                    "duration_ms": elapsed_ms,
                    "user_agent_hash": ua_hash,
                },
                separators=(",", ":"),
                ensure_ascii=False,
            )
            _access_log.info(line)

        return response
