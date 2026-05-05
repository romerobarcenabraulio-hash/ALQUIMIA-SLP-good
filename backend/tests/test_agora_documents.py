"""
Tests Fase 3 — ÁGORA Document Intelligence.

Estos tests documentan los contratos que ÁGORA debe obedecer.
Fallan si ÁGORA produce documentos "bonitos" sin verdad debajo.

Grupo A — Contratos de datos (schemas)
  1.  ScenarioBundle sin kpis_con_provenance debe rechazarse por el gate
  2.  DocumentSpec sin audiencia no es válido
  3.  DocumentSpec sin decision_que_habilita no es válido
  4.  ClaimLedger detecta claims sin evidencia
  5.  ClaimLedger.is_valid() falla si hay claims pendientes de fuente
  6.  LogisticsBlueprint con multas sin base legal falla
  7.  ApprovalMatrix no es final sin aprobador institucional
  8.  CompliancePack detecta datos personales sin tratamiento

Grupo B — Reglas de negocio ÁGORA
  9.  ScenarioBundle con múltiples municipios requiere capa metropolitana
  10. ScenarioBundle con un solo municipio NO requiere capa metropolitana
  11. DocumentSpec.is_valid() pasa cuando tiene los tres campos obligatorios
  12. ValidationReport.puede_exportar() falla si hay errores
  13. ExportManifest se construye con todos los campos mínimos
  14. DraftBundle.tiene_anexo_fuentes() retorna True/False correctamente

Grupo C — Gates de calidad
  15. Un KPI de fuente estimada NO puede tener EvidenceTipo.dato con confianza >= 0.9
  16. ClaimEntry con tipo=promesa requiere review_status != aprobado si no hay evidence
  17. DocumentPlan.specs_validos() filtra specs inválidos
  18. InterpretationMemo diferencia what_this_means de what_this_does_not_mean
  19. ScenarioBundle.tiene_provenance_para_kpi() detecta KPI sin provenance
  20. ScenarioBundle.tiene_legal_para_municipio() detecta municipio sin legal

Grupo D — Cambio de ZM cambia documentos
  21. ScenarioBundle con ZM=SLP y ZM=QRO tienen municipios distintos
  22. DocumentPlan para ZM distintas tiene zm distinto

Grupo E — Exports y manifests
  23. ExportManifest sin archivos tiene lista vacía
  24. ValidationReport separa errores de warnings
"""
from __future__ import annotations

import pytest
from datetime import datetime

