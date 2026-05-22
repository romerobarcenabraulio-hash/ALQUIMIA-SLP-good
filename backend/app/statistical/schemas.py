from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class PertTaskInput(BaseModel):
    id: str
    nombre: str = ""
    optimista_dias: float = Field(gt=0)
    probable_dias: float = Field(gt=0)
    pesimista_dias: float = Field(gt=0)


class PertTaskResult(BaseModel):
    id: str
    nombre: str
    esperado_dias: float
    varianza: float
    desviacion: float
    ic90_bajo: float
    ic90_alto: float
    es_critica: bool = False


class PertAnalysisRequest(BaseModel):
    tareas: List[PertTaskInput]
    tareas_criticas_ids: Optional[List[str]] = None


class PertAnalysisResponse(BaseModel):
    tareas: List[PertTaskResult]
    duracion_proyecto_esperada: float
    varianza_proyecto: float
    ic90_proyecto_bajo: float
    ic90_proyecto_alto: float
    metodologia: str = "beta-PERT (PMBOK)"


class MaterialDistribInput(BaseModel):
    material: str
    media_mxn_kg: float = Field(gt=0)
    sigma_log: float = Field(default=0.25, gt=0)


class MonteCarloRequest(BaseModel):
    iteraciones: int = Field(default=5000, ge=500, le=20000)
    captura_media: float = Field(default=0.10, ge=0.01, le=0.5)
    captura_sigma_beta: float = Field(default=2.0, gt=0)
    materiales: List[MaterialDistribInput] = Field(default_factory=list)
    toneladas_anuales_base: float = Field(default=100_000, gt=0)
    composicion: Optional[Dict[str, float]] = None
    usar_price_series_db: bool = True
    zm_id: Optional[str] = None
    municipio_id: Optional[str] = None


class MonteCarloPercentiles(BaseModel):
    p10: float
    p50: float
    p90: float
    media: float


class MonteCarloResponse(BaseModel):
    iteraciones: int
    ingreso_anual_mxn: MonteCarloPercentiles
    advertencias: List[str] = Field(default_factory=list)
    fuente_precios: str = "request"
    metodologia: str = "log-normal precios · beta captura"
