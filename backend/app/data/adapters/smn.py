"""
Adapter: SMN/CONAGUA — Temperatura promedio anual y precipitación.

Fuente primaria: Servicio Meteorológico Nacional (CONAGUA).
  API pública: https://smn.conagua.gob.mx/es/climatologia/informacion-climatologica/normales-climatologicas
  Datos de normales climatológicas 1981-2010.

No existe API REST en tiempo real para normales climatológicas sin autenticación.
Tipo máximo: certificado (publicación oficial, metodología WMO, fecha conocida).

Normales climatológicas SMN 1981-2010 (promedio anual):
  SLP: 18.2 °C media anual / 475 mm precipitación anual
  QRO: 18.8 °C media anual / 576 mm precipitación anual
  MTY: 22.1 °C media anual / 644 mm precipitación anual

Ref: CONAGUA-SMN, Normales Climatológicas de México 1981-2010 (publicado 2012).
     https://smn.conagua.gob.mx/tools/RESOURCES/Normales8110/NORMAL24085.TXT (ejemplo)
"""
from __future__ import annotations

from typing import Dict, List

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

_SMN_URL   = "https://smn.conagua.gob.mx/es/climatologia/informacion-climatologica/normales-climatologicas"
_SMN_FECHA = "2012-01-01"  # Publicación de normales 1981-2010

# Normales climatológicas SMN 1981-2010
_NORMALES: Dict[str, Dict] = {
    "SLP": {
        "temp_media_anual_c":     18.2,
        "precipitacion_anual_mm": 475.0,
        "nota": "Normal 1981-2010 estación SLP-DGE 24085. SMN-CONAGUA.",
    },
    "QRO": {
        "temp_media_anual_c":     18.8,
        "precipitacion_anual_mm": 576.0,
        "nota": "Normal 1981-2010 estación QRO-OBS 22007. SMN-CONAGUA.",
    },
    "MTY": {
        "temp_media_anual_c":     22.1,
        "precipitacion_anual_mm": 644.0,
        "nota": "Normal 1981-2010 estación MTY-OBS 19049. SMN-CONAGUA.",
    },
}


class SmnAdapter(BaseAdapter):
    id             = "smn_clima"
    nombre         = "SMN/CONAGUA — Normales Climatológicas 1981-2010"
    organismo      = "CONAGUA/SMN"
    endpoint       = None   # No hay API REST pública sin autenticación
    requiere_clave = False
    tipo_maximo    = FuenteTipo.certificado   # Datos offline (normales 1981-2010), no live API

    def kpis_cubiertos(self) -> List[str]:
        return ["temp_media_anual_c", "precipitacion_anual_mm"]

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        zm_key  = zm.upper()
        normal  = _NORMALES.get(zm_key)

        prov_base = DataProvenance(
            tipo=FuenteTipo.certificado,
            fuente_nombre="SMN/CONAGUA — Normales Climatológicas 1981-2010",
            fuente_organismo="CONAGUA/SMN",
            fuente_url=_SMN_URL,
            fecha_dato=_SMN_FECHA,
            fecha_consulta=now_iso(),
            confianza=0.88,
            advertencia=(
                "Normal climatológica período 1981-2010 (WMO). "
                "No refleja tendencias de cambio climático post-2010. "
                "Para proyecciones de cambio climático usar escenarios IPCC/INECC."
            ),
            requiere_clave_api=False,
        )

        if normal is None:
            no_prov = self._provenance_no_disponible(
                f"ZM '{zm}' no tiene datos SMN en el repositorio ALQUIMIA."
            )
            return [
                KPIConProvenance(
                    kpi_id="temp_media_anual_c",
                    kpi_label="Temperatura media anual",
                    valor=None,
                    unidad="°C",
                    provenance=no_prov,
                ),
                KPIConProvenance(
                    kpi_id="precipitacion_anual_mm",
                    kpi_label="Precipitación media anual",
                    valor=None,
                    unidad="mm/año",
                    provenance=no_prov,
                ),
            ]

        return [
            KPIConProvenance(
                kpi_id="temp_media_anual_c",
                kpi_label=f"Temperatura media anual ZM {zm_key}",
                valor=normal["temp_media_anual_c"],
                unidad="°C",
                provenance=prov_base,
            ),
            KPIConProvenance(
                kpi_id="precipitacion_anual_mm",
                kpi_label=f"Precipitación media anual ZM {zm_key}",
                valor=normal["precipitacion_anual_mm"],
                unidad="mm/año",
                provenance=prov_base,
            ),
        ]