from app.agents.schemas import (
    ScenarioBundle,
    DocumentSpec,
    DocumentNivel,
    EvidenceItem,
    EvidenceTipo,
    ClaimEntry,
    ClaimLedger,
    ClaimType,
    ClaimReviewStatus,
    SourceStatus,
    InterpretationMemo,
    LogisticsBlueprint,
    RACIEntry,
    ApprovalMatrix,
    DocumentStatus,
    CompliancePack,
    DocumentPlan,
    DraftSection,
    DraftDocument,
    DraftBundle,
    ValidationReport,
    ValidationIssue,
    ExportManifest,
    ExportedFile,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_bundle(
    zm: str = "SLP",
    municipios: list[str] = None,
    kpis: list[dict] = None,
    legal: dict = None,
) -> ScenarioBundle:
    if municipios is None:
        municipios = ["slp"]
    if kpis is None:
        kpis = [
            {
                "kpi_id": "poblacion_total",
                "valor": 1_200_000,
                "provenance": {
                    "tipo": "certificado",
                    "fuente_nombre": "INEGI Censo 2020",
                    "confianza": 0.93,
                },
            }
        ]
    if legal is None:
        legal = {m: {"reglamento": "Reglamento de Limpia de SLP", "verificado": True} for m in municipios}

    return ScenarioBundle(
        zm=zm,
        municipios_activos=municipios,
        horizonte_anios=3,
        kpis_con_provenance=kpis,
        legal_municipal=legal,
        confidence_score=0.85,
    )


def make_spec(
    document_id: str = "doc_01",
    audiencia: list[str] = None,
    decision: str = "Aprobar reforma en Cabildo",
    secciones: list[str] = None,
) -> DocumentSpec:
    return DocumentSpec(
        document_id=document_id,
        titulo="Documento de prueba",
        audiencia=audiencia if audiencia is not None else ["Presidente municipal"],
        decision_que_habilita=decision,
        nivel=DocumentNivel.municipal,
        secciones_obligatorias=secciones if secciones is not None else ["1. Situación actual"],
    )


def make_evidence() -> EvidenceItem:
    return EvidenceItem(
        texto_claim="La población de SLP es de 1.2 millones de habitantes según INEGI Censo 2020.",
        tipo=EvidenceTipo.dato,
        fuente="INEGI Censo 2020",
        kpi_ids=["poblacion_total"],
        confianza=0.93,
        lenguaje_permitido="según INEGI Censo 2020",
    )


def make_claim(
    document_id: str = "doc_01",
    evidence_items: list[EvidenceItem] = None,
    review_status: ClaimReviewStatus = ClaimReviewStatus.aprobado,
    source_status: SourceStatus = SourceStatus.verificado,
    claim_type: ClaimType = ClaimType.dato,
) -> ClaimEntry:
    return ClaimEntry(
        document_id=document_id,
        section_id="sec_01",
        claim_text="La población es de 1.2M.",
        claim_type=claim_type,
        evidence_items=evidence_items if evidence_items is not None else [make_evidence()],
        source_status=source_status,
        confidence=0.93,
        allowed_language="según INEGI Censo 2020",
        review_status=review_status,
    )


# ─── Grupo A — Contratos de datos ─────────────────────────────────────────────

class TestContratosDatos:

    def test_scenario_bundle_sin_kpis_provenance_tiene_lista_vacia(self):
        """
        Un ScenarioBundle sin kpis_con_provenance debe tener lista vacía —
        el gate de ÁGORA debe detectar esto y no generar documentos con KPIs
        sin trazabilidad.
        """
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            kpis_con_provenance=[],  # sin KPIs
        )
        assert bundle.kpis_con_provenance == [], (
            "kpis_con_provenance vacío debe ser detectado por el gate de ÁGORA."
        )
        assert len(bundle.kpis_con_provenance) == 0

    def test_document_spec_sin_audiencia_no_es_valido(self):
        """DocumentSpec con audiencia vacía no es válido."""
        spec = make_spec(audiencia=[])
        assert not spec.is_valid(), (
            "DocumentSpec sin audiencia no debe ser válido. "
            "Ningún documento puede generarse sin saber a quién va dirigido."
        )

    def test_document_spec_sin_decision_no_es_valido(self):
        """DocumentSpec sin decision_que_habilita no es válido."""
        spec = make_spec(decision="")
        assert not spec.is_valid(), (
            "DocumentSpec sin decision_que_habilita no debe ser válido. "
            "Cada documento debe habilitar una decisión concreta."
        )

    def test_claim_ledger_detecta_claims_sin_evidencia(self):
        """ClaimLedger.claims_sin_evidencia() retorna claims sin EvidenceItem."""
        claim_vacio = make_claim(evidence_items=[])
        ledger = ClaimLedger(
            document_id="doc_01",
            entries=[claim_vacio, make_claim()],
        )
        sin_evidencia = ledger.claims_sin_evidencia()
        assert len(sin_evidencia) == 1, (
            f"Debe detectar 1 claim sin evidencia, encontró {len(sin_evidencia)}."
        )

    def test_claim_ledger_is_valid_falla_con_claims_requieren_fuente(self):
        """ClaimLedger no es válido si hay claims pendientes de fuente."""
        claim_pendiente = make_claim(review_status=ClaimReviewStatus.requiere_fuente)
        ledger = ClaimLedger(
            document_id="doc_01",
            entries=[claim_pendiente],
        )
        assert not ledger.is_valid(), (
            "ClaimLedger con claims en estado 'requiere_fuente' no debe ser válido."
        )

    def test_logistics_blueprint_multas_sin_base_legal_falla(self):
        """LogisticsBlueprint con multas sin base legal debe detectarse."""
        bp = LogisticsBlueprint(
            municipio="slp",
            fines_or_incentives="Multa de $500 MXN por incumplimiento",
            base_legal_incentivos=None,  # sin artículo
        )
        assert not bp.tiene_base_legal_para_multas(), (
            "LogisticsBlueprint con multas y sin base legal debe fallar. "
            "Una multa sin artículo legal no puede incluirse en el documento operativo."
        )

    def test_logistics_blueprint_sin_multas_pasa(self):
        """LogisticsBlueprint sin multas no necesita base legal."""
        bp = LogisticsBlueprint(
            municipio="slp",
            fines_or_incentives=None,
            base_legal_incentivos=None,
        )
        assert bp.tiene_base_legal_para_multas(), (
            "Sin multas/incentivos no debe requerir base legal."
        )

    def test_approval_matrix_no_es_final_sin_aprobador(self):
        """ApprovalMatrix no puede ser final sin aprobador institucional."""
        matrix = ApprovalMatrix(
            document_id="doc_01",
            version="0.1",
            status=DocumentStatus.aprobado,
            institutional_approver=None,
        )
        assert not matrix.is_final(), (
            "ApprovalMatrix.is_final() debe ser False sin aprobador institucional."
        )

    def test_approval_matrix_es_final_con_aprobador(self):
        """ApprovalMatrix es final cuando tiene aprobador y status aprobado."""
        matrix = ApprovalMatrix(
            document_id="doc_01",
            version="1.0",
            status=DocumentStatus.aprobado,
            institutional_approver="Presidente Municipal",
        )
        assert matrix.is_final()

    def test_compliance_pack_detecta_datos_personales_sin_tratamiento(self):
        """CompliancePack debe detectar datos personales sin tratamiento definido."""
        pack = CompliancePack(
            document_id="doc_01",
            personal_data_used=True,
            data_treatment=None,
        )
        assert pack.requiere_tratamiento_datos(), (
            "CompliancePack con datos personales y sin tratamiento debe requerir acción."
        )

    def test_compliance_pack_sin_datos_personales_no_requiere_tratamiento(self):
        """CompliancePack sin datos personales no requiere tratamiento."""
        pack = CompliancePack(
            document_id="doc_01",
            personal_data_used=False,
            data_treatment=None,
        )
        assert not pack.requiere_tratamiento_datos()


