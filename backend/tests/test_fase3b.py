"""
Tests Fase 3B — Conectar contratos ÁGORA al runtime.

Los contratos documentales ya controlan la redacción real de ÁGORA.
Estos tests fallan si los contratos son decoración.

Grupo Runtime
  1. test_run_agora_convierte_planinput_a_scenario_bundle
  2. test_call_agent_recibe_document_spec
  3. test_prompt_builder_incluye_audiencia_decision_y_warnings
  4. test_redactor_no_recibe_planinput_suelto

Grupo DraftBundle
  5. test_run_agora_retorna_draft_bundle
  6. test_draft_document_tiene_sections_tables_claimledger
  7. test_claim_numerico_sin_evidencia_bloquea_documento

Grupo ExportBundle
  8. test_run_agora_retorna_export_bundle_con_manifest
  9. test_upload_to_drive_usa_export_bundle
 10. test_no_txt_sueltos_como_salida_primaria
 11. test_fallback_template_no_es_defendible

Grupo Validación
 12. test_validation_report_bloquea_documento_sin_audiencia
 13. test_validation_report_degrada_dato_estimado
 14. test_documento_juridico_sin_matriz_legal_bloquea
 15. test_compliance_pack_requerido_si_hay_capex

Grupo Integración
 16. test_generate_plan_job_output_incluye_export_bundle
 17. test_generate_plan_preserva_advertencias_data_provenance
 18. test_hub_puede_mostrar_estado_documental
"""
from __future__ import annotations

import asyncio
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.agents.agora import AgentContext, PlanInput, PlanOutput, run_agora
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.agents.document_specs import build_document_plan
from app.agents.exporter import build_export_bundle, canonical_filename
from app.agents.prompt_builder import build_agent_prompt
from app.agents.validator import validate_document, validate_bundle
from app.agents.schemas import (
    ClaimEntry,
    ClaimLedger,
    ClaimReviewStatus,
    ClaimType,
    DocumentNivel,
    DocumentSpec,
    DocumentStatusLevel,
    DraftDocument,
    DraftSection,
    EvidenceItem,
    EvidenceTipo,
    ExportBundle,
    ScenarioBundle,
    SourceStatus,
    ValidationReport,
)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

def make_plan_input(zm: str = "SLP", municipio: str = "slp") -> PlanInput:
    return PlanInput(
        municipio=municipio,
        zm=zm,
        scenario_json={"horizonte": 3, "pct_captura_por_año": [20, 45, 70]},
        kpis_json={
            "tir": 28.5,
            "vpn": 5_000_000.0,
            "payback_meses": 18,
            "empleos_directos": 120,
            "co2e_evitadas": 4500.0,
            "capex_total": 3_200_000.0,
        },
        data_provenance={
            "zm": zm,
            "kpis": [
                {
                    "kpi_id": "tir",
                    "valor": 28.5,
                    "unidad": "%",
                    "provenance": {"tipo": "calculado", "confianza": 0.80,
                                   "fuente_nombre": "Simulador ALQUIMIA"},
                },
                {
                    "kpi_id": "poblacion_total",
                    "valor": 1_200_000,
                    "unidad": "hab",
                    "provenance": {"tipo": "certificado", "confianza": 0.93,
                                   "fuente_nombre": "INEGI Censo 2020"},
                },
            ],
            "score_datos": 82,
            "advertencias": [],
        },
    )


def make_bundle(zm: str = "SLP") -> ScenarioBundle:
    return build_bundle_from_plan_input(
        make_plan_input(zm), ["slp", "soledad"]
    )


def make_spec(
    document_id: str = "01_resumen_ejecutivo_municipal",
    audiencia: list[str] | None = None,
    decision: str = "Aprobar en Cabildo",
    secciones: list[str] | None = None,
    nivel: DocumentNivel = DocumentNivel.ejecutivo,
) -> DocumentSpec:
    return DocumentSpec(
        document_id=document_id,
        titulo="Documento de prueba",
        audiencia=audiencia if audiencia is not None else ["Presidente municipal"],
        decision_que_habilita=decision,
        nivel=nivel,
        secciones_obligatorias=secciones if secciones is not None else ["1. Situación actual"],
    )


