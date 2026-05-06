"""Contratos nacionales y de cobertura municipal."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator


class CoverageStage(str, Enum):
    no_iniciado = "no_iniciado"
    datos_basicos = "datos_basicos"
    datos_certificados = "datos_certificados"
    legal_localizado = "legal_localizado"
    legal_verificado = "legal_verificado"
    contrato_identificado = "contrato_identificado"
    operacion_modelada = "operacion_modelada"
    documentos_borrador = "documentos_borrador"
    documentos_defendibles = "documentos_defendibles"
    implementacion_activa = "implementacion_activa"


class SourceStatus(str, Enum):
    no_disponible = "no_disponible"
    estimado = "estimado"
    localizado = "localizado"
    verificado = "verificado"
    bloqueado = "bloqueado"


class EstadoCatalog(BaseModel):
    estado_id: str
    nombre: str
    abreviatura: str
    region: str


class ZonaMetropolitanaCatalog(BaseModel):
    zm_id: str
    nombre: str
    estado_principal: str
    municipios: List[str]
    fuente: str
    status: SourceStatus


class MunicipioProfile(BaseModel):
    municipio_id: str
    clave_inegi: str
    nombre: str
    estado: str
    zm_id: str
    poblacion: Optional[int] = None
    viviendas: Optional[int] = None
    rsu_ton_dia: Optional[float] = None
    gen_per_capita: Optional[float] = Field(
        default=None,
        description="kg RSU por persona-día (aprox.)",
    )
    presupuesto_mxn: Optional[float] = None
    dependencia_responsable: Optional[str] = None
    concesion_status: SourceStatus = SourceStatus.no_disponible
    coverage_status: CoverageStage = CoverageStage.no_iniciado
    data_provenance: Dict[str, Any] = Field(default_factory=dict)
    lat: Optional[float] = Field(default=None, description="Centroide aproximado WGS84 para visualización")
    lng: Optional[float] = Field(default=None, description="Centroide aproximado WGS84 para visualización")
    co2e_disposal_ton_dia: Optional[float] = Field(
        default=None,
        description="Orden de magnitud t CO2e/día asociado a gestión/disposición del volumen RSU estimado",
    )


class RsuFootprintMapFeature(BaseModel):
    """Punto para mapa RSU — catálogo piloto ALQUIMIA (ampliable a México completo)."""

    municipio_id: str
    nombre: str
    estado: str
    zm_id: str
    poblacion: int
    gen_per_capita_kg_dia: float
    rsu_ton_dia: float
    co2e_disposal_ton_dia: float
    lat: float
    lng: float


class RsuFootprintMapResponse(BaseModel):
    catalog_simulation_epoch: str
    feature_count: int
    features: List[RsuFootprintMapFeature]
    methodology_summary: str
    disclaimer: str


class LegalSource(BaseModel):
    legal_source_id: str
    municipio_id: str
    titulo: str
    tipo: str
    fuente: str
    url: Optional[str] = None
    fecha_publicacion: str
    fecha_verificacion: Optional[str] = None
    version: str
    checksum: str
    status: SourceStatus
    articulos_indexados: int = Field(ge=0)

    @model_validator(mode="after")
    def _require_traceability(self):
        missing = [
            name for name in ("fuente", "fecha_publicacion", "version", "checksum")
            if not getattr(self, name)
        ]
        if missing:
            raise ValueError(f"LegalSource sin trazabilidad completa: {', '.join(missing)}")
        if self.status == SourceStatus.verificado and not self.fecha_verificacion:
            raise ValueError("LegalSource verificado requiere fecha_verificacion")
        return self


class LegalArticle(BaseModel):
    article_id: str
    legal_source_id: str
    numero: str
    texto: str
    temas: List[str] = Field(default_factory=list)
    obligaciones: List[str] = Field(default_factory=list)
    sanciones: List[str] = Field(default_factory=list)
    habilita_separacion: bool = False
    habilita_centros_acopio: bool = False
    habilita_macrogeneradores: bool = False
    habilita_multas: bool = False


class ContractSource(BaseModel):
    contract_id: str
    municipio_id: str
    tipo: str
    contraparte: Optional[str] = None
    vigencia_inicio: Optional[str] = None
    vigencia_fin: Optional[str] = None
    alcance: str
    fuente: str
    status: SourceStatus
    restricciones: List[str] = Field(default_factory=list)


class CoverageStatus(BaseModel):
    municipio_id: str
    demografia: SourceStatus
    rsu: SourceStatus
    legal: SourceStatus
    contrato: SourceStatus
    presupuesto: SourceStatus
    operacion: SourceStatus
    documentos: SourceStatus
    bloqueos: List[str] = Field(default_factory=list)
    siguiente_accion: str
    coverage_status: CoverageStage
    agora_bloqueado: bool