# ─── Grupo B — Reglas de negocio ÁGORA ───────────────────────────────────────

class TestReglasNegocio:

    def test_bundle_multimunicipio_requiere_capa_metropolitana(self):
        """
        Si municipios_activos tiene más de un municipio, ÁGORA debe generar
        capa municipal Y capa metropolitana.
        """
        bundle = make_bundle(
            zm="SLP",
            municipios=["slp", "soledad", "cerroGordo", "villa-de-reyes"],
        )
        assert bundle.requiere_capa_metropolitana(), (
            "Un bundle con 4 municipios debe requerir capa metropolitana. "
            "No se puede redactar como si la ZM fuera una sola autoridad."
        )

    def test_bundle_un_municipio_no_requiere_metropolitano(self):
        """Un solo municipio no requiere capa metropolitana."""
        bundle = make_bundle(zm="QRO", municipios=["queretaro"])
        assert not bundle.requiere_capa_metropolitana()

    def test_document_spec_valido_con_campos_completos(self):
        """DocumentSpec es válido cuando tiene audiencia, decisión y secciones."""
        spec = make_spec()
        assert spec.is_valid(), (
            f"DocumentSpec completo debe ser válido. Campos: {spec.model_dump()}"
        )

    def test_validation_report_no_puede_exportar_con_errores(self):
        """ValidationReport con errores bloquea la exportación."""
        issue = ValidationIssue(
            severity="error",
            document_id="doc_01",
            message="KPI sin evidencia",
            code="KPI_SIN_EVIDENCIA",
        )
        report = ValidationReport(
            bundle_id="bundle_01",
            issues=[issue],
            passed=False,
        )
        assert not report.puede_exportar(), (
            "ValidationReport con errores no debe permitir exportación."
        )

    def test_validation_report_puede_exportar_sin_errores(self):
        """ValidationReport sin errores permite exportación."""
        report = ValidationReport(bundle_id="bundle_01", passed=True)
        assert report.puede_exportar()

    def test_export_manifest_se_construye_correctamente(self):
        """ExportManifest tiene todos los campos mínimos requeridos."""
        manifest = ExportManifest(
            bundle_id="bundle_01",
            zm="SLP",
            municipios=["slp"],
            version="1.0",
            files=[
                ExportedFile(filename="01_Resumen_Ejecutivo.docx", format="docx"),
                ExportedFile(filename="07_Fuentes.docx", format="docx"),
            ],
            fuentes_usadas=["INEGI Censo 2020", "SEMARNAT DBGIR 2021"],
            score_datos=88.0,
        )
        assert manifest.zm == "SLP"
        assert len(manifest.files) == 2
        assert manifest.score_datos == 88.0
        assert "ALQUIMIA" in manifest.generado_por

    def test_draft_bundle_tiene_anexo_fuentes_true(self):
        """DraftBundle.tiene_anexo_fuentes() detecta documento de fuentes."""
        spec_fuentes = DocumentSpec(
            document_id="07_fuentes_trazabilidad",
            titulo="Anexo de Fuentes y Trazabilidad",
            audiencia=["Auditor"],
            decision_que_habilita="Verificar trazabilidad de datos",
            nivel=DocumentNivel.tecnico,
            secciones_obligatorias=["Manifest de datos"],
        )
        draft_fuentes = DraftDocument(document_id="07_fuentes_trazabilidad", spec=spec_fuentes)
        bundle = DraftBundle(
            bundle_id="b01",
            zm="SLP",
            municipios=["slp"],
            documentos=[draft_fuentes],
        )
        assert bundle.tiene_anexo_fuentes(), (
            "DraftBundle con documento de fuentes debe reconocerlo."
        )

    def test_draft_bundle_sin_anexo_fuentes_false(self):
        """DraftBundle sin documento de fuentes retorna False."""
        spec = make_spec()
        draft = DraftDocument(document_id="doc_01", spec=spec)
        bundle = DraftBundle(
            bundle_id="b01",
            zm="SLP",
            municipios=["slp"],
            documentos=[draft],
        )
        assert not bundle.tiene_anexo_fuentes()


