"""
Fase 2 — DataProvenance: trazabilidad formal de cada KPI.

Regla central: ningún KPI se presenta como oficial sin fuente verificable.

Jerarquía de confianza (descendente):
  oficial      → publicado por organismo autorizado, URL verificable, fecha conocida
  certificado  → estudio técnico con metodología documentada, no API en tiempo real
  estimado     → proyección, interpolación o valor derivado de modelo ALQUIMIA
  manual       → ingresado por el usuario o equipo sin fuente externa
  no_disponible → no se pudo obtener; valor ausente — nunca sustituir silenciosamente

Regla de presentación:
  - oficial + certificado → se pueden presentar como referencia en documentos
  - estimado              → llevan badge amarillo y nota de incertidumbre
  - manual                → llevan badge naranja con "ingresado manualmente"
  - no_disponible         → bloquean lenguaje de certeza; ÁGORA advierte
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ─── Tipos de fuente ──────────────────────────────────────────────────────────

class FuenteTipo(str, Enum):
    oficial       = "oficial"       # API/publicación de organismo autorizado
    certificado   = "certificado"   # Estudio técnico documentado, no live API
    estimado      = "estimado"      # Proyección o derivado de modelo
    manual        = "manual"        # Ingresado por usuario / equipo
    no_disponible = "no_disponible" # No obtenible — nunca silenciar


# ─── Provenance de un dato ────────────────────────────────────────────────────

class DataProvenance(BaseModel):
    tipo:                FuenteTipo
    fuente_nombre:       str                    # e.g. "INEGI Censo 2020"
    fuente_organismo:    str                    # e.g. "INEGI", "Banxico", "SEMARNAT"
    fuente_url:          Optional[str] = None   # URL verificable o None
    fecha_dato:          Optional[str] = None   # Fecha de referencia del dato (ISO)
    fecha_consulta:      Optional[str] = None   # Cuándo se consultó (ISO)
    confianza:           float = Field(..., ge=0.0, le=1.0)
    advertencia:         Optional[str] = None   # Texto de advertencia visible al usuario
    requiere_clave_api:  bool = False           # True si el adapter necesita API key
    error_detalle:       Optional[str] = None   # Detalle del error cuando no_disponible


# ─── KPI con su provenance ────────────────────────────────────────────────────

class KPIConProvenance(BaseModel):
    kpi_id:      str                    # e.g. "poblacion_total", "tipo_cambio"
    kpi_label:   str                    # e.g. "Población total ZM"
    valor:       Optional[Any] = None   # El valor; None si no_disponible
    unidad:      str                    # e.g. "habitantes", "MXN/USD", "kg/hab/día"
    provenance:  DataProvenance


# ─── Advertencia para ÁGORA ───────────────────────────────────────────────────

class AdvertenciaKPI(BaseModel):
    kpi_id:      str
    kpi_label:   str
    tipo:        FuenteTipo
    advertencia: str
    bloquea_agora: bool  # True solo para no_disponible en KPIs críticos


# ─── Snapshot de datos de una ZM ─────────────────────────────────────────────

class SnapshotDatos(BaseModel):
    """
    Colección de todos los KPIs con provenance para una ZM en un momento dado.
    Este es el objeto que el frontend consume para saber de dónde vino cada número.
    """
    zm:            str
    timestamp:     str                        # ISO datetime de cuando se generó
    kpis:          List[KPIConProvenance]
    advertencias:  List[AdvertenciaKPI]       # KPIs que necesitan atención
    score_datos:   int = Field(..., ge=0, le=100)  # Calidad general de los datos 0-100
    bloquea_agora: bool                       # True si algún KPI crítico es no_disponible

    @property
    def kpi_map(self) -> Dict[str, KPIConProvenance]:
        return {k.kpi_id: k for k in self.kpis}


# ─── Estado de un adapter/fuente ─────────────────────────────────────────────

class FuenteStatus(BaseModel):
    """Vista compacta del estado de una fuente de datos — para /data/fuentes."""
    id:              str
    nombre:          str
    organismo:       str
    endpoint:        Optional[str] = None
    tipo_maximo:     FuenteTipo    # El mejor tier que puede proporcionar
    disponible:      bool          # False si requiere key no configurada o API caída
    requiere_clave:  bool
    kpis_cubiertos:  List[str]     # kpi_ids que esta fuente puede proveer
    advertencia:     Optional[str] = None