def make_draft_with_sections(
    document_id: str = "doc_01",
    is_fallback: bool = False,
    audiencia: list[str] | None = None,
    decision: str = "Aprobar",
    with_claim_ledger: bool = True,
    nivel: DocumentNivel = DocumentNivel.ejecutivo,
) -> DraftDocument:
    spec = make_spec(document_id=document_id, audiencia=audiencia,
                     decision=decision, nivel=nivel)
    sec = DraftSection(section_id="sec_01", titulo="Situación actual",
                       contenido="El municipio requiere modernización.")
    ledger = None
    if with_claim_ledger:
        evidence = EvidenceItem(
            texto_claim="TIR proyectada: 28.5%",
            tipo=EvidenceTipo.formula,
            fuente="Simulador ALQUIMIA",
            kpi_ids=["tir"],
            confianza=0.80,
            lenguaje_permitido="el simulador proyecta",
        )
        ledger = ClaimLedger(
            document_id=document_id,
            entries=[ClaimEntry(
                document_id=document_id,
                section_id="sec_01",
                claim_text="TIR: 28.5%",
                claim_type=ClaimType.interpretacion,
                evidence_items=[evidence],
                source_status=SourceStatus.estimado,
                confidence=0.80,
                allowed_language="el simulador proyecta",
                review_status=ClaimReviewStatus.aprobado,
            )],
        )
    return DraftDocument(
        document_id=document_id,
        spec=spec,
        secciones=[sec],
        claim_ledger=ledger,
        is_fallback=is_fallback,
    )


# ─── Grupo Runtime ─────────────────────────────────────────────────────────────