# ─── Grupo C — Gates de calidad ───────────────────────────────────────────────

class TestGatesCalidad:

    def test_evidencia_estimada_no_debe_tener_confianza_maxima(self):
        """
        Un KPI de fuente estimada no debe presentar confianza >= 0.9.
        Esto documenta la regla: si es estimado, el lenguaje debe ser prudente.
        """
        evidence_estimada = EvidenceItem(
            texto_claim="Se estima que la población es de 1.2M.",
            tipo=EvidenceTipo.supuesto,  # estimado → supuesto, no dato
            fuente="Estimación propia ALQUIMIA",
            kpi_ids=["poblacion_total"],
            confianza=0.45,          # confianza baja, coherente con supuesto
            lenguaje_permitido="se estima que",
        )
        assert evidence_estimada.confianza < 0.9, (
            "Evidencia de tipo supuesto no debe tener confianza >= 0.9. "
            "Sería deshonesto presentar una estimación como dato certificado."
        )

    def test_claim_promesa_sin_evidencia_requiere_fuente(self):
        """
        Un ClaimEntry de tipo promesa sin evidence_items debe tener
        review_status=requiere_fuente, nunca aprobado.
        """
        claim_promesa = ClaimEntry(
            document_id="doc_01",
            section_id="sec_01",
            claim_text="El programa generará 500 empleos directos.",
            claim_type=ClaimType.promesa,
            evidence_items=[],   # sin evidencia
            source_status=SourceStatus.no_disponible,
            confidence=0.0,
            allowed_language="se proyecta",
            review_status=ClaimReviewStatus.requiere_fuente,  # correcto
        )
        assert claim_promesa.review_status == ClaimReviewStatus.requiere_fuente, (
            "Promesa sin evidencia debe requerir fuente, no aparecer como aprobada."
        )
        assert claim_promesa.evidence_items == []

    def test_document_plan_filtra_specs_invalidos(self):
        """DocumentPlan.specs_validos() no debe incluir specs inválidos."""
        spec_valido   = make_spec(document_id="doc_valido")
        spec_invalido = make_spec(document_id="doc_invalido", audiencia=[], decision="")
        plan = DocumentPlan(
            bundle_id="b01",
            zm="SLP",
            municipios=["slp"],
            specs=[spec_valido, spec_invalido],
        )
        validos = plan.specs_validos()
        assert len(validos) == 1
        assert validos[0].document_id == "doc_valido", (
            "DocumentPlan.specs_validos() debe filtrar specs sin audiencia/decisión."
        )

    def test_interpretation_memo_diferencia_significa_y_no_significa(self):
        """InterpretationMemo debe tener ambos campos distinguidos."""
        memo = InterpretationMemo(
            zm="SLP",
            what_this_means="El simulador proyecta una TIR del 28% bajo supuestos de captura del 70% en año 3.",
            what_this_does_not_mean="El programa no garantiza esa TIR. La TIR real depende del precio del material y la ejecución operativa.",
            decision_implications=["Llevar al Cabildo con advertencias sobre sensibilidad"],
            verification_needed_before_cabildo=["Verificar precio spot de PET con recicladora local"],
        )
        assert memo.what_this_means != memo.what_this_does_not_mean, (
            "what_this_means y what_this_does_not_mean deben ser distintos. "
            "ÁGORA no puede mezclar lo que el modelo proyecta con lo que garantiza."
        )
        assert len(memo.verification_needed_before_cabildo) > 0

    def test_bundle_detecta_kpi_sin_provenance(self):
        """ScenarioBundle.tiene_provenance_para_kpi() detecta KPI sin trazabilidad."""
        bundle = make_bundle(
            kpis=[
                {
                    "kpi_id": "tir",
                    "valor": 28.5,
                    # sin "provenance"
                }
            ]
        )
        assert not bundle.tiene_provenance_para_kpi("tir"), (
            "KPI sin campo 'provenance' debe ser detectado por el bundle. "
            "ÁGORA no puede redactar con seguridad sobre un KPI sin trazabilidad."
        )

    def test_bundle_kpi_con_provenance_es_detectado(self):
        """ScenarioBundle.tiene_provenance_para_kpi() retorna True para KPI con provenance."""
        bundle = make_bundle()
        assert bundle.tiene_provenance_para_kpi("poblacion_total"), (
            "poblacion_total tiene provenance en el bundle de prueba."
        )

    def test_bundle_detecta_municipio_sin_legal(self):
        """ScenarioBundle.tiene_legal_para_municipio() detecta municipio sin diagnóstico."""
        bundle = make_bundle(
            municipios=["slp", "soledad"],
            legal={"slp": {"reglamento": "R. Limpia SLP", "verificado": True}},
            # "soledad" no tiene legal
        )
        assert not bundle.tiene_legal_para_municipio("soledad"), (
            "Municipio 'soledad' no tiene diagnóstico legal en el bundle."
        )
        assert bundle.tiene_legal_para_municipio("slp")


