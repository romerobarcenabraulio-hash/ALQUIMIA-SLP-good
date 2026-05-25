import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Runtime / deploy (.env.example)
    ENVIRONMENT:     str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    PORT:            int = 8000
    LOG_LEVEL:       str = "info"

    # JWT
    SECRET_KEY:          str = "alquimia-secret-change-in-prod-2025"
    ALGORITHM:           str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    # DB
    DATABASE_URL: str = "postgresql://alquimia:alquimia@localhost:5432/alquimia"

    # APIs externas
    SERPER_API_KEY:   Optional[str] = None
    PERPLEXITY_API_KEY: Optional[str] = None  # diferido — ver RESEARCH_INTELLIGENCE_ROADMAP.md
    MAPBOX_TOKEN:     Optional[str] = None  # deprecated — usar Google Maps en frontend
    ANTHROPIC_API_KEY: Optional[str] = None
    # INEGI DENUE — resolve_inegi_api_token()
    INEGI_API_TOKEN: Optional[str] = None
    INEGI_RUTEO_TOKEN: Optional[str] = None
    # Google Maps Platform (Render env names)
    GOOGLE_PLACES_API_KEY: str = ""
    GEOCODING_API: Optional[str] = None
    MAPS_PLATFORM_API: Optional[str] = None
    OPTIMIZATION_ROUTE_API: Optional[str] = None
    # Banxico SIE — token para consultas con rango de fecha (INPC histórico).
    # Sin token: solo endpoint "oportuno" (tipo cambio). Con token: también INPC anual.
    # Registro gratuito en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
    BANXICO_TOKEN:   Optional[str] = None
    # Modelo para el pipeline legacy (ZIP 7-docs). Haiku = velocidad; Sonnet = calidad.
    # Cambiar a claude-sonnet-4-6 para calidad máxima (más lento y costoso).
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
    # Feature flags — deshabilitar en staging si dependencias externas no están listas
    INVESTIGADOR_ENABLED: bool = True   # Ejecutar Agente Investigador (requiere SERPER_API_KEY)
    PLACES_SYNC_ENABLED:  bool = False

    # Google Drive
    DRIVE_ROOT_ID:     str = "1mVC_ay_qvmT08QZReoKp2X8jTHZiPoMW"
    DRIVE_SLP_ID:      str = "1btaIFfZiEFIoocFdbDAWN1O-lNKwyTWC"
    DRIVE_QRO_ID:      str = "1KVXVzwMpXKE8a8IZCHEOimn32NBCeL-h"
    DRIVE_NL_ID:       str = "1I1nVxDzs4iKdUiiOpVviCvH9k_w-gZTv"
    DRIVE_GTO_ID:      str = "1CXBIvK82Aa1RqDKIa82SoXGiBLqozwb2"

    DRIVE_CAPITULO_SLP_ID:    str = "1EauAowFQCm2s67gNogF27L29m9qLJqxCqFp5p9E3xQ4"
    DRIVE_MODELO_BASED_ID:    str = "1fdtOgWQ0rstpNiv7g_d0a-2LqFS6QFaflQz1NtJHcag"
    DRIVE_CENTROS_ACOPIO_ID:  str = "1UiTHuvc-8Ozdu0BYEvsurX19ztB8uk94Dwm9XuaPNnI"
    DRIVE_RECICLADORAS_ID:    str = "12__CE0tiv8XAzWIve7xszwdLaCqLNNYzZO1d5Ds9h6M"
    DRIVE_ESTRATEGIA_SLP_ID:  str = "1scCxAihTJrHqkjuinXlq1ewbZjtfLyTd"
    DRIVE_GANTT_SLP_ID:       str = "1L9R7ieqJtk4YxD7LMZHTOHeJcf0wyEcg"
    DRIVE_BITACORA_ID:        str = "1trv7XqXXEAynaUwJeLvmGTAjLoThJOQS1CqOpWiU8dI"

    GOOGLE_SERVICE_ACCOUNT_FILE: Optional[str] = None

    # Cuentas institucionales — registro, correo y TOTP
    REGISTRATION_ENABLED: bool = True
    EMAIL_PROVIDER: str = "console"  # console | resend
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "ALQUIMIA <noreply@alquimia.mx>"
    APP_PUBLIC_URL: str = "http://localhost:3000"

    # SMS — verificación de teléfono y segundo factor en login
    SMS_PROVIDER: str = "console"  # console | twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None
    SMS_MAX_SENDS_PER_HOUR: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15
    MAX_FAILED_LOGINS: int = 5

    def app_public_url(self) -> str:
        """URL pública del frontend (enlaces de verificación de correo)."""
        base = (self.APP_PUBLIC_URL or "").strip().rstrip("/")
        if base and base not in ("http://localhost:3000", "http://127.0.0.1:3000"):
            return base
        if self.ENVIRONMENT == "production":
            return "https://alquimia-slp.vercel.app"
        return base or "http://localhost:3000"


settings = Settings()


def resolve_inegi_api_token() -> str:
    """Token del portal de desarrolladores INEGI (sin exponer al cliente).

    Orden: variables de entorno INEGI_API_TOKEN → INEGI_DENUE_TOKEN → DENUE_API_TOKEN;
    si ninguna está en el entorno, usa `settings.INEGI_API_TOKEN` (p. ej. desde `.env`).
    """
    for key in ("INEGI_API_TOKEN", "INEGI_DENUE_TOKEN", "DENUE_API_TOKEN"):
        raw = os.environ.get(key)
        if raw is not None and str(raw).strip():
            return str(raw).strip()
    return (settings.INEGI_API_TOKEN or "").strip()


def resolve_inegi_ruteo_token() -> str:
    """Token API de Ruteo SAKBÉ v3.1 (gaia.inegi.org.mx/sakbe_v3.1/genera_token.jsp)."""
    for key in ("INEGI_RUTEO_TOKEN", "SAKBE_API_KEY", "INEGI_RUTEO_KEY"):
        raw = os.environ.get(key)
        if raw is not None and str(raw).strip():
            return str(raw).strip()
    return (settings.INEGI_RUTEO_TOKEN or "").strip()