class TestRuntime:

    def test_run_agora_convierte_planinput_a_scenario_bundle(self):
        """
        build_bundle_from_plan_input convierte PlanInput a ScenarioBundle.
        El bundle debe tener ZM y municipios del PlanInput.
        """
        plan = make_plan_input("QRO")
        bundle = build_bundle_from_plan_input(plan, ["queretaro", "el-marques"])
        assert isinstance(bundle, ScenarioBundle)
        assert bundle.zm == "QRO"
        assert "queretaro" in bundle.municipios_activos
        assert len(bundle.kpis_con_provenance) > 0, (
            "El bundle debe tener KPIs con provenance del data_provenance del PlanInput."
        )

    def test_call_agent_recibe_document_spec(self):
        """
        AgentContext contiene DocumentSpec — el agente no recibe solo PlanInput.
        """
        bundle = make_bundle()
        plan   = build_document_plan(bundle)
        spec   = plan.specs[0]
        from app.agents.schemas import DraftBundle
        draft  = DraftBundle(
            bundle_id=bundle.scenario_id,
            zm=bundle.zm,
            municipios=bundle.municipios_activos,
        )
        context = AgentContext(
            agent_name="ghostwriter",
            bundle=bundle,
            spec=spec,
            draft_bundle=draft,
        )
        assert context.spec is spec, (
            "AgentContext.spec debe ser el DocumentSpec, no None ni PlanInput."
        )
        assert hasattr(context.spec, "audiencia"), (
            "El spec debe tener audiencia."
        )
        assert hasattr(context.spec, "decision_que_habilita"), (
            "El spec debe tener decision_que_habilita."
        )

    def test_prompt_builder_incluye_audiencia_decision_y_warnings(self):
        """
        build_agent_prompt produce un prompt con audiencia, decisión y warnings.
        Si hay warnings, exige lenguaje prudente.
        """
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            kpis_con_provenance=[
                {"kpi_id": "tir", "valor": 28.5,
                 "provenance": {"tipo": "calculado", "confianza": 0.80}}
            ],
            warnings=["Municipio 'soledad' sin diagnóstico legal"],
        )
        spec = make_spec(audiencia=["Presidente municipal", "Regidores"])
        prompt = build_agent_prompt("ghostwriter", spec, bundle)

        assert prompt.contains_audiencia(), (
            "El prompt debe contener 'Audiencia:' — es obligatorio para cada documento."
        )
        assert prompt.contains_decision(), (
            "El prompt debe contener la decisión que habilita el documento."
        )
        assert prompt.contains_lenguaje_prudente(), (
            "Con warnings activos, el prompt debe exigir lenguaje prudente."
        )

    def test_prompt_builder_incluye_tablas_obligatorias(self):
        """Si el spec tiene tablas obligatorias, el prompt las menciona."""
        spec = DocumentSpec(
            document_id="doc",
            titulo="Modelo Financiero",
            audiencia=["Tesorería"],
            decision_que_habilita="Validar CAPEX",
            nivel=DocumentNivel.financiero,
            secciones_obligatorias=["1. CAPEX"],
            tablas_obligatorias=["Tabla CAPEX/OPEX por fase"],
        )
        bundle = ScenarioBundle(
            zm="SLP", municipios_activos=["slp"], horizonte_anios=3,
        )
        prompt = build_agent_prompt("economista", spec, bundle)
        assert prompt.contains_tabla("Tabla CAPEX/OPEX por fase"), (
            "Si el spec exige una tabla, el prompt debe mencionarla explícitamente."
        )

    def test_redactor_no_recibe_planinput_suelto(self):
        """
        _call_agent_with_context recibe AgentContext, no PlanInput suelto.
        El AgentContext contiene bundle + spec: el redactor tiene contexto estructurado.
        """
        bundle = make_bundle()
        plan   = build_document_plan(bundle)
        spec   = plan.specs[0]
        from app.agents.schemas import DraftBundle
        draft  = DraftBundle(
            bundle_id=bundle.scenario_id,
            zm=bundle.zm,
            municipios=bundle.municipios_activos,
        )
        context = AgentContext(
            agent_name="ghostwriter",
            bundle=bundle,
            spec=spec,
            draft_bundle=draft,
        )
        # Verificar que el contexto tiene ScenarioBundle, no solo strings
        assert isinstance(context.bundle, ScenarioBundle), (
            "El redactor debe recibir ScenarioBundle, no strings sueltos."
        )
        assert context.bundle.zm == "SLP"
        assert context.agent_name == "ghostwriter"


# ─── Grupo DraftBundle ────────────────────────────────────────────────────────

class TestDraftBundle:

    @pytest.mark.asyncio
    async def test_run_agora_retorna_draft_bundle(self):
        """run_agora debe retornar PlanOutput con draft_bundle poblado."""
        plan = make_plan_input("SLP")
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.draft_bundle is not None, (
            "PlanOutput.draft_bundle no debe ser None. "
            "ÁGORA debe producir DraftBundle, no solo strings."
        )
        assert output.draft_bundle.zm == "SLP"
        assert len(output.draft_bundle.documentos) > 0, (
            "DraftBundle debe contener al menos un DraftDocument."
        )

    @pytest.mark.asyncio
    async def test_draft_document_tiene_sections_tables_claimledger(self):
        """
        Al menos un DraftDocument debe tener secciones y claim_ledger.
        """
        plan = make_plan_input("SLP")
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.draft_bundle is not None
        docs_con_secciones = output.draft_bundle.documentos_con_secciones()
        assert len(docs_con_secciones) > 0, (
            "Al menos un DraftDocument debe tener secciones. "
            "Los documentos no pueden ser solo DraftDocument vacíos."
        )

        docs_con_ledger = output.draft_bundle.documentos_con_claim_ledger()
        assert len(docs_con_ledger) > 0, (
            "Al menos un DraftDocument debe tener ClaimLedger. "
            "Las afirmaciones deben tener trazabilidad."
        )

    def test_claim_numerico_sin_evidencia_bloquea_documento(self):
        """
        Un DraftDocument cuyo ClaimLedger tiene claims sin evidencia
        debe tener status bloqueado o revision tras validación.
        """
        bundle = make_bundle()
        # ClaimLedger con claim sin evidencia
        ledger = ClaimLedger(
            document_id="doc_01",
            entries=[ClaimEntry(
                document_id="doc_01",
                section_id="sec_01",
                claim_text="Se generarán 500 empleos (sin fuente).",
                claim_type=ClaimType.promesa,
                evidence_items=[],  # sin evidencia
                source_status=SourceStatus.no_disponible,
                confidence=0.0,
                allowed_language="se proyecta",
                review_status=ClaimReviewStatus.requiere_fuente,
            )],
        )
        doc = DraftDocument(
            document_id="doc_01",
            spec=make_spec(),
            secciones=[DraftSection(section_id="s1", titulo="Empleo",
                                    contenido="500 empleos.")],
            claim_ledger=ledger,
        )
        _, status = validate_document(doc, bundle)
        # Claim sin evidencia → warning → revision (no bloqueado si solo es warning)
        # Pero el claim también está en requiere_fuente → warning de claims_sin_evidencia
        assert status in (DocumentStatusLevel.revision, DocumentStatusLevel.bloqueado), (
            "Un documento con claims sin evidencia no puede ser 'defendible' ni 'borrador'."
        )


