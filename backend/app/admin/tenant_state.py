"""Servicio canónico de estado del tenant y transiciones por etapa."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


STAGE_ORDER = ("validation", "planning", "execution", "expansion")
TRANSITION_REQUIREMENTS = {
    ("validation", "planning"): "G1",
    ("planning", "execution"): "G2",
    ("execution", "expansion"): "G3",
}


class TenantStateError(ValueError):
    """Error de regla de negocio en maquina de estados de tenant."""


@dataclass(frozen=True)
class TransitionDecision:
    from_stage: str
    to_stage: str
    required_gate: str
    manual_confirmation: bool


def can_access_stage(current_stage: str, requested_stage: str) -> bool:
    if current_stage not in STAGE_ORDER:
        raise TenantStateError(f"Etapa actual invalida: {current_stage}")
    if requested_stage not in STAGE_ORDER:
        raise TenantStateError(f"Etapa solicitada invalida: {requested_stage}")
    return STAGE_ORDER.index(current_stage) >= STAGE_ORDER.index(requested_stage)


def assert_can_access_stage(current_stage: str, requested_stage: str) -> None:
    if not can_access_stage(current_stage, requested_stage):
        raise TenantStateError(
            f"Tenant en etapa {current_stage} no puede acceder a plataforma {requested_stage}"
        )


def gate_status(gates: list[dict[str, Any]], gate_id: str) -> str | None:
    for gate in gates:
        if gate.get("gate_id") == gate_id:
            return gate.get("status")
    return None


def has_additional_capability(capabilities: list[dict[str, Any]]) -> bool:
    for capability in capabilities:
        if not capability.get("active", True):
            continue
        if capability.get("source") != "tier_default":
            return True
        metadata = capability.get("metadata_json") or capability.get("metadata") or {}
        if isinstance(metadata, dict) and metadata.get("additional") is True:
            return True
    return False


def validate_manual_transition(
    *,
    current_stage: str,
    target_stage: str,
    gates: list[dict[str, Any]],
    capabilities: list[dict[str, Any]],
    manual_confirmation: bool,
) -> TransitionDecision:
    if not manual_confirmation:
        raise TenantStateError("La transicion requiere confirmacion manual desde Plataforma 0")

    required_gate = TRANSITION_REQUIREMENTS.get((current_stage, target_stage))
    if required_gate is None:
        raise TenantStateError(f"Transicion no permitida: {current_stage} -> {target_stage}")

    if gate_status(gates, required_gate) != "cerrado":
        raise TenantStateError(
            f"No se puede transicionar {current_stage} -> {target_stage}: {required_gate} no esta cerrado"
        )

    if target_stage == "expansion" and not has_additional_capability(capabilities):
        raise TenantStateError(
            "No se puede transicionar execution -> expansion sin capabilities adicionales activas"
        )

    return TransitionDecision(
        from_stage=current_stage,
        to_stage=target_stage,
        required_gate=required_gate,
        manual_confirmation=True,
    )
