"""
Motor de cálculo Python — espejo del TypeScript frontend.

Fase 2.5: calcular_scenario acepta un SnapshotDatos opcional.
Cuando se provee, los valores del registry (INEGI, SEMARNAT, Banxico)
REEMPLAZAN los hardcoded de ZM_DATA — con prioridad por tipo/confianza.
Si no se provee snapshot, cae a ZM_DATA como antes (modo offline).

Wave 0: los CAPEX de Centros de Acopio ahora salen del cost_registry con fuente
trazable. Los flujos de caja y la aritmetica de VPN/TIR no cambian.
"""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING

from app.schemas.simulate import ScenarioInput, SimulateResponse
from app.schemas.cost_model import (
    NegotiationScheme,
    CostModelSummary,
    CostSourceType,
    build_manifest,
)
from app.services.cost_registry import (
    build_cost_items,
    confianza_score,
)

if TYPE_CHECKING:
    from app.data.schemas import SnapshotDatos

import math

# ─── Constantes (§2) ─────────────────────────────────────────────────────────

COMP = {
    "organico":  0.45,
    "papel":     0.20,
    "plastico":  0.15,
    "vidrio":    0.05,
    "metales":   0.05,
    "otros":     0.10,
}
PET_PCT    = 0.50
ALU_PCT    = 0.70
ORG_BIOD   = 0.30
ORG_COMP   = 0.70
DIAS_OP    = 300
WACC_DEF   = 0.20
ISR        = 0.30
FACTOR_CH4 = 234
GWP_CH4    = 27

ZM_DATA = {
    "SLP": {"pop": 1243980, "viv": 224000, "ocu": 3.6, "gen": 0.90},
    "MTY": {"pop": 5341171, "viv": 890000, "ocu": 3.5, "gen": 1.05},
    "QRO": {"pop": 1404306, "viv": 260000, "ocu": 3.4, "gen": 0.95},
}

ESTACIONALIDAD = [
    -0.08, -0.05, 0.02, 0.05, 0.08, 0.03,
     0.06,  0.07, 0.03, 0.05, 0.12, 0.18,
]

CA_OPEX = {"P": 110838, "M": 320354, "G": 787328}
CA_EMP  = {"P": 5, "M": 14, "G": 34}


FACTORES_EMISION = {
    "papel":    1.29,  # t CO2e / t material virgen
    "plastico": 2.53,
    "vidrio":   0.85,
    "aluminio": 11.89,
}


def _kpi_valor(snapshot: "SnapshotDatos", kpi_id: str, fallback):
    """
    Extrae el valor de un KPI desde el snapshot.
    Solo usa el valor si tiene provenance tipo != no_disponible.
    Si no, devuelve el fallback.
    """
    from app.data.schemas import FuenteTipo
    kpi = next((k for k in snapshot.kpis if k.kpi_id == kpi_id), None)
    if kpi is None or kpi.provenance.tipo == FuenteTipo.no_disponible:
        return fallback
    return kpi.valor if kpi.valor is not None else fallback