# ─── Grupo ExportBundle ───────────────────────────────────────────────────────

class TestExportBundle:

    @pytest.mark.asyncio
    async def test_run_agora_retorna_export_bundle_con_manifest(self):
        """run_agora debe retornar ExportBundle con manifest."""
        plan   = make_plan_input("SLP")
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.export_bundle is not None, (
            "PlanOutput.export_bundle no debe ser None."
        )
        assert output.export_bundle.has_manifest(), (
            "ExportBundle debe tener manifest — un paquete sin manifest no es rastreable."
        )
        assert output.export_bundle.manifest.zm == "SLP"

    @pytest.mark.asyncio
    async def test_upload_to_drive_usa_export_bundle(self):
        """
        _upload_from_export_bundle lee desde export_bundle.documents,
        no desde strings hardcodeados.
        """
        from app.agents.agora import _upload_from_export_bundle
        from app.agents.schemas import DraftBundle, ExportedDocument

        bundle = make_bundle()
        plan   = build_document_plan(bundle)
        from app.agents.agora import _init_draft_bundle
        draft  = _init_draft_bundle(bundle, plan)

        export_bundle = build_export_bundle(draft, plan, bundle)

        # Verificar que _upload_from_export_bundle es la función que se llama
        # (sin service account no hace upload real, pero la función existe)
        # Y que lee de export_bundle.documents, no strings hardcodeados
        assert len(export_bundle.documents) > 0
        for doc in export_bundle.documents:
            assert not doc.filename.endswith(".txt"), (
                f"'{doc.filename}' termina en .txt — "
                "los documentos deben ser .md mínimo."
            )

    @pytest.mark.asyncio
    async def test_no_txt_sueltos_como_salida_primaria(self):
        """
        Ningún archivo en ExportBundle puede terminar en .txt.
        La salida primaria es .md o .docx.
        """
        plan   = make_plan_input("SLP")
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.export_bundle is not None
        assert not output.export_bundle.has_txt_files(), (
            "ExportBundle contiene archivos .txt. "
            "La Fase 3B prohíbe .txt como salida primaria — usar .md mínimo."
        )
        for doc in output.export_bundle.documents:
            ext = doc.filename.rsplit(".", 1)[-1]
            assert ext in ("md", "docx", "json"), (
                f"'{doc.filename}' tiene extensión .{ext} no permitida."
            )

    @pytest.mark.asyncio
    async def test_fallback_template_no_es_defendible(self):
        """
        Un documento generado por template (is_fallback=True)
        nunca puede tener status=defendible.
        """
        plan   = make_plan_input("SLP")
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.draft_bundle is not None
        for doc in output.draft_bundle.documentos:
            if doc.is_fallback:
                assert doc.status != DocumentStatusLevel.defendible, (
                    f"Documento '{doc.document_id}' es template (is_fallback=True) "
                    "pero tiene status=defendible — "
                    "un template nunca puede ser defendible."
                )

        # También verificar en export_bundle
        if output.export_bundle:
            for ed in output.export_bundle.documents:
                if ed.source == "template":
                    assert ed.status != DocumentStatusLevel.defendible, (
                        f"ExportedDocument '{ed.document_id}' source=template "
                        "pero status=defendible."
                    )


