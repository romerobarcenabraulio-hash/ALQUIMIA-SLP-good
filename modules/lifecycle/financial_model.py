"""Ciclo de vida financiero — VPN, TIR, payback, valor terminal (Modelo_BASED)."""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from app.schemas.simulate import MixCAs, PreciosMaterial, ScenarioInput
from app.services.calculator import (
    ALU_PCT,
    CA_EMP,
    CA_OPEX,
    COMP,
    DIAS_OP,
    ESTACIONALIDAD,
    FACTOR_CH4,
    FACTORES_EMISION,
    GWP_CH4,
    ISR,
    ORG_BIOD,
    ORG_COMP,
    PET_PCT,
    WACC_DEF,
    ZM_DATA,
    _calc_tir,
)

HORIZONTE_BIOS = 10
CAPTURA_MODELO_BASED = [20, 45, 70, 90, 100, 100, 100, 100, 100, 100]
G_PERPETUIDAD = 0.02


def modelo_based_supuestos() -> dict[str, Any]:
    return {
        "fuente": "Modelo_BASED.xlsx",
        "zm": "SLP",
        "horizonte_anios": HORIZONTE_BIOS,
        "wacc_pct": WACC_DEF * 100,
        "tipo_cambio_mxn_usd": 17.10,
        "gen_percapita_kg_dia": 0.90,
        "mix_cas": {"P": 18, "M": 0, "G": 0},
        "pct_captura_por_anio": CAPTURA_MODELO_BASED,
        "merma_log_pct": 10,
        "dias_operativos": DIAS_OP,
        "precio_carbono": "voluntario",
        "costo_com_social_mxn": 600_000,
        "precios_mxn_kg": PreciosMaterial().model_dump(),
    }


