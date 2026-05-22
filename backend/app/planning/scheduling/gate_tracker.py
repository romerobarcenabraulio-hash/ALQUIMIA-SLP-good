"""
Gate Tracker — Monitor de gates del proyecto Alquimia.

Gates G1-G5 con reglas de alerta: 30, 15 y 7 días antes.
Estado persiste en backend/data/state/gate_status.json.

IMPORTANTE: gate_status.json NUNCA se sobreescribe si ya existe con datos reales.
Solo se inicializa si el archivo no existe.
"""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Dict, List, Literal, Optional

logger = logging.getLogger(__name__)

# Ruta absoluta relativa al archivo — NO depende del cwd
_THIS_DIR = Path(__file__).resolve().parent
GATE_STATUS_PATH = _THIS_DIR.parent.parent.parent / "data" / "state" / "gate_status.json"

GateId = Literal["G1", "G2", "G3", "G4", "G5"]
GateStatus = Literal["CRUZADO", "EN_PROCESO", "EN_RIESGO", "NO_INICIADO"]

GATE_DEFINITIONS: Dict[str, dict] = {
    "G1": {
        "descripcion": "Acuerdo Cabildo publicado en Gaceta + reforma reglamentaria aprobada",
        "fase": "Fase 1",
        "periodo": "Meses 0-3",
        "riesgo_si_no_se_cruza": "TODO lo que sigue es inviable",
        "prerequisitos": [
            "Reforma reglamentaria aprobada en sesión de Cabildo",
            "Publicación en Gaceta Municipal",
            "Arts. 4, 20Bis, 21, 21Bis, 31, 37Bis reformados",
        ],
    },
    "G2": {
        "descripcion": "Adenda al contrato de concesión firmada",
        "fase": "Fase 2",
        "periodo": "Meses 3-6",
        "riesgo_si_no_se_cruza": "Concesionario operará con incentivos opuestos",
        "prerequisitos": [
            "Negociación con concesionario completada",
            "Adenda redactada y revisada legalmente",
            "Firma de ambas partes",
        ],
    },
    "G3": {
        "descripcion": "3 meses de datos operativos + primera conciliación mensual",
        "fase": "Fase 3",
        "periodo": "Meses 6-12",
        "riesgo_si_no_se_cruza": "Piloto sin datos = programa sin dientes",
        "prerequisitos": [
            "Operación continua por 3 meses",
            "Primera conciliación plan vs báscula vs factura completada",
            "CAs con báscula operativa y conectada",
        ],
    },
    "G4": {
        "descripcion": "60% cobertura + evidencia cuantitativa para Cabildo",
        "fase": "Fase 4",
        "periodo": "Meses 12-18",
        "riesgo_si_no_se_cruza": "Escalamiento sin sustento político",
        "prerequisitos": [
            "Cobertura de 60% de viviendas verificada",
            "Reporte cuantitativo aprobado por PMO",
            "Presentación ante Cabildo programada",
        ],
    },
    "G5": {
        "descripcion": "100% cobertura + modelo de réplica estatal",
        "fase": "Fase 5",
        "periodo": "Meses 18-24",
        "riesgo_si_no_se_cruza": "Objetivo final del proyecto no cumplido",
        "prerequisitos": [
            "100% cobertura de viviendas verificada",
            "Modelo de réplica documentado",
            "Reporte GRI completado",
        ],
    },
}

_INITIAL_GATE_STATE = {
    gate_id: {
        "status": "NO_INICIADO",
        "fecha_objetivo": None,
        "fecha_cruce_real": None,
        "prerequisitos_completados": [],
        "ultima_revision": None,
        "alertas_enviadas": [],
        "notas": "",
    }
    for gate_id in GATE_DEFINITIONS
}


def load_gate_status() -> dict:
    """Carga estado de gates. Crea estado inicial si el archivo no existe."""
    if not GATE_STATUS_PATH.exists():
        GATE_STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
        _write_json(GATE_STATUS_PATH, _INITIAL_GATE_STATE)
        return dict(_INITIAL_GATE_STATE)
    return _read_json(GATE_STATUS_PATH)