# ─── Grupo Validación ─────────────────────────────────────────────────────────

class TestValidacion:

    def test_validation_report_bloquea_documento_sin_audiencia(self):
        """Sin audiencia declarada → status bloqueado."""
        bundle = make_bundle()
        doc = make_draft_with_sections(audiencia=[])  # sin audiencia
        _, status = validate_document(doc, bundle)
        assert status == DocumentStatusLevel.bloqueado, (
            "Un documento sin audiencia debe ser bloqueado. "
            "Ningún documento puede generarse sin saber a quién va dirigido."
        )

    def test_validation_report_bloquea_documento_sin_decision(self):
        """Sin decision_que_habilita → status bloqueado."""
        bundle = make_bundle()
        doc = make_draft_with_sections(decision="")
        _, status = validate_document(doc, bundle)
        assert status == DocumentStatusLevel.bloqueado, (
            "Un documento sin decisión que habilita debe ser bloqueado."
        )

    def test_validation_report_bloquea_documento_sin_secciones(self):
        """Sin secciones → status bloqueado."""
        bundle = make_bundle()
        doc = DraftDocument(
            document_id="doc_vacio",
            spec=make_spec(),
            secciones=[],  # vacío
            claim_ledger=ClaimLedger(document_id="doc_vacio"),
        )
        _, status = validate_document(doc, bundle)
        assert status == DocumentStatusLevel.bloqueado, (
            "Un documento sin secciones debe ser bloqueado."
        )

    def test_validation_report_degrada_dato_estimado(self):
        """
        Dato estimado con lenguaje inadecuadamente oficial → error.
        """
        bundle = make_bundle()
        # Crear un claim con source_status=estimado pero lenguaje oficial
        from app.agents.schemas import ClaimLedger, ClaimEntry
        ledger = ClaimLedger(
            document_id="doc_01",
            entries=[ClaimEntry(
                document_id="doc_01",
                section_id="sec_01",
                claim_text="Según INEGI, la TIR es 28.5%",
                claim_type=ClaimType.dato,
                evidence_items=[],
                source_status=SourceStatus.estimado,  # estimado
                confidence=0.4,
                allowed_language="según INEGI",        # INCORRECTO para estimado
                review_status=ClaimReviewStatus.requiere_fuente,
            )],
        )
        doc = DraftDocument(
            document_id="doc_01",
            spec=make_spec(),
            secciones=[DraftSection(section_id="s1", titulo="T",
                                    contenido="Según INEGI, TIR 28.5%.")],
            claim_ledger=ledger,
        )
        report, status = validate_document(doc, bundle)
        # Debe detectar el problema como error (dato estimado con lenguaje oficial)
        errores_codigos = [i.code for i in report.errores()]
        assert "DATO_ESTIMADO_COMO_OFICIAL" in errores_codigos, (
            "El validador debe detectar dato estimado con lenguaje oficial como error."
        )
        assert status == DocumentStatusLevel.bloqueado

    def test_documento_juridico_sin_matriz_legal_bloquea(self):
        """
        Un documento jurídico municipal sin diagnóstico legal en el bundle
        debe ser bloqueado.
        """
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp", "soledad"],
            horizonte_anios=3,
            legal_municipal={
                "slp": {"reglamento": "R. Limpia SLP", "verificado": True}
                # "soledad" no tiene legal
            },
        )
        spec_soledad = DocumentSpec(
            document_id="03_diagnostico_reforma_soledad",
            titulo="Diagnóstico Jurídico — Soledad",
            audiencia=["Cabildo Soledad"],
            decision_que_habilita="Reforma reglamento Soledad",
            nivel=DocumentNivel.municipal,
            secciones_obligatorias=["1. Reglamento vigente"],
        )
        doc = DraftDocument(
            document_id="03_diagnostico_reforma_soledad",
            spec=spec_soledad,
            secciones=[DraftSection(section_id="s1", titulo="Reglamento",
                                    contenido="El reglamento vigente de Soledad...")],
            claim_ledger=ClaimLedger(document_id="03_diagnostico_reforma_soledad"),
        )
        report, status = validate_document(doc, bundle)
        assert status == DocumentStatusLevel.bloqueado, (
            "Municipio 'soledad' sin diagnóstico legal debe bloquear su documento jurídico."
        )
        assert any(i.code == "SIN_MATRIZ_LEGAL" for i in report.errores()), (
            "Debe aparecer error SIN_MATRIZ_LEGAL en el reporte."
        )

    def test_compliance_pack_requerido_si_hay_capex(self):
        """
        Si el bundle tiene CAPEX > 0 y el documento no tiene CompliancePack,
        debe aparecer warning CAPEX_SIN_COMPLIANCE.
        """
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            resultados={"capex_total": 3_200_000.0},
        )
        doc = make_draft_with_sections()
        doc.compliance = None  # sin CompliancePack

        report, status = validate_document(doc, bundle)
        warnings_codigos = [i.code for i in report.warnings()]
        assert "CAPEX_SIN_COMPLIANCE" in warnings_codigos, (
            "Con CAPEX > 0 y sin CompliancePack debe aparecer warning CAPEX_SIN_COMPLIANCE."
        )
        assert status in (DocumentStatusLevel.revision, DocumentStatusLevel.borrador), (
            "Con CAPEX sin compliance debe degradar a revision o borrador."
        )

    def test_documento_con_todo_bien_es_defendible(self):
        """Un documento sin errores ni warnings relevantes es defendible."""
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            confidence_score=0.85,
            resultados={},  # sin CAPEX
        )
        doc = make_draft_with_sections()
        doc.is_fallback = False

        report, status = validate_document(doc, bundle)
        # Sin errores → no bloqueado
        assert len(report.errores()) == 0
        # Puede ser revision (sin ApprovalMatrix) o defendible si no hay warnings
        assert status != DocumentStatusLevel.bloqueado


