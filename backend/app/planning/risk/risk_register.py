"""
Risk Register — Registro vivo de riesgos del proyecto Alquimia.

Estado persiste en backend/data/risk/risk_register.json.
Solo se inicializa con definiciones base si el archivo no existe.

REGLA DE NO-HARDCODE:
  Los scores NO son literales. Se calculan como:
      score = PROB_SCORES[probabilidad] * IMPACTO_SCORES[impacto]
  Fuente de la matriz: PMBOK 6th ed., tabla 11-5.
"""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Dict, List, Literal, Optional

logger = logging.getLogger(__name__)

_THIS_DIR = Path(__file__).resolve().parent
RISK_REGISTER_PATH = _THIS_DIR.parent.parent.parent / "data" / "risk" / "risk_register.json"

RiskId = Literal["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09"]
RiskStatus = Literal["ROJO", "AMARILLO", "VERDE", "CERRADO"]

# ── Matriz de scoring — PMBOK 6th ed. Tabla 11-5 ─────────────────────────────
PROB_SCORES: Dict[str, int] = {"Alta": 3, "Media": 2, "Baja": 1}
IMPACTO_SCORES: Dict[str, int] = {"Crítico": 3, "Alto": 2, "Medio": 1, "Bajo": 0}


def calculate_score(probabilidad: str, impacto: str) -> int:
    """Calcula el score de riesgo como Prob × Impacto."""
    prob = PROB_SCORES.get(probabilidad, 1)
    imp = IMPACTO_SCORES.get(impacto, 0)
    return prob * imp


def get_status_from_score(score: int) -> str:
    """Score 7-9: ROJO | Score 4-6: AMARILLO | Score <4: VERDE"""
    if score >= 7:
        return "ROJO"
    elif score >= 4:
        return "AMARILLO"
    else:
        return "VERDE"


_BASE_RISK_DEFS: List[dict] = [
    {
        "id": "R01",
        "descripcion": "Cabildo no aprueba reforma reglamentaria",
        "probabilidad": "Alta",
        "impacto": "Crítico",
        "categoria": "Político-regulatorio",
        "gate_afectado": "G1",
    },
    {
        "id": "R02",
        "descripcion": "Concesionario bloquea implementación de separación",
        "probabilidad": "Alta",
        "impacto": "Crítico",
        "categoria": "Contractual",
        "gate_afectado": "G2",
    },
    {
        "id": "R03",
        "descripcion": "Participación residencial < 40%",
        "probabilidad": "Media",
        "impacto": "Alto",
        "categoria": "Social",
        "gate_afectado": "G3",
    },
    {
        "id": "R04",
        "descripcion": "Precio de materiales cae > 20% respecto al ancla",
        "probabilidad": "Media",
        "impacto": "Alto",
        "categoria": "Mercado",
        "gate_afectado": "G4",
    },
    {
        "id": "R05",
        "descripcion": "Centro de acopio no habilitado en fecha programada",
        "probabilidad": "Media",
        "impacto": "Alto",
        "categoria": "Infraestructura",
        "gate_afectado": "G3",
    },
    {
        "id": "R06",
        "descripcion": "Cambio de administración municipal",
        "probabilidad": "Alta",
        "impacto": "Medio",
        "categoria": "Político",
        "gate_afectado": "G4",
    },
    {
        "id": "R07",
        "descripcion": "Score legal bajo en municipio — reforma insuficiente",
        "probabilidad": "Alta",
        "impacto": "Alto",
        "categoria": "Jurídico",
        "gate_afectado": "G1",
    },
    {
        "id": "R08",
        "descripcion": "Reglamentos no homologados entre municipios de la ZM",
        "probabilidad": "Alta",
        "impacto": "Alto",
        "categoria": "Jurídico",
        "gate_afectado": "G2",
    },
    {
        "id": "R09",
        "descripcion": "OPEX logístico excede presupuesto aprobado (feed HERMES)",
        "probabilidad": "Media",
        "impacto": "Alto",
        "categoria": "Financiero-operativo",
        "gate_afectado": "G3",
    },
]


