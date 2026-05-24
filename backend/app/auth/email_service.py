"""Correo transaccional — Resend en producción, log en desarrollo."""
from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(*, to_email: str, verify_url: str, nombre: str) -> None:
    subject = "Confirma tu cuenta en ALQUIMIA"
    html = f"""
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1C1B18;">
      <p style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #3B6D11;">ALQUIMIA</p>
      <h1 style="font-size: 22px;">Hola, {nombre}</h1>
      <p style="font-size: 14px; line-height: 1.7; color: #4A4740;">
        Recibimos tu solicitud de acceso a la plataforma de consultoría municipal.
        Confirma tu correo para continuar con la configuración de seguridad (código TOTP).
      </p>
      <p style="margin: 28px 0;">
        <a href="{verify_url}" style="background:#3B6D11;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
          Confirmar correo electrónico
        </a>
      </p>
      <p style="font-size: 11px; color: #A8A49C;">El enlace expira en 24 horas. Si no solicitaste esta cuenta, ignora este mensaje.</p>
    </div>
    """

    if settings.EMAIL_PROVIDER == "console" or not settings.RESEND_API_KEY:
        logger.info("[EMAIL:console] verification → %s | %s", to_email, verify_url)
        return

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
        )
        if res.status_code >= 400:
            logger.error("Resend error %s: %s", res.status_code, res.text)
            raise RuntimeError("No se pudo enviar el correo de verificación")
