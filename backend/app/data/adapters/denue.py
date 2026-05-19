"""
Adapter: INEGI DENUE — Directorio Estadístico Nacional de Unidades Económicas.

Fuente: INEGI API DENUE v1
URL: https://www.inegi.org.mx/servicios/api_denue.html
Documentación: https://www.inegi.org.mx/app/api/denue/v1/tokenVerify/

Usos en ALQUIMIA:
  - Identificar establecimientos activos relacionados con reciclaje y residuos
    en el municipio objetivo (centros de acopio existentes, recicladoras, etc.)
  - Actividades SCIAN relevantes:
    562111 — Recolección de residuos no peligrosos
    562112 — Acopio y reciclaje de materiales
    562119 — Otros servicios de recolección de residuos
    381111 — Comercio al por mayor de desperdicios y desechos metálicos
    381191 — Comercio al por mayor de otros desperdicios

Modos de operación:
  CON token (INEGI_DENUE_TOKEN env): llamadas en vivo a la API DENUE.
  SIN token: retorna datos de catálogo de ejemplo (piloto SLP) con advertencia.

Regla de honestidad:
  - DENUE identifica ESTABLECIMIENTOS, no generadores domésticos ni basura.
  - Los datos DENUE no sustituyen datos de generación per cápita ni composición RSU.
  - Siempre declarar fuente y fecha de actualización DENUE en DataProvenance.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance


# ─── Configuración API ────────────────────────────────────────────────────────

_DENUE_TOKEN   = os.getenv("INEGI_DENUE_TOKEN", "")
_BASE_URL      = "https://www.inegi.org.mx/app/api/denue/v1"
_TIMEOUT_S     = 8.0

# SCIAN de actividades de reciclaje y acopio
_SCIAN_RECICLAJE = ["562111", "562112", "562119", "381111", "381191"]

# ─── Catálogo offline piloto SLP (cuando no hay token) ───────────────────────

_PILOTO_SLP: List[Dict[str, Any]] = [
    {
        "id": "DENUE_SLP_001",
        "nombre": "Centro de Acopio Municipal SLP",
        "actividad_scian": "562112",
        "actividad_label": "Acopio y reciclaje de materiales",
        "municipio": "San Luis Potosí",
        "cve_municipio": "24028",
        "lat": 22.1565,
        "lon": -100.9855,
        "estatus": "activo",
        "fuente": "DENUE 2024 (catálogo offline piloto)",
    },
    {
        "id": "DENUE_SLP_002",
        "nombre": "Recicladora Potosina S.A.",
        "actividad_scian": "381191",
        "actividad_label": "Comercio al por mayor de otros desperdicios",
        "municipio": "San Luis Potosí",
        "cve_municipio": "24028",
        "lat": 22.1420,
        "lon": -100.9780,
        "estatus": "activo",
        "fuente": "DENUE 2024 (catálogo offline piloto)",
    },
    {
        "id": "DENUE_SLP_003",
        "nombre": "Punto Verde Soledad",
        "actividad_scian": "562111",
        "actividad_label": "Recolección de residuos no peligrosos",
        "municipio": "Soledad de Graciano Sánchez",
        "cve_municipio": "24035",
        "lat": 22.1845,
        "lon": -100.9321,
        "estatus": "activo",
        "fuente": "DENUE 2024 (catálogo offline piloto)",
    },
]

_VERSION = "INEGI DENUE 2024 (actualización semestral)"
_URL_DOC = "https://www.inegi.org.mx/servicios/api_denue.html"


class DenueAdapter(BaseAdapter):
    """
    Adapter para consultar establecimientos de reciclaje y acopio en INEGI DENUE.
    Soporta llamadas en vivo (con token) y catálogo offline (sin token).
    """

    SOURCE_ID = "inegi_denue_2024"

    def get_centros_acopio_municipio(
        self,
        cve_municipio: str,
        radio_km: float = 10.0,
        lat_ref: Optional[float] = None,
        lon_ref: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Busca establecimientos DENUE de reciclaje/acopio en el municipio.

        Args:
            cve_municipio: Clave geoestadística municipal (p.e. "24028")
            radio_km: Radio de búsqueda en km (solo para búsqueda georreferenciada)
            lat_ref: Latitud del punto de referencia (centroide del municipio)
            lon_ref: Longitud del punto de referencia

        Returns:
            Dict con lista de establecimientos y DataProvenance
        """
        if _DENUE_TOKEN:
            return self._buscar_en_vivo(cve_municipio, radio_km, lat_ref, lon_ref)
        else:
            return self._fallback_catalogo(cve_municipio)

    def _buscar_en_vivo(
        self,
        cve_municipio: str,
        radio_km: float,
        lat_ref: Optional[float],
        lon_ref: Optional[float],
    ) -> Dict[str, Any]:
        """Consulta la API DENUE en tiempo real."""
        actividades_str = "|".join(_SCIAN_RECICLAJE)

        try:
            if lat_ref and lon_ref:
                # Búsqueda georreferenciada
                url = (
                    f"{_BASE_URL}/Busqueda/BuscarAreaActEstr/"
                    f"{lat_ref}/{lon_ref}/{radio_km * 1000}/0/{actividades_str}/0/"
                    f"{_DENUE_TOKEN}"
                )
            else:
                # Búsqueda por municipio
                url = (
                    f"{_BASE_URL}/Busqueda/BuscarLocalidad/"
                    f"{cve_municipio}/{actividades_str}/0/{_DENUE_TOKEN}"
                )

            with httpx.Client(timeout=_TIMEOUT_S) as client:
                resp = client.get(url)
                resp.raise_for_status()
                data = resp.json()

            establecimientos = self._parsear_respuesta_denue(data)

            return {
                "establecimientos": establecimientos,
                "total": len(establecimientos),
                "provenance": DataProvenance(
                    fuente="INEGI DENUE — consulta en vivo",
                    tipo=FuenteTipo.oficial,
                    confianza=0.88,
                    nota=(
                        f"Búsqueda DENUE para CVE municipio '{cve_municipio}'. "
                        f"Actividades SCIAN: {', '.join(_SCIAN_RECICLAJE)}. "
                        f"DENUE identifica establecimientos registrados, no todos los puntos de acopio informales."
                    ),
                    url=_URL_DOC,
                    fecha_consulta=now_iso(),
                    version_datos=_VERSION,
                ).dict(),
            }

        except Exception as e:
            return self._fallback_catalogo(cve_municipio, error=str(e))

    def _fallback_catalogo(
        self,
        cve_municipio: str,
        error: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retorna el catálogo offline piloto SLP cuando no hay token."""
        establecimientos = [
            est for est in _PILOTO_SLP
            if est["cve_municipio"] == cve_municipio
        ]

        nota = (
            f"Sin INEGI_DENUE_TOKEN configurado. "
            f"Se usan datos de catálogo offline piloto SLP. "
            f"Para datos en vivo, configurar INEGI_DENUE_TOKEN en .env."
        )
        if error:
            nota += f" Error en llamada a API: {error}"

        return {
            "establecimientos": establecimientos,
            "total": len(establecimientos),
            "provenance": DataProvenance(
                fuente="INEGI DENUE 2024 — catálogo offline piloto",
                tipo=FuenteTipo.estimado,
                confianza=0.50,
                nota=nota,
                url=_URL_DOC,
                fecha_consulta=now_iso(),
                version_datos=f"{_VERSION} (offline)",
            ).dict(),
        }

    def _parsear_respuesta_denue(self, data: Any) -> List[Dict[str, Any]]:
        """Normaliza la respuesta de la API DENUE al formato interno."""
        if not isinstance(data, list):
            return []

        resultado = []
        for item in data:
            try:
                resultado.append({
                    "id": str(item.get("id", "")),
                    "nombre": item.get("Nombre", ""),
                    "actividad_scian": str(item.get("Codigo_Actividad", "")),
                    "actividad_label": item.get("Nombre_Actividad", ""),
                    "municipio": item.get("Nombre_Municipio", ""),
                    "cve_municipio": str(item.get("Codigo_Municipio", "")),
                    "lat": float(item.get("Latitud", 0)),
                    "lon": float(item.get("Longitud", 0)),
                    "estatus": "activo",
                    "fuente": "DENUE API en vivo",
                })
            except (KeyError, ValueError, TypeError):
                continue

        return resultado