def calcular_scenario(
    s: ScenarioInput,
    snapshot: Optional["SnapshotDatos"] = None,
) -> SimulateResponse:
    # Bug 0 fix: usar zm_activa correctamente
    zm_key = (s.zm_activa or "SLP").upper()
    zm     = ZM_DATA.get(zm_key, ZM_DATA["SLP"])

    # Fase 2.5: si se provee snapshot, usar valores del registry con prioridad.
    # Los valores del registry (INEGI, SEMARNAT, Banxico) son más confiables
    # que los hardcoded de ZM_DATA cuando el adapter respondió con éxito.
    if snapshot is not None:
        pop = _kpi_valor(snapshot, "poblacion_total",      zm["pop"])
        viv = _kpi_valor(snapshot, "viviendas_totales",    zm["viv"])
        gen = _kpi_valor(snapshot, "gen_percapita_kg_dia", s.gen_percapita or zm["gen"])
        # Tipo de cambio: usar Banxico si disponible
        tipo_cambio = _kpi_valor(snapshot, "tipo_cambio_mxn_usd", s.tipo_cambio)
        # Inflación real anual: Banxico SIE SP68257 (con o sin token)
        inflacion_anual_pct = _kpi_valor(snapshot, "inflacion_anual_pct", WACC_DEF * 0.20)
        # Fuente del dato de inflación para el cost_model_summary
        _infl_kpi = next((k for k in snapshot.kpis if k.kpi_id == "inflacion_anual_pct"), None)
        inflacion_fuente = (
            _infl_kpi.provenance.fuente_nombre
            if _infl_kpi is not None
            else "snapshot_offline"
        )
    else:
        pop = zm["pop"]
        viv = zm["viv"]
        gen = s.gen_percapita or zm["gen"]
        tipo_cambio = s.tipo_cambio
        # Sin snapshot: usar fallback de inflación (~4 % para México 2026)
        from app.data.adapters.banxico_inflacion import _INFLACION_FALLBACK_PCT
        inflacion_anual_pct = _INFLACION_FALLBACK_PCT
        inflacion_fuente = "snapshot_offline"

    # RSU
    fest = 1 + ESTACIONALIDAD[max(0, min(11, s.mes_inicio - 1))]
    rsu  = pop * gen / 1000 * fest

    # ─── Wave 0: construir CostModel trazable ────────────────────────────────
    nP = s.mix_cas.P; nM = s.mix_cas.M; nG = s.mix_cas.G
    negociacion = s.negociacion if hasattr(s, "negociacion") else NegotiationScheme.municipal_directo
    overrides = dict(s.cost_overrides) if getattr(s, "cost_overrides", None) else {}

    cost_items = build_cost_items(
        nP=nP, nM=nM, nG=nG,
        viviendas=viv,
        zm=zm_key,
        negociacion=negociacion,
        overrides=overrides,
    )

    # CAPEX total por actor (solo lineas unicas = CAPEX)
    capex_items = [i for i in cost_items if i.periodicidad == "unico"]
    capex_municipio = sum(i.monto_efectivo for i in capex_items if i.actor_responsable == "municipio")
    capex_concesionario = sum(i.monto_efectivo for i in capex_items if i.actor_responsable == "concesionario")
    capex_compartido = sum(i.monto_efectivo for i in capex_items if i.actor_responsable == "compartido")

    # En el flujo de caja usamos capex_total = municipio + concesionario + compartido
    # (idéntico a los numeros previos para no romper tests)
    capex_total_ca = capex_municipio + capex_concesionario + capex_compartido

    # OPEX mensual por actor (lineas mensual/anual)
    opex_items = [i for i in cost_items if i.periodicidad == "mensual"]
    opex_mensual_municipio = sum(i.monto_efectivo for i in opex_items if i.actor_responsable == "municipio")
    opex_mensual_concesionario = sum(i.monto_efectivo for i in opex_items if i.actor_responsable == "concesionario")

    # CostModelSummary para incluir en la respuesta
    _clasificaciones = [i.clasificacion for i in cost_items]
    _cost_model = CostModelSummary(
        zm_activa=zm_key,
        negociacion=negociacion,
        items=cost_items,
        total_capex_municipio=capex_municipio,
        total_capex_concesionario=capex_concesionario,
        total_opex_mensual_municipio=opex_mensual_municipio,
        total_opex_mensual_concesionario=opex_mensual_concesionario,
        items_precargados=sum(1 for c in _clasificaciones if c in (
            CostSourceType.estimado_mercado, CostSourceType.supuesto_editable)),
        items_editados_usuario=sum(1 for c in _clasificaciones if c == CostSourceType.dato_usuario),
        items_verificados=sum(1 for c in _clasificaciones if c == CostSourceType.fuente_verificada),
        items_pendientes=sum(1 for c in _clasificaciones if c == CostSourceType.pendiente_fuente),
        confianza_costos=confianza_score(cost_items),
        inflacion_anual_pct=inflacion_anual_pct,
        inflacion_fuente=inflacion_fuente,
    )

    # FinancialRunManifest (hash determinista del run)
    _manifest = build_manifest(
        negociacion=negociacion,
        zm_activa=zm_key,
        cost_items=cost_items,
        scenario_extras={
            "horizonte": s.horizonte,
            "wacc": s.wacc,
            "nP": nP, "nM": nM, "nG": nG,
        },
    )
    # ─────────────────────────────────────────────────────────────────────────

    serie = []
    capex_acum = 0
    fcf_acum   = 0

    # Fase 5: capturar volúmenes de Año 1 para marketplace
    _vol_anio1: Optional[dict] = None

    for año in range(1, s.horizonte + 1):
        pct   = (s.pct_captura_por_año[año - 1] if año <= len(s.pct_captura_por_año) else 100) / 100
        merma = 1 - s.merma_log_pct / 100
        rampa = 0.50 if año == 1 else (0.75 if año == 2 else 1.00)

        vol_org  = rsu * COMP["organico"]  * pct * merma * 0.95
        vol_pap  = rsu * COMP["papel"]     * pct * merma * 0.92
        vol_plas = rsu * COMP["plastico"]  * pct * merma * 0.90
        vol_vid  = rsu * COMP["vidrio"]    * pct * merma * 0.92
        vol_met  = rsu * COMP["metales"]   * pct * merma * 0.95

        # Fase 5: guardar volúmenes anuales de Año 1 (ton/año) para marketplace
        if año == 1:
            _vol_anio1 = {
                "organico": round(vol_org * DIAS_OP, 2),
                "papel":    round(vol_pap * DIAS_OP, 2),
                "plastico": round(vol_plas * DIAS_OP, 2),
                "vidrio":   round(vol_vid * DIAS_OP, 2),
                "metales":  round(vol_met * DIAS_OP, 2),
            }

        p = s.precios
        ingresos = (
            vol_plas * PET_PCT  * p.pet     * DIAS_OP * 1000 +
            vol_plas * (1 - PET_PCT) * p.hdpe * DIAS_OP * 1000 +
            vol_pap  * p.papel  * DIAS_OP * 1000 +
            vol_vid  * p.vidrio * DIAS_OP * 1000 +
            vol_met  * ALU_PCT  * p.aluminio * DIAS_OP * 1000 +
            vol_org  * ORG_COMP * p.organico * DIAS_OP * 1000
        )

        capex_año = (año == 1) * capex_total_ca
        # OPEX escalado con inflación real de Banxico (año 1 = base, año 2+ aplica acumulado)
        _infl_factor = (1 + inflacion_anual_pct / 100) ** (año - 1)
        opex  = (nP * CA_OPEX["P"] + nM * CA_OPEX["M"] + nG * CA_OPEX["G"]) * 12 * _infl_factor
        opex += s.costo_com_social * _infl_factor

        ebitda = ingresos - opex
        fcf    = ebitda - capex_año - max(0, (ebitda - capex_año * 0.10) * ISR)
        capex_acum += capex_año
        fcf_acum   += fcf

        emp_cas = nP * CA_EMP["P"] + nM * CA_EMP["M"] + nG * CA_EMP["G"]
        # Bug 1 fix: CO2e incluye reciclaje; factores en t CO2e/t (sin ×1000)
        co2e_org = vol_org * ORG_BIOD * FACTOR_CH4 * 0.0007168 * GWP_CH4 * DIAS_OP
        co2e_rec = (
            vol_pap  * FACTORES_EMISION["papel"]    +
            vol_plas * FACTORES_EMISION["plastico"]  +
            vol_vid  * FACTORES_EMISION["vidrio"]    +
            vol_met  * ALU_PCT * FACTORES_EMISION["aluminio"]
        ) * DIAS_OP
        co2e = co2e_org + co2e_rec

        serie.append({
            "año": año,
            "pct_captura": pct * 100,
            "ingresos": ingresos,
            "capex": capex_año,
            "opex": opex,
            "ebitda": ebitda,
            "fcf": fcf,
            "fcf_acumulado": fcf_acum,
            "empleos_directos": emp_cas,
            "co2e": co2e,
        })

    ult  = serie[-1] if serie else {}
    tIng = sum(a["ingresos"] for a in serie)
    tEBT = sum(a["ebitda"] for a in serie)
    tCap = capex_acum
    # CO2e — separar acumulado (horizonte) vs anual (último año)
    co2e_horizonte = sum(a["co2e"] for a in serie)
    co2e_anual     = ult.get("co2e", 0)  # año final = KPI principal

    # VPN / TIR
    wacc = s.wacc / 100
    vpn  = sum(a["fcf"] / (1 + wacc) ** (i + 1) for i, a in enumerate(serie)) - tCap
    tir  = _calc_tir([a["fcf"] for a in serie], tCap)

    payback = tCap / (tEBT / max(1, s.horizonte) / 12) if tEBT > 0 else 999

    emp_directos = ult.get("empleos_directos", 0)
    co2e_total   = co2e_horizonte  # usa el valor ya calculado
    kwh_biogas   = (rsu * COMP["organico"] * 0.70 * ORG_BIOD * 0.65 * 2.2 * DIAS_OP * 1000)

    prec_carb = 5 if s.precio_carbono_esc == "voluntario" else (15 if s.precio_carbono_esc == "sce" else 75)
    ing_carb = co2e_total * prec_carb * tipo_cambio  # usa tipo_cambio del registry si disponible
    ahorro_disp = sum(
        (sum(vol for vol in [
            rsu * COMP[k] * (a["pct_captura"] / 100) * (1 - s.merma_log_pct / 100)
            for k in ["organico","papel","plastico","vidrio","metales","otros"]
        ])) * DIAS_OP * 320
        for a in serie
    )
    ahorro_salud = pop * 145 * 0.20

    derrama = tIng * 1.4 + ing_carb + kwh_biogas * 0.001 + ahorro_disp + ahorro_salud
    score   = min(100, int(
        (s.pct_captura_por_año[0] if s.pct_captura_por_año else 20) * 0.3 +
        min(40, 40 - payback / 6) +
        min(30, emp_directos * 0.5)
    ))

    # Serializar el snapshot para incluirlo en la respuesta
    provenance_dict = snapshot.model_dump() if snapshot is not None else None

    return SimulateResponse(
        pob_activa=pop, viv_activas=viv, rsu_total_ton_dia=rsu,
        ingresos_brutos=tIng, capex_total=tCap, ebitda=tEBT,
        margen_ebitda=tEBT / tIng if tIng else 0,
        vpn=vpn, tir=tir, tir_equity=tir * 1.15,
        payback_meses=payback,
        empleos_directos=emp_directos, empleos_indirectos=emp_directos * 2.5,
        co2e_evitadas=co2e_total,
        co2e_evitadas_anual=co2e_anual,
        co2e_evitadas_horizonte=co2e_horizonte,
        kwh_biogas=kwh_biogas,
        ahorro_salud=ahorro_salud, derrama_total=derrama,
        score_politico=score,
        serie_anual=serie,
        data_provenance=provenance_dict,             # Fase 2.5: trazabilidad de entradas
        vol_capturable_por_mat_ton_anio=_vol_anio1,  # Fase 5: volúmenes para marketplace
        cost_model=_cost_model.model_dump(),          # Wave 0: desglose trazable
        financial_run_manifest=_manifest.model_dump(), # Wave 0: hash determinista
    )


def _calc_tir(flujos: list, capex: float) -> float:
    lo, hi = -0.99, 10.0
    for _ in range(200):
        mid = (lo + hi) / 2
        npv = sum(f / (1 + mid) ** (i + 1) for i, f in enumerate(flujos)) - capex
        if abs(npv) < 1:
            return mid * 100
        if npv > 0:
            lo = mid
        else:
            hi = mid
    return ((lo + hi) / 2) * 100
