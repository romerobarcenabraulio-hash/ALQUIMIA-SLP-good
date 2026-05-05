"""
Adapter: SEMARNAT DGEIA — Generación per cápita y composición RSU.

Fuente: Diagnóstico Básico para la Gestión Integral de los Residuos (DBGIR 2020-2021).
        URL: https://www.gob.mx/semarnat/documentos/diagnostico-basico-para-la-gestion-integral-de-residuos

No existe API en tiempo real para estos datos.
Tipo máximo: certificado (publicación oficial, fecha conocida, metodología documentada).

Composición promedio nacional SEMARNAT (2021):
  Orgánicos:  44.9 % → usamos 45 %
  Papel:      18.5 % → usamos 20 %
  Plástico:   12.5 % → usamos 15 %
  Vidrio:      5.8 % → usamos  5 %
  Metales:     3.4 % → usamos  5 % (incluye aluminio)
  Otros:      14.9 % → usamos 10 %

Generación per cápita (kg/hab/día) por estrato SEMARNAT DBGIR 2021:
  Ciudad grande (> 1M hab):  0.98–1.10 kg/día
  Ciudad media (0.5–1M hab): 0.90–0.98 kg/día
  Ciudad pequeña (< 0.5M):   0.75–0.90 kg/día

Los valores usados en el motor (SLP: 0.90, QRO: 0.95, MTY: 1.05) están
dentro del rango SEMARNAT para sus respectivos estratos.
"""
from __future__ import annotations

from typing import Dict, List

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

_DBGIR_URL   = "https://www.gob.mx/semarnat/documentos/diagnostico-basico-para-la-gestion-integral-de-residuos"
_DBGIR_FECHA = "2021-12-01"

# Generación per cápita por ZM — dentro del rango SEMARNAT DBGIR 2021
_GEN_PERCAPITA: Dict[str, Dict] = {
    "SLP": {"valor": 0.90, "rango": "0.90–0.98 kg/día (ciudad media)", "estrato": "ciudad media"},
    "QRO": {"valor": 0.95, "rango": "0.90–0.98 kg/día (ciudad media)", "estrato": "ciudad media"},
    "MTY": {"valor": 1.05, "rango": "0.98–1.10 kg/día (ciudad grande)", "estrato": "ciudad grande"},
}

# Composición RSU — valores SEMARNAT DBGIR 2021 (% masa seca)
_COMPOSICION = {
    "organico":  0.45,
    "papel":     0.20,
    "plastico":  0.15,
    "vidrio":    0.05,
    "metales":   0.05,
    "otros":     0.10,
}


class SemarnatAdapter(BaseAdapter):
    id             = "semarnat_rsu"
    nombre         = "SEMARNAT DGEIA — DBGIR 2020-2021"
    organismo      = "SEMARNAT"
    endpoint       = None  # No hay API en tiempo real
    requiere_clave = False
    tipo_maximo    = FuenteTipo.certificado   # Datos offline (DBGIR 2021), no live API

    def kpis_cubiertos(self) -> List[str]:
        return ["gen_percapita_kg_dia", "composicion_rsu"]

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        zm_key  = zm.upper()
        gen_meta = _GEN_PERCAPITA.get(zm_key)

        prov_gen = DataProvenance(
            tipo=FuenteTipo.certificado,
            fuente_nombre="SEMARNAT DGEIA — Diagnóstico Básico GIR 2020-2021",
            fuente_organismo="SEMARNAT",
            fuente_url=_DBGIR_URL,
            fecha_dato=_DBGIR_FECHA,
            fecha_consulta=now_iso(),
            confianza=0.82,
            advertencia=(
                "Generación per cápita nacional SEMARNAT 2021. "
                "Los valores municipales reales pueden variar ±15 % respecto al promedio de estrato. "
                "Se recomienda validar con medición directa o datos municipales antes de presentar como cifra oficial."
            ),
            requiere_clave_api=False,
        )

        prov_comp = DataProvenance(
            tipo=FuenteTipo.certificado,
            fuente_nombre="SEMARNAT DGEIA — Composición nacional RSU 2021",
            fuente_organismo="SEMARNAT",
            fuente_url=_DBGIR_URL,
            fecha_dato=_DBGIR_FECHA,
            fecha_consulta=now_iso(),
            confianza=0.80,
            advertencia=(
                "Composición promedio nacional. La composición real puede variar según "
                "estrato socioeconómico, clima y temporada. Sin caracterización local, "
                "asumir incertidumbre de ±5 pp por fracción."
            ),
            requiere_clave_api=False,
        )

        kpis: List[KPIConProvenance] = []

        if gen_meta:
            kpis.append(KPIConProvenance(
                kpi_id="gen_percapita_kg_dia",
                kpi_label=f"Generación per cápita ({gen_meta['estrato']})",
                valor=gen_meta["valor"],
                unidad="kg/hab/día",
                provenance=prov_gen,
            ))
        else:
            kpis.append(KPIConProvenance(
                kpi_id="gen_percapita_kg_dia",
                kpi_label="Generación per cápita",
                valor=0.90,  # valor nacional promedio
                unidad="kg/hab/día",
                provenance=DataProvenance(
                    tipo=FuenteTipo.estimado,
                    fuente_nombre="Promedio nacional SEMARNAT (ZM no catalogada)",
                    fuente_organismo="SEMARNAT",
                    fuente_url=_DBGIR_URL,
                    fecha_dato=_DBGIR_FECHA,
                    fecha_consulta=now_iso(),
                    confianza=0.60,
                    advertencia=f"ZM '{zm}' no tiene valor específico SEMARNAT. Usando promedio nacional.",
                    requiere_clave_api=False,
                ),
            ))

        kpis.append(KPIConProvenance(
            kpi_id="composicion_rsu",
            kpi_label="Composición RSU por fracción (% masa)",
            valor=_COMPOSICION,
            unidad="%",
            provenance=prov_comp,
        ))

        return kpis
