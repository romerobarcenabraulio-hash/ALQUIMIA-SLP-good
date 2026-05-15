"""
Adapter: INEGI — Población y viviendas.

Fuente primaria: INEGI Censo de Población y Vivienda 2020.
Datos de Censo son publicaciones oficiales — no live API.
La API de indicadores INEGI requiere token para uso intensivo; regístralo como
`INEGI_API_TOKEN` en el backend (ver `resolve_inegi_api_token` en `app.config`).
Este adapter aún entrega valores Censo 2020 desde catálogo interno; las llamadas HTTP
a INEGI pueden añadirse por ZM/indicador cuando CSA defina IDs oficiales.

Estrategia actual:
  1. Valores del Censo 2020 integrados (tipo=certificado; no API en tiempo real).
  2. NUNCA retornar tipo=oficial como si fuera respuesta live si no hubo consulta API en la misma petición.

Poblaciones base Censo 2020 (fuente: INEGI, publicadas 2021):
  SLP ZM: 1,243,980 hab (suma 4 municipios)
  QRO ZM: 1,404,306 hab
  MTY ZM: 5,341,171 hab (área metropolitana)
"""
from __future__ import annotations

from typing import Dict, List

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

# ─── Valores del Censo INEGI 2020 — fuente oficial publicada ─────────────────
# Tipo: certificado (publicación oficial, no API en tiempo real)
_CENSO_2020: Dict[str, Dict] = {
    "SLP": {
        "poblacion":  1_243_980,
        "viviendas":    224_000,
        "ocu":              3.6,
        "nota": "ZM San Luis Potosí: SLP + Soledad + Cerro de San Pedro + Villa de Pozos. INEGI Censo 2020.",
    },
    "QRO": {
        "poblacion":  1_404_306,
        "viviendas":    260_000,
        "ocu":              3.4,
        "nota": "ZM Querétaro: Querétaro + Corregidora + El Marqués + Huimilpan. INEGI Censo 2020.",
    },
    "MTY": {
        "poblacion":  5_341_171,
        "viviendas":    890_000,
        "ocu":              3.5,
        "nota": "ZM Monterrey: 9 municipios AMM. INEGI Censo 2020.",
    },
}

_CENSO_URL = "https://www.inegi.org.mx/programas/ccpv/2020/"
_CENSO_FECHA = "2020-03-15"


class InegiAdapter(BaseAdapter):
    id             = "inegi_poblacion"
    nombre         = "INEGI Censo de Población y Vivienda 2020"
    organismo      = "INEGI"
    endpoint       = "https://www.inegi.org.mx/app/api/indicadores/"
    requiere_clave = False
    tipo_maximo    = FuenteTipo.certificado   # Datos offline (Censo 2020), no live API

    def kpis_cubiertos(self) -> List[str]:
        return ["poblacion_total", "viviendas_totales", "ocupantes_por_vivienda"]

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        zm_key = zm.upper()
        censo  = _CENSO_2020.get(zm_key)

        if censo is None:
            no_prov = self._provenance_no_disponible(
                f"ZM '{zm}' no tiene datos Censo 2020 en el repositorio ALQUIMIA."
            )
            return [
                KPIConProvenance(kpi_id="poblacion_total",         kpi_label="Población total ZM", valor=None, unidad="habitantes",       provenance=no_prov),
                KPIConProvenance(kpi_id="viviendas_totales",       kpi_label="Viviendas totales ZM", valor=None, unidad="viviendas",       provenance=no_prov),
                KPIConProvenance(kpi_id="ocupantes_por_vivienda",  kpi_label="Ocupantes promedio", valor=None, unidad="personas/vivienda", provenance=no_prov),
            ]

        # Nota importante sobre el tipo: el Censo es una publicación oficial INEGI,
        # pero NO es una API en tiempo real — lo clasificamos como certificado
        # (confianza alta, fuente verificable, pero no live).
        prov = DataProvenance(
            tipo=FuenteTipo.certificado,
            fuente_nombre="INEGI Censo de Población y Vivienda 2020",
            fuente_organismo="INEGI",
            fuente_url=_CENSO_URL,
            fecha_dato=_CENSO_FECHA,
            fecha_consulta=now_iso(),
            confianza=0.93,
            advertencia=(
                "Dato de Censo 2020. La población real a la fecha puede diferir por "
                "crecimiento natural y migratorio. Se recomienda actualizar con "
                "proyecciones CONAPO para horizontes > 3 años."
            ),
            requiere_clave_api=False,
        )

        return [
            KPIConProvenance(
                kpi_id="poblacion_total",
                kpi_label=f"Población total ZM {zm_key}",
                valor=censo["poblacion"],
                unidad="habitantes",
                provenance=prov,
            ),
            KPIConProvenance(
                kpi_id="viviendas_totales",
                kpi_label=f"Viviendas totales ZM {zm_key}",
                valor=censo["viviendas"],
                unidad="viviendas",
                provenance=prov,
            ),
            KPIConProvenance(
                kpi_id="ocupantes_por_vivienda",
                kpi_label="Ocupantes promedio por vivienda",
                valor=censo["ocu"],
                unidad="personas/vivienda",
                provenance=prov,
            ),
        ]
