"""
EVM Engine — Earned Value Management completo.

Calcula el set completo: PV, EV, AC, CV, SV, CPI, SPI, TCPI,
EAC₁ (likely), EAC₂ (optimistic), EAC₃ (conservative), ETC, VAC, semáforo.

Fuente de fórmulas: cursor-rules/kronos.md líneas 244-281.
Verificar resultados contra Modelo_BASED.xlsx antes de presentar en cabildo.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger(__name__)

Semaforo = Literal["VERDE", "AMARILLO", "ROJO"]


@dataclass(frozen=True)
class EVMResult:
    bac: float
    pv: float
    ev: float
    ac: float
    cv: float
    sv: float
    cv_pct: float
    sv_pct: float
    cpi: float
    spi: float
    tcpi: float
    eac_likely: float
    eac_optimistic: float
    eac_conservative: float
    etc: float
    vac: float
    vac_pct: float
    semaforo: Semaforo


def get_semaforo(cpi: float, spi: float, vac_pct: float) -> Semaforo:
    """
    VERDE:    CPI >= 0.95 y SPI >= 0.90
    AMARILLO: CPI >= 0.85 y SPI >= 0.80
    ROJO:     cualquier otro caso
    """
    if cpi >= 0.95 and spi >= 0.90:
        return "VERDE"
    elif cpi >= 0.85 and spi >= 0.80:
        return "AMARILLO"
    else:
        return "ROJO"


def calculate_evm(bac: float, pv: float, ev: float, ac: float) -> EVMResult:
    """
    Calcula el set completo de métricas EVM.

    Args:
        bac: Budget at Completion — presupuesto total aprobado (MXN)
        pv:  Planned Value — valor del trabajo que debería estar hecho hoy (MXN)
        ev:  Earned Value — valor del trabajo realmente completado (MXN)
        ac:  Actual Cost — costo real incurrido a la fecha (MXN)

    Returns:
        EVMResult con todas las métricas calculadas.

    Raises:
        ValueError: si bac, pv o ac son <= 0, o si ev < 0.
    """
    if bac <= 0:
        raise ValueError(f"BAC debe ser positivo. Recibido: {bac}")
    if pv <= 0:
        raise ValueError(f"PV debe ser positivo. Recibido: {pv}")
    if ac <= 0:
        raise ValueError(f"AC debe ser positivo. Recibido: {ac}")
    if ev < 0:
        raise ValueError(f"EV no puede ser negativo. Recibido: {ev}")

    cv = ev - ac
    sv = ev - pv
    cv_pct = (cv / ev * 100) if ev > 0 else 0.0
    sv_pct = (sv / pv * 100) if pv > 0 else 0.0

    cpi = ev / ac
    spi = ev / pv

    bac_minus_ac = bac - ac
    tcpi = ((bac - ev) / bac_minus_ac) if bac_minus_ac != 0 else float("inf")

    # EAC₁: si CPI se mantiene (el más probable)
    eac_likely = bac / cpi if cpi != 0 else float("inf")
    # EAC₂: si los desvíos actuales son atípicos (optimista)
    eac_optimistic = ac + (bac - ev)
    # EAC₃: si tanto CPI como SPI impactan hasta el final (conservador)
    eac_conservative = (
        ac + (bac - ev) / (cpi * spi)
        if (cpi * spi) != 0
        else float("inf")
    )

    etc = eac_likely - ac
    vac = bac - eac_likely
    vac_pct = vac / bac * 100

    semaforo = get_semaforo(cpi, spi, vac_pct)

    logger.info(
        "evm_calculated",
        extra={
            "cpi": round(cpi, 4),
            "spi": round(spi, 4),
            "semaforo": semaforo,
        },
    )

    return EVMResult(
        bac=bac,
        pv=pv,
        ev=ev,
        ac=ac,
        cv=round(cv, 2),
        sv=round(sv, 2),
        cv_pct=round(cv_pct, 2),
        sv_pct=round(sv_pct, 2),
        cpi=round(cpi, 4),
        spi=round(spi, 4),
        tcpi=round(tcpi, 4),
        eac_likely=round(eac_likely, 2),
        eac_optimistic=round(eac_optimistic, 2),
        eac_conservative=round(eac_conservative, 2),
        etc=round(etc, 2),
        vac=round(vac, 2),
        vac_pct=round(vac_pct, 2),
        semaforo=semaforo,
    )
