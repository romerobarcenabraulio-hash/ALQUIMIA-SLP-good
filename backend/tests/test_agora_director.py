"""
Tests Fase 3 — Director de Paquete.

El Director decide qué documentos generar según el ScenarioBundle.
Estos tests protegen las reglas de negocio documentales críticas:

Grupo A — Siempre genera
  1. Siempre genera ejecutivo
  2. Siempre genera operativo
  3. Siempre genera guía ciudadana
  4. Con KPIs genera técnico-financiero
  5. Con snapshot o KPIs genera fuentes-trazabilidad

Grupo B — Por municipio
  6. Genera un documento jurídico por municipio con legal verificado
  7. No genera jurídico para municipio sin legal
  8. Genera advertencia cuando municipio no tiene legal
  9. Todos los specs jurídicos tienen document_id distinto (no mezcla municipios)

Grupo C — Capa metropolitana
 10. Genera metropolitano solo con ≥ 2 municipios
 11. No genera metropolitano con 1 municipio
 12. Metropolitano tiene ZM correcta

Grupo D — Bloqueos
 13. Sin KPIs no genera técnico-financiero (lo bloquea con warning)
 14. Sin snapshot ni KPIs no genera fuentes (lo bloquea con warning)
 15. Todos los specs del plan son válidos (tienen audiencia, decisión, secciones)

Grupo E — Prohibición de contaminación entre ZMs
 16. Plan SLP tiene municipios SLP, no QRO
 17. Plan QRO tiene municipios QRO, no SLP
 18. Spec jurídico de SLP tiene "slp" en document_id, no "queretaro"
"""
from __future__ import annotations

import pytest

