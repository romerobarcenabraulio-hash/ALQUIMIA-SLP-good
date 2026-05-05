"""Contratos de Fase 6: macrogeneradores y resumen de impacto."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator, model_validator


MaterialVolumes = Dict[str, float]


class MacroTipo(str, Enum):
    hotel = "hotel"
    estadio = "estadio"
    club_deportivo = "club_deportivo"
    plaza_comercial = "plaza_comercial"
    mercado_publico = "mercado_publico"
    hospital = "hospital"
    universidad = "universidad"
    parque_industrial = "parque_industrial"
    edificio_oficinas = "edificio_oficinas"
    evento_masivo = "evento_masivo"


class FuenteTipoMacro(str, Enum):
    oficial = "oficial"
    directorio_publico = "directorio_publico"
    dato_reportado = "dato_reportado"
    manual_usuario = "manual_usuario"
    benchmark_sectorial = "benchmark_sectorial"
    estimado_modelo = "estimado_modelo"
    fallback = "fallback"


class MacroStatus(str, Enum):
    verificado = "verificado"
    estimado = "estimado"
    manual = "manual"
    pendiente_verificacion = "pendiente_verificacion"
    inactivo = "inactivo"
    bloqueado = "bloqueado"


class RiesgoOperativo(str, Enum):
    bajo = "bajo"
    medio = "medio"
    alto = "alto"
    critico = "critico"


class VariablesEspecificasTipo(BaseModel):
    """Variables requeridas segun el tipo de generador."""

    datos: Dict[str, Any]
    tipo_referencia: str
    variables_faltantes: List[str] = Field(default_factory=list)


class CalculoVolumenMacro(BaseModel):
    formula: str
    fuente_factor: str
    unidad: str
    periodicidad: str
    razon: str
    incertidumbre_rango: Tuple[float, float]
    es_temporal: bool


class MacroGenerator(BaseModel):
    generator_id: str
    nombre: str
    tipo: MacroTipo
    zm: str
    municipio: Optional[str] = None
    ubicacion: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    actividad_base: Optional[float] = None
    unidad_actividad: Optional[str] = None
    generacion_estimada_ton_dia: float = Field(ge=0)
    composicion: MaterialVolumes
    estacionalidad_mensual: List[float] = Field(default_factory=lambda: [1.0] * 12)
    dias_operacion_anio: int = Field(default=365, ge=0, le=366)
    separacion_actual_pct: float = Field(default=0, ge=0, le=100)
    separacion_potencial_pct: float = Field(default=60, ge=0, le=100)
    pureza_estimada_pct: float = Field(default=80, ge=0, le=100)
    fuente: str
    fuente_tipo: FuenteTipoMacro
    confianza: float = Field(ge=0, le=1)
    status: MacroStatus
    last_verified_at: Optional[str] = None
    variables_tipo: Optional[VariablesEspecificasTipo] = None
    calculo_volumen: Optional[CalculoVolumenMacro] = None
    residuos_regulados_detectados: List[str] = Field(default_factory=list)
    advertencia_residuos_regulados: str = ""
    excluir_del_conteo_domiciliario: bool = True
    es_temporal: bool = False

    @field_validator("zm")
    @classmethod
    def _normalize_zm(cls, value: str) -> str:
        return value.upper().strip()

    @field_validator("municipio")
    @classmethod
    def _normalize_municipio(cls, value: Optional[str]) -> Optional[str]:
        return value.lower().strip() if value else value

    @field_validator("estacionalidad_mensual")
    @classmethod
    def _validate_estacionalidad(cls, values: List[float]) -> List[float]:
        if len(values) != 12:
            raise ValueError("estacionalidad_mensual debe tener 12 valores")
        if any(v < 0 for v in values):
            raise ValueError("estacionalidad_mensual no puede contener valores negativos")
        return values

    @model_validator(mode="after")
    def _validate_operational_honesty(self):
        if not self.composicion:
            raise ValueError("composicion no puede estar vacia")
        if any(v < 0 for v in self.composicion.values()):
            raise ValueError("composicion no puede contener porcentajes negativos")
        total = sum(self.composicion.values())
        if total <= 0:
            raise ValueError("composicion debe sumar mas que cero")
        if abs(total - 1.0) > 0.03:
            raise ValueError("composicion debe sumar aproximadamente 1.0")

        if self.status == MacroStatus.verificado:
            if self.fuente_tipo not in (
                FuenteTipoMacro.oficial,
                FuenteTipoMacro.directorio_publico,
                FuenteTipoMacro.dato_reportado,
            ):
                raise ValueError("un macrogenerador verificado requiere fuente oficial/publica/reportada")
            if self.confianza < 0.8:
                raise ValueError("un macrogenerador verificado requiere confianza >= 0.8")

        if self.fuente_tipo == FuenteTipoMacro.manual_usuario and self.confianza > 0.6:
            raise ValueError("una fuente manual no puede tener confianza mayor a 0.6")
        if self.fuente_tipo == FuenteTipoMacro.benchmark_sectorial and self.confianza > 0.65:
            raise ValueError("un benchmark sectorial no puede tener confianza mayor a 0.65")
        return self

    def activo_para_calculo(self) -> bool:
        return self.status not in (MacroStatus.inactivo, MacroStatus.bloqueado)

    def tiene_ubicacion(self) -> bool:
        return self.lat is not None and self.lon is not None


class MacroGeneratorPlan(BaseModel):
    generator_id: str
    acciones: List[str] = Field(default_factory=list)
    contenedores: Dict[str, int] = Field(default_factory=dict)
    frecuencia_recoleccion: str
    ventana_horaria: str
    ruta_sugerida: Optional[str] = None
    volumen_recuperable_ton_anio: float
    costo_logistico_mxn_anio: float
    ingreso_estimado_mxn_anio: float
    riesgo_operativo: RiesgoOperativo
    convenio_requerido: bool
    advertencias: List[str] = Field(default_factory=list)


class MacroImpactSummary(BaseModel):
    zm: str
    municipios: List[str] = Field(default_factory=list)
    generators_count: int
    total_ton_dia: float
    total_ton_anio: float
    volumen_por_material: MaterialVolumes
    impacto_camiones: Dict[str, Any] = Field(default_factory=dict)
    impacto_cas: Dict[str, Any] = Field(default_factory=dict)
    impacto_market: Optional[Dict[str, Any]] = None
    ingreso_incremental_mxn: float
    costo_incremental_mxn: float
    co2e_incremental_ton: float
    warnings: List[str] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    plans: List[MacroGeneratorPlan] = Field(default_factory=list)
    generators: List[MacroGenerator] = Field(default_factory=list)


class MacroImpactRequest(BaseModel):
    zm: str
    municipios: List[str] = Field(default_factory=list)
    generators: Optional[List[MacroGenerator]] = None
    include_registry: bool = True


class MacroGeneratorUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[MacroTipo] = None
    zm: Optional[str] = None
    municipio: Optional[str] = None
    ubicacion: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    actividad_base: Optional[float] = None
    unidad_actividad: Optional[str] = None
    generacion_estimada_ton_dia: Optional[float] = Field(default=None, ge=0)
    composicion: Optional[MaterialVolumes] = None
    estacionalidad_mensual: Optional[List[float]] = None
    dias_operacion_anio: Optional[int] = Field(default=None, ge=0, le=366)
    separacion_actual_pct: Optional[float] = Field(default=None, ge=0, le=100)
    separacion_potencial_pct: Optional[float] = Field(default=None, ge=0, le=100)
    pureza_estimada_pct: Optional[float] = Field(default=None, ge=0, le=100)
    fuente: Optional[str] = None
    fuente_tipo: Optional[FuenteTipoMacro] = None
    confianza: Optional[float] = Field(default=None, ge=0, le=1)
    status: Optional[MacroStatus] = None
    last_verified_at: Optional[str] = None
    variables_tipo: Optional[VariablesEspecificasTipo] = None
    calculo_volumen: Optional[CalculoVolumenMacro] = None
    residuos_regulados_detectados: Optional[List[str]] = None
    advertencia_residuos_regulados: Optional[str] = None
    excluir_del_conteo_domiciliario: Optional[bool] = None
    es_temporal: Optional[bool] = None
