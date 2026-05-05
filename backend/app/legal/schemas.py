"""
Motor Jurídico Municipal — Schemas Pydantic.

Cubre el ciclo completo:
  Reglamento → Diagnóstico → Estrategia de reforma → Gate ÁGORA
"""
from __future__ import annotations

from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ─── Enumeraciones ────────────────────────────────────────────────────────────

class CategoriaArticulo(str, Enum):
    separacion_origen        = "separacion_origen"
    recoleccion_diferenciada = "recoleccion_diferenciada"
    disposicion_final        = "disposicion_final"
    pepenadores              = "pepenadores"
    financiamiento           = "financiamiento"
    sanciones                = "sanciones"
    participacion            = "participacion"
    transparencia            = "transparencia"
    convenios                = "convenios"


class EstadoArticulo(str, Enum):
    presente_adecuado = "presente_adecuado"   # ✅ cumple
    presente_obsoleto = "presente_obsoleto"   # ⚠️  existe pero desactualizado
    ausente           = "ausente"             # ❌  no existe
    conflicto         = "conflicto"           # 🔴  choca con otra norma


class Criticidad(str, Enum):
    alta   = "alta"
    media  = "media"
    baja   = "baja"


class ReformEstrategia(str, Enum):
    A = "A"   # Reforma puntual   — ≤ 2 artículos ausentes,  plazo  3 meses
    B = "B"   # Reforma integral  — 3-7 artículos ausentes,  plazo  6 meses
    C = "C"   # Nuevo reglamento  — ≥ 8 ausentes / obsoleto, plazo 12 meses
    D = "D"   # Decreto urgencia  — brecha crítica sin verificar, plazo 1 mes


class LegalSourceIngestStatus(str, Enum):
    no_disponible = "no_disponible"
    localizado = "localizado"
    descargado = "descargado"


class LegalSourceValidationStatus(str, Enum):
    no_disponible = "no_disponible"
    pendiente_validacion_juridica = "pendiente_validacion_juridica"
    validado_externamente = "validado_externamente"


class LegalOfficiality(str, Enum):
    fuente_localizada_no_validada = "fuente_localizada_no_validada"
    documento_descargado_no_validado = "documento_descargado_no_validado"
    validado_por_autoridad_competente = "validado_por_autoridad_competente"


class RegulatoryNodeType(str, Enum):
    reglamento = "reglamento"
    titulo = "titulo"
    capitulo = "capitulo"
    seccion = "seccion"
    articulo = "articulo"
    fraccion = "fraccion"
    inciso = "inciso"
    parrafo = "parrafo"
    transitorio = "transitorio"
    anexo_tecnico = "anexo_tecnico"
    lineamiento_tecnico = "lineamiento_tecnico"


class NormativeTechnique(str, Enum):
    reformar = "reformar"
    adicionar = "adicionar"
    derogar = "derogar"
    abrogar = "abrogar"
    transitorio = "transitorio"
    lineamiento_tecnico = "lineamiento_tecnico"
    anexo_tecnico = "anexo_tecnico"


class NormativeProposalStatus(str, Enum):
    propuesta_expositiva = "propuesta_expositiva"
    bloqueada_por_fuente = "bloqueada_por_fuente"
    pendiente_validacion_juridica = "pendiente_validacion_juridica"


# ─── Entidades ───────────────────────────────────────────────────────────────

class ArticuloMatriz(BaseModel):
    """Fila de la matriz de artículos de un reglamento."""
    numero:          str
    titulo:          str
    categoria:       CategoriaArticulo
    estado:          EstadoArticulo
    criticidad:      Criticidad
    texto_actual:    Optional[str] = None
    texto_propuesto: Optional[str] = None  # sugerido por ÁGORA-Arquitecto


class Reglamento(BaseModel):
    """Metadatos + provenance del reglamento de limpia de un municipio."""
    municipio_id:               str
    zm:                         str
    nombre:                     str
    version:                    str
    fecha_publicacion:          str         # ISO date string
    fuente:                     str         # "POE" | "DOF" | "Municipal" | "No disponible"
    url:                        Optional[str] = None
    verificado:                 bool = False
    requiere_revision_juridica: bool = True  # bloqueante hasta fuente confirmada


class MunicipalLegalSourceManifest(BaseModel):
    """
    Manifest de ingesta/localización legal por municipio.

    Una URL localizada o un archivo descargado NO equivalen a reglamento vigente,
    dictamen ni documento oficial validado. La validación competente se modela
    por separado en validation_status.
    """
    source_id: str
    municipio_id: str
    zm: str
    title: str
    official_url: Optional[str] = None
    download_url: Optional[str] = None
    retrieved_at: str
    ingest_status: LegalSourceIngestStatus
    validation_status: LegalSourceValidationStatus
    officiality: LegalOfficiality
    status_http: Optional[int] = None
    content_type: Optional[str] = None
    checksum_sha256: Optional[str] = None
    bytes_size: Optional[int] = Field(default=None, ge=0)
    source_kind: str = "reglamento_municipal"
    source_authority: str
    can_enable_education: bool = True
    can_enable_simulation: bool = True
    can_enable_sanctions: bool = False
    can_generate_official_document: bool = False
    warnings: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)
    next_action: str


