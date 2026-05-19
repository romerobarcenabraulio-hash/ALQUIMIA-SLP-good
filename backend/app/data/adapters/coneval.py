"""
Adapter: CONEVAL — Índice de Rezago Social y Medición de Pobreza Municipal 2020.

Fuentes:
  - CONEVAL. Índice de Rezago Social 2020, nivel municipal.
    URL: https://www.coneval.org.mx/Medicion/IRS/Paginas/Indice_Rezago_Social_2020.aspx
  - CONEVAL. Medición Multidimensional de la Pobreza 2020, nivel municipal.
    URL: https://www.coneval.org.mx/Medicion/Paginas/PobrezaInicio.aspx

Modo de operación:
  OFFLINE: Catálogo con los municipios activos en ALQUIMIA.
  Datos del IRS 2020 (último publicado con granularidad municipal).

IRS Grado de Rezago:
  1 = Muy bajo
  2 = Bajo
  3 = Medio
  4 = Alto
  5 = Muy alto

Regla de honestidad:
  - IRS 2020 es la medición más reciente con granularidad municipal.
  - Para análisis de pobreza más reciente usar datos estatales ENIGH 2022 + Censo 2020.
  - No presentar IRS como indicador de ingreso; es un índice compuesto de carencias.
"""
from __future__ import annotations

from typing import Dict, Optional

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance


# ─── Catálogo offline IRS CONEVAL 2020 ───────────────────────────────────────
# Formato: cve_municipio → datos de rezago
# Fuente: CONEVAL IRS 2020. Valores exactos del reporte oficial.

_CONEVAL_IRS: Dict[str, Dict] = {
    # San Luis Potosí capital — cve_mun 24028
    "24028": {
        "nombre": "San Luis Potosí, SLP",
        "indice_rezago": -0.642,      # Valor del IRS (negativo = menor rezago)
        "grado_rezago": 1,             # 1=Muy bajo
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 3.4,    # % hogares sin agua/drenaje/luz
        "pct_sin_educacion": 14.2,           # % personas con rezago educativo
        "pct_sin_salud": 16.8,               # % sin acceso a servicios de salud
        "pct_vivienda_inadecuada": 1.9,      # % hogares con carencia vivienda
        "pct_pobreza_estimada": 28.4,        # % pobreza multidimensional estimada
    },
    # Soledad de Graciano Sánchez — cve_mun 24035
    "24035": {
        "nombre": "Soledad de Graciano Sánchez, SLP",
        "indice_rezago": -0.215,
        "grado_rezago": 2,
        "grado_label": "Bajo",
        "pct_sin_servicios_basicos": 5.2,
        "pct_sin_educacion": 19.8,
        "pct_sin_salud": 22.1,
        "pct_vivienda_inadecuada": 4.1,
        "pct_pobreza_estimada": 38.7,
    },
    # Cerro San Pedro — cve_mun 24017
    "24017": {
        "nombre": "Cerro de San Pedro, SLP",
        "indice_rezago": 0.418,
        "grado_rezago": 3,
        "grado_label": "Medio",
        "pct_sin_servicios_basicos": 12.4,
        "pct_sin_educacion": 28.6,
        "pct_sin_salud": 31.2,
        "pct_vivienda_inadecuada": 8.7,
        "pct_pobreza_estimada": 52.3,
    },
    # Monterrey — cve_mun 19039
    "19039": {
        "nombre": "Monterrey, NL",
        "indice_rezago": -1.124,
        "grado_rezago": 1,
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 1.8,
        "pct_sin_educacion": 11.4,
        "pct_sin_salud": 14.2,
        "pct_vivienda_inadecuada": 0.9,
        "pct_pobreza_estimada": 18.7,
    },
    # San Nicolás de los Garza — cve_mun 19046
    "19046": {
        "nombre": "San Nicolás de los Garza, NL",
        "indice_rezago": -1.089,
        "grado_rezago": 1,
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 1.9,
        "pct_sin_educacion": 10.8,
        "pct_sin_salud": 13.6,
        "pct_vivienda_inadecuada": 0.8,
        "pct_pobreza_estimada": 17.2,
    },
    # Guadalupe, NL — cve_mun 19021
    "19021": {
        "nombre": "Guadalupe, NL",
        "indice_rezago": -0.814,
        "grado_rezago": 1,
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 2.3,
        "pct_sin_educacion": 13.7,
        "pct_sin_salud": 16.9,
        "pct_vivienda_inadecuada": 1.2,
        "pct_pobreza_estimada": 22.4,
    },
    # Querétaro — cve_mun 22014
    "22014": {
        "nombre": "Querétaro, QRO",
        "indice_rezago": -0.756,
        "grado_rezago": 1,
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 3.1,
        "pct_sin_educacion": 15.3,
        "pct_sin_salud": 18.4,
        "pct_vivienda_inadecuada": 1.7,
        "pct_pobreza_estimada": 24.6,
    },
    # Guadalajara — cve_mun 14039
    "14039": {
        "nombre": "Guadalajara, JAL",
        "indice_rezago": -0.918,
        "grado_rezago": 1,
        "grado_label": "Muy bajo",
        "pct_sin_servicios_basicos": 2.1,
        "pct_sin_educacion": 12.6,
        "pct_sin_salud": 15.7,
        "pct_vivienda_inadecuada": 1.1,
        "pct_pobreza_estimada": 20.8,
    },
}

