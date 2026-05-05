from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.legal.schemas import LegalSourceValidationStatus
from app.operations.legal_gate import evaluate_legal_gated_action
from app.operations.legal_gate_schemas import (
    LegalGatedActionRequest,
    LegalGatedActionType,
    LegalGatedScope,
    WasteScope,
)
from app.operations.router import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/operations")
    return TestClient(app)


def _request(**overrides) -> LegalGatedActionRequest:
    data = {
        "action_type": LegalGatedActionType.educational_warning,
        "municipio_id": "slp",
        "geography_scope": LegalGatedScope.municipio,
        "route_or_zone_id": "Z1",
        "evidence_ids": ["ev-1"],
        "waste_scope": WasteScope.rsu_municipal,
    }
    data.update(overrides)
    return LegalGatedActionRequest(**data)


def test_advertencia_educativa_no_crea_multa():
    result = evaluate_legal_gated_action(_request())

    assert result.status == "ready"
    assert result.educational_warning is not None
    assert result.educational_warning.creates_fine is False
    assert result.due_process_gate.can_issue_educational_warning is True
    assert result.proposed_sanction is None


def test_inspeccion_no_crea_sancion_firme():
    result = evaluate_legal_gated_action(
        _request(action_type=LegalGatedActionType.inspection)
    )

    assert result.status == "ready"
    assert result.inspection is not None
    assert result.inspection.creates_firm_sanction is False
    assert result.proposed_sanction is None


def test_sancion_propuesta_requiere_base_legal_municipal_validada():
    result = evaluate_legal_gated_action(
        _request(
            action_type=LegalGatedActionType.proposed_sanction,
            municipio_id="mty",
            legal_source_municipio_id="mty",
            legal_basis_article_id="Art. 11",
            legal_validation_status=LegalSourceValidationStatus.validado_externamente,
        )
    )

    assert result.status == "ready"
    assert result.proposed_sanction is not None
    assert result.proposed_sanction.is_firm is False
    assert result.proposed_sanction.officiality == "propuesta_no_oficial"
    assert result.due_process_gate.can_propose_sanction is True


def test_municipio_sin_legal_validado_bloquea_sancion_pero_permite_educacion():
    sanction = evaluate_legal_gated_action(
        _request(
            action_type=LegalGatedActionType.proposed_sanction,
            municipio_id="slp",
            legal_source_municipio_id="slp",
            legal_basis_article_id="Art. 11",
        )
    )
    education = evaluate_legal_gated_action(
        _request(action_type=LegalGatedActionType.educational_warning, municipio_id="slp")
    )

    assert sanction.status == "blocked"
    assert "validada" in " ".join(sanction.blockers).lower()
    assert sanction.due_process_gate.can_propose_sanction is False
    assert education.status == "ready"
    assert education.due_process_gate.can_issue_educational_warning is True


def test_zm_no_desbloquea_municipio():
    result = evaluate_legal_gated_action(
        _request(
            action_type=LegalGatedActionType.proposed_sanction,
            municipio_id="SLP",
            geography_scope=LegalGatedScope.city_zm,
            legal_source_municipio_id="SLP",
            legal_basis_article_id="Art. 11",
            legal_validation_status=LegalSourceValidationStatus.validado_externamente,
        )
    )

    assert result.status == "blocked"
    assert "zm" in " ".join(result.blockers).lower()
    assert result.due_process_gate.can_propose_sanction is False


def test_documento_definitivo_queda_bloqueado():
    result = evaluate_legal_gated_action(
        _request(
            action_type=LegalGatedActionType.definitive_document,
            municipio_id="mty",
            competent_validation_explicit=True,
        )
    )

    assert result.status == "blocked"
    assert result.due_process_gate.can_create_definitive_document is False
    assert "documento definitivo" in " ".join(result.blockers).lower()


def test_no_usa_residuos_regulados_peligrosos_o_especiales():
    for scope in (WasteScope.regulado, WasteScope.peligroso, WasteScope.especial):
        result = evaluate_legal_gated_action(
            _request(action_type=LegalGatedActionType.educational_warning, waste_scope=scope)
        )
        assert result.status == "blocked"
        assert result.waste_scope == scope
        assert "rsu municipal" in " ".join(result.blockers).lower()


def test_endpoint_responde_200_ready_en_caso_educativo():
    response = _client().post(
        "/operations/legal-gated-action",
        json=_request().model_dump(mode="json"),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["educational_warning"]["creates_fine"] is False
    assert payload["proposed_sanction"] is None


def test_endpoint_responde_200_blocked_cuando_falta_legal_municipal():
    response = _client().post(
        "/operations/legal-gated-action",
        json=_request(
            action_type=LegalGatedActionType.proposed_sanction,
            municipio_id="slp",
            legal_source_municipio_id="slp",
            legal_basis_article_id="Art. 11",
        ).model_dump(mode="json"),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert "validada" in " ".join(payload["blockers"]).lower()


def test_texto_no_presenta_dictamen_ni_oficialidad_de_plataforma():
    result = evaluate_legal_gated_action(_request())

    text = " ".join(
        [
            result.language_help_text,
            result.next_action,
            result.educational_warning.message,
            result.educational_warning.officiality,
        ]
    ).lower()
    for forbidden in ("dictamen juridico emitido", "documento oficial emitido", "sancion firme"):
        assert forbidden not in text


def test_debido_proceso_requiere_base_legal_y_bloquea_sin_validacion():
    result = evaluate_legal_gated_action(
        _request(
            action_type=LegalGatedActionType.due_process,
            municipio_id="slp",
            legal_source_municipio_id="slp",
            legal_basis_article_id="Art. 11",
            evidence_ids=["ev-1"],
        )
    )

    assert result.status == "blocked"
    assert "validada" in " ".join(result.blockers).lower()
    assert result.due_process_gate.can_propose_sanction is False