from app.agents.schemas import (
    DocumentNivel,
    ScenarioBundle,
    DocumentPlan,
)
from app.agents.document_specs import (
    build_document_plan,
    DOC_EJECUTIVO,
    DOC_TECNICO_FINANCIERO,
    DOC_JURIDICO_PREFIX,
    DOC_METROPOLITANO,
    DOC_OPERATIVO,
    DOC_CIUDADANO,
    DOC_FUENTES,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_bundle_slp(num_municipios: int = 4) -> ScenarioBundle:
    municipios_slp = ["slp", "soledad", "cerro-gordo", "villa-de-reyes"][:num_municipios]
    legal = {m: {"reglamento": f"R. Limpia {m}", "verificado": True} for m in municipios_slp}
    return ScenarioBundle(
        zm="SLP",
        municipios_activos=municipios_slp,
        horizonte_anios=3,
        kpis_con_provenance=[
            {"kpi_id": "tir", "valor": 28.5, "provenance": {"tipo": "calculado", "confianza": 0.8}},
            {"kpi_id": "vpn", "valor": 5_000_000, "provenance": {"tipo": "calculado", "confianza": 0.8}},
        ],
        snapshot_datos={"zm": "SLP", "score_datos": 85},
        legal_municipal=legal,
        confidence_score=0.85,
    )


def make_bundle_qro() -> ScenarioBundle:
    municipios_qro = ["queretaro", "el-marques", "corregidora", "huimilpan"]
    legal = {m: {"reglamento": f"R. Limpia {m}", "verificado": True} for m in municipios_qro}
    return ScenarioBundle(
        zm="QRO",
        municipios_activos=municipios_qro,
        horizonte_anios=3,
        kpis_con_provenance=[
            {"kpi_id": "tir", "valor": 24.1, "provenance": {"tipo": "calculado", "confianza": 0.8}},
        ],
        snapshot_datos={"zm": "QRO", "score_datos": 78},
        legal_municipal=legal,
        confidence_score=0.80,
    )


def ids(plan: DocumentPlan) -> list[str]:
    return [s.document_id for s in plan.specs]


# ─── Grupo A — Siempre genera ─────────────────────────────────────────────────

class TestSiempreGenera:

    def test_siempre_genera_ejecutivo(self):
        plan = build_document_plan(make_bundle_slp())
        assert DOC_EJECUTIVO in ids(plan), (
            "El Director siempre debe generar el resumen ejecutivo."
        )

    def test_siempre_genera_operativo(self):
        plan = build_document_plan(make_bundle_slp())
        assert DOC_OPERATIVO in ids(plan), (
            "El Director siempre debe generar el manual operativo."
        )

    def test_siempre_genera_guia_ciudadana(self):
        plan = build_document_plan(make_bundle_slp())
        assert DOC_CIUDADANO in ids(plan), (
            "El Director siempre debe generar la guía ciudadana."
        )

    def test_con_kpis_genera_tecnico_financiero(self):
        plan = build_document_plan(make_bundle_slp())
        assert DOC_TECNICO_FINANCIERO in ids(plan), (
            "Con KPIs disponibles, debe generar el modelo técnico-financiero."
        )

    def test_con_snapshot_genera_fuentes(self):
        plan = build_document_plan(make_bundle_slp())
        assert DOC_FUENTES in ids(plan), (
            "Con snapshot de datos disponible, debe generar el anexo de fuentes."
        )

    def test_ejecutivo_tiene_nivel_ejecutivo(self):
        plan = build_document_plan(make_bundle_slp())
        spec = next(s for s in plan.specs if s.document_id == DOC_EJECUTIVO)
        assert spec.nivel == DocumentNivel.ejecutivo

    def test_ejecutivo_tiene_max_4_paginas(self):
        plan = build_document_plan(make_bundle_slp())
        spec = next(s for s in plan.specs if s.document_id == DOC_EJECUTIVO)
        assert spec.max_paginas is not None
        assert spec.max_paginas <= 4, (
            "El resumen ejecutivo debe poder leerse en ≤ 4 minutos → ≤ 4 páginas."
        )

    def test_ciudadano_tiene_nivel_ciudadano(self):
        plan = build_document_plan(make_bundle_slp())
        spec = next(s for s in plan.specs if s.document_id == DOC_CIUDADANO)
        assert spec.nivel == DocumentNivel.ciudadano

    def test_fuentes_tiene_nivel_tecnico(self):
        plan = build_document_plan(make_bundle_slp())
        spec = next(s for s in plan.specs if s.document_id == DOC_FUENTES)
        assert spec.nivel == DocumentNivel.tecnico


# ─── Grupo B — Por municipio ──────────────────────────────────────────────────

class TestPorMunicipio:

    def test_genera_juridico_por_municipio_con_legal(self):
        """Un DocumentSpec jurídico por municipio con legal verificado."""
        bundle = make_bundle_slp(num_municipios=4)
        plan = build_document_plan(bundle)

        juridicos = [s for s in plan.specs if s.nivel == DocumentNivel.municipal]
        municipios_con_legal = list(bundle.legal_municipal.keys())
        assert len(juridicos) == len(municipios_con_legal), (
            f"Deben generarse {len(municipios_con_legal)} specs jurídicos, "
            f"uno por municipio con legal verificado. Got {len(juridicos)}."
        )

    def test_no_genera_juridico_para_municipio_sin_legal(self):
        """Si un municipio no tiene legal, no se genera su documento jurídico."""
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp", "soledad"],
            horizonte_anios=3,
            kpis_con_provenance=[{"kpi_id": "tir", "valor": 28.0, "provenance": {}}],
            legal_municipal={"slp": {"reglamento": "R. Limpia SLP", "verificado": True}},
            # "soledad" NO tiene legal
        )
        plan = build_document_plan(bundle)
        juridico_ids = [s.document_id for s in plan.specs if s.nivel == DocumentNivel.municipal]
        assert f"{DOC_JURIDICO_PREFIX}_slp" in juridico_ids
        assert f"{DOC_JURIDICO_PREFIX}_soledad" not in juridico_ids, (
            "'soledad' no tiene legal verificado — no debe generarse su doc jurídico."
        )

    def test_genera_advertencia_para_municipio_sin_legal(self):
        """El plan debe contener advertencia para municipios sin legal."""
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp", "soledad"],
            horizonte_anios=3,
            kpis_con_provenance=[{"kpi_id": "tir", "valor": 28.0, "provenance": {}}],
            legal_municipal={"slp": {"reglamento": "R. Limpia SLP", "verificado": True}},
        )
        plan = build_document_plan(bundle)
        texto_warnings = " ".join(plan.warnings)
        assert "soledad" in texto_warnings, (
            "Debe aparecer advertencia indicando que 'soledad' no tiene diagnóstico legal."
        )

    def test_specs_juridicos_tienen_document_id_distinto(self):
        """Cada municipio tiene su propio document_id — no mezclar entre municipios."""
        bundle = make_bundle_slp(num_municipios=4)
        plan = build_document_plan(bundle)

        juridico_ids = [s.document_id for s in plan.specs if s.nivel == DocumentNivel.municipal]
        assert len(juridico_ids) == len(set(juridico_ids)), (
            "Todos los specs jurídicos deben tener document_id único. "
            "No se puede usar el mismo spec para dos municipios distintos."
        )

    def test_spec_juridico_tiene_municipio_en_id(self):
        """El document_id del spec jurídico contiene el municipio_id."""
        plan = build_document_plan(make_bundle_slp(num_municipios=1))
        juridicos = [s for s in plan.specs if s.nivel == DocumentNivel.municipal]
        assert len(juridicos) == 1
        assert "slp" in juridicos[0].document_id.lower(), (
            "El document_id del spec jurídico debe contener el municipio_id."
        )

    def test_spec_juridico_tiene_audiencia_con_municipio(self):
        """La audiencia del spec jurídico menciona al municipio."""
        plan = build_document_plan(make_bundle_slp(num_municipios=1))
        juridicos = [s for s in plan.specs if s.nivel == DocumentNivel.municipal]
        audiencia_texto = " ".join(juridicos[0].audiencia).lower()
        assert "slp" in audiencia_texto, (
            "La audiencia del spec jurídico debe mencionar el municipio específico."
        )


