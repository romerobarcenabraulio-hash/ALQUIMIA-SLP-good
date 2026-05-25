"""Catálogo de factores LCA con fuente y año documentados."""
from __future__ import annotations

import json
from datetime import date

from modules.lifecycle.paths import lca_factors_path
from modules.lifecycle.schemas import LcaFactor, LcaFactorsCatalog

_DEFAULT_FACTORS = LcaFactorsCatalog(
    actualizado=date.today().isoformat(),
    factores=[
        LcaFactor(
            fraccion="aluminio",
            co2e_evitado_ton=9.0,
            fuente="Ecoinvent",
            referencia="aluminium production, primary, at plant / RER",
            anio_referencia=2023,
        ),
        LcaFactor(
            fraccion="pet",
            co2e_evitado_ton=1.5,
            fuente="Ecoinvent",
            referencia="polyethylene terephthalate, granulate, at plant / RER",
            anio_referencia=2023,
        ),
        LcaFactor(
            fraccion="papel_carton",
            co2e_evitado_ton=0.9,
            fuente="Ecoinvent",
            referencia="market for paper, virgin / GLO",
            anio_referencia=2023,
        ),
        LcaFactor(
            fraccion="organicos_compost",
            co2e_evitado_ton=0.5,
            fuente="IPCC",
            referencia="AR6 GWP100 CH4=27.9",
            anio_referencia=2021,
        ),
        LcaFactor(
            fraccion="vidrio",
            co2e_evitado_ton=0.3,
            fuente="Ecoinvent",
            referencia="glass production, at plant / RER",
            anio_referencia=2023,
        ),
        LcaFactor(
            fraccion="organicos_biogas",
            co2e_evitado_ton=0.234,
            fuente="INECC/SEMARNAT",
            referencia="Metodología Nacional GEI México — metano relleno",
            anio_referencia=2022,
        ),
    ],
)


def load_lca_factors() -> LcaFactorsCatalog:
    path = lca_factors_path()
    if not path.is_file():
        save_lca_factors(_DEFAULT_FACTORS)
        return _DEFAULT_FACTORS
    raw = json.loads(path.read_text(encoding="utf-8"))
    return LcaFactorsCatalog.model_validate(raw)


def save_lca_factors(catalog: LcaFactorsCatalog) -> None:
    path = lca_factors_path()
    path.write_text(
        json.dumps(catalog.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def factor_map() -> dict[str, LcaFactor]:
    return {f.fraccion: f for f in load_lca_factors().factores}
