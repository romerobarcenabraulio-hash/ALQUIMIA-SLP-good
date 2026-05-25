"""Fallback de tonelaje desde escenario Modelo_BASED cuando HERMES no publica."""
from __future__ import annotations

from app.schemas.simulate import MixCAs, PreciosMaterial, ScenarioInput
from app.services.calculator import COMP, DIAS_OP, ALU_PCT, PET_PCT, calcular_scenario

BIOS_FRAC_MAP = {
    "organicos_compost": "organico",
    "papel_carton": "papel",
    "pet": "plastico",
    "vidrio": "vidrio",
    "aluminio": "aluminio",
}


def _modelo_based_scenario() -> ScenarioInput:
    """Supuestos base Modelo_BASED.xlsx — ZM SLP, horizonte 10 años."""
    return ScenarioInput(
        zm_activa="SLP",
        municipios_activos=["slp", "sol", "csp", "vip"],
        horizonte=5,
        pct_captura_por_año=[20, 45, 70, 90, 100, 100, 100, 100, 100, 100],
        precios=PreciosMaterial(),
        merma_log_pct=10,
        mix_cas=MixCAs(P=18, M=0, G=0),
        wacc=20,
        tipo_cambio=17.10,
        precio_carbono_esc="voluntario",
        gen_percapita=0.90,
        mes_inicio=1,
        costo_com_social=600_000,
    )


def scenario_tonelaje_anual() -> dict[str, float]:
    """Volúmenes anuales por fracción BIOS a partir del motor Modelo_BASED."""
    s = _modelo_based_scenario()
    res = calcular_scenario(s)
    rsu = res.rsu_total_ton_dia
    ult = res.serie_anual[-1] if res.serie_anual else {}
    pct = ult.get("pct_captura", 70) / 100
    merma = 1 - s.merma_log_pct / 100

    vol_org = rsu * COMP["organico"] * pct * merma * 0.95 * DIAS_OP
    vol_pap = rsu * COMP["papel"] * pct * merma * 0.92 * DIAS_OP
    vol_pet = rsu * COMP["plastico"] * pct * merma * 0.90 * PET_PCT * DIAS_OP
    vol_vid = rsu * COMP["vidrio"] * pct * merma * 0.92 * DIAS_OP
    vol_alu = rsu * COMP["metales"] * pct * merma * 0.95 * ALU_PCT * DIAS_OP

    return {
        "organicos_compost": round(vol_org, 2),
        "papel_carton": round(vol_pap, 2),
        "pet": round(vol_pet, 2),
        "vidrio": round(vol_vid, 2),
        "aluminio": round(vol_alu, 2),
    }