def save_gate_status(status: dict) -> None:
    """Persiste el estado de gates."""
    GATE_STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _write_json(GATE_STATUS_PATH, status)


def _read_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


def check_gate_alerts(today: Optional[date] = None) -> List[dict]:
    """
    Retorna alertas activas según las reglas de 30/15/7 días.

    Returns:
        Lista de dicts: {gate_id, dias_al_gate, nivel_alerta, accion_requerida, descripcion}
    """
    if today is None:
        today = date.today()

    status = load_gate_status()
    alertas: List[dict] = []

    for gate_id in ["G1", "G2", "G3", "G4", "G5"]:
        gate_data = status.get(gate_id, {})
        if gate_data.get("status") == "CRUZADO":
            continue

        fecha_str = gate_data.get("fecha_objetivo")
        if not fecha_str:
            continue

        try:
            fecha_obj = date.fromisoformat(str(fecha_str))
        except ValueError:
            logger.warning(f"fecha_objetivo inválida para {gate_id}: {fecha_str}")
            continue

        dias = (fecha_obj - today).days
        desc = GATE_DEFINITIONS[gate_id]["descripcion"]

        if dias < 0:
            nivel = "CRITICO"
            accion = f"Gate {gate_id} VENCIDO hace {abs(dias)} días sin cruzarse. Escalar inmediatamente al Alcalde."
        elif dias <= 7:
            nivel = "ROJO"
            accion = "Daily check. Escalar a Alcalde/Cabildo si gate en riesgo."
        elif dias <= 15:
            nivel = "NARANJA"
            accion = "Verificar avance >= 70% en entregable. Iniciar aprobaciones pendientes."
        elif dias <= 30:
            nivel = "AMARILLO"
            accion = "Publicar reporte de estado del gate a todos los stakeholders."
        else:
            continue

        alertas.append({
            "gate_id": gate_id,
            "dias_al_gate": dias,
            "nivel_alerta": nivel,
            "accion_requerida": accion,
            "descripcion": desc,
        })

    return alertas


def update_gate(
    gate_id: GateId,
    status: GateStatus,
    fecha_objetivo: Optional[date] = None,
    prerequisito_completado: Optional[str] = None,
    nota: Optional[str] = None,
) -> dict:
    """
    Actualiza el estado de un gate y persiste el cambio.

    Args:
        gate_id: "G1" a "G5"
        status: Nuevo estado del gate
        fecha_objetivo: Fecha objetivo (ISO string o date)
        prerequisito_completado: Prerequisito que se marcó como completo
        nota: Nota libre sobre el cambio

    Returns:
        Estado actualizado del gate específico.
    """
    if gate_id not in GATE_DEFINITIONS:
        raise ValueError(f"gate_id inválido: {gate_id}. Válidos: G1-G5")

    all_status = load_gate_status()
    gate = all_status[gate_id]

    gate["status"] = status
    gate["ultima_revision"] = date.today().isoformat()

    if fecha_objetivo is not None:
        gate["fecha_objetivo"] = fecha_objetivo.isoformat()

    if status == "CRUZADO":
        gate["fecha_cruce_real"] = date.today().isoformat()

    if prerequisito_completado:
        existing = gate.get("prerequisitos_completados", [])
        if prerequisito_completado not in existing:
            existing.append(prerequisito_completado)
        gate["prerequisitos_completados"] = existing

    if nota:
        gate["notas"] = nota

    save_gate_status(all_status)
    logger.info(f"gate_updated gate_id={gate_id} status={status}")
    return gate


def get_current_gate() -> Optional[str]:
    """Retorna el ID del gate actual (el más temprano no cruzado)."""
    status = load_gate_status()
    for gate_id in ["G1", "G2", "G3", "G4", "G5"]:
        if status.get(gate_id, {}).get("status") != "CRUZADO":
            return gate_id
    return None
