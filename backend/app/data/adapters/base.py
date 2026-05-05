"""
BaseAdapter — interfaz que todos los adapters deben implementar.

Contrato:
  - fetch() NUNCA lanza excepción visible al caller.
  - Si la fuente no está disponible, retorna KPIConProvenance con
    tipo = no_disponible y error_detalle explicativo.
  - NUNCA retorna tipo = oficial si la fuente no fue verificada en esta sesión.
  - El valor puede ser None solo cuando tipo = no_disponible.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List

from app.data.schemas import (
    DataProvenance, FuenteTipo, FuenteStatus, KPIConProvenance,
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseAdapter(ABC):
    """Interfaz de adapter de datos con contrato de honestidad."""

    id:              str   # Identificador único del adapter (e.g. "inegi_poblacion")
    nombre:          str   # Nombre legible (e.g. "INEGI Censo / Indicadores")
    organismo:       str   # Organismo responsable
    endpoint:        str | None = None
    requiere_clave:  bool = False
    # tipo_maximo: el mejor FuenteTipo que este adapter puede proporcionar.
    # Los adapters offline (datos hardcoded) deben declarar certificado o menos.
    # Los adapters live (API en tiempo real) pueden ser oficial.
    tipo_maximo: FuenteTipo = FuenteTipo.oficial

    @abstractmethod
    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        """
        Retorna lista de KPIs que este adapter provee para la ZM indicada.
        Nunca lanza — encapsula errores en provenance tipo=no_disponible.
        """

    @abstractmethod
    def kpis_cubiertos(self) -> List[str]:
        """Lista de kpi_ids que este adapter puede proveer."""

    def _provenance_ok(
        self,
        fuente_nombre: str,
        fuente_url: str | None,
        fecha_dato: str | None,
        confianza: float,
        advertencia: str | None = None,
    ) -> DataProvenance:
        """Helper: provenance para dato obtenido exitosamente."""
        return DataProvenance(
            tipo=FuenteTipo.oficial if confianza >= 0.90 else FuenteTipo.certificado,
            fuente_nombre=fuente_nombre,
            fuente_organismo=self.organismo,
            fuente_url=fuente_url,
            fecha_dato=fecha_dato,
            fecha_consulta=now_iso(),
            confianza=confianza,
            advertencia=advertencia,
            requiere_clave_api=self.requiere_clave,
        )

    def _provenance_fallback(
        self,
        fuente_nombre: str,
        advertencia: str,
        confianza: float = 0.60,
        fecha_dato: str | None = None,
    ) -> DataProvenance:
        """Helper: provenance para dato estimado (fallback honesto)."""
        return DataProvenance(
            tipo=FuenteTipo.estimado,
            fuente_nombre=fuente_nombre,
            fuente_organismo=self.organismo,
            fuente_url=None,
            fecha_dato=fecha_dato,
            fecha_consulta=now_iso(),
            confianza=confianza,
            advertencia=advertencia,
            requiere_clave_api=self.requiere_clave,
        )

    def _provenance_no_disponible(
        self,
        error: str,
    ) -> DataProvenance:
        """Helper: provenance para dato no obtenible — NUNCA simular."""
        return DataProvenance(
            tipo=FuenteTipo.no_disponible,
            fuente_nombre=f"{self.nombre} — no disponible",
            fuente_organismo=self.organismo,
            fuente_url=None,
            fecha_dato=None,
            fecha_consulta=now_iso(),
            confianza=0.0,
            advertencia=f"Dato no disponible: {error}",
            requiere_clave_api=self.requiere_clave,
            error_detalle=error,
        )

    def status(self) -> FuenteStatus:
        if self.requiere_clave:
            tipo_max = FuenteTipo.estimado
        else:
            tipo_max = self.tipo_maximo
        return FuenteStatus(
            id=self.id,
            nombre=self.nombre,
            organismo=self.organismo,
            endpoint=self.endpoint,
            tipo_maximo=tipo_max,
            disponible=not self.requiere_clave,
            requiere_clave=self.requiere_clave,
            kpis_cubiertos=self.kpis_cubiertos(),
        )
