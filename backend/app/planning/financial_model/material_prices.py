"""
Material Prices Monitor — Monitor de precios de materiales reciclables.

REGLA DE NO-HARDCODE:
  Cascada de precio ancla:
    0. precio_ancla_override (simulador store.precios — fuente primaria en UI)
    1. price_series PostgreSQL
    2. model_calibrations PostgreSQL
    3. Constante fallback documentada
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

UMBRAL_ALERTA: float = 0.10

MATERIALES_VALIDOS = {"PET", "papel_carton", "vidrio", "aluminio"}

_PRECIO_ANCLA_FALLBACK: Dict[str, tuple[float, str]] = {
    "PET":          (5.50,  "Modelo_BASED.xlsx · Capítulo SLP · mayo 2026"),
    "papel_carton": (2.50,  "Modelo_BASED.xlsx · Capítulo SLP · mayo 2026"),
    "vidrio":       (2.30,  "Modelo_BASED.xlsx · Capítulo SLP · mayo 2026"),
    "aluminio":     (15.10, "Modelo_BASED.xlsx · Capítulo SLP · mayo 2026"),
}

_TONELAJE_MENSUAL_A3_KG: Dict[str, float] = {
    "PET":          1_102_248.0,
    "papel_carton": 3_265_920.0,
    "vidrio":         816_480.0,
    "aluminio":       571_536.0,
}
_TONELAJE_FUENTE = "Modelo_BASED.xlsx · Capítulo SLP · tonelaje proyectado Año 3"


def _load_ancla_from_db(material: str, session: Any) -> Optional[tuple[float, str]]:
    if session is None:
        return None

    try:
        from app.models.research import PriceSeries
        row = (
            session.query(PriceSeries)
            .filter(
                PriceSeries.material == material,
                PriceSeries.precio_mxn.isnot(None),
                PriceSeries.precio_mxn > 0,
            )
            .order_by(PriceSeries.fecha.desc())
            .first()
        )
        if row:
            fuente = f"price_series DB · {row.fecha} · tier {row.tier_confianza}"
            return float(row.precio_mxn), fuente
    except Exception as exc:
        logger.debug(f"price_series lookup failed for {material}: {exc}")

    try:
        from app.models.research import ModelCalibration  # type: ignore[attr-defined]
        param = f"precio_ancla_{material}"
        row = (
            session.query(ModelCalibration)
            .filter(
                ModelCalibration.parametro == param,
                ModelCalibration.vigente.is_(True),
            )
            .order_by(ModelCalibration.fecha_calibracion.desc())
            .first()
        )
        if row:
            fuente = f"model_calibrations DB · {row.fecha_calibracion}"
            return float(row.valor), fuente
    except Exception as exc:
        logger.debug(f"model_calibrations lookup failed for {material}: {exc}")

    return None


def get_precio_ancla(
    material: str,
    session: Any = None,
    precio_ancla_override: Optional[float] = None,
) -> tuple[float, str]:
    """
    Devuelve (precio_ancla_mxn_kg, fuente_label).

    Si precio_ancla_override está presente (p. ej. desde store.precios), se usa directo.
    """
    if material not in MATERIALES_VALIDOS:
        raise ValueError(
            f"Material '{material}' no reconocido. "
            f"Válidos: {sorted(MATERIALES_VALIDOS)}"
        )

    if precio_ancla_override is not None and precio_ancla_override > 0:
        return precio_ancla_override, "simulatorStore.precios — override del cliente"

    db_result = _load_ancla_from_db(material, session)
    if db_result:
        return db_result

    precio, provenance = _PRECIO_ANCLA_FALLBACK[material]
    logger.warning(
        f"precio_ancla_fallback material={material} precio={precio} "
        f"fuente='{provenance}'. Actualizar con datos de mercado reales."
    )
    return precio, f"FALLBACK — {provenance}"


def check_precio_material(
    material: str,
    precio_actual: float,
    session: Any = None,
    precio_ancla_override: Optional[float] = None,
    tonelaje_mensual_kg: Optional[float] = None,
) -> dict:
    """Verifica desviación del precio actual vs ancla."""
    if material not in MATERIALES_VALIDOS:
        raise ValueError(
            f"Material '{material}' no reconocido. "
            f"Válidos: {sorted(MATERIALES_VALIDOS)}"
        )
    if precio_actual <= 0:
        raise ValueError(f"precio_actual debe ser positivo. Recibido: {precio_actual}")

    ancla, fuente_ancla = get_precio_ancla(
        material, session, precio_ancla_override=precio_ancla_override
    )
    desviacion = (precio_actual - ancla) / ancla
    alerta = abs(desviacion) > UMBRAL_ALERTA

    tonelaje = tonelaje_mensual_kg if tonelaje_mensual_kg is not None else _TONELAJE_MENSUAL_A3_KG.get(material, 0.0)
    fuente_tonelaje = (
        "calculado — genPercapita × población × composición"
        if tonelaje_mensual_kg is not None
        else _TONELAJE_FUENTE
    )
    impacto_mensual = (precio_actual - ancla) * tonelaje

    if alerta:
        msg = (
            f"ALERTA: {material} en ${precio_actual:.2f}/kg "
            f"({desviacion * 100:+.1f}% vs ancla ${ancla:.2f} · {fuente_ancla}). "
            f"Impacto mensual Año 3: ${impacto_mensual:,.0f} MXN."
        )
        logger.warning(msg)
    else:
        msg = (
            f"OK: {material} en ${precio_actual:.2f}/kg "
            f"({desviacion * 100:+.1f}% vs ancla ${ancla:.2f} · {fuente_ancla})."
        )

    return {
        "material": material,
        "precio_ancla": ancla,
        "fuente_ancla": fuente_ancla,
        "precio_actual": precio_actual,
        "desviacion_pct": round(desviacion * 100, 2),
        "alerta": alerta,
        "impacto_mensual_mxn": round(impacto_mensual, 2),
        "fuente_tonelaje": fuente_tonelaje,
        "mensaje": msg,
    }


def check_all_precios(
    precios: Dict[str, float],
    session: Any = None,
    anclas_override: Optional[Dict[str, float]] = None,
) -> List[dict]:
    """Verifica varios materiales. anclas_override mapea material → precio ancla del store."""
    resultados: List[dict] = []
    overrides = anclas_override or {}
    for material, precio in precios.items():
        try:
            resultados.append(
                check_precio_material(
                    material,
                    precio,
                    session,
                    precio_ancla_override=overrides.get(material),
                )
            )
        except ValueError as exc:
            logger.error(f"check_all_precios error en {material}: {exc}")
    return resultados
