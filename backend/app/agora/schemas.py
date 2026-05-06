"""Esquemas Pydantic para el pipeline ÁGORA «Genera mi plan» (Q-023)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    municipio: str = Field(..., min_length=2, max_length=200, description="Nombre del municipio o ZM de referencia")
    estado: str = Field(..., min_length=2, max_length=100)
    poblacion: int = Field(..., ge=1, le=50_000_000)
    generacion_rsu_dia: float = Field(..., ge=0, description="Generación modelada de RSU, toneladas por día")
    ingreso_estimado_anual_mxn: float = Field(..., ge=0, description="Ingresos anuales estimados del modelo, MXN")
    escenario: Literal["conservador", "moderado", "acelerado"]
    sector_pack_id: str = Field(default="politica_publica_rsu_mx_v1", min_length=4, max_length=120)


class PlanResponse(BaseModel):
    """
    Metadatos de referencia cuando se documenta el contrato.
    El POST /generate-plan devuelve cuerpo binario ZIP (StreamingResponse), no este JSON.
    """

    filename_pattern: str = "alquimia_plan_{municipio_slug}_{fecha}.zip"
    contenido_tipo: Literal["application/zip"] = "application/zip"
    num_documentos_markdown: Literal[7] = 7
