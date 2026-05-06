"""Modelos PyDantic para registro predial e inspecciones municipales."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field
from typing import Literal


class TipoInfraccionPredia(str, Enum):
    basura_clandestina = "basura_clandestina"
    ca_sin_permiso = "ca_sin_permiso"
    mezcla_residuos_no_autorizada = "mezcla_residuos_no_autorizada"
    vertedero_no_autorizado = "vertedero_no_autorizado"
    otro = "otro"


class NivelSancion(str, Enum):
    aviso = "aviso"
    advertencia = "advertencia"
    multa_menor = "multa_menor"
    multa_media = "multa_media"
    multa_maxima = "multa_maxima"
    clausura = "clausura"


class EscaleraSancion(BaseModel):
    municipio_id: str
    articulo_reglamento: str
    descripcion_infraccion: TipoInfraccionPredia
    nivel: NivelSancion
    uma_minimo: float
    uma_maximo: float
    genera_clausura: bool
    fuente_reglamento: str
    verificado_clc: bool


class CatalogoEscalerasSlpResponse(BaseModel):
    """Valor UMA único servido al cliente; mismo número que `escalera_slp.VALOR_UMA_2026`."""

    valor_uma_referencia_mxn: float
    escaleras: list[EscaleraSancion]


class PredioRegistroCreate(BaseModel):
    municipio_id: str = Field(..., min_length=1)
    direccion_texto: str = Field(..., min_length=1)
    lat: float | None = None
    lon: float | None = None
    uso_suelo_declarado: str | None = None
    area_m2: float | None = None
    notas: str | None = None


class PredioRegistro(BaseModel):
    predio_id: str
    municipio_id: str
    direccion_texto: str
    lat: float | None = None
    lon: float | None = None
    uso_suelo_declarado: str | None = None
    area_m2: float | None = None
    notas: str | None = None


class InspeccionPrediaCreate(BaseModel):
    fecha_inspeccion: str = Field(..., min_length=1)
    tipo_infraccion: TipoInfraccionPredia
    descripcion_hallazgo: str = Field(..., min_length=1)
    tiene_permiso_ca: bool
    permiso_ca_vigente: bool | None = None
    inspector_nombre: str | None = None
    inspector_cargo: str | None = None


class InspeccionPredia(BaseModel):
    inspeccion_id: str
    predio_id: str
    fecha_inspeccion: str
    tipo_infraccion: TipoInfraccionPredia
    descripcion_hallazgo: str
    tiene_permiso_ca: bool
    permiso_ca_vigente: bool | None = None
    inspector_nombre: str | None = None
    inspector_cargo: str | None = None
    municipio_id: str
    status: Literal["borrador", "notificado", "en_proceso", "resuelto"]


class ExpedienteSancionCreate(BaseModel):
    inspeccion_id: str = Field(..., min_length=1)
    nivel_sancion_sugerido: NivelSancion | None = None


class ExpedienteSancion(BaseModel):
    expediente_id: str
    inspeccion_id: str
    predio_id: str
    municipio_id: str
    fecha_generacion: str
    tipo_infraccion: TipoInfraccionPredia
    articulo_reglamento: str
    nivel_sancion: NivelSancion
    uma_aplicado: float
    valor_uma_mxn: float
    monto_min_mxn: float
    monto_max_mxn: float
    genera_clausura: bool
    reglamento_verificado_clc: bool
    disclaimer: str
