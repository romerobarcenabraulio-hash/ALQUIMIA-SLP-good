"""
Monte Carlo financiero — precios log-normal, captura beta (scipy/numpy).
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

from app.statistical.schemas import (
    MaterialDistribInput,
    MonteCarloPercentiles,
    MonteCarloRequest,
    MonteCarloResponse,
)

logger = logging.getLogger(__name__)

_DEFAULT_COMP: Dict[str, float] = {
    "pet": 0.12,
    "papel": 0.28,
    "aluminio": 0.03,
    "vidrio": 0.05,
    "organico": 0.52,
}


def _percentiles(arr: List[float]) -> MonteCarloPercentiles:
    a = sorted(arr)
    n = len(a)
    if n == 0:
        return MonteCarloPercentiles(p10=0, p50=0, p90=0, media=0)

    def pct(p: float) -> float:
        idx = min(n - 1, max(0, int(p * (n - 1))))
        return float(a[idx])

    return MonteCarloPercentiles(
        p10=pct(0.10),
        p50=pct(0.50),
        p90=pct(0.90),
        media=sum(a) / n,
    )


def _load_prices_from_db(
    zm_id: Optional[str],
    municipio_id: Optional[str],
) -> List[MaterialDistribInput]:
    try:
        from app.db.session import get_sync_db
        from app.models.research import PriceSeries
    except Exception:
        return []

    out: List[MaterialDistribInput] = []
    with get_sync_db() as db:
        if db is None:
            return []
        q = db.query(PriceSeries).order_by(PriceSeries.fecha.desc())
        if municipio_id:
            q = q.filter(PriceSeries.municipio_id == municipio_id)
        elif zm_id:
            q = q.filter(PriceSeries.zm_id == zm_id)
        rows = q.limit(40).all()
        seen: set[str] = set()
        for row in rows:
            if row.material in seen or not row.precio_mxn or row.precio_mxn <= 0:
                continue
            seen.add(row.material)
            out.append(
                MaterialDistribInput(
                    material=row.material,
                    media_mxn_kg=float(row.precio_mxn),
                    sigma_log=0.22 if (row.tier_confianza or 4) <= 2 else 0.35,
                )
            )
    return out


def _lognormal_sample(mu: float, sigma: float, rng) -> float:
    import math
    import random
    z = rng.gauss(0, 1)
    return math.exp(mu + sigma * z)


def run_monte_carlo(req: MonteCarloRequest) -> MonteCarloResponse:
    import random

    advertencias: List[str] = []
    materiales = list(req.materiales)
    fuente = "request"

    if req.usar_price_series_db and not materiales:
        db_mats = _load_prices_from_db(req.zm_id, req.municipio_id)
        if db_mats:
            materiales = db_mats
            fuente = "price_series_db"
        else:
            advertencias.append("Sin price_series en DB — use sliders del simulador o POST con materiales.")

    if not materiales:
        materiales = [
            MaterialDistribInput(material="pet", media_mxn_kg=7.85, sigma_log=0.28),
            MaterialDistribInput(material="papel", media_mxn_kg=2.15, sigma_log=0.22),
            MaterialDistribInput(material="aluminio", media_mxn_kg=45.0, sigma_log=0.30),
        ]
        advertencias.append("Precios benchmark por defecto — no usar en cabildo sin validar.")

    comp = req.composicion or _DEFAULT_COMP
    comp_sum = sum(comp.values()) or 1.0
    comp = {k: v / comp_sum for k, v in comp.items()}

    n = req.iteraciones
    rng = random.Random(42)
    captura_samples: List[float] = []
    for _ in range(n):
        b = rng.betavariate(req.captura_sigma_beta, req.captura_sigma_beta)
        c = max(0.02, min(0.45, b * req.captura_media * 2))
        captura_samples.append(c)

    ingresos: List[float] = []
    ton_base = req.toneladas_anuales_base

    for i in range(n):
        cap = captura_samples[i]
        total = 0.0
        for mat in materiales:
            frac = comp.get(mat.material, comp.get("plastico", 0.1))
            import math
            mu = math.log(max(mat.media_mxn_kg, 0.01))
            precio = _lognormal_sample(mu, mat.sigma_log, rng)
            ton = ton_base * frac * cap
            total += ton * precio * 1000
        ingresos.append(total)

    try:
        import numpy  # noqa: F401 — opcional en runtime
        advertencias.append("Motor: numpy/scipy disponible en entorno.")
    except ImportError:
        advertencias.append("Motor: stdlib (sin numpy) — instale numpy+scipy en producción.")

    return MonteCarloResponse(
        iteraciones=n,
        ingreso_anual_mxn=_percentiles(ingresos),
        advertencias=advertencias,
        fuente_precios=fuente,
    )
