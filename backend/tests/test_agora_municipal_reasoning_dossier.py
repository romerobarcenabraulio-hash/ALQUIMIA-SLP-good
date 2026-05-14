"""Contrato de expediente municipal razonado para AGORA."""
from __future__ import annotations

import asyncio

import pytest

from app.agents.agora import PlanInput, run_agora
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.agents.dossier import build_municipal_reasoning_dossier
from app.agents.prompt_builder import build_agent_prompt
from app.agents.schemas import (
    ClaimClassification,
    DocumentNivel,
    DocumentSpec,
    DossierStatus,
    MunicipalReasoningDossier,
    ScenarioBundle,
)


def _spec() -> DocumentSpec:
    return DocumentSpec(
        document_id="01_expediente",
        titulo="Expediente municipal de circularidad",
        audiencia=["Cabildo"],
        decision_que_habilita="Decidir ruta de validación del expediente",
        nivel=DocumentNivel.ejecutivo,
        secciones_obligatorias=["Resumen", "Fuentes", "Logística"],
    )


def _plan_input(**overrides) -> PlanInput:
    data = {
        "municipio": "slp",
        "zm": "SLP",
        "scenario_json": {"horizonte": 3},
        "kpis_json": {"rsu_ton_dia": 577.8},
        "data_provenance": {
            "score_datos": 80,
            "kpis": [
                {
                    "kpi_id": "poblacion_total",
                    "valor": 912871,
                    "unidad": "hab",
                    "provenance": {
                        "tipo": "certificado",
                        "confianza": 0.93,
                        "fuente_nombre": "INEGI Censo 2020",
                    },
                },
                {
                    "kpi_id": "rsu_ton_dia",
                    "valor": 577.8,
                    "unidad": "t/dia",
                    "provenance": {
                        "tipo": "calculado",
                        "confianza": 0.70,
                        "fuente_nombre": "Simulador ALQUIMIA",
                    },
                },
            ],
            "advertencias": [],
        },
        "operations_summary": {
            "status": "ready",
            "route_id": "ruta-1",
            "capacity": "580 t/día",
            "responsable": "Servicios Públicos Municipales",
            "warnings": [],
        },
    }
    data.update(overrides)
    return PlanInput(**data)


def test_dossier_contract_exige_expediente_no_documento_suelto():
    bundle = build_bundle_from_plan_input(_plan_input(), ["slp"])
    dossier = build_municipal_reasoning_dossier(bundle)

    assert isinstance(dossier, MunicipalReasoningDossier)
    assert dossier.municipios == ["slp"]
    assert dossier.thesis
    assert dossier.source_epistemology
    assert dossier.logistics.waves
    assert dossier.esg_public_value.environmental
    assert dossier.enabled_decisions
    assert "No es dictamen" in " ".join(dossier.esg_public_value.limitations)


def test_dossier_clasifica_claims_por_fuente_y_modelo():
    bundle = build_bundle_from_plan_input(_plan_input(), ["slp"])
    dossier = build_municipal_reasoning_dossier(bundle)
    classifications = {claim.classification for claim in dossier.claims}

    assert ClaimClassification.fuente_verificada in classifications
    assert ClaimClassification.estimacion_modelo in classifications
    assert any("INEGI" in claim.source for claim in dossier.claims)


def test_dossier_bloquea_o_condiciona_logistica_sin_blueprint():
    bundle = build_bundle_from_plan_input(
        _plan_input(operations_summary=None),
        ["slp"],
    )
    dossier = build_municipal_reasoning_dossier(bundle)

    assert dossier.status in {DossierStatus.needs_verification, DossierStatus.blocked}
    assert dossier.logistics.status == DossierStatus.needs_verification
    assert any("LogisticsBlueprint" in blocker for wave in dossier.logistics.waves for blocker in wave.blockers)
    assert any("ruta logística" in objection.objection for objection in dossier.critical_objections.objections)


def test_dossier_no_permuta_zm_por_municipio():
    bundle = build_bundle_from_plan_input(_plan_input(zm="ZM SLP"), ["slp", "sol"])
    dossier = build_municipal_reasoning_dossier(bundle)

    assert dossier.zm == "ZM SLP"
    assert dossier.municipios == ["slp", "sol"]
    assert {wave.municipio_id for wave in dossier.logistics.waves} == {"slp", "sol"}
    assert all(report.municipio_id in {"slp", "sol"} for report in dossier.source_epistemology)


def test_prompt_builder_inyecta_dossier_antes_de_redactar():
    bundle = build_bundle_from_plan_input(_plan_input(), ["slp"])
    dossier = build_municipal_reasoning_dossier(bundle)
    bundle.inputs_usuario["municipal_reasoning_dossier"] = dossier.model_dump(mode="json")

    prompt = build_agent_prompt("ghostwriter", _spec(), bundle)
    text = prompt.full_prompt()

    assert "MunicipalReasoningDossier disponible" in text
    assert "claims bloqueados del expediente" in text or "siguientes acciones del expediente" in text
    assert "ruta logística" in text


def test_run_agora_construye_dossier_antes_de_documentos():
    async def _run() -> None:
        output = await run_agora(_plan_input(), municipios_activos=["slp"])
        assert output.municipal_reasoning_dossier is not None
        assert output.draft_bundle is not None
        assert output.draft_bundle.municipal_reasoning_dossier is not None
        assert output.draft_bundle.municipal_reasoning_dossier.dossier_id == output.municipal_reasoning_dossier.dossier_id

    asyncio.run(_run())
