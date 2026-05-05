"""
Adapter: Fallback estático honesto — ALQUIMIA valores por defecto.

Este adapter NUNCA simula datos como oficiales.
Todos los valores son tipo=manual (ingresados por el equipo ALQUIMIA)
con confianza máxima de 0.50.

Propósito: proveer un valor de último recurso cuando todos los demás
adapters fallan, siempre con advertencia explícita de que NO es un
dato oficial y que debe validarse antes de presentarse.

Regla de uso: solo se invoca cuando ningún otro adapter retornó un
valor para el KPI solicitado. El DataRegistry lo llama automáticamente
como último escalón.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

# Valores por defecto ingresados manualmente — actualizados 2025-Q1
# Fuente: literatura técnica / SEMARNAT / INEGI / estimaciones ALQUIMIA
_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "tipo_cambio_mxn_usd": {
        "valor": 17.10,
        "unidad": "MXN/USD",
        "label": "Tipo de cambio MXN/USD (fallback ALQUIMIA)",
        "nota": "Snapshot manual ALQUIMIA 2025-01. Verificar en banxico.org.mx.",
    },
    "poblacion_total": {
        "valor": None,   # No hay valor genérico útil
        "unidad": "habitantes",
        "label": "Población total ZM",
        "nota": "Sin datos para esta ZM. Ingresar manualmente.",
    },
    "viviendas_totales": {
        "valor": None,
        "unidad": "viviendas",
        "label": "Viviendas totales ZM",
        "nota": "Sin datos para esta ZM. Ingresar manualmente.",
    },
    "ocupantes_por_vivienda": {
        "valor": 3.5,
        "unidad": "personas/vivienda",
        "label": "Ocupantes promedio por vivienda",
        "nota": "Promedio nacional INEGI 2020. Puede variar ±0.5 según ZM.",
    },
    "gen_percapita_kg_dia": {
        "valor": 0.90,
        "unidad": "kg/hab/día",
        "label": "Generación per cápita RSU",
        "nota": "Promedio nacional SEMARNAT DBGIR 2021. Incertidumbre ±15 %.",
    },
    "composicion_rsu": {
        "valor": {
            "organico": 0.45,
            "papel":    0.20,
            "plastico": 0.15,
            "vidrio":   0.05,
            "metales":  0.05,
            "otros":    0.10,
        },
        "unidad": "%",
        "label": "Composición RSU por fracción",
        "nota": "Promedio nacional SEMARNAT 2021. Incertidumbre ±5 pp por fracción.",
    },
    "temp_media_anual_c": {
        "valor": 20.0,
        "unidad": "°C",
        "label": "Temperatura media anual",
        "nota": "Valor genérico para México central. Verificar con SMN.",
    },
    "precipitacion_anual_mm": {
        "valor": 550.0,
        "unidad": "mm/año",
        "label": "Precipitación media anual",
        "nota": "Valor genérico para México central. Verificar con SMN.",
    },
}


def _provenance_fallback_estatico(kpi_id: str, nota: str) -> DataProvenance:
    return DataProvenance(
        tipo=FuenteTipo.manual,
        fuente_nombre=f"Valor por defecto ALQUIMIA — {kpi_id}",
        fuente_organismo="ALQUIMIA (estimación interna)",
        fuente_url=None,
        fecha_dato="2025-01-01",
        fecha_consulta=now_iso(),
        confianza=0.45,
        advertencia=(
            f"VALOR POR DEFECTO. {nota} "
            "Este dato NO proviene de una fuente oficial verificada en esta sesión. "
            "NO presentar como dato oficial sin validación previa."
        ),
        requiere_clave_api=False,
        error_detalle="Todos los adapters primarios fallaron para este KPI.",
    )


class FallbackAdapter(BaseAdapter):
    """
    Adapter de último recurso — retorna defaults con tipo=manual.
    Cubre todos los KPIs conocidos. Nunca bloquea la aplicación.
    """

    id             = "fallback_estatico"
    nombre         = "Fallback estático ALQUIMIA (valores por defecto)"
    organismo      = "ALQUIMIA"
    endpoint       = None
    requiere_clave = False
    tipo_maximo    = FuenteTipo.manual   # Siempre manual — nunca más alto

    def kpis_cubiertos(self) -> List[str]:
        return list(_DEFAULTS.keys())

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        kpis: List[KPIConProvenance] = []
        for kpi_id, meta in _DEFAULTS.items():
            kpis.append(KPIConProvenance(
                kpi_id=kpi_id,
                kpi_label=meta["label"],
                valor=meta["valor"],
                unidad=meta["unidad"],
                provenance=_provenance_fallback_estatico(kpi_id, meta["nota"]),
            ))
        return kpis

    async def fetch_single(self, kpi_id: str) -> Optional[KPIConProvenance]:
        """Retorna un único KPI del fallback estático, o None si no conocido."""
        meta = _DEFAULTS.get(kpi_id)
        if meta is None:
            return None
        return KPIConProvenance(
            kpi_id=kpi_id,
            kpi_label=meta["label"],
            valor=meta["valor"],
            unidad=meta["unidad"],
            provenance=_provenance_fallback_estatico(kpi_id, meta["nota"]),
        )
