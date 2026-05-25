"""Contexto municipal POLIS → parámetros AURUM."""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from modules.planning.budget.schemas import _d


def load_municipal_params(municipio_id: str) -> dict[str, Any]:
    """
    Lee perfil POLIS si existe; fallback a constantes ZM SLP.
    """
    defaults: dict[str, Any] = {
        "viviendas_activas": 224_000,
        "ca_mix": {"P": 8, "M": 7, "G": 3},
        "n_recicladoras": 5,
        "ingreso_bruto_anual_mxn": "361000000",
        "ebitda_anual_mxn": "85000000",
        "supuesto_base": "Modelo_BASED.xlsx · Fase 0-1 · ZM SLP",
        "fuente": "aurum_defaults",
    }

    try:
        from modules.personalization.profile_loader import canonical_figures, load_profile

        profile = load_profile(municipio_id)
        infra = profile.get("infraestructura_objetivo") or {}
        detalle = infra.get("centros_acopio_detalle") or {}
        cifras = canonical_figures(municipio_id)

        ca_mix = {
            "P": int(detalle.get("UV-P", detalle.get("P", 0)) or 0),
            "M": int(detalle.get("UV-M", detalle.get("M", 0)) or 0),
            "G": int(detalle.get("UV-G", detalle.get("G", 0)) or 0),
        }
        if sum(ca_mix.values()) == 0:
            ca_mix = defaults["ca_mix"]

        ingreso = infra.get("ingreso_anual_anio_3_mxn")
        opex_rango = infra.get("opex_anual_mxn_rango") or []
        ebitda_est = None
        if ingreso and len(opex_rango) >= 2:
            opex_mid = (float(opex_rango[0]) + float(opex_rango[1])) / 2
            ebitda_est = str(int(float(ingreso) - opex_mid))

        return {
            "viviendas_activas": int(cifras.get("viviendas") or defaults["viviendas_activas"]),
            "ca_mix": ca_mix,
            "n_recicladoras": int(cifras.get("recicladoras") or infra.get("recicladoras_por_giro") or 5),
            "ingreso_bruto_anual_mxn": str(int(ingreso)) if ingreso else defaults["ingreso_bruto_anual_mxn"],
            "ebitda_anual_mxn": ebitda_est or defaults["ebitda_anual_mxn"],
            "supuesto_base": profile.get("generacion_rsu_fuente") or defaults["supuesto_base"],
            "fuente": f"polis_profile:{profile.get('municipio_id', municipio_id)}",
        }
    except FileNotFoundError:
        return defaults


def load_bios_maintenance_warnings() -> list[str]:
    """Alertas RUL de BIOS → AURUM (mantenimiento / CAPEX futuro)."""
    try:
        from modules.lifecycle.asset_registry import load_inventory, replacement_alerts

        alerts = replacement_alerts(load_inventory())
        out: list[str] = []
        for a in alerts:
            out.append(
                f"BIOS {a['nivel']}: {a['nombre']} (RUL {a['rul_anios']} años) → revisar OPEX mantenimiento"
            )
        return out
    except Exception:
        return []