# ─── Grupo D — Cambio de ZM cambia documentos ────────────────────────────────

class TestCambioZMCambiaDocumentos:

    def test_bundles_zm_distintas_tienen_municipios_distintos(self):
        """ScenarioBundle con ZM=SLP y ZM=QRO tienen municipios distintos."""
        bundle_slp = make_bundle(
            zm="SLP",
            municipios=["slp", "soledad", "cerro-gordo", "villa-de-reyes"],
        )
        bundle_qro = make_bundle(
            zm="QRO",
            municipios=["queretaro", "el-marques", "corregidora", "huimilpan"],
        )
        assert bundle_slp.zm != bundle_qro.zm
        assert set(bundle_slp.municipios_activos) != set(bundle_qro.municipios_activos), (
            "SLP y QRO deben tener municipios distintos."
        )

    def test_document_plan_zm_distintas(self):
        """DocumentPlan para ZMs distintas tienen zm distinto."""
        plan_slp = DocumentPlan(
            bundle_id="b_slp",
            zm="SLP",
            municipios=["slp"],
            specs=[make_spec(document_id="doc_slp")],
        )
        plan_qro = DocumentPlan(
            bundle_id="b_qro",
            zm="QRO",
            municipios=["queretaro"],
            specs=[make_spec(document_id="doc_qro")],
        )
        assert plan_slp.zm != plan_qro.zm
        assert plan_slp.bundle_id != plan_qro.bundle_id

    def test_documento_juridico_municipal_es_por_municipio(self):
        """
        Hay que generar un spec jurídico POR municipio, no uno genérico.
        Prohibido usar reforma de SLP como plantilla para QRO.
        """
        spec_slp = DocumentSpec(
            document_id="03_juridico_slp",
            titulo="Diagnóstico y Reforma Reglamentaria — SLP",
            audiencia=["Sindicatura SLP", "Cabildo SLP"],
            decision_que_habilita="Reforma al Reglamento de Limpia de SLP",
            nivel=DocumentNivel.municipal,
            secciones_obligatorias=["Reglamento vigente", "Brechas", "Propuesta"],
        )
        spec_qro = DocumentSpec(
            document_id="03_juridico_queretaro",
            titulo="Diagnóstico y Reforma Reglamentaria — Querétaro",
            audiencia=["Sindicatura Querétaro", "Cabildo Querétaro"],
            decision_que_habilita="Reforma al Reglamento de Limpia de Querétaro",
            nivel=DocumentNivel.municipal,
            secciones_obligatorias=["Reglamento vigente", "Brechas", "Propuesta"],
        )
        assert spec_slp.document_id != spec_qro.document_id, (
            "SLP y QRO deben tener document_id distintos para su documento jurídico. "
            "Prohibido usar un spec de SLP como plantilla para QRO."
        )
        assert "slp" in spec_slp.document_id.lower()
        assert "queretaro" in spec_qro.document_id.lower()