# ─── Grupo C — Capa metropolitana ────────────────────────────────────────────

class TestCapaMetropolitana:

    def test_genera_metropolitano_con_multiples_municipios(self):
        """Con ≥ 2 municipios activos, debe generarse capa metropolitana."""
        plan = build_document_plan(make_bundle_slp(num_municipios=4))
        assert DOC_METROPOLITANO in ids(plan), (
            "Con 4 municipios activos debe generarse la capa metropolitana."
        )

    def test_no_genera_metropolitano_con_un_municipio(self):
        """Con 1 municipio activo, NO debe generarse capa metropolitana."""
        plan = build_document_plan(make_bundle_slp(num_municipios=1))
        assert DOC_METROPOLITANO not in ids(plan), (
            "Con 1 municipio no se necesita coordinación metropolitana."
        )

    def test_metropolitano_tiene_zm_correcta(self):
        """El spec metropolitano tiene la ZM del bundle."""
        bundle = make_bundle_slp(num_municipios=4)
        plan = build_document_plan(bundle)
        spec = next((s for s in plan.specs if s.document_id == DOC_METROPOLITANO), None)
        assert spec is not None
        assert bundle.zm in spec.titulo, (
            f"El spec metropolitano debe mencionar la ZM '{bundle.zm}' en su título."
        )

    def test_metropolitano_tiene_nivel_metropolitano(self):
        plan = build_document_plan(make_bundle_slp(num_municipios=4))
        spec = next(s for s in plan.specs if s.document_id == DOC_METROPOLITANO)
        assert spec.nivel == DocumentNivel.metropolitano

    def test_metropolitano_no_sustituye_municipales(self):
        """
        El plan debe tener TANTO specs municipales COMO metropolitano.
        El metropolitano no reemplaza a los municipales.
        """
        plan = build_document_plan(make_bundle_slp(num_municipios=4))
        niveles = [s.nivel for s in plan.specs]
        assert DocumentNivel.municipal in niveles, (
            "Debe haber specs municipales aunque haya capa metropolitana."
        )
        assert DocumentNivel.metropolitano in niveles


# ─── Grupo D — Bloqueos ───────────────────────────────────────────────────────

