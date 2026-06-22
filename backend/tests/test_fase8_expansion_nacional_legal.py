"""Fase 8 - expansion nacional legal municipio por municipio."""
from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.agents.agora import PlanInput
from app.agents.bundle_builder import build_bundle_from_plan_input
from app.legal.repository import get_repo
from app.national.catalog import add_or_update_profile, get_profile, list_zm_municipios
from app.national.coverage import coverage_for_municipio, coverage_for_zm, legal_source_for_municipio
from app.national.router import router
from app.national.schemas import LegalSource, MunicipioProfile, SourceStatus


def test_qro_mty_slp_se_representan_como_municipios_no_entidad_unica():
    assert list_zm_municipios("SLP") == ["slp", "sol", "csp", "vip"]
    assert list_zm_municipios("QRO") == ["qro", "cor", "mar", "hui"]
    assert "mty" in list_zm_municipios("MTY")
    assert len(list_zm_municipios("MTY")) > 1


def test_una_zm_no_desbloquea_legal_para_todos():
    coverage = coverage_for_zm("QRO")
    statuses = {c.municipio_id: c.legal for c in coverage}

    assert statuses["qro"] == SourceStatus.verificado
    assert statuses["cor"] == SourceStatus.verificado
    assert statuses["mar"] != SourceStatus.verificado
    assert any(c.agora_bloqueado for c in coverage if c.municipio_id == "mar")


def test_pdf_en_un_municipio_no_desbloquea_otro_en_zm():
    qro = coverage_for_municipio("qro")
    mar = coverage_for_municipio("mar")

    assert qro.legal == SourceStatus.verificado
    assert mar.legal != SourceStatus.verificado
    assert mar.agora_bloqueado


def test_pdf_monterrey_no_desbloquea_san_nicolas_sin_catalogo():
    mty = coverage_for_municipio("mty")
    snl = coverage_for_municipio("snl")

    assert mty.legal == SourceStatus.verificado
    assert snl.legal != SourceStatus.verificado
    assert snl.agora_bloqueado


def test_documento_juridico_requiere_municipio_especifico():
    slp_source = legal_source_for_municipio("slp")
    sol_source = legal_source_for_municipio("sol")

    assert slp_source is not None
    assert sol_source is not None
    assert slp_source.municipio_id == "slp"
    assert sol_source.municipio_id == "sol"
    assert slp_source.legal_source_id != sol_source.legal_source_id


def test_legal_source_requiere_fuente_version_fecha_checksum():
    with pytest.raises(ValueError):
        LegalSource(
            legal_source_id="bad",
            municipio_id="x",
            titulo="Reglamento sin version",
            tipo="reglamento",
            fuente="",
            fecha_publicacion="",
            version="",
            checksum="",
            status=SourceStatus.localizado,
            articulos_indexados=0,
        )


def test_municipio_sin_legal_queda_bloqueado_o_degradado():
    hui = coverage_for_municipio("hui")

    assert hui.legal in (SourceStatus.no_disponible, SourceStatus.localizado)
    assert hui.agora_bloqueado
    assert hui.bloqueos


def test_coverage_status_refleja_campos_faltantes():
    csp = coverage_for_municipio("csp")

    assert csp.presupuesto == SourceStatus.no_disponible
    assert csp.contrato == SourceStatus.no_disponible
    assert csp.operacion == SourceStatus.estimado
    assert csp.siguiente_accion


def test_agora_recibe_municipios_separados():
    coverages = [c.model_dump(mode="json") for c in coverage_for_zm("SLP")]
    profiles = [get_profile(m).model_dump(mode="json") for m in list_zm_municipios("SLP") if get_profile(m)]
    sources = [
        s.model_dump(mode="json")
        for m in list_zm_municipios("SLP")
        if (s := legal_source_for_municipio(m)) is not None
    ]
    plan_input = PlanInput(
        municipio="slp",
        zm="SLP",
        scenario_json={"zm": "SLP"},
        kpis_json={},
        municipio_profiles=profiles,
        coverage_statuses=coverages,
        legal_sources=sources,
    )
    bundle = build_bundle_from_plan_input(plan_input, municipios_activos=["slp", "sol"])
    bundle.inputs_usuario["municipio_profiles"] = plan_input.municipio_profiles
    bundle.inputs_usuario["coverage_statuses"] = plan_input.coverage_statuses

    ids = {p["municipio_id"] for p in bundle.inputs_usuario["municipio_profiles"]}
    assert {"slp", "sol"}.issubset(ids)
    assert len(ids) > 1


def test_no_se_usan_documentos_historicos_slp_como_fuente_de_verdad():
    profile = get_profile("slp")
    source = legal_source_for_municipio("slp")

    assert profile is not None
    assert "historico" not in str(profile.data_provenance).lower()
    assert source is not None
    assert "_historico_pre_expansion" not in source.fuente


def test_se_puede_agregar_municipio_nuevo_sin_reescribir_codigo():
    profile = MunicipioProfile(
        municipio_id="testmun",
        clave_inegi="99001",
        nombre="Municipio Test",
        estado="SLP",
        zm_id="TST",
        data_provenance={"tipo": "manual", "fuente": "test"},
    )
    saved = add_or_update_profile(profile)

    assert saved.municipio_id == "testmun"
    assert get_profile("testmun") is not None
    assert "testmun" in list_zm_municipios("TST")


def test_endpoints_national_basicos():
    app = FastAPI()
    app.include_router(router, prefix="/national")
    client = TestClient(app)

    assert client.get("/national/estados").status_code == 200
    municipios = client.get("/national/zm/SLP/municipios")
    assert municipios.status_code == 200
    assert len(municipios.json()) == 4
    coverage = client.get("/national/legal/zm/QRO/coverage")
    assert coverage.status_code == 200
    assert len(coverage.json()) == 4
