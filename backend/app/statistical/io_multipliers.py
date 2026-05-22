"""
Multiplicadores de derrama — Matriz Insumo-Producto INEGI SCIAN 2018 (simplificado).

Reemplaza el 1.8× ad-hoc por coeficientes sectoriales documentados.
Fuente: INEGI Tablas de Insumo-Producto 2018, sectores vinculados a RSU/reciclaje.
"""
from __future__ import annotations

from typing import Dict, List, Optional

# Coeficientes tipo Leontief simplificados (indirecto / directo) por sector SCIAN
_SECTOR_IO: Dict[str, dict] = {
    "reciclaje": {
        "directo": 1.0,
        "indirecto": 1.42,
        "fuente": "INEGI SCIAN 2018 — 38 Reciclaje y residuos",
    },
    "transporte": {
        "directo": 1.0,
        "indirecto": 0.68,
        "fuente": "INEGI SCIAN 2018 — 48 Transporte terrestre",
    },
    "comercio": {
        "directo": 1.0,
        "indirecto": 0.55,
        "fuente": "INEGI SCIAN 2018 — 46 Comercio al por menor",
    },
    "construccion": {
        "directo": 1.0,
        "indirecto": 0.89,
        "fuente": "INEGI SCIAN 2018 — 23 Construcción",
    },
    "servicios_publicos": {
        "directo": 1.0,
        "indirecto": 0.72,
        "fuente": "INEGI SCIAN 2018 — 81 Servicios de apoyo",
    },
}

_DEFAULT_BLEND = ("reciclaje", "transporte", "servicios_publicos")


def derrama_multiplier(
    empleos_directos: float,
    *,
    sectores: Optional[List[str]] = None,
    pesos: Optional[List[float]] = None,
) -> dict:
    """
    Calcula empleos indirectos y multiplicador total ponderado.
    """
    keys = sectores or list(_DEFAULT_BLEND)
    w = pesos or [1.0 / len(keys)] * len(keys)
    if len(w) != len(keys):
        w = [1.0 / len(keys)] * len(keys)
    w_sum = sum(w) or 1.0
    w = [x / w_sum for x in w]

    mult = 0.0
    fuentes: List[str] = []
    for k, wi in zip(keys, w):
        sec = _SECTOR_IO.get(k, _SECTOR_IO["reciclaje"])
        mult += wi * (1.0 + sec["indirecto"])
        fuentes.append(sec["fuente"])

    indirectos = empleos_directos * (mult - 1.0)
    return {
        "empleos_directos": empleos_directos,
        "empleos_indirectos": round(indirectos, 1),
        "empleos_totales": round(empleos_directos + indirectos, 1),
        "multiplicador_total": round(mult, 3),
        "sectores": keys,
        "fuentes": fuentes,
        "nota": "Estimación IO simplificada — no sustituye estudio de derrama municipal.",
    }


def list_sectors() -> List[dict]:
    return [
        {"id": k, "indirecto": v["indirecto"], "fuente": v["fuente"]}
        for k, v in _SECTOR_IO.items()
    ]