class TestBloqueos:

    def test_sin_kpis_no_genera_tecnico_financiero(self):
        """Sin kpis_con_provenance, el modelo técnico-financiero se bloquea."""
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            kpis_con_provenance=[],  # vacío
            legal_municipal={"slp": {"reglamento": "R. Limpia SLP", "verificado": True}},
        )
        plan = build_document_plan(bundle)
        assert DOC_TECNICO_FINANCIERO not in ids(plan), (
            "Sin KPIs no puede generarse el modelo técnico-financiero."
        )
        # Debe haber advertencia de bloqueo
        assert any("BLOQUEADO" in w and "tecnico" in w.lower() for w in plan.warnings), (
            "Debe aparecer advertencia de bloqueo para el modelo técnico-financiero."
        )

    def test_sin_snapshot_ni_kpis_no_genera_fuentes(self):
        """Sin snapshot ni KPIs, el anexo de fuentes se bloquea."""
        bundle = ScenarioBundle(
            zm="SLP",
            municipios_activos=["slp"],
            horizonte_anios=3,
            kpis_con_provenance=[],
            snapshot_datos=None,
            legal_municipal={"slp": {"reglamento": "R. Limpia SLP", "verificado": True}},
        )
        plan = build_document_plan(bundle)
        assert DOC_FUENTES not in ids(plan), (
            "Sin snapshot ni KPIs no puede generarse el anexo de fuentes."
        )

    def test_todos_los_specs_del_plan_son_validos(self):
        """Todos los DocumentSpec incluidos en el plan deben ser válidos."""
        plan = build_document_plan(make_bundle_slp())
        invalidos = [s for s in plan.specs if not s.is_valid()]
        assert len(invalidos) == 0, (
            f"El Director no debe incluir specs inválidos en el plan. "
            f"Inválidos: {[s.document_id for s in invalidos]}"
        )

    def test_todos_los_specs_tienen_audiencia(self):
        """Todo spec generado por el Director tiene audiencia no vacía."""
        plan = build_document_plan(make_bundle_slp())
        for spec in plan.specs:
            assert spec.audiencia, (
                f"Spec '{spec.document_id}' tiene audiencia vacía. "
                "Ningún documento puede generarse sin audiencia declarada."
            )

    def test_todos_los_specs_tienen_decision(self):
        """Todo spec generado por el Director tiene decision_que_habilita."""
        plan = build_document_plan(make_bundle_slp())
        for spec in plan.specs:
            assert spec.decision_que_habilita, (
                f"Spec '{spec.document_id}' sin decision_que_habilita. "
                "Cada documento debe habilitar una decisión concreta."
            )


# ─── Grupo E — No contaminar entre ZMs ───────────────────────────────────────

class TestNoContaminacionEntreZMs:

    def test_plan_slp_tiene_municipios_slp(self):
        """El plan de SLP no debe contener municipios de QRO."""
        plan = build_document_plan(make_bundle_slp())
        assert plan.zm == "SLP"
        for municipio in plan.municipios:
            assert "queretaro" not in municipio.lower(), (
                f"Plan de SLP no debe contener municipio de QRO: {municipio}"
            )

    def test_plan_qro_tiene_municipios_qro(self):
        """El plan de QRO no debe contener municipios de SLP."""
        plan = build_document_plan(make_bundle_qro())
        assert plan.zm == "QRO"
        for municipio in plan.municipios:
            assert "soledad" not in municipio.lower(), (
                f"Plan de QRO no debe contener municipio de SLP: {municipio}"
            )

    def test_spec_juridico_slp_no_tiene_queretaro(self):
        """El spec jurídico de SLP no puede contaminar con datos de QRO."""
        plan = build_document_plan(make_bundle_slp(num_municipios=1))
        juridicos = [s for s in plan.specs if s.nivel == DocumentNivel.municipal]
        assert len(juridicos) >= 1
        for spec in juridicos:
            assert "queretaro" not in spec.document_id.lower()
            assert "queretaro" not in spec.titulo.lower()

    def test_zm_del_plan_coincide_con_zm_del_bundle(self):
        """La ZM del plan debe coincidir con la del bundle que lo generó."""
        for zm, bundle in [("SLP", make_bundle_slp()), ("QRO", make_bundle_qro())]:
            plan = build_document_plan(bundle)
            assert plan.zm == zm, (
                f"Plan construido desde bundle ZM={zm} debe tener plan.zm={zm}, "
                f"pero tiene {plan.zm}."
            )

    def test_planes_de_distintas_zm_tienen_bundle_ids_distintos(self):
        """Dos ScenarioBundles distintos generan bundle_ids distintos."""
        plan_slp = build_document_plan(make_bundle_slp())
        plan_qro = build_document_plan(make_bundle_qro())
        assert plan_slp.bundle_id != plan_qro.bundle_id, (
            "Cada ScenarioBundle debe tener scenario_id único."
        )