class RegulatoryStructureNode(BaseModel):
    """Nodo normalizado de técnica reglamentaria municipal."""
    node_id: str
    node_type: RegulatoryNodeType
    label: str
    number: Optional[str] = None
    title: Optional[str] = None
    text_excerpt: Optional[str] = None
    children: List["RegulatoryStructureNode"] = Field(default_factory=list)


class LegalValidationGate(BaseModel):
    """
    Compuerta jurídica para propuestas expositivas.

    La salida puede orientar educación, simulación y preparación técnica, pero
    no habilita sanciones ni documentos definitivos sin validación competente.
    """
    validation_status: LegalSourceValidationStatus
    requires_jurist_review: bool = True
    blocks_sanctions: bool = True
    blocks_definitive_document: bool = True
    can_continue_education: bool = True
    can_continue_simulation: bool = True
    blockers: List[str] = Field(default_factory=list)
    next_action: str
    disclaimer: str


class NormativeInsertionProposal(BaseModel):
    """Propuesta expositiva de inserción/reforma por municipio."""
    proposal_id: str
    municipio_id: str
    reglamento_titulo: str
    source_manifest: MunicipalLegalSourceManifest
    validation_status: LegalSourceValidationStatus
    proposal_status: NormativeProposalStatus = NormativeProposalStatus.propuesta_expositiva
    categoria_reforma: str
    ubicacion_probable: str
    articulo_o_seccion_relacionada: str
    tecnica_sugerida: NormativeTechnique
    numeracion_sugerida: str
    texto_base_sugerido: str
    justificacion: str
    riesgos_armonizacion: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0, le=1)
    requiere_validacion_juridica: bool = True
    is_definitive: bool = False
    is_permanent_obligation: bool = True
    does_not_replace_regulatory_reform: bool = False
    residuos_scope: str = "rsu_municipal"
    legal_validation_gate: LegalValidationGate


class MunicipalLegalInsertionMap(BaseModel):
    """Mapa municipal de estructura e inserciones normativas propuestas."""
    municipio_id: str
    municipio_nombre: str
    zm: str
    legal_scope: str = "municipio"
    jurisdiction_scope: Literal["Municipality"] = "Municipality"
    reglamento_titulo: str
    source_manifest: MunicipalLegalSourceManifest
    validation_status: LegalSourceValidationStatus
    regulatory_structure: RegulatoryStructureNode
    proposals: List[NormativeInsertionProposal]
    validation_gate: LegalValidationGate
    warnings: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)
    next_action: str


class LegalSourceIngestRequest(BaseModel):
    official_url: Optional[str] = None
    download_url: Optional[str] = None
    title: Optional[str] = None
    status_http: Optional[int] = None
    content_type: Optional[str] = None
    content_base64: Optional[str] = None
    source_authority: Optional[str] = None


class LegalVerificarRequest(BaseModel):
    """Cuerpo opcional para trazabilidad humana al marcar verificado (no reemplaza auditoría en BD)."""

    justification: Optional[str] = Field(
        default=None,
        description="Resumen de decisión de jurídico interno o autoridad competente",
    )
    evidence_ref: Optional[str] = Field(
        default=None,
        description="Enlace, folio expediente o evidencia documental asociada",
    )


class LegalDiagnostic(BaseModel):
    """Output completo del diagnóstico jurídico para un municipio."""
    municipio_id:               str
    zm:                         str
    reglamento_nombre:          str
    reglamento_version:         str
    reglamento_fuente:          str
    fecha_diagnostico:          str
    articulos:                  List[ArticuloMatriz]

    # ── Métricas derivadas ──────────────────────────────────────────────────
    brecha_total:               int   # artículos ausentes + en conflicto
    brecha_critica:             int   # brecha_total con criticidad=alta
    tiene_separacion_origen:    bool
    tiene_tarifa_diferenciada:  bool
    tiene_figura_reciclador:    bool
    tiene_sancion_ejecutable:   bool
    score_legal:                int = Field(..., ge=0, le=100)

    # ── Gate ────────────────────────────────────────────────────────────────
    requiere_revision_juridica: bool
    agora_bloqueado:            bool  # True ↔ reglamento no verificado
    legal_scope:                str = "municipio"
    jurisdiction_scope: Literal["Municipality"] = "Municipality"
    source_manifest:            MunicipalLegalSourceManifest
    legal_validation_status:    LegalSourceValidationStatus
    officiality:                LegalOfficiality
    can_enable_education:       bool = True
    can_enable_simulation:      bool = True
    can_enable_sanctions:       bool = False
    can_generate_official_document: bool = False
    sanctions_blocked_reason:   Optional[str] = None
    official_document_blocked_reason: Optional[str] = None
    next_action:                str
    legal_disclaimer:           str
    residuos_scope:             str = "rsu_municipal"


