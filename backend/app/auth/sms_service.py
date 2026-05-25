"""Envío de códigos SMS — Twilio en producción, consola en desarrollo."""
from __future__ import annotations

import hashlib
import logging
import secrets

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _hash_code(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def generate_sms_code() -> tuple[str, str]:
    """Devuelve (código de 6 dígitos, hash para almacenar)."""
    raw = f"{secrets.randbelow(1_000_000):06d}"
    return raw, _hash_code(raw)


def verify_sms_code(raw: str, stored_hash: str) -> bool:
    return secrets.compare_digest(_hash_code(raw.strip()), stored_hash)


async def send_sms_code(*, to_e164: str, code: str, purpose: str) -> None:
    body = f"ALQUIMIA: tu código de verificación es {code}. Válido 10 min. No lo compartas."
    provider = (settings.SMS_PROVIDER or "console").lower()

    if provider == "console":
        logger.info("[SMS:console] %s → %s | %s", purpose, to_e164, code)
        return

    if provider == "twilio":
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_FROM_NUMBER:
            logger.warning("[SMS] Twilio no configurado — usando consola")
            logger.info("[SMS:console] %s → %s | %s", purpose, to_e164, code)
            return
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                url,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                data={"To": to_e164, "From": settings.TWILIO_FROM_NUMBER, "Body": body},
            )
            if res.status_code >= 400:
                logger.error("[SMS:twilio] error %s: %s", res.status_code, res.text[:200])
                raise RuntimeError("No se pudo enviar el SMS")
        return

    logger.info("[SMS:console] %s → %s | %s", purpose, to_e164, code)
