import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.education.domestic import calculate_domestic_education
from app.education.router import router
from app.education.schemas import DataSource, HouseholdEducationRequest, PropertyType


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/education")
    return TestClient(app)


def _source(confidence: float = 0.8) -> DataSource:
    return DataSource(
        source_id="municipal-rsu-hogar-test",
        name="Medicion municipal de generacion domiciliaria",
        organization="Direccion municipal de servicios publicos",
        source_type="medicion_municipal",
        unit="kg/persona/dia",
        confidence=confidence,
        explanation="Dato de prueba con unidad declarada para calculadora domestica.",
    )


@pytest.mark.parametrize("property_type", list(PropertyType))
def test_tipo_predio_genera_recomendacion_distinta(property_type):
    result = calculate_domestic_education(
        HouseholdEducationRequest(
            property_type=property_type,
            household_members=4,
            days=7,
            generation_kg_per_person_day=0.9,
            source=_source(),
        )
    )

    assert result.status == "ready"
    assert result.recommendation is not None
    assert result.recommendation.property_type == property_type
    assert result.recommendation.where_to_place


def test_casa_edificio_condominio_residencial_no_comparten_misma_guia():
    titles = {
        property_type: calculate_domestic_education(
            HouseholdEducationRequest(
                property_type=property_type,
                household_members=3,
                generation_kg_per_person_day=0.9,
                source=_source(),
            )
        ).recommendation.title
        for property_type in PropertyType
    }

    assert len(set(titles.values())) == 4


def test_calculo_con_fuente_valida_incluye_formula_unidad_confianza_y_fuente():
    result = calculate_domestic_education(
        HouseholdEducationRequest(
            property_type=PropertyType.casa,
            household_members=4,
            days=7,
            generation_kg_per_person_day=0.9,
            source=_source(0.83),
        )
    )

    assert result.status == "ready"
    assert result.total_generation_kg == pytest.approx(25.2)
    assert result.unit == "kg/periodo"
    assert result.source.confidence == 0.83
    assert result.calculation_annex
    first = result.calculation_annex[0]
    assert first.calculation_name
    assert first.formula == "personas_en_hogar * kg_por_persona_dia * dias"
    assert first.unit == "kg/periodo"
    assert first.source.source_id == "municipal-rsu-hogar-test"
    assert first.explanation


def test_falta_dato_critico_bloquea_sin_inventar_numero():
    result = calculate_domestic_education(
        HouseholdEducationRequest(
            property_type=PropertyType.edificio,
            household_members=None,
            source=_source(),
        )
    )

    assert result.status == "blocked"
    assert result.total_generation_kg is None
    assert result.categories == []
    assert result.calculation_annex == []
    assert result.blockers
    assert result.next_action


def test_fuente_sin_confianza_bloquea_calculo():
    result = calculate_domestic_education(
        HouseholdEducationRequest(
            property_type=PropertyType.condominio,
            household_members=4,
            generation_kg_per_person_day=0.9,
            source=_source(0),
        )
    )

    assert result.status == "blocked"
    assert "fuente valida" in " ".join(result.blockers).lower()


def test_sin_generacion_declarada_usa_referencia_con_warning_trazable():
    result = calculate_domestic_education(
        HouseholdEducationRequest(
            property_type=PropertyType.residencial,
            household_members=4,
        )
    )

    assert result.status == "warning"
    assert result.total_generation_kg is not None
    assert result.warnings
    assert result.source is not None
    assert result.source.organization == "SEMARNAT DBGIR"
    assert result.calculation_annex[0].source.source_id == result.source.source_id


def test_texto_no_usa_lenguaje_de_multa_sancion_u_obligacion_legal():
    for property_type in PropertyType:
        result = calculate_domestic_education(
            HouseholdEducationRequest(
                property_type=property_type,
                household_members=4,
                generation_kg_per_person_day=0.9,
                source=_source(),
            )
        )

        text = " ".join(
            [
                result.result_help_text,
                result.chart_help_text,
                result.recommendation.why,
                result.recommendation.not_legal_obligation,
                " ".join(result.recommendation.where_to_place),
                " ".join(category.help_text for category in result.categories),
            ]
        ).lower()
        for forbidden in ("multa", "sancion", "infraccion", "castigo", "obligacion legal"):
            assert forbidden not in text
        assert "residuos peligrosos" in result.result_help_text


def test_endpoint_domestic_calculator_observable():
    response = _client().post(
        "/education/domestic-calculator",
        json={
            "property_type": "condominio",
            "household_members": 5,
            "days": 7,
            "generation_kg_per_person_day": 0.8,
            "source": _source().model_dump(),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["property_type"] == "condominio"
    assert payload["total_generation_kg"] == pytest.approx(28.0)
    assert payload["chart_help_text"]
    assert payload["calculation_annex"]
    assert payload["recommendation"]["where_to_place"]