def _build_scenario(
    *,
    pct_captura: list[float] | None = None,
    precios_scale: float = 1.0,
    wacc_pct: float | None = None,
    fuel_opex_scale: float = 1.0,
) -> tuple[list[dict], float, float, float, float, float, float, float]:
    """Proyecta flujos anuales con supuestos Modelo_BASED extendidos a 10 años."""
    s = ScenarioInput(
        zm_activa="SLP",
        horizonte=min(HORIZONTE_BIOS, 5),
        pct_captura_por_año=(pct_captura or CAPTURA_MODELO_BASED)[:5],
        mix_cas=MixCAs(P=18, M=0, G=0),
        wacc=wacc_pct if wacc_pct is not None else WACC_DEF * 100,
        precios=PreciosMaterial(
            pet=5.50 * precios_scale,
            hdpe=8.50 * precios_scale,
            papel=2.50 * precios_scale,
            vidrio=2.30 * precios_scale,
            aluminio=15.10 * precios_scale,
            organico=0.30 * precios_scale,
        ),
    )

    zm = ZM_DATA["SLP"]
    pop = zm["pop"]
    gen = s.gen_percapita or zm["gen"]
    fest = 1 + ESTACIONALIDAD[max(0, min(11, s.mes_inicio - 1))]
    rsu = pop * gen / 1000 * fest

    nP, nM, nG = s.mix_cas.P, s.mix_cas.M, s.mix_cas.G
    from app.services.cost_registry import build_cost_items
    from app.schemas.cost_model import NegotiationScheme

    cost_items = build_cost_items(
        nP=nP, nM=nM, nG=nG,
        viviendas=zm["viv"],
        zm="SLP",
        negociacion=NegotiationScheme.municipal_directo,
        overrides={},
    )
    capex_total = sum(i.monto_efectivo for i in cost_items if i.periodicidad == "unico")

    captura = pct_captura or CAPTURA_MODELO_BASED
    wacc = (wacc_pct if wacc_pct is not None else WACC_DEF * 100) / 100
    serie: list[dict] = []
    capex_acum = 0.0

    for año in range(1, HORIZONTE_BIOS + 1):
        pct = (captura[año - 1] if año <= len(captura) else 100) / 100
        merma = 1 - s.merma_log_pct / 100
        rampa = 0.50 if año == 1 else (0.75 if año == 2 else 1.00)

        vol_org = rsu * COMP["organico"] * pct * merma * 0.95 * rampa
        vol_pap = rsu * COMP["papel"] * pct * merma * 0.92 * rampa
        vol_plas = rsu * COMP["plastico"] * pct * merma * 0.90 * rampa
        vol_vid = rsu * COMP["vidrio"] * pct * merma * 0.92 * rampa
        vol_met = rsu * COMP["metales"] * pct * merma * 0.95 * rampa

        p = s.precios
        ingresos = (
            vol_plas * PET_PCT * p.pet * DIAS_OP * 1000
            + vol_plas * (1 - PET_PCT) * p.hdpe * DIAS_OP * 1000
            + vol_pap * p.papel * DIAS_OP * 1000
            + vol_vid * p.vidrio * DIAS_OP * 1000
            + vol_met * ALU_PCT * p.aluminio * DIAS_OP * 1000
            + vol_org * ORG_COMP * p.organico * DIAS_OP * 1000
        )

        capex_año = (año == 1) * capex_total
        opex_base = (nP * CA_OPEX["P"] + nM * CA_OPEX["M"] + nG * CA_OPEX["G"]) * 12
        opex_logistica = rsu * pct * 320 * DIAS_OP * 0.08 * fuel_opex_scale
        opex = opex_base + s.costo_com_social + opex_logistica

        ebitda = ingresos - opex
        fcf = ebitda - capex_año - max(0, (ebitda - capex_año * 0.10) * ISR)
        capex_acum += capex_año

        co2e_org = vol_org * ORG_BIOD * FACTOR_CH4 * 0.0007168 * GWP_CH4 * DIAS_OP
        co2e_rec = (
            vol_pap * FACTORES_EMISION["papel"]
            + vol_plas * FACTORES_EMISION["plastico"]
            + vol_vid * FACTORES_EMISION["vidrio"]
            + vol_met * ALU_PCT * FACTORES_EMISION["aluminio"]
        ) * DIAS_OP

        serie.append(
            {
                "año": año,
                "pct_captura": pct * 100,
                "ingresos": ingresos,
                "capex": capex_año,
                "opex": opex,
                "ebitda": ebitda,
                "fcf": fcf,
                "co2e": co2e_org + co2e_rec,
                "empleos_directos": nP * CA_EMP["P"] + nM * CA_EMP["M"] + nG * CA_EMP["G"],
            }
        )

    t_ebitda = sum(a["ebitda"] for a in serie)
    vpn = sum(a["fcf"] / (1 + wacc) ** (i + 1) for i, a in enumerate(serie)) - capex_acum
    tir = _calc_tir([a["fcf"] for a in serie], capex_acum)
    payback = capex_acum / (t_ebitda / HORIZONTE_BIOS / 12) if t_ebitda > 0 else 999

    payback_desc = 999.0
    if capex_acum > 0:
        acum = 0.0
        for t, a in enumerate(serie):
            acum += a["fcf"] / (1 + wacc) ** (t + 1)
            if acum >= capex_acum:
                prev = acum - a["fcf"] / (1 + wacc) ** (t + 1)
                frac = (capex_acum - prev) / (a["fcf"] / (1 + wacc) ** (t + 1))
                payback_desc = (t + frac) * 12
                break

    co2e_horizonte = sum(a["co2e"] for a in serie)
    return serie, vpn, tir, payback, payback_desc, capex_acum, co2e_horizonte, wacc


def calcular_valor_terminal(fcf_terminal: float, wacc: float, g: float = G_PERPETUIDAD) -> float:
    if wacc <= g:
        return 0.0
    return fcf_terminal * (1 + g) / (wacc - g)


def calcular_ciclo_financiero() -> dict[str, Any]:
    serie, vpn, tir, payback, payback_desc, capex, co2e, wacc = _build_scenario()
    fcf_final = serie[-1]["fcf"] if serie else 0.0
    tv = calcular_valor_terminal(fcf_final, wacc)
    vpn_tv = vpn + tv / (1 + wacc) ** HORIZONTE_BIOS

    return {
        "modelo": "Modelo_BASED.xlsx",
        "horizonte_anios": HORIZONTE_BIOS,
        "wacc_pct": round(wacc * 100, 2),
        "supuestos": modelo_based_supuestos(),
        "vpn_mxn": round(vpn, 2),
        "tir_pct": round(tir, 2),
        "payback_meses": round(payback, 1),
        "payback_descontado_meses": round(payback_desc, 1),
        "valor_terminal_mxn": round(tv, 2),
        "vpn_con_terminal_mxn": round(vpn_tv, 2),
        "capex_total_mxn": round(capex, 2),
        "co2e_horizonte_ton": round(co2e, 2),
        "serie_anual_resumen": [
            {"año": a["año"], "fcf": round(a["fcf"], 0), "co2e": round(a["co2e"], 0)}
            for a in serie
        ],
        "generado_en": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }


def persist_financial(result: dict[str, Any], path) -> None:
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
