"""
Demografía y coordenadas aproximadas para vista mapa RSU (simulación educativa).

NOTA Navigator / producto:
- Población y generación son ORDEN DE MAGNITUD para UX; no sustituyen censos INEGI ni balances municipales oficiales.
- Coordenadas son centroides aproximados (EPSG:4326) para visualización, no límites territoriales MGN.
"""
from __future__ import annotations

from typing import Any, Dict, Tuple

# kg de RSU por persona-día (orden típico urbano México / literatura RSU municipal)
DEFAULT_GEN_PER_CAPITA_KG_DIA: float = 0.92

# Factor illustrativo: t CO2e por t RSU gestionado predominantemente en disposición tipo relleno sin captura óptima de biogás.
# Uso educativo; rangos reales dependen de composición, METBC, captura CH4, transporte, etc.
DISPOSAL_CO2E_T_PER_T_RSU_DIA: float = 0.55

# municipio_id -> (poblacion_aprox, lat, lng)
_MUNICIPIO_DEMO: Dict[str, Tuple[int, float, float]] = {
    "slp": (855_000, 22.1565, -100.9755),
    "sol": (331_000, 22.1833, -100.9399),
    "csp": (5_000, 21.9833, -100.8667),
    "vip": (35_000, 22.1860, -100.8760),
    "qro": (1_050_000, 20.5881, -100.3881),
    "cor": (193_000, 20.5333, -100.4333),
    "mar": (168_000, 20.7167, -100.2833),
    "hui": (95_000, 20.3667, -100.2667),
    "mty": (1_140_000, 25.6866, -100.3161),
    "spg": (130_000, 25.6572, -100.4027),
    "snl": (443_000, 25.7459, -100.3025),
    "gua": (691_000, 25.6778, -100.2597),
    "apo": (656_000, 25.7817, -100.1889),
    "sca": (355_000, 25.6767, -100.4606),
    "gar": (252_000, 25.7831, -100.5839),
    "esc": (481_000, 25.7944, -100.3147),
    "jua": (293_000, 25.6478, -100.0964),
    "gdl": (1_385_600, 20.6752, -103.3475),
    "zap": (1_062_000, 20.7236, -103.3878),
    "tla": (650_000, 20.6390, -103.2933),
}


def demo_tuple(municipio_id: str) -> Tuple[int, float, float] | None:
    return _MUNICIPIO_DEMO.get(municipio_id.lower())


def provenance_block() -> Dict[str, Any]:
    return {
        "tipo": "estimado",
        "fuente": "demografia_aprox_alquimia_mapa_rsu",
        "metodologia_rsu": (
            "rsu_ton_dia ≈ poblacion * gen_per_capita_kg_dia / 1000; "
            "gen_per_capita_kg_dia valor referencia urbana Mexico."
        ),
        "metodologia_co2e": (
            f"co2e_disposal_ton_dia ≈ rsu_ton_dia * {DISPOSAL_CO2E_T_PER_T_RSU_DIA} "
            "(orden de magnitud disposición / gestión; no inventario corporativo ni GEI oficial)."
        ),
        "advertencia": (
            "No usar para multas, inventarios oficiales GEI ni límites jurisdiccionales. "
            "Completar con INEGI / datos municipales antes de decisiones públicas."
        ),
    }
