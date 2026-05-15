import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    # JWT
    SECRET_KEY:          str = "alquimia-secret-change-in-prod-2025"
    ALGORITHM:           str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    # DB
    DATABASE_URL: str = "postgresql://alquimia:alquimia@localhost:5432/alquimia"

    # APIs externas
    SERPER_API_KEY:   Optional[str] = None
    MAPBOX_TOKEN:     Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    # INEGI: el runtime también lee INEGI_DENUE_TOKEN / DENUE_API_TOKEN vía resolve_inegi_api_token().
    INEGI_API_TOKEN: Optional[str] = None
    # ID vigente en la API Messages (Haiku rápido; el slug antiguo claude-3-5-haiku-20241022 puede dar 404).
    ANTHROPIC_MODEL: str = "claude-haiku-4-5-20251001"

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
