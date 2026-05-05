"""
Adapter: Banxico SIE — Tipo de cambio MXN/USD (FIX).

Serie: SF43718 (tipo de cambio fix publicado por Banxico).
Endpoint público — sin API key.

Si la API no responde, retorna el último valor conocido como tipo=estimado,
con advertencia explícita. NUNCA simula como oficial.
"""
from __future__ import annotations

import os
from typing import List

import httpx

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

# Último valor conocido confiable (snapshot manual — se actualiza con cada deploy)
_FALLBACK_TIPO_CAMBIO = 17.10
_FALLBACK_FECHA       = "2025-01-01"
_BANXICO_URL          = (
    "https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno"
)


class BanxicoAdapter(BaseAdapter):
    id             = "banxico_tipo_cambio"
    nombre         = "Banxico SIE — Tipo de cambio FIX (SF43718)"
    organismo      = "Banco de México"
    endpoint       = "https://www.banxico.org.mx/SieAPIRest/service/v1/"
    requiere_clave = False   # El endpoint oportuno es público

    def kpis_cubiertos(self) -> List[str]:
        return ["tipo_cambio_mxn_usd"]

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        # zm no afecta el tipo de cambio — es nacional
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(
                    _BANXICO_URL,
                    headers={"Accept": "application/json"},
                )
            if r.status_code == 200:
                data  = r.json()
                series = data.get("bmx", {}).get("series", [{}])[0]
                datos  = series.get("datos", [])
                if datos:
                    ultimo = datos[-1]
                    valor  = float(ultimo["dato"].replace(",", ""))
                    fecha  = ultimo.get("fecha", "")
                    return [KPIConProvenance(
                        kpi_id="tipo_cambio_mxn_usd",
                        kpi_label="Tipo de cambio MXN/USD (FIX)",
                        valor=valor,
                        unidad="MXN/USD",
                        provenance=self._provenance_ok(
                            fuente_nombre="Banxico SIE SF43718 — FIX oportuno",
                            fuente_url="https://www.banxico.org.mx/tipcamb/main.do",
                            fecha_dato=fecha,
                            confianza=0.97,
                        ),
                    )]
        except Exception as exc:
            pass  # Caída silenciosa → fallback honesto abajo

        # Fallback honesto — valor de snapshot, no oficial
        return [KPIConProvenance(
            kpi_id="tipo_cambio_mxn_usd",
            kpi_label="Tipo de cambio MXN/USD (FIX)",
            valor=_FALLBACK_TIPO_CAMBIO,
            unidad="MXN/USD",
            provenance=DataProvenance(
                tipo=FuenteTipo.estimado,
                fuente_nombre=f"Snapshot manual ALQUIMIA ({_FALLBACK_FECHA})",
                fuente_organismo="Banco de México (snapshot offline)",
                fuente_url="https://www.banxico.org.mx/tipcamb/main.do",
                fecha_dato=_FALLBACK_FECHA,
                fecha_consulta=now_iso(),
                confianza=0.55,
                advertencia=(
                    f"Banxico SIE no respondió en esta sesión. "
                    f"Usando snapshot {_FALLBACK_FECHA} (${_FALLBACK_TIPO_CAMBIO:.2f} MXN/USD). "
                    f"Verifica el tipo de cambio vigente en banxico.org.mx antes de presentar resultados."
                ),
                requiere_clave_api=False,
                error_detalle="Timeout o error de red al consultar Banxico SIE",
            ),
        )]
