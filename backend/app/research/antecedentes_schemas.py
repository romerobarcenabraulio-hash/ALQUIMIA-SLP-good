"""Schemas — reportaje de antecedentes municipales (M01A)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


AntecedenteTipo = Literal[
    "concesion",
    "programa",
    "infraestructura",
    "norma",
    "conflicto",
    "campaña",
    "operador",
    "contexto",
    "indicador",
]


class AntecedenteFuente(BaseModel):
    url: str
    titulo: Optional[str] = None
    tier: Literal["T1", "T2", "T3", "T4"] = "T3"
    confianza: float = Field(ge=0.0, le=1.0, default=0.5)


class AntecedenteEvento(BaseModel):
    evento_id: str
    anio: Optional[int] = None
    tipo: AntecedenteTipo
    titulo: str
    resumen: str
    fuentes: List[AntecedenteFuente] = Field(default_factory=list)
    confianza: float = Field(ge=0.0, le=1.0, default=0.5)
    operador: Optional[str] = None
    verificar: bool = False


class AntecedentesReportaje(BaseModel):
    municipio_id: str
    zm_id: str
    municipio_nombre: str
    estado: str = ""
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sintesis: str = ""
    eventos: List[AntecedenteEvento] = Field(default_factory=list)
    vacios_documentales: List[str] = Field(default_factory=list)
    lecciones: List[str] = Field(default_factory=list)
    score_completitud: float = Field(ge=0.0, le=1.0, default=0.0)
    advertencias: List[str] = Field(default_factory=list)
    fuente_serper: bool = False
    queries_ejecutadas: int = 0