class ReformStrategyOutput(BaseModel):
    """Estrategia de reforma recomendada para el municipio."""
    estrategia:       ReformEstrategia
    nombre:           str
    descripcion:      str
    plazo_meses:      int
    articulos_clave:  List[str]   # números de artículos prioritarios
    agora_bloqueado:  bool
    motivo_bloqueo:   Optional[str] = None


class MunicipalLegalContext(BaseModel):
    """
    Contexto legal municipal endurecido para Fase 11.1.

    Es municipal por diseño. La ZM puede coordinar, pero no sustituye
    reglamento, fuente, validación ni desbloqueos del municipio.
    """
    municipio_id: str
    municipio_nombre: str
    zm: str
    legal_scope: str = "municipio"
    jurisdiction_scope: Literal["Municipality"] = "Municipality"
    diagnostic: LegalDiagnostic
    strategy: ReformStrategyOutput
    source_manifest: MunicipalLegalSourceManifest
    obligaciones: List[str]
    limites: List[str]
    bloqueos: List[str]
    next_action: str
    can_enable_education: bool
    can_enable_simulation: bool
    can_enable_sanctions: bool
    can_generate_official_document: bool
    legal_disclaimer: str


class LegalStatusHub(BaseModel):
    """Vista compacta para el Hub — un renglón por municipio."""
    municipio_id:     str
    municipio_nombre: str
    zm:               str
    jurisdiction_scope: Literal["Municipality"] = "Municipality"
    score_legal:      int
    estrategia:       ReformEstrategia
    plazo_meses:      int
    agora_bloqueado:  bool
    brecha_critica:   int
    verificado:       bool


# ─── Capa metropolitana ───────────────────────────────────────────────────────

class OleadaImplementacion(BaseModel):
    """Municipios que deben moverse en cada oleada."""
    numero:          int
    nombre:          str
    municipios:      List[str]        # municipio_ids
    descripcion:     str
    mes_inicio:      int
    mes_fin:         int


class CoordinacionMetropolitana(BaseModel):
    """
    Capa de coordinación ZM — separada del paquete municipal.

    Cubre: convenio marco, homologación mínima de fracciones,
    estándar de datos, interoperabilidad de rutas,
    infraestructura compartida y estrategia de oleadas.

    NO mezclar con reglamento municipal, adenda contractual
    ni lineamientos técnicos.
    """
    zm:                        str
    convenio_marco_zm:         str   # "firmado" | "borrador" | "pendiente" | "no_existe"
    homologacion_fracciones:   str   # descripción del estándar mínimo acordado
    estandar_datos:            str   # plataforma / formato de intercambio
    interoperabilidad_rutas:   str   # estado de coordinación operativa
    infraestructura_compartida: str  # relleno, transbordo, etc.
    municipios_lider:          List[str]   # municipio_ids que deben actuar primero
    municipios_bloqueados:     List[str]   # municipio_ids con gate activo
    oleadas:                   List[OleadaImplementacion]
    nota:                      str


class DiagnosticoMunicipal(BaseModel):
    """
    Diagnóstico + estrategia para un municipio individual dentro de una ZM.
    Es el átomo del paquete metropolitan.
    """
    municipio_id:     str
    municipio_nombre: str
    zm:               str
    diagnostic:       LegalDiagnostic
    strategy:         ReformStrategyOutput


class PaqueteMetropolitano(BaseModel):
    """
    Salida de dos capas del Motor Jurídico para una ZM completa.

    Capa 1 — paquete_municipal:
      Diagnóstico normativo, matriz de brechas y estrategia de reforma
      para CADA municipio activo. Cada municipio tiene autoridad jurídica,
      presupuestal y contractual independiente.

    Capa 2 — paquete_metropolitano:
      Coordinación regional: convenio marco, homologación mínima,
      estándar de datos, interoperabilidad de rutas, infraestructura
      compartida y estrategia de oleadas.

    IMPORTANTE: No mezclar convenio metropolitano con reglamento municipal.
    """
    zm:                     str
    total_municipios:       int
    municipios_bloqueados:  int   # cuántos tienen agora_bloqueado
    score_legal_zm:         int   # promedio ponderado por población
    paquete_municipal:      List[DiagnosticoMunicipal]
    paquete_metropolitano:  CoordinacionMetropolitana
