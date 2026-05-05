"""
dna_loader.py — Carga el ADN de SLP desde Drive al arrancar.
SLP es SOLO LECTURA — ADN de referencia para todos los agentes.
"""
import logging
from typing import Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class DNAContext:
    capitulo: str = ""
    modelo:   str = ""
    centros_acopio: str = ""
    recicladoras: str = ""
    estrategia: str = ""
    gantt: str = ""
    bitacora: str = ""
    loaded: bool = False

# Singleton global
_dna: DNAContext = DNAContext()


async def load_slp_dna() -> DNAContext:
    """Lee los 7 documentos fuente de SLP desde Drive."""
    from app.config import settings

    if not settings.GOOGLE_SERVICE_ACCOUNT_FILE:
        logger.info("Google SA no configurado — operando con ADN en memoria")
        _dna.loaded = False
        return _dna

    try:
        from googleapiclient.discovery import build
        from google.oauth2 import service_account

        creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            scopes=["https://www.googleapis.com/auth/drive.readonly"],
        )
        service = build("drive", "v3", credentials=creds)

        doc_ids = {
            "capitulo":       settings.DRIVE_CAPITULO_SLP_ID,
            "modelo":         settings.DRIVE_MODELO_BASED_ID,
            "centros_acopio": settings.DRIVE_CENTROS_ACOPIO_ID,
            "recicladoras":   settings.DRIVE_RECICLADORAS_ID,
        }

        for campo, doc_id in doc_ids.items():
            try:
                content = _read_drive_file(service, doc_id)
                setattr(_dna, campo, content[:50000])  # Primeros 50K chars
            except Exception as e:
                logger.warning(f"No pudo leer {campo} ({doc_id}): {e}")

        _dna.loaded = True
        logger.info("ADN SLP cargado exitosamente desde Drive")

    except ImportError:
        logger.warning("google-api-python-client no instalado — ADN offline")
    except Exception as e:
        logger.error(f"Error cargando ADN: {e}")

    return _dna


def get_dna() -> DNAContext:
    return _dna


def _read_drive_file(service, file_id: str) -> str:
    """Lee un archivo de Drive. Soporta Docs (exporta a text) y archivos normales."""
    try:
        # Intentar exportar como Google Doc
        resp = service.files().export(fileId=file_id, mimeType="text/plain").execute()
        if isinstance(resp, bytes):
            return resp.decode("utf-8", errors="replace")
        return str(resp)
    except Exception:
        # Fallback: descargar como binario
        import io
        resp = service.files().get_media(fileId=file_id).execute()
        if isinstance(resp, bytes):
            return resp.decode("utf-8", errors="replace")
        return str(resp)