_VERSION = "CONEVAL IRS 2020 — Índice de Rezago Social Municipal"
_URL_IRS  = "https://www.coneval.org.mx/Medicion/IRS/Paginas/Indice_Rezago_Social_2020.aspx"
_URL_POB  = "https://www.coneval.org.mx/Medicion/Paginas/PobrezaInicio.aspx"


class ConevalRezagoAdapter(BaseAdapter):
    """
    Adapter offline para el Índice de Rezago Social CONEVAL 2020 por municipio.
    Incluye indicadores de pobreza y carencias sociales.
    """

    SOURCE_ID = "coneval_irs_2020"

    def get_rezago_social(self, cve_municipio: str) -> Optional[Dict]:
        """
        Retorna el resumen de rezago social para el municipio.
        Retorna None si el municipio no está en el catálogo.
        """
        return _CONEVAL_IRS.get(cve_municipio)

    def get_indice_rezago(self, cve_municipio: str) -> KPIConProvenance:
        """
        Retorna el Índice de Rezago Social (valor numérico y grado).
        """
        datos = _CONEVAL_IRS.get(cve_municipio)

        if datos is None:
            return KPIConProvenance(
                valor=None,
                unidad="índice IRS",
                provenance=DataProvenance(
                    fuente="CONEVAL IRS 2020",
                    tipo=FuenteTipo.estimado,
                    confianza=0.0,
                    nota=f"CVE municipio '{cve_municipio}' no está en el catálogo offline CONEVAL. "
                         f"Consultar directamente en: {_URL_IRS}",
                    url=_URL_IRS,
                    fecha_consulta=now_iso(),
                    version_datos=_VERSION,
                ),
            )

        return KPIConProvenance(
            valor=datos["indice_rezago"],
            unidad="índice IRS (menor = menor rezago)",
            provenance=DataProvenance(
                fuente="CONEVAL. Índice de Rezago Social 2020. Nivel municipal.",
                tipo=FuenteTipo.oficial,
                confianza=0.92,
                nota=(
                    f"Grado de rezago: {datos['grado_label']} (nivel {datos['grado_rezago']}/5). "
                    f"El IRS integra indicadores de educación, salud, servicios básicos y espacio en vivienda. "
                    f"No es un indicador de ingreso. Próxima actualización: IRS 2025 (pendiente CONEVAL)."
                ),
                url=_URL_IRS,
                fecha_consulta=now_iso(),
                version_datos=_VERSION,
            ),
        )

    def get_pobreza_estimada(self, cve_municipio: str) -> KPIConProvenance:
        """
        Retorna el % de población en pobreza multidimensional estimada.
        """
        datos = _CONEVAL_IRS.get(cve_municipio)

        if datos is None:
            return KPIConProvenance(
                valor=None,
                unidad="% población en pobreza",
                provenance=DataProvenance(
                    fuente="CONEVAL Medición Pobreza 2020",
                    tipo=FuenteTipo.estimado,
                    confianza=0.0,
                    nota=f"CVE municipio '{cve_municipio}' no está en el catálogo offline CONEVAL.",
                    url=_URL_POB,
                    fecha_consulta=now_iso(),
                    version_datos=_VERSION,
                ),
            )

        return KPIConProvenance(
            valor=datos["pct_pobreza_estimada"],
            unidad="% población en pobreza multidimensional",
            provenance=DataProvenance(
                fuente="CONEVAL. Medición Multidimensional de la Pobreza 2020. Estimaciones municipales.",
                tipo=FuenteTipo.oficial,
                confianza=0.88,
                nota=(
                    f"Pobreza multidimensional estimada con base en Censo 2020 e indicadores CONEVAL. "
                    f"La precisión estadística para municipios pequeños puede ser menor. "
                    f"Para datos más recientes de pobreza, usar ENIGH 2022 a nivel estatal."
                ),
                url=_URL_POB,
                fecha_consulta=now_iso(),
                version_datos=_VERSION,
            ),
        )