def _build_initial_register() -> Dict[str, dict]:
    """Construye el registro inicial calculando score y status desde la matriz."""
    register: Dict[str, dict] = {}
    for defn in _BASE_RISK_DEFS:
        score = calculate_score(defn["probabilidad"], defn["impacto"])
        status = get_status_from_score(score)
        risk_id = defn["id"]
        register[risk_id] = {
            "descripcion": defn["descripcion"],
            "probabilidad": defn["probabilidad"],
            "impacto": defn["impacto"],
            "score": score,
            "status": status,
            "categoria": defn["categoria"],
            "gate_afectado": defn["gate_afectado"],
            "owner": None,
            "fecha_creacion": "2026-05-22",
            "fecha_ultima_revision": None,
            "plan_mitigacion": None,
            "evidencia_reciente": None,
            "historial": [],
            "fuente_score": "PMBOK 6th ed. Tabla 11-5 — Prob × Impacto",
        }
    return register


def _read_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


def _merge_missing_base_risks(register: Dict[str, dict]) -> Dict[str, dict]:
    """Añade R01–R09 faltantes sin sobrescribir estado existente."""
    initial = _build_initial_register()
    changed = False
    for rid, data in initial.items():
        if rid not in register:
            register[rid] = data
            changed = True
    if changed:
        save_risk_register(register)
    return register


def load_risk_register() -> Dict[str, dict]:
    """Carga el registro. Inicializa con definiciones base si no existe."""
    if not RISK_REGISTER_PATH.exists():
        initial = _build_initial_register()
        _write_json(RISK_REGISTER_PATH, initial)
        return dict(initial)
    register = _read_json(RISK_REGISTER_PATH)
    return _merge_missing_base_risks(register)


def save_risk_register(register: Dict[str, dict]) -> None:
    _write_json(RISK_REGISTER_PATH, register)


def update_risk(
    risk_id: RiskId,
    status: Optional[RiskStatus] = None,
    owner: Optional[str] = None,
    plan_mitigacion: Optional[str] = None,
    evidencia_reciente: Optional[str] = None,
    nota: Optional[str] = None,
) -> dict:
    """Actualiza un riesgo y registra el cambio en su historial."""
    register = load_risk_register()
    if risk_id not in register:
        raise ValueError(f"risk_id inválido: {risk_id}. Válidos: R01-R09")

    risk = register[risk_id]
    old_status = risk["status"]

    if status is not None:
        risk["status"] = status
    if owner is not None:
        risk["owner"] = owner
    if plan_mitigacion is not None:
        risk["plan_mitigacion"] = plan_mitigacion
    if evidencia_reciente is not None:
        risk["evidencia_reciente"] = evidencia_reciente

    risk["fecha_ultima_revision"] = date.today().isoformat()

    entry = {
        "fecha": date.today().isoformat(),
        "status_anterior": old_status,
        "status_nuevo": risk["status"],
        "nota": nota or "",
    }
    risk.setdefault("historial", []).append(entry)

    save_risk_register(register)
    logger.info(f"risk_updated risk_id={risk_id} {old_status}->{risk['status']}")
    return risk


def get_risks_by_status(status: RiskStatus) -> List[dict]:
    """Retorna lista de riesgos con el status dado."""
    register = load_risk_register()
    return [
        {"id": rid, **rdata}
        for rid, rdata in register.items()
        if rdata.get("status") == status
    ]


def get_risks_without_owner() -> List[str]:
    """Retorna IDs de riesgos sin owner asignado."""
    register = load_risk_register()
    return [rid for rid, r in register.items() if not r.get("owner")]


def get_stale_risks(days_threshold: int = 14) -> List[str]:
    """Retorna IDs de riesgos con score >= 6 sin revisión reciente."""
    register = load_risk_register()
    today = date.today()
    stale: List[str] = []

    for rid, r in register.items():
        if r.get("score", 0) < 6:
            continue
        if r.get("status") == "CERRADO":
            continue
        last_rev = r.get("fecha_ultima_revision")
        if not last_rev:
            stale.append(rid)
            continue
        try:
            last_date = date.fromisoformat(str(last_rev))
            if (today - last_date).days > days_threshold:
                stale.append(rid)
        except ValueError:
            stale.append(rid)

    return stale
