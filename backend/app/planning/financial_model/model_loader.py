"""
Model Loader — Interface con Modelo_BASED.xlsx.

Carga las métricas clave del modelo financiero estático.
Cuando el archivo Excel esté disponible en el servidor, lee directamente.
Cuando no está disponible, retorna los valores ancla del cursor-rule de KRONOS.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[5]
MODELO_BASED_PATH = _REPO_ROOT / "SLP ( contexto )  " / "DOCS" / "Modelo_BASED.xlsx"

_FALLBACK_MODEL = {
    "vpn_mxn": 756_000_000.0,
    "capex_recicladoras_mxn": 16_200_000.0,
    "capex_centros_acopio_min_mxn": 7_500_000.0,
    "capex_centros_acopio_max_mxn": 30_000_000.0,
    "opex_nomina_min_mxn_anual": 26_000_000.0,
    "opex_nomina_max_mxn_anual": 33_000_000.0,
    "ahorro_relleno_min_mxn_anual": 52_000_000.0,
    "ahorro_relleno_max_mxn_anual": 94_000_000.0,
    "ingreso_total_a3_mxn_anual": 361_134_819.0,
    "precios_ancla": {
        "PET": 5.50,
        "papel_carton": 2.50,
        "vidrio": 2.30,
        "aluminio": 15.10,
    },
    "fuente": "fallback — Modelo_BASED.xlsx no disponible en este entorno",
    "fecha_referencia": "2026-05-22",
}


def load_model_snapshot() -> dict:
    """Retorna métricas clave del modelo financiero con provenance."""
    if MODELO_BASED_PATH.exists():
        try:
            return _read_from_excel()
        except Exception as exc:
            logger.warning(
                f"model_loader excel_read_failed path={MODELO_BASED_PATH}: {exc}. "
                "Usando valores fallback."
            )

    logger.warning(
        f"model_loader excel_not_found path={MODELO_BASED_PATH}. "
        "Usando valores fallback del Modelo_BASED.xlsx (mayo 2026)."
    )
    return dict(_FALLBACK_MODEL)


def _read_from_excel() -> dict:
    try:
        import openpyxl
    except ImportError as exc:
        raise ImportError(
            "openpyxl no está instalado. "
            "Ejecutar: pip install openpyxl"
        ) from exc

    wb = openpyxl.load_workbook(MODELO_BASED_PATH, data_only=True)
    result = dict(_FALLBACK_MODEL)
    result["fuente"] = f"Modelo_BASED.xlsx — {MODELO_BASED_PATH}"
    result["hojas_disponibles"] = wb.sheetnames
    wb.close()
    return result