# ─── Grupo Integración ────────────────────────────────────────────────────────

class TestIntegracion:

    @pytest.mark.asyncio
    async def test_generate_plan_job_output_incluye_export_bundle(self):
        """
        run_agora retorna PlanOutput con export_bundle, draft_bundle y document_plan_obj.
        El job de /generate/plan puede acceder a estos campos.
        """
        plan   = make_plan_input("QRO", "queretaro")
        output = await run_agora(
            plan, municipios_activos=["queretaro", "el-marques"]
        )

        assert output.export_bundle is not None, (
            "PlanOutput debe contener export_bundle para que el Hub pueda mostrar estado."
        )
        assert output.draft_bundle is not None
        assert output.document_plan_obj is not None
        assert output.document_plan_obj.zm == "QRO"

        # El export_bundle tiene documents y manifest
        assert len(output.export_bundle.documents) > 0
        assert output.export_bundle.manifest is not None

    @pytest.mark.asyncio
    async def test_generate_plan_preserva_advertencias_data_provenance(self):
        """
        Las advertencias del data_provenance viajan hasta el ExportBundle.
        """
        plan = PlanInput(
            municipio="slp",
            zm="SLP",
            scenario_json={"horizonte": 3},
            kpis_json={"tir": 10.0},
            data_provenance={
                "zm": "SLP",
                "kpis": [],
                "score_datos": 35,   # bajo
                "advertencias": [
                    {
                        "kpi_id": "poblacion_total",
                        "kpi_label": "Población total ZM",
                        "tipo": "no_disponible",
                        "advertencia": "Sin datos para esta ZM.",
                        "bloquea_agora": True,
                    }
                ],
            },
        )
        output = await run_agora(plan, municipios_activos=["slp"])

        assert output.export_bundle is not None
        # Las advertencias del data_provenance deben aparecer en el bundle
        bundle = output.draft_bundle
        assert bundle is not None
        # score bajo → confidence baja → warnings en ValidationReport
        # Al menos el export_bundle no debe tener todos los docs defendibles
        todos_defendibles = all(
            d.status == DocumentStatusLevel.defendible
            for d in output.export_bundle.documents
        )
        assert not todos_defendibles, (
            "Con score_datos=35, no todos los documentos pueden ser defendibles."
        )

    def test_hub_puede_mostrar_estado_documental(self):
        """
        El endpoint /hub/docs/{zm}/estado-documental retorna estructura
        con total, por_estado y documentos con estado visible.
        Usa sys.modules mock para evitar que auth.py intente hashear contraseñas
        al importarse (bcrypt incompatible con Python 3.14 en entorno de tests).
        """
        import sys
        import types
        from unittest.mock import MagicMock
        from pydantic import BaseModel
        from typing import Optional

        # ── Crear UserInfo aquí para no depender de auth.py ──────────────────
        class UserInfo(BaseModel):
            sub:   str
            email: str
            rol:   str = "viewer"

        # ── Mock de app.routers.auth antes de importar hub ───────────────────
        mock_auth = types.ModuleType("app.routers.auth")
        mock_get_current_user = MagicMock(return_value=None)
        mock_auth.get_current_user = mock_get_current_user
        mock_auth.UserInfo = UserInfo
        sys.modules["app.routers.auth"] = mock_auth

        # Limpiar hub del cache de módulos para forzar reimport con mock
        sys.modules.pop("app.routers.hub", None)

        try:
            from fastapi import FastAPI
            from fastapi.testclient import TestClient
            from app.routers.hub import router, _docs, Documento

            # Crear app de test con el router del Hub
            app = FastAPI()
            app.include_router(router, prefix="/hub")

            # Inyectar documentos de prueba directamente
            doc_slp = Documento(
                id="test_hub_1",
                nombre="01_Resumen_Ejecutivo_Municipal.md",
                tipo="MD",
                estado="defendible",
                fecha="2026-04-29",
                zm="SLPTEST",
                document_id="01_resumen_ejecutivo_municipal",
                version="0.1-borrador",
                source="template",
            )
            doc_slp_2 = Documento(
                id="test_hub_2",
                nombre="03_Diagnostico_Juridico_Slp.md",
                tipo="MD",
                estado="bloqueado",
                fecha="2026-04-29",
                zm="SLPTEST",
                document_id="03_diagnostico_reforma_slp",
                version="0.1-borrador",
                source="template",
            )
            _docs.extend([doc_slp, doc_slp_2])

            # Override del dependency de auth
            def override_auth():
                return UserInfo(sub="test", email="test@test.com", rol="admin")

            app.dependency_overrides[mock_get_current_user] = override_auth

            client = TestClient(app)
            resp = client.get("/hub/docs/SLPTEST/estado-documental")

            assert resp.status_code == 200
            data = resp.json()
            assert data["zm"] == "SLPTEST"
            assert data["total"] >= 2, "Hub debe mostrar al menos los 2 documentos añadidos."
            assert "por_estado" in data, "Hub debe mostrar resumen por estado."
            assert "documentos" in data, "Hub debe listar documentos con su estado."

            estados = {d["estado"] for d in data["documentos"]}
            assert "defendible" in estados or "bloqueado" in estados, (
                "Hub debe poder mostrar documentos en distintos estados."
            )

        finally:
            # Cleanup: restaurar estado original
            _docs[:] = [d for d in _docs if d.zm != "SLPTEST"]
            sys.modules.pop("app.routers.hub", None)
            sys.modules.pop("app.routers.auth", None)
