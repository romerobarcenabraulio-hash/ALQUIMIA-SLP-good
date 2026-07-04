"""
Router: /api/v1/banobras

BANOBRAS green credit alignment checker.
Evaluates a tenant's simulation + gate state against BANOBRAS eligibility criteria
and returns a readiness score + gap analysis.
Sprint 46-48.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/banobras", tags=["banobras"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CriterioEvaluacion(BaseModel):
    codigo: str
    descripcion: str
    requerimiento: str
    cumple: bool
    evidencia: Optional[str] = None
    peso: float           # 0-1 weight in scoring
    comentario: Optional[str] = None


class BanobrasCreditLine(BaseModel):
    linea: str            # "FAIS", "BID-Residuos", "Sustentable-Municipal"
    monto_maximo_mdp: float
    tasa_referencia_pct: float
    plazo_anos: int
    descripcion: str


class BANOBRASReadinessReport(BaseModel):
    tenant_id: str
    score_total: float        # 0-100
    nivel: str                # no_elegible | con_brechas | elegible | listo
    criterios: List[CriterioEvaluacion]
    brechas: List[str]        # what is still missing
    fortalezas: List[str]     # what is strong
    lineas_aplicables: List[BanobrasCreditLine]
    recomendacion_siguiente_paso: str


# ─── Criteria definitions ─────────────────────────────────────────────────────

CRITERIOS_BANOBRAS = [
    {
        "codigo": "TEC-01",
        "descripcion": "Diagnóstico técnico del servicio",
        "requerimiento": "Diagnóstico ALQUIMIA con al menos 5 KPIs validados",
        "peso": 0.20,
    },
    {
        "codigo": "FIN-01",
        "descripcion": "Modelo financiero con fuente de repago",
        "requerimiento": "Simulación con horizonte ≥ 5 años y WACC declarado",
        "peso": 0.25,
    },
    {
        "codigo": "FIN-02",
        "descripcion": "Análisis de riesgo documentado",
        "requerimiento": "Escenarios pesimista/optimista en simulación",
        "peso": 0.15,
    },
    {
        "codigo": "REG-01",
        "descripcion": "Marco regulatorio municipal alineado",
        "requerimiento": "Reglamento subido + alineación LGPGIR verificada",
        "peso": 0.10,
    },
    {
        "codigo": "OP-01",
        "descripcion": "Plan de implementación con hitos",
        "requerimiento": "Plan Maestro generado y al menos 3 gates completados",
        "peso": 0.15,
    },
    {
        "codigo": "ESG-01",
        "descripcion": "Reporte ESG con GRI 306 alineado",
        "requerimiento": "Reporte ESG generado con score AUDITOR ≥ 50",
        "peso": 0.10,
    },
    {
        "codigo": "PART-01",
        "descripcion": "Acuerdos comerciales con recicladores/compradores",
        "requerimiento": "Al menos 1 partner link en estado contratado o activo",
        "peso": 0.05,
    },
]

CREDIT_LINES = [
    BanobrasCreditLine(
        linea="FAIS Residuos",
        monto_maximo_mdp=50.0,
        tasa_referencia_pct=7.5,
        plazo_anos=10,
        descripcion="Fondo para infraestructura de manejo de RSU. Requiere TEC-01 + FIN-01.",
    ),
    BanobrasCreditLine(
        linea="BID Residuos Sólidos",
        monto_maximo_mdp=200.0,
        tasa_referencia_pct=6.8,
        plazo_anos=15,
        descripcion="Línea BID para proyectos de economía circular. Requiere ESG-01 + PART-01.",
    ),
    BanobrasCreditLine(
        linea="Crédito Sustentable Municipal",
        monto_maximo_mdp=30.0,
        tasa_referencia_pct=8.0,
        plazo_anos=7,
        descripcion="Financiamiento para mejoras operativas con componente verde. Requiere TEC-01.",
    ),
]


# ─── Evaluation logic ─────────────────────────────────────────────────────────

def _evaluate_criterios(simulation_state: dict, gates_data: dict, context: dict) -> list[dict]:
    """Evaluate each criteria against provided data."""
    results = []

    ton_generadas = simulation_state.get("tonGeneradasDia", 0)
    horizonte = simulation_state.get("horizonte", 0)
    wacc = simulation_state.get("wacc")
    tasa_recuperacion = simulation_state.get("tasaRecuperacionActual", 0)
    gates_completed = gates_data.get("completed", 0)
    auditor_score = context.get("auditor_score", 0)
    esg_generated = context.get("esg_generated", False)
    reglamento_uploaded = context.get("reglamento_uploaded", False)
    partner_links_active = context.get("partner_links_active", 0)

    for crit_def in CRITERIOS_BANOBRAS:
        code = crit_def["codigo"]
        cumple = False
        comentario = None
        evidencia = None

        if code == "TEC-01":
            kpis_present = sum([
                1 if ton_generadas > 0 else 0,
                1 if tasa_recuperacion > 0 else 0,
                1 if horizonte > 0 else 0,
                1 if wacc else 0,
            ])
            cumple = kpis_present >= 3
            evidencia = f"{kpis_present}/4 KPIs en simulador"
            comentario = None if cumple else "Completa más parámetros en el Simulador"

        elif code == "FIN-01":
            cumple = bool(horizonte and horizonte >= 5 and wacc)
            evidencia = f"Horizonte: {horizonte} años, WACC: {wacc}"
            comentario = None if cumple else "Ajusta horizonte a ≥5 años y define WACC"

        elif code == "FIN-02":
            # Check if simulation has multiple scenarios (not verifiable from state alone)
            cumple = bool(ton_generadas > 0 and tasa_recuperacion > 0)
            evidencia = "Análisis de sensibilidad disponible si se generan múltiples simulaciones"
            comentario = None if cumple else "Guarda variantes pesimista/optimista del simulador"

        elif code == "REG-01":
            cumple = reglamento_uploaded
            evidencia = "Reglamento cargado" if reglamento_uploaded else "Pendiente"
            comentario = None if cumple else "Sube el reglamento municipal de limpia"

        elif code == "OP-01":
            cumple = gates_completed >= 3
            evidencia = f"{gates_completed}/5 puertas completadas"
            comentario = None if cumple else f"Faltan {3 - gates_completed} puertas para cumplir"

        elif code == "ESG-01":
            cumple = esg_generated and auditor_score >= 50
            evidencia = f"Score AUDITOR: {auditor_score}/100"
            comentario = None if cumple else "Genera reporte ESG y mejora el score AUDITOR"

        elif code == "PART-01":
            cumple = partner_links_active >= 1
            evidencia = f"{partner_links_active} acuerdos activos"
            comentario = None if cumple else "Identifica y contrata al menos un reciclador"

        results.append({
            "codigo": code,
            "descripcion": crit_def["descripcion"],
            "requerimiento": crit_def["requerimiento"],
            "cumple": cumple,
            "evidencia": evidencia,
            "peso": crit_def["peso"],
            "comentario": comentario,
        })

    return results


def _score_and_classify(criterios: list[dict]) -> tuple[float, str]:
    total_weight = sum(c["peso"] for c in criterios)
    weighted_score = sum(c["peso"] for c in criterios if c["cumple"])
    score_100 = round((weighted_score / total_weight) * 100) if total_weight > 0 else 0

    if score_100 < 30:
        nivel = "no_elegible"
    elif score_100 < 60:
        nivel = "con_brechas"
    elif score_100 < 85:
        nivel = "elegible"
    else:
        nivel = "listo"

    return score_100, nivel


def _filter_credit_lines(criterios: list[dict], score: float) -> list[BanobrasCreditLine]:
    if score < 30:
        return []
    if score >= 70:
        return CREDIT_LINES
    # Return lines matching completed criteria
    completed = {c["codigo"] for c in criterios if c["cumple"]}
    lines = []
    if "TEC-01" in completed:
        lines.append(CREDIT_LINES[2])  # Sustentable Municipal
    if "TEC-01" in completed and "FIN-01" in completed:
        lines.append(CREDIT_LINES[0])  # FAIS
    return lines


# ─── Endpoints ────────────────────────────────────────────────────────────────

class BANOBRASRequest(BaseModel):
    tenant_id: str
    simulation_state: dict = {}
    gates_completed: int = 0
    auditor_score: int = 0
    esg_generated: bool = False
    reglamento_uploaded: bool = False
    partner_links_active: int = 0


@router.post("/evaluar", response_model=BANOBRASReadinessReport)
async def evaluar_elegibilidad(
    body: BANOBRASRequest,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Evaluate BANOBRAS green credit eligibility for a tenant."""
    gates_data = {"completed": body.gates_completed}
    context = {
        "auditor_score": body.auditor_score,
        "esg_generated": body.esg_generated,
        "reglamento_uploaded": body.reglamento_uploaded,
        "partner_links_active": body.partner_links_active,
    }

    criterios = _evaluate_criterios(body.simulation_state, gates_data, context)
    score, nivel = _score_and_classify(criterios)
    credit_lines = _filter_credit_lines(criterios, score)

    brechas = [
        f"{c['codigo']}: {c['comentario']}"
        for c in criterios
        if not c["cumple"] and c["comentario"]
    ]
    fortalezas = [
        f"{c['codigo']}: {c['descripcion']}"
        for c in criterios if c["cumple"]
    ]

    NEXT_STEP = {
        "no_elegible": "Completa diagnóstico técnico: carga datos reales al Simulador y sube tu reglamento municipal.",
        "con_brechas": "Cierra las brechas señaladas: Plan Maestro, reporte ESG y modelo financiero son prioritarios.",
        "elegible": "Prepara dossier técnico y solicita evaluación formal con BANOBRAS. Presenta Plan Maestro.",
        "listo": "Solicita carta de intención con BANOBRAS. Tu dossier ALQUIMIA cumple todos los requisitos base.",
    }

    logger.info("banobras_eval tenant=%s score=%s nivel=%s", body.tenant_id, score, nivel)

    return BANOBRASReadinessReport(
        tenant_id=body.tenant_id,
        score_total=score,
        nivel=nivel,
        criterios=[CriterioEvaluacion(**c) for c in criterios],
        brechas=brechas,
        fortalezas=fortalezas,
        lineas_aplicables=credit_lines,
        recomendacion_siguiente_paso=NEXT_STEP[nivel],
    )