# ─── Grupo E — Exports y manifests ────────────────────────────────────────────

class TestExportsManifests:

    def test_export_manifest_sin_archivos_lista_vacia(self):
        """ExportManifest sin archivos tiene lista vacía, no None."""
        manifest = ExportManifest(
            bundle_id="b01",
            zm="SLP",
            municipios=["slp"],
            version="0.1",
        )
        assert manifest.files == [], "files debe ser lista vacía, no None."
        assert manifest.fuentes_usadas == []

    def test_validation_report_separa_errores_de_warnings(self):
        """ValidationReport.errores() y .warnings() separan correctamente la severidad."""
        report = ValidationReport(
            bundle_id="b01",
            issues=[
                ValidationIssue(severity="error",   message="Sin evidencia", code="E001"),
                ValidationIssue(severity="warning",  message="Confianza baja", code="W001"),
                ValidationIssue(severity="error",   message="Municipio sin legal", code="E002"),
                ValidationIssue(severity="info",     message="Score 65/100", code="I001"),
            ],
        )
        assert len(report.errores()) == 2
        assert len(report.warnings()) == 1
        assert not report.puede_exportar(), "Dos errores deben bloquear exportación."

    def test_draft_bundle_documento_por_id_retorna_correcto(self):
        """DraftBundle.documento_por_id() localiza el documento correcto."""
        spec = make_spec(document_id="doc_ejecutivo")
        draft = DraftDocument(document_id="doc_ejecutivo", spec=spec)
        bundle = DraftBundle(
            bundle_id="b01",
            zm="SLP",
            municipios=["slp"],
            documentos=[draft],
        )
        encontrado = bundle.documento_por_id("doc_ejecutivo")
        assert encontrado is not None
        assert encontrado.document_id == "doc_ejecutivo"

    def test_draft_bundle_documento_por_id_no_encontrado(self):
        """DraftBundle.documento_por_id() retorna None si no existe."""
        bundle = DraftBundle(bundle_id="b01", zm="SLP", municipios=["slp"])
        assert bundle.documento_por_id("no_existe") is None

    def test_claim_ledger_is_valid_true_con_claims_aprobados(self):
        """ClaimLedger es válido cuando todos los claims tienen evidencia y están aprobados."""
        ledger = ClaimLedger(
            document_id="doc_01",
            entries=[
                make_claim(review_status=ClaimReviewStatus.aprobado),
                make_claim(review_status=ClaimReviewStatus.aprobado),
            ],
        )
        assert ledger.is_valid(), "Ledger con todos los claims aprobados debe ser válido."
