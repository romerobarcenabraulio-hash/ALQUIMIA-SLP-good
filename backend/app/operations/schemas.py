"""Contratos operativos de campo."""
from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


class OperationStatus(str, Enum):
    activo = "activo"
    programado = "programado"
    completado = "completado"
    cancelado = "cancelado"
    bloqueado = "bloqueado"


class EvidenceType(str, Enum):
    foto = "foto"
    video = "video"
    firma = "firma"
    lectura_bascula = "lectura_bascula"
    acta = "acta"
    gps = "gps"


class DueProcessStatus(str, Enum):
    advertencia_no_sancionatoria = "advertencia_no_sancionatoria"
    notificacion = "notificacion"
    en_aclaracion = "en_aclaracion"
    sancion_propuesta = "sancion_propuesta"
    sancion_firme = "sancion_firme"
    cancelada = "cancelada"
    pagada = "pagada"


class RoutePlan(BaseModel):
    route_id: str = Field(default_factory=lambda: f"route-{uuid4()}")
    zm: str
    municipio_id: str
    nombre: str
    colonias: List[str]
    frecuencia: str
    materiales: List[str]
    camion_tipo: str
    capacidad_ton: float = Field(gt=0)
    operador_responsable: str
    status: OperationStatus = OperationStatus.activo


class CollectorShift(BaseModel):
    shift_id: str = Field(default_factory=lambda: f"shift-{uuid4()}")
    route_id: str
    fecha: str
    hora_inicio: str
    hora_fin: Optional[str] = None
    recolector_id: str
    vehiculo_id: str
    status: OperationStatus = OperationStatus.programado


class EvidenceAsset(BaseModel):
    evidence_id: str = Field(default_factory=lambda: f"evidence-{uuid4()}")
    tipo: EvidenceType
    path_or_url: str
    checksum: str
    timestamp: str
    captured_by: str
    chain_of_custody: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _evidence_traceable(self):
        if not self.path_or_url or not self.checksum or not self.timestamp or not self.captured_by:
            raise ValueError("EvidenceAsset requiere path/url, checksum, timestamp y captured_by")
        return self


class PickupEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"pickup-{uuid4()}")
    shift_id: str
    municipio_id: str
    ubicacion: str
    generador_id: str
    material: str
    peso_estimado_kg: float = Field(ge=0)
    pureza_pct: float = Field(ge=0, le=100)
    contaminacion_pct: float = Field(ge=0, le=100)
    evidencia_ids: List[str] = Field(default_factory=list)
    timestamp: str
    source: str


class InspectionRecord(BaseModel):
    inspection_id: str = Field(default_factory=lambda: f"inspection-{uuid4()}")
    municipio_id: str
    generador_id: str
    inspector: str
    fecha: str
    hallazgos: List[str] = Field(default_factory=list)
    pureza_pct: float = Field(ge=0, le=100)
    evidencia_ids: List[str] = Field(default_factory=list)
    legal_source_id: Optional[str] = None
    status: OperationStatus = OperationStatus.completado


class ViolationRecord(BaseModel):
    violation_id: str = Field(default_factory=lambda: f"violation-{uuid4()}")
    inspection_id: str
    municipio_id: str
    legal_source_id: str
    article_id: str
    tipo_infraccion: str
    etapa: DueProcessStatus
    evidencia_ids: List[str] = Field(default_factory=list)
    monto_mxn: float = Field(ge=0)
    derecho_aclaracion: bool
    due_process_status: DueProcessStatus
    status: OperationStatus = OperationStatus.programado


class IncentiveRecord(BaseModel):
    incentive_id: str = Field(default_factory=lambda: f"incentive-{uuid4()}")
    municipio_id: str
    generador_id: str
    criterio: str
    beneficio: str
    evidencia_ids: List[str] = Field(default_factory=list)
    status: OperationStatus = OperationStatus.programado


class OperationsSummary(BaseModel):
    municipio_id: str
    total_pickups: int
    toneladas_recuperadas: float
    pureza_promedio_pct: float
    contaminacion_promedio_pct: float
    inspecciones: int
    violaciones_validas: int
    advertencias_educativas: int
    incentivos: int
    reincidencias: Dict[str, int] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)

