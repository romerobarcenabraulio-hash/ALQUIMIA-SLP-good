"""
Fase 3 — ÁGORA Document Intelligence: contratos de datos.

Orden de definición (sin forward refs):
  Enums (incluye DocumentStatusLevel)
  EvidenceItem
  ClaimEntry + ClaimLedger
  InterpretationMemo
  RACIEntry + LogisticsBlueprint
  ChangeLogEntry + ApprovalMatrix
  CompliancePack
  ValidationIssue + ValidationReport   ← movido antes de DraftDocument
  EvidencePack                          ← nuevo
  DraftTable / DraftFigure / DraftAnnex ← nuevos
  DocumentSpec
  ScenarioBundle
  DocumentPlan
  DraftSection (usa DraftTable/DraftFigure)
  DraftDocument (usa ValidationReport, DocumentStatusLevel — ya definidos)
  DraftBundle
  ExportedFile + ExportManifest
  ExportedDocument + ExportBundle       ← nuevos
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
import uuid


# ─── Enums ───────────────────────────────────────────────────────────────────

class DocumentNivel(str, Enum):
    municipal     = "municipal"
    metropolitano = "metropolitano"
    tecnico       = "tecnico"
    ejecutivo     = "ejecutivo"
    ciudadano     = "ciudadano"
    operativo     = "operativo"
    financiero    = "financiero"


class DocumentStatusLevel(str, Enum):
    """Estados posibles de un DraftDocument tras validación."""
    borrador    = "borrador"    # generado por template, nunca validado
    revision    = "revision"    # contenido existe, tiene warnings
    defendible  = "defendible"  # pasa validación, puede ir a Cabildo/auditor
    bloqueado   = "bloqueado"   # errores críticos, no entra al ExportBundle como válido


class ClaimType(str, Enum):
    dato           = "dato"
    interpretacion = "interpretacion"
    recomendacion  = "recomendacion"
    promesa        = "promesa"
    norma          = "norma"
    riesgo         = "riesgo"


class ClaimReviewStatus(str, Enum):
    aprobado           = "aprobado"
    degradar_lenguaje  = "degradar_lenguaje"
    eliminar           = "eliminar"
    requiere_fuente    = "requiere_fuente"


class EvidenceTipo(str, Enum):
    dato         = "dato"
    formula      = "formula"
    fuente_legal = "fuente_legal"
    benchmark    = "benchmark"
    supuesto     = "supuesto"
    decision     = "decision"


class SourceStatus(str, Enum):
    verificado    = "verificado"
    estimado      = "estimado"
    fallback      = "fallback"
    no_disponible = "no_disponible"


class DocumentStatus(str, Enum):
    borrador  = "borrador"
    revision  = "revision"
    aprobado  = "aprobado"
    bloqueado = "bloqueado"


# ─── EvidenceItem ─────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    """
    Cada afirmación importante debe poder apuntar a su evidencia.
    Sin EvidenceItem, la afirmación no sobrevive la validación.
    """
    claim_id:           str = Field(default_factory=lambda: str(uuid.uuid4()))
    texto_claim:        str
    tipo:               EvidenceTipo
    fuente:             str
    kpi_ids:            List[str] = Field(default_factory=list)
    confianza:          float = Field(ge=0.0, le=1.0)
    lenguaje_permitido: str
    advertencia:        Optional[str] = None


# ─── ClaimLedger ─────────────────────────────────────────────────────────────

class ClaimEntry(BaseModel):
    """Una afirmación material registrada en el ledger."""
    claim_id:         str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id:      str
    section_id:       str
    claim_text:       str
    claim_type:       ClaimType
    evidence_items:   List[EvidenceItem] = Field(default_factory=list)
    source_status:    SourceStatus
    confidence:       float = Field(ge=0.0, le=1.0)
    allowed_language: str
    review_status:    ClaimReviewStatus = ClaimReviewStatus.requiere_fuente


class ClaimLedger(BaseModel):
    """
    Registro de afirmaciones materiales. El Validador lo revisa ANTES de la prosa.
    Si el ClaimLedger no pasa, el documento no pasa.
    """
    document_id: str
    entries:     List[ClaimEntry] = Field(default_factory=list)
    created_at:  datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def claims_sin_evidencia(self) -> List[ClaimEntry]:
        return [e for e in self.entries if not e.evidence_items]

    def claims_requieren_fuente(self) -> List[ClaimEntry]:
        return [e for e in self.entries
                if e.review_status == ClaimReviewStatus.requiere_fuente]

    def is_valid(self) -> bool:
        return (len(self.claims_sin_evidencia()) == 0
                and len(self.claims_requieren_fuente()) == 0)


# ─── InterpretationMemo ───────────────────────────────────────────────────────

class InterpretationMemo(BaseModel):
    """
    ÁGORA no puede redactar como garantía lo que el simulador solo modela.
    """
    model_config = ConfigDict(protected_namespaces=())

    zm:                                 str
    observed_data:                      Dict[str, Any] = Field(default_factory=dict)
    certified_snapshots:                List[str] = Field(default_factory=list)
    model_outputs:                      Dict[str, Any] = Field(default_factory=dict)
    scenario_assumptions:               List[str] = Field(default_factory=list)
    sensitivity_drivers:                List[str] = Field(default_factory=list)
    what_this_means:                    str
    what_this_does_not_mean:            str
    decision_implications:              List[str] = Field(default_factory=list)
    verification_needed_before_cabildo: List[str] = Field(default_factory=list)


# ─── LogisticsBlueprint ───────────────────────────────────────────────────────

class RACIEntry(BaseModel):
    proceso:     str
    responsable: str
    aprueba:     str
    consulta:    List[str] = Field(default_factory=list)
    informa:     List[str] = Field(default_factory=list)


class LogisticsBlueprint(BaseModel):
    """Convierte política pública en procesos implementables."""
    municipio:             str
    processes:             List[str] = Field(default_factory=list)
    roles_raci:            List[RACIEntry] = Field(default_factory=list)
    routes:                List[Dict[str, Any]] = Field(default_factory=list)
    collection_centers:    List[Dict[str, Any]] = Field(default_factory=list)
    truck_capacity:        Optional[Dict[str, Any]] = None
    material_flows:        Dict[str, Any] = Field(default_factory=dict)
    incident_protocol:     List[str] = Field(default_factory=list)
    evidence_protocol:     List[str] = Field(default_factory=list)
    weekly_kpis:           List[str] = Field(default_factory=list)
    fines_or_incentives:   Optional[str] = None
    base_legal_incentivos: Optional[str] = None
    contingency_plan:      List[str] = Field(default_factory=list)

    def tiene_base_legal_para_multas(self) -> bool:
        if not self.fines_or_incentives:
            return True
        return self.base_legal_incentivos is not None


# ─── ApprovalMatrix ───────────────────────────────────────────────────────────

class ChangeLogEntry(BaseModel):
    version: str
    fecha:   str
    autor:   str
    cambio:  str


class ApprovalMatrix(BaseModel):
    """Ningún documento puede llamarse final sin matriz de aprobación."""
    document_id:            str
    version:                str
    status:                 DocumentStatus = DocumentStatus.borrador
    technical_reviewer:     Optional[str] = None
    legal_reviewer:         Optional[str] = None
    financial_reviewer:     Optional[str] = None
    operational_reviewer:   Optional[str] = None
    institutional_approver: Optional[str] = None
    change_log:             List[ChangeLogEntry] = Field(default_factory=list)
    use_restrictions:       List[str] = Field(default_factory=list)
    public_version_available: bool = False

    def is_final(self) -> bool:
        return (self.status == DocumentStatus.aprobado
                and self.institutional_approver is not None)


# ─── CompliancePack ───────────────────────────────────────────────────────────

class CompliancePack(BaseModel):
    """Requerido cuando hay CAPEX, servicios, datos personales o adquisiciones."""
    document_id:        str
    procurement_needed: bool = False
    procurement_route:  Optional[str] = None
    budget_source:      Optional[str] = None
    conflict_risk:      Optional[str] = None
    personal_data_used: bool = False
    data_treatment:     Optional[str] = None
    sensitive_annexes:  List[str] = Field(default_factory=list)
    transparency_ready: bool = False
    archive_id:         Optional[str] = None

    def requiere_tratamiento_datos(self) -> bool:
        return self.personal_data_used and self.data_treatment is None


# ─── ValidationReport ─────────────────────────────────────────────────────────
# Definido ANTES de DraftDocument para evitar forward-refs en Pydantic v2.

class ValidationIssue(BaseModel):
    severity:    str           # "error" | "warning" | "info"
    document_id: Optional[str] = None
    section_id:  Optional[str] = None
    claim_id:    Optional[str] = None
    message:     str
    code:        str


class ValidationReport(BaseModel):
    """El Validador ataca el paquete antes de que lo ataque alguien externo."""
    bundle_id:    str
    issues:       List[ValidationIssue] = Field(default_factory=list)
    validated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    passed:       bool = False

    def errores(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == "error"]

    def warnings(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == "warning"]

    def puede_exportar(self) -> bool:
        return len(self.errores()) == 0


# ─── EvidencePack ─────────────────────────────────────────────────────────────

class EvidencePack(BaseModel):
    """Colección de evidencia organizada para un documento específico."""
    document_id: str
    items:       List[EvidenceItem] = Field(default_factory=list)

    def by_kpi(self, kpi_id: str) -> List[EvidenceItem]:
        return [i for i in self.items if kpi_id in i.kpi_ids]

    def has_evidence_for_kpi(self, kpi_id: str) -> bool:
        return any(kpi_id in i.kpi_ids for i in self.items)


# ─── Municipal Reasoning Dossier ─────────────────────────────────────────────

class DossierStatus(str, Enum):
    ready = "ready"
    needs_verification = "needs_verification"
    blocked = "blocked"


class ClaimClassification(str, Enum):
    fuente_verificada = "fuente_verificada"
    supuesto_editable = "supuesto_editable"
    estimacion_modelo = "estimacion_modelo"
    pendiente_fuente = "pendiente_fuente"
    contradiccion_detectada = "contradiccion_detectada"


class MunicipalReasoningClaim(BaseModel):
    claim_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    municipio_id: str
    claim: str
    classification: ClaimClassification
    source: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    decision_use: str
    limitation: str


class SourceEpistemologyReport(BaseModel):
    """Qué sabemos, cómo lo sabemos y qué sigue sin poder afirmarse."""
    municipio_id: str
    verified_sources: List[str] = Field(default_factory=list)
    model_estimates: List[str] = Field(default_factory=list)
    editable_assumptions: List[str] = Field(default_factory=list)
    pending_sources: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    next_verification_action: str

    def has_blocking_gap(self) -> bool:
        return bool(self.pending_sources or self.contradictions)


class CriticalObjection(BaseModel):
    objection_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    municipio_id: str
    objection: str
    severity: str
    affected_claim: str
    corrective_action: str


class CriticalObjectionReport(BaseModel):
    """Ataque interno al expediente antes de redactar."""
    objections: List[CriticalObjection] = Field(default_factory=list)

    def critical_count(self) -> int:
        return len([o for o in self.objections if o.severity == "critical"])


class OperationalWave(BaseModel):
    wave_id: str
    municipio_id: str
    justification: str
    routes_or_zones: List[str] = Field(default_factory=list)
    capacity_requirement: str
    responsible_role: str
    timing: str
    assumptions: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)


class OperationalLogisticsDossier(BaseModel):
    status: DossierStatus
    waves: List[OperationalWave] = Field(default_factory=list)
    route_logic: str
    capacity_logic: str
    evidence_required: List[str] = Field(default_factory=list)
    next_action: str


class ESGPublicValueAssessment(BaseModel):
    environmental: List[str] = Field(default_factory=list)
    social: List[str] = Field(default_factory=list)
    governance: List[str] = Field(default_factory=list)
    standards_alignment: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class MunicipalReasoningDossier(BaseModel):
    """Output maestro: documentos, hoja de ruta y narrativa derivan de aquí."""
    dossier_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: DossierStatus
    zm: str
    municipios: List[str]
    thesis: str
    municipal_maturity: Dict[str, str] = Field(default_factory=dict)
    source_epistemology: List[SourceEpistemologyReport] = Field(default_factory=list)
    claims: List[MunicipalReasoningClaim] = Field(default_factory=list)
    critical_objections: CriticalObjectionReport = Field(default_factory=CriticalObjectionReport)
    logistics: OperationalLogisticsDossier
    esg_public_value: ESGPublicValueAssessment
    blocked_claims: List[str] = Field(default_factory=list)
    enabled_decisions: List[str] = Field(default_factory=list)
    next_actions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def is_ready(self) -> bool:
        return self.status == DossierStatus.ready and self.critical_objections.critical_count() == 0


# ─── DraftTable / DraftFigure / DraftAnnex ───────────────────────────────────

class DraftTable(BaseModel):
    """Tabla estructurada. Toda tabla debe tener fuente. Unidad y periodo si aplica."""
    table_id:     str
    titulo:       str
    fuente:       str
    unidad:       Optional[str] = None
    periodo:      Optional[str] = None
    advertencias: List[str] = Field(default_factory=list)
    headers:      List[str] = Field(default_factory=list)
    rows:         List[Dict[str, Any]] = Field(default_factory=list)


class DraftFigure(BaseModel):
    """Figura/visualización. Debe tener mensaje principal y fuente."""
    figure_id:         str
    titulo:            str
    mensaje_principal: str
    fuente:            str
    nota_lectura:      Optional[str] = None
    data:              Dict[str, Any] = Field(default_factory=dict)


class DraftAnnex(BaseModel):
    """Anexo del documento."""
    annex_id:  str
    titulo:    str
    tipo:      str   # "tabla" | "formato" | "normativa" | "datos" | "bitacora"
    contenido: str
    fuente:    Optional[str] = None


# ─── DocumentSpec ─────────────────────────────────────────────────────────────

class DocumentSpec(BaseModel):
    """
    Contrato de un documento. Un DocumentSpec sin audiencia,
    decisión y secciones no es válido.
    """
    document_id:            str
    titulo:                 str
    audiencia:              List[str]
    decision_que_habilita:  str
    nivel:                  DocumentNivel
    secciones_obligatorias: List[str] = Field(default_factory=list)
    tablas_obligatorias:    List[str] = Field(default_factory=list)
    figuras_obligatorias:   List[str] = Field(default_factory=list)
    anexos_obligatorios:    List[str] = Field(default_factory=list)
    fuentes_minimas:        List[str] = Field(default_factory=list)
    criterios_de_bloqueo:   List[str] = Field(default_factory=list)
    tono:                   str = "institucional"
    lecturabilidad_objetivo: str = "universitario"
    max_paginas:            Optional[int] = None

    def is_valid(self) -> bool:
        return (bool(self.audiencia)
                and bool(self.decision_que_habilita)
                and bool(self.secciones_obligatorias))


# ─── ScenarioBundle ───────────────────────────────────────────────────────────

class ScenarioBundle(BaseModel):
    """
    Contrato de entrada que ÁGORA recibe.
    Regla: si municipios_activos > 1, generar capa municipal Y metropolitana.
    """
    scenario_id:         str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at:          datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    zm:                  str
    municipios_activos:  List[str]
    horizonte_anios:     int
    inputs_usuario:      Dict[str, Any] = Field(default_factory=dict)
    resultados:          Dict[str, Any] = Field(default_factory=dict)
    kpis_con_provenance: List[Dict[str, Any]] = Field(default_factory=list)
    snapshot_datos:      Optional[Dict[str, Any]] = None
    legal_municipal:     Dict[str, Any] = Field(default_factory=dict)
    legal_metropolitano: Optional[Dict[str, Any]] = None
    warnings:            List[str] = Field(default_factory=list)
    bloqueos:            List[str] = Field(default_factory=list)
    confidence_score:    float = Field(ge=0.0, le=1.0, default=1.0)

    def requiere_capa_metropolitana(self) -> bool:
        return len(self.municipios_activos) > 1

    def kpi_ids(self) -> List[str]:
        return [k.get("kpi_id", "") for k in self.kpis_con_provenance]

    def tiene_provenance_para_kpi(self, kpi_id: str) -> bool:
        return any(k.get("kpi_id") == kpi_id and k.get("provenance")
                   for k in self.kpis_con_provenance)

    def tiene_legal_para_municipio(self, municipio_id: str) -> bool:
        return (municipio_id in self.legal_municipal
                and bool(self.legal_municipal[municipio_id]))

    def tiene_capex(self) -> bool:
        return (self.resultados.get("capex_total") or 0) > 0


# ─── DocumentPlan ─────────────────────────────────────────────────────────────

class DocumentPlan(BaseModel):
    """Lista de documentos a generar con sus specs. Salida del Director de Paquete."""
    bundle_id:  str
    zm:         str
    municipios: List[str]
    specs:      List[DocumentSpec] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    warnings:   List[str] = Field(default_factory=list)

    def specs_validos(self) -> List[DocumentSpec]:
        return [s for s in self.specs if s.is_valid()]

    def documento_por_nivel(self, nivel: DocumentNivel) -> List[DocumentSpec]:
        return [s for s in self.specs if s.nivel == nivel]


# ─── DraftSection ─────────────────────────────────────────────────────────────

class DraftSection(BaseModel):
    section_id: str
    titulo:     str
    contenido:  str
    tablas:     List[DraftTable] = Field(default_factory=list)
    figuras:    List[DraftFigure] = Field(default_factory=list)
    claims:     List[ClaimEntry] = Field(default_factory=list)


# ─── DraftDocument ────────────────────────────────────────────────────────────

class DraftDocument(BaseModel):
    """
    Un documento dentro del paquete.
    Strings sueltos son prohibidos como salida primaria.
    """
    document_id:       str
    spec:              DocumentSpec
    status:            DocumentStatusLevel = DocumentStatusLevel.borrador
    secciones:         List[DraftSection] = Field(default_factory=list)
    tablas:            List[DraftTable] = Field(default_factory=list)
    figuras:           List[DraftFigure] = Field(default_factory=list)
    anexos:            List[DraftAnnex] = Field(default_factory=list)
    glosario:          Dict[str, str] = Field(default_factory=dict)
    claim_ledger:      Optional[ClaimLedger] = None
    validation_report: Optional[ValidationReport] = None
    approval:          Optional[ApprovalMatrix] = None
    compliance:        Optional[CompliancePack] = None
    is_fallback:       bool = False    # True si fue generado por template, no LLM
    blocked_reason:    Optional[str] = None


# ─── DraftBundle ─────────────────────────────────────────────────────────────

class DraftBundle(BaseModel):
    """El paquete completo antes de exportación."""
    bundle_id:      str
    zm:             str
    municipios:     List[str]
    documentos:     List[DraftDocument] = Field(default_factory=list)
    claim_ledger:   Optional[ClaimLedger] = None
    interpretation: Optional[InterpretationMemo] = None
    logistics:      Optional[LogisticsBlueprint] = None
    municipal_reasoning_dossier: Optional[MunicipalReasoningDossier] = None
    created_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def tiene_anexo_fuentes(self) -> bool:
        return any(
            d.spec.nivel == DocumentNivel.tecnico
            and "fuentes" in d.spec.document_id.lower()
            for d in self.documentos
        )

    def documento_por_id(self, document_id: str) -> Optional[DraftDocument]:
        return next((d for d in self.documentos if d.document_id == document_id), None)

    def documentos_con_secciones(self) -> List[DraftDocument]:
        return [d for d in self.documentos if d.secciones]

    def documentos_con_claim_ledger(self) -> List[DraftDocument]:
        return [d for d in self.documentos if d.claim_ledger is not None]


# ─── ExportedFile / ExportManifest (existentes) ───────────────────────────────

class ExportedFile(BaseModel):
    filename:   str
    format:     str   # "md" | "docx" | "json"
    drive_id:   Optional[str] = None
    checksum:   Optional[str] = None
    bytes_size: Optional[int] = None


class ExportManifest(BaseModel):
    """Registro rastreable de todo lo exportado."""
    bundle_id:        str
    zm:               str
    municipios:       List[str]
    version:          str
    exported_at:      datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    files:            List[ExportedFile] = Field(default_factory=list)
    fuentes_usadas:   List[str] = Field(default_factory=list)
    kpis_incluidos:   List[str] = Field(default_factory=list)
    warnings_activos: List[str] = Field(default_factory=list)
    score_datos:      Optional[float] = None
    generado_por:     str = "ÁGORA GOV — ALQUIMIA"


# ─── ExportedDocument / ExportBundle (nuevos Fase 3B) ────────────────────────

class ExportedDocument(BaseModel):
    """Un documento en el bundle de exportación con estado y metadata completa."""
    document_id: str
    filename:    str
    format:      str               # "md" | "docx" | "json" — NUNCA "txt"
    status:      DocumentStatusLevel
    version:     str = "0.1-borrador"
    source:      str               # "llm" | "template" | "bloqueado"
    warnings:    List[str] = Field(default_factory=list)
    drive_id:    Optional[str] = None


class ExportBundle(BaseModel):
    """
    ExportBundle reemplaza los .txt sueltos.
    Cada documento tiene nombre canónico, estado y trazabilidad.
    Un paquete sin manifest no es rastreable.
    """
    bundle_id:         str
    zm:                str
    municipios:        List[str]
    version:           str = "0.1-borrador"
    exported_at:       datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    documents:         List[ExportedDocument] = Field(default_factory=list)
    blocked_documents: List[Dict[str, Any]] = Field(default_factory=list)
    manifest:          Optional[ExportManifest] = None
    warnings:          List[str] = Field(default_factory=list)
    generado_por:      str = "ÁGORA GOV — ALQUIMIA"

    def has_manifest(self) -> bool:
        return self.manifest is not None

    def has_txt_files(self) -> bool:
        """Los archivos de exportación nunca deben ser .txt."""
        return any(d.filename.endswith(".txt") for d in self.documents)

    def documents_by_status(self, status: DocumentStatusLevel) -> List[ExportedDocument]:
        return [d for d in self.documents if d.status == status]

    def documents_defendibles(self) -> List[ExportedDocument]:
        return self.documents_by_status(DocumentStatusLevel.defendible)

    def documents_bloqueados(self) -> List[ExportedDocument]:
        return self.documents_by_status(DocumentStatusLevel.bloqueado)


# ─── PackageRecord / DownloadAsset (Fase 3C) ─────────────────────────────────

class DownloadAsset(BaseModel):
    """Archivo individual descargable de un paquete persistido."""
    asset_id:   str = Field(default_factory=lambda: str(uuid.uuid4()))
    package_id: str
    filename:   str
    mime_type:  str
    path:       str
    checksum:   str           # SHA-256 del contenido
    size_bytes: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PackageRecord(BaseModel):
    """
    Registro persistente de un paquete documental generado.
    Permite recuperación por ID, auditoría por manifest y descarga directa.
    No reemplaza ExportBundle en memoria — lo envuelve para persistencia.
    """
    package_id:    str
    scenario_id:   str
    zm:            str
    municipios:    List[str] = Field(default_factory=list)
    created_at:    datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version:       str = "0.1-borrador"
    status:        str = "completed"       # pending | running | completed | failed
    manifest_path: Optional[str] = None   # ruta a manifest.json en disco
    zip_path:      Optional[str] = None   # ruta a package.zip en disco
    checksum:      Optional[str] = None   # SHA-256 del ZIP
    warnings:      List[str] = Field(default_factory=list)
    n_documents:   int = 0
    n_defendibles: int = 0
    n_bloqueados:  int = 0


# ─── Wave 1: ResearchFindings (Agente Investigador) ───────────────────────────

class ResearchItem(BaseModel):
    """Un resultado individual de investigación web."""
    query:       str
    titulo:      str
    snippet:     str
    url:         str
    domain:      str
    domain_tier: str = "web"   # "inegi" | "banxico" | "gob" | "paper" | "web"
    fecha:       Optional[str] = None
    valor_numerico: Optional[float] = None
    unidad:      Optional[str] = None
    confianza:   float = Field(ge=0.0, le=1.0, default=0.5)


class ResearchFindings(BaseModel):
    """
    Output del Agente Investigador.
    Agrupa hallazgos por categoria para que cada agente consuma solo lo suyo.
    """
    zm:          str
    municipio:   str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Costos financieros (alimentan CostModel)
    costos_construccion:  List[ResearchItem] = Field(default_factory=list)
    costos_terreno:       List[ResearchItem] = Field(default_factory=list)
    costos_flota:         List[ResearchItem] = Field(default_factory=list)
    costos_disposicion:   List[ResearchItem] = Field(default_factory=list)
    precios_materiales:   List[ResearchItem] = Field(default_factory=list)

    # Contexto regulatorio y político
    reglamentos:          List[ResearchItem] = Field(default_factory=list)
    noticias_locales:     List[ResearchItem] = Field(default_factory=list)
    benchmarks_latam:     List[ResearchItem] = Field(default_factory=list)
    papers_academicos:    List[ResearchItem] = Field(default_factory=list)

    # Metadata de calidad
    queries_ejecutadas:   int = 0
    queries_con_resultado: int = 0
    fuente_serper:        bool = False
    advertencias:         List[str] = Field(default_factory=list)

    def top_costo(self, categoria: str) -> Optional[ResearchItem]:
        """Devuelve el item de mayor confianza para una categoria de costos."""
        items = getattr(self, categoria, [])
        if not items:
            return None
        return max(items, key=lambda x: x.confianza)


# ─── Wave 1: CentroAcopio (base de datos) ────────────────────────────────────

class CentroAcopioMaterial(str, Enum):
    pet       = "pet"
    hdpe      = "hdpe"
    carton    = "carton"
    papel     = "papel"
    vidrio    = "vidrio"
    aluminio  = "aluminio"
    acero     = "acero"
    organico  = "organico"
    tetrapak  = "tetrapak"
    electronico = "electronico"
    baterias  = "baterias"
    aceite    = "aceite"
    textil    = "textil"
    otro      = "otro"


class CentroAcopioTipo(str, Enum):
    centro_municipal   = "centro_municipal"
    empresa_recicladora = "empresa_recicladora"
    punto_verde        = "punto_verde"
    chatarreria        = "chatarreria"
    banco_de_residuos  = "banco_de_residuos"
    otro               = "otro"


class CentroAcopio(BaseModel):
    """Punto de disposición o venta de materiales reciclables."""
    centro_id:      str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre:         str
    tipo:           CentroAcopioTipo = CentroAcopioTipo.otro
    direccion:      str
    municipio:      str
    estado:         str
    zm:             Optional[str] = None
    lat:            Optional[float] = None
    lon:            Optional[float] = None
    materiales:     List[CentroAcopioMaterial] = Field(default_factory=list)
    precio_compra:  Dict[str, float] = Field(
        default_factory=dict,
        description="Material → precio de compra en MXN/kg"
    )
    telefono:       Optional[str] = None
    horario:        Optional[str] = None
    acepta_publico: bool = True
    acepta_empresa: bool = False
    fuente:         str = "usuario"   # "places_api" | "denue" | "usuario"
    verificado:     bool = False
    score_confianza: float = Field(ge=0.0, le=1.0, default=0.5)
    created_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─── Wave 1: Planning (Gantt / PERT / RACI) ──────────────────────────────────

class PlanningTask(BaseModel):
    """Tarea individual para Gantt y PERT con estimados β-PERT de 3 puntos.

    Estimados de duración:
      t_optimista (t_o): mejor caso — sin obstáculos ni retrasos
      t_probable  (t_m): duración más realista (moda)
      t_pesimista (t_p): peor caso — retrasos máximos esperados

    Duración esperada PERT: (t_o + 4·t_m + t_p) / 6
    Varianza PERT: ((t_p - t_o) / 6)²
    """
    task_id:      str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre:       str
    descripcion:  str = ""
    responsable:  str
    inicio_semana: int = Field(ge=1)
    duracion_semanas: int = Field(ge=1)   # duración esperada calculada con β-PERT
    predecesoras: List[str] = Field(default_factory=list)
    es_critica:   bool = False
    costo_mxn:    float = 0.0
    fuente_costo: str = ""
    holgura_semanas: int = 0
    fase_gate: str = ""  # G1–G5 — gate institucional KRONOS
    # 3-point PERT estimates (semanas)
    t_optimista:  Optional[float] = None  # t_o: mejor caso
    t_probable:   Optional[float] = None  # t_m: más probable
    t_pesimista:  Optional[float] = None  # t_p: peor caso
    sigma:        Optional[float] = None  # desviación estándar = (t_p - t_o) / 6

    def duracion_pert(self) -> float:
        """Calcula la duración esperada usando la fórmula β-PERT."""
        if self.t_optimista is not None and self.t_probable is not None and self.t_pesimista is not None:
            return round((self.t_optimista + 4 * self.t_probable + self.t_pesimista) / 6, 2)
        return float(self.duracion_semanas)

    def varianza_pert(self) -> float:
        """Varianza de la duración = ((t_p - t_o) / 6)²"""
        if self.t_optimista is not None and self.t_pesimista is not None:
            return round(((self.t_pesimista - self.t_optimista) / 6) ** 2, 4)
        return 0.0


class GanttPlan(BaseModel):
    """Plan Gantt maestro generado por agentes logísticos."""
    zm:          str
    municipio:   str
    scenario_id: str
    tasks:       List[PlanningTask] = Field(default_factory=list)
    horizonte_semanas: int = 52
    costo_total_mxn: float = 0.0
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fuente_costos: str = "cost_registry_v1"

    def ruta_critica(self) -> List[PlanningTask]:
        return [t for t in self.tasks if t.es_critica]


class PertNode(BaseModel):
    """Nodo del diagrama PERT con análisis de tiempo temprano/tardío y varianza β-PERT."""
    node_id:        str
    nombre:         str
    tiempo_esperado: float   # semanas — calculado con β-PERT si hay 3 puntos
    tiempo_temprano: float = 0.0
    tiempo_tardio:  float = 0.0
    holgura:        float = 0.0
    es_critico:     bool = False
    t_optimista:    Optional[float] = None
    t_probable:     Optional[float] = None
    t_pesimista:    Optional[float] = None
    varianza:       float = 0.0   # ((t_p - t_o) / 6)²
    sigma:          float = 0.0   # desviación estándar del nodo


class PertPlan(BaseModel):
    """Diagrama PERT con ruta crítica identificada."""
    zm:          str
    municipio:   str
    scenario_id: str
    nodes:       List[PertNode] = Field(default_factory=list)
    duracion_total_semanas: float = 0.0
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RACIRow(BaseModel):
    """Fila de la matriz RACI con roles y responsabilidades."""
    proceso:       str
    responsable:   str          # R
    aprueba:       str          # A
    consulta:      List[str] = Field(default_factory=list)   # C
    informa:       List[str] = Field(default_factory=list)   # I
    plazo_semanas: Optional[int] = None
    norma_aplicable: Optional[str] = None


class RACIPlan(BaseModel):
    """Matriz RACI completa para el programa de circularidad."""
    zm:          str
    municipio:   str
    scenario_id: str
    filas:       List[RACIRow] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─── Wave 1: SurveyTemplate (encuesta social/demográfica) ────────────────────

class SurveyPregunta(BaseModel):
    pregunta_id:  str
    texto:        str
    tipo:         str   # "opcion_multiple" | "escala_likert" | "abierta" | "numerica"
    opciones:     List[str] = Field(default_factory=list)
    obligatoria:  bool = True
    seccion:      str = ""


class SurveyTemplate(BaseModel):
    """Encuesta social/demográfica generada para módulo de riesgos."""
    survey_id:    str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo:       str
    descripcion:  str
    municipio:    str
    zm:           str
    riesgos_detectados: List[str] = Field(default_factory=list)
    preguntas:    List[SurveyPregunta] = Field(default_factory=list)
    consentimiento: str = "Los datos son anónimos y se usarán exclusivamente para análisis de gestión de residuos."
    created_at:   datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version:      str = "1.0"

    def n_secciones(self) -> int:
        return len({p.seccion for p in self.preguntas if p.seccion})


# ─── Módulo de Riesgos: dimensiones y análisis ───────────────────────────────

class RiesgoDimension(str, Enum):
    mercado    = "mercado"
    politico   = "politico"
    operativo  = "operativo"
    regulatorio = "regulatorio"


class RiesgoFormula(BaseModel):
    """Fórmula documentada para una dimensión de riesgo."""
    dimension:        RiesgoDimension
    expresion:        str   # p.e. "(1 − tasa_colocacion) × vol × precio × 0.35"
    variables:        Dict[str, str]   # nombre_var → descripción
    ponderacion:      float            # peso en score total (0–1, suma = 1)
    fuente_datos:     str              # de dónde vienen los inputs
    referencia:       str              # fuente bibliográfica o institucional
    rango_score:      str = "0–100"


class RiesgoScore(BaseModel):
    """Score calculado para una dimensión en un escenario específico."""
    dimension:   RiesgoDimension
    valor:       float              # 0–100
    nivel:       str                # "bajo" | "medio" | "alto" | "critico"
    drivers:     List[str] = Field(default_factory=list)    # factores que elevan el score
    mitigaciones: List[str] = Field(default_factory=list)  # acciones recomendadas


class RiesgoAnalisis(BaseModel):
    """Análisis completo de riesgo para un municipio / escenario."""
    municipio:      str
    zm:             str
    scenario_id:    str
    scores:         List[RiesgoScore] = Field(default_factory=list)
    score_total:    float = 0.0         # suma ponderada de todos los scores
    nivel_total:    str   = "bajo"      # semáforo global
    formula_ponderacion: Dict[str, float] = Field(
        default_factory=lambda: {
            "mercado":     0.30,
            "politico":    0.40,
            "operativo":   0.20,
            "regulatorio": 0.10,
        }
    )
    notas:          Optional[str] = None
    generated_at:   datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def calcular_score_total(self) -> float:
        pesos = self.formula_ponderacion
        total = sum(
            s.valor * pesos.get(s.dimension.value, 0.0)
            for s in self.scores
        )
        self.score_total = round(total, 2)
        if total < 25:
            self.nivel_total = "bajo"
        elif total < 50:
            self.nivel_total = "medio"
        elif total < 75:
            self.nivel_total = "alto"
        else:
            self.nivel_total = "critico"
        return self.score_total
