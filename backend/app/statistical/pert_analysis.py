"""
Análisis PERT con varianza e intervalo de confianza 90%.
"""
from __future__ import annotations

import math
from typing import List, Optional

from app.statistical.schemas import (
    PertAnalysisRequest,
    PertAnalysisResponse,
    PertTaskInput,
    PertTaskResult,
)


def _pert_expected(o: float, m: float, p: float) -> float:
    return (o + 4 * m + p) / 6.0


def _pert_variance(o: float, p: float) -> float:
    return ((p - o) / 6.0) ** 2


def _ic90(mu: float, sigma: float) -> tuple[float, float]:
    z = 1.645
    return mu - z * sigma, mu + z * sigma


def analyze_pert(req: PertAnalysisRequest) -> PertAnalysisResponse:
    crit = set(req.tareas_criticas_ids or [])
    results: List[PertTaskResult] = []
    var_sum = 0.0
    exp_sum = 0.0

    for t in req.tareas:
        o, m, p = t.optimista_dias, t.probable_dias, t.pesimista_dias
        if p < m:
            p, m = m, p
        if o > m:
            o = m
        exp = _pert_expected(o, m, p)
        var = _pert_variance(o, p)
        sigma = math.sqrt(var)
        lo, hi = _ic90(exp, sigma)
        es_crit = t.id in crit
        results.append(
            PertTaskResult(
                id=t.id,
                nombre=t.nombre or t.id,
                esperado_dias=round(exp, 2),
                varianza=round(var, 4),
                desviacion=round(sigma, 3),
                ic90_bajo=round(lo, 2),
                ic90_alto=round(hi, 2),
                es_critica=es_crit,
            )
        )
        if es_crit:
            exp_sum += exp
            var_sum += var

    proj_sigma = math.sqrt(var_sum) if var_sum > 0 else 0.0
    p_lo, p_hi = _ic90(exp_sum, proj_sigma)

    return PertAnalysisResponse(
        tareas=results,
        duracion_proyecto_esperada=round(exp_sum, 2),
        varianza_proyecto=round(var_sum, 4),
        ic90_proyecto_bajo=round(p_lo, 2),
        ic90_proyecto_alto=round(p_hi, 2),
    )


def pert_from_task_dicts(tasks: List[dict], critical_ids: Optional[List[str]] = None) -> PertAnalysisResponse:
    parsed = [
        PertTaskInput(
            id=str(t["id"]),
            nombre=str(t.get("nombre", t["id"])),
            optimista_dias=float(t.get("optimista", t.get("o", 7))),
            probable_dias=float(t.get("probable", t.get("m", 14))),
            pesimista_dias=float(t.get("pesimista", t.get("p", 28))),
        )
        for t in tasks
    ]
    return analyze_pert(PertAnalysisRequest(tareas=parsed, tareas_criticas_ids=critical_ids))
