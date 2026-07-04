"""
Router: /esg

ESG quarterly report generation — Sprint 33.

Produces a structured ESG report from a tenant's simulation state,
aligned to GRI 306 (Waste) and SEMARNAT municipal reporting requirements.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth import UserInfo, get_current_user
from app.models.simulation import Simulation, SimulationVersion

router = APIRouter(prefix="/esg", tags=["esg"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class GRIIndicator(BaseModel):
    code: str           # e.g. "GRI 306-3"
    titulo: str
    valor: Optional[str] = None
    unidad: str = ""
    fuente: str
    nota: Optional[str] = None
    estatus: str = "disponible"  # disponible | estimado | no_disponible


class ESGSeccion(BaseModel):
    id: str
    titulo: str
    descripcion: str
    indicadores: List[GRIIndicator]


class ESGReporte(BaseModel):
    municipio: str
    estado: str
    periodo: str          # "Q1 2026", "Q2 2026", etc.
    fecha_generacion: str
    simulation_id: Optional[str]
    simulation_name: Optional[str]
    secciones: List[ESGSeccion]
    advertencias: List[str]
    auditor_score: int    # 0-100
    version: str = "0.1-borrador"


# ─── Builders ─────────────────────────────────────────────────────────────────

def _current_quarter(today: date) -> str:
    q = (today.month - 1) // 3 + 1
    return f"Q{q} {today.year}"


def _build_secciones(state: Dict[str, Any], municipio: str) -> tuple[List[ESGSeccion], List[str], int]:
    advertencias: List[str] = []
    kpi_scores: List[float] = []

    wacc = state.get("wacc")
    horizonte = state.get("horizonte")
    municipios = state.get("municipiosActivos", [municipio])
    precios = state.get("precios", {})
    gen_percapita = state.get("generacion_percapita_kg_dia")
    tasa_recuperacion = state.get("tasaRecuperacionActual")
    mix = state.get("mixCorrientes", {})

    # Derive tonnage from simulation state if available
    ton_generadas = state.get("tonGeneradasDia")
    ton_recuperadas = None
    if ton_generadas and tasa_recuperacion:
        ton_recuperadas = round(ton_generadas * tasa_recuperacion / 100, 2)

    # Score helpers
    def score(v, conf=0.75):
        kpi_scores.append(conf if v is not None else 0.0)
        return v

    # ── Environmental ────────────────────────────────────────────────────────
    ind_ambiental: List[GRIIndicator] = [
        GRIIndicator(
            code="GRI 306-3",
            titulo="Residuos generados",
            valor=f"{ton_generadas:.2f}" if score(ton_generadas, 0.7) else None,
            unidad="ton/día",
            fuente="Simulador ALQUIMIA (estimado SEMARNAT/CONAPO)",
            nota="Derivado de gen. per cápita × población" if not ton_generadas else None,
            estatus="estimado" if ton_generadas else "no_disponible",
        ),
        GRIIndicator(
            code="GRI 306-4",
            titulo="Residuos desviados de disposición final",
            valor=f"{ton_recuperadas:.2f}" if score(ton_recuperadas, 0.65) else None,
            unidad="ton/día",
            fuente="Simulador ALQUIMIA",
            estatus="estimado" if ton_recuperadas else "no_disponible",
        ),
        GRIIndicator(
            code="GRI 306-5",
            titulo="Residuos a disposición final (relleno sanitario)",
            valor=f"{round(ton_generadas - ton_recuperadas, 2):.2f}" if (ton_generadas and ton_recuperadas) else None,
            unidad="ton/día",
            fuente="Simulador ALQUIMIA (calculado)",
            estatus="estimado" if (ton_generadas and ton_recuperadas) else "no_disponible",
        ),
        GRIIndicator(
            code="SEMARNAT-RSU-01",
            titulo="Generación per cápita",
            valor=f"{gen_percapita:.3f}" if score(gen_percapita, 0.8) else None,
            unidad="kg/hab/día",
            fuente="SEMARNAT 2022 (estatal promedio)",
            estatus="estimado" if gen_percapita else "no_disponible",
        ),
    ]

    # Composition breakdown
    if mix:
        for mat, frac in mix.items():
            if frac and frac > 0.01:
                ind_ambiental.append(GRIIndicator(
                    code=f"GRI 306-3.{mat[:3].upper()}",
                    titulo=f"Fracción {mat}",
                    valor=f"{round(frac * 100, 1)}",
                    unidad="% del total",
                    fuente="Simulador ALQUIMIA (parámetro de entrada)",
                    estatus="disponible",
                ))
                kpi_scores.append(0.8)

    # ── Social ───────────────────────────────────────────────────────────────
    ind_social: List[GRIIndicator] = [
        GRIIndicator(
            code="GRI 401-1",
            titulo="Empleos formales en cadena RSU",
            valor=None,
            unidad="personas",
            fuente="Pendiente — requiere levantamiento municipal",
            nota="Dato necesario para cumplimiento GRI Social.",
            estatus="no_disponible",
        ),
        GRIIndicator(
            code="LGPGIR-Art.9",
            titulo="Municipios activos en programa de separación",
            valor=str(len(municipios)) if score(len(municipios), 0.9) else None,
            unidad="municipios",
            fuente="Configuración de simulación ALQUIMIA",
            estatus="disponible",
        ),
    ]
    if not ton_generadas:
        advertencias.append("Sin datos de generación total — GRI 306-3 no calculable.")
    if not tasa_recuperacion:
        advertencias.append("Sin tasa de recuperación declarada — GRI 306-4 estimado con benchmark SEMARNAT.")

    # ── Gobernanza ───────────────────────────────────────────────────────────
    ind_gov: List[GRIIndicator] = [
        GRIIndicator(
            code="GRI 2-22",
            titulo="Declaración de estrategia de sostenibilidad",
            valor="Diagnóstico ALQUIMIA en preparación",
            unidad="",
            fuente="Plataforma ALQUIMIA",
            estatus="disponible",
        ),
        GRIIndicator(
            code="LGPGIR-Art.5",
            titulo="Horizonte de planeación RSU declarado",
            valor=f"{horizonte} años" if score(horizonte, 0.95) else None,
            unidad="años",
            fuente="Simulación ALQUIMIA",
            estatus="disponible" if horizonte else "no_disponible",
        ),
        GRIIndicator(
            code="ASF-2024",
            titulo="Score de trazabilidad de datos",
            valor=None,
            unidad="/100",
            fuente="AUDITOR ALQUIMIA",
            nota="Calculado al generar reporte completo con snapshot de datos.",
            estatus="no_disponible",
        ),
    ]

    secciones = [
        ESGSeccion(
            id="ambiental",
            titulo="E — Ambiental",
            descripcion="Indicadores de generación, desviación y disposición de residuos. Alineado a GRI 306.",
            indicadores=ind_ambiental,
        ),
        ESGSeccion(
            id="social",
            titulo="S — Social",
            descripcion="Empleo formal en cadena RSU, cobertura municipal y educación ambiental.",
            indicadores=ind_social,
        ),
        ESGSeccion(
            id="gobernanza",
            titulo="G — Gobernanza",
            descripcion="Estrategia declarada, horizonte de planeación y cumplimiento LGPGIR/ASF.",
            indicadores=ind_gov,
        ),
    ]

    n_disponible = sum(1 for s in kpi_scores if s >= 0.7)
    score_100 = round((sum(kpi_scores) / max(len(kpi_scores), 1)) * 100)

    return secciones, advertencias, score_100


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{simulation_id}/reporte", response_model=ESGReporte)
async def get_esg_reporte(
    simulation_id: str,
    request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate ESG quarterly report from a simulation's latest state."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    tenant_id = request.headers.get("x-tenant-id", "default")

    sim = (
        db.query(Simulation)
        .filter(Simulation.id == simulation_id, Simulation.user_id == user.id)
        .first()
    )
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    latest = (
        db.query(SimulationVersion)
        .filter(SimulationVersion.simulation_id == simulation_id)
        .order_by(SimulationVersion.version_number.desc())
        .first()
    )

    state = latest.state_data if latest else {}
    municipios = sim.municipios or state.get("municipiosActivos") or []
    municipio = municipios[0] if municipios else (user.municipio_nombre or "Municipio")
    estado = user.estado_mx or state.get("zm", "")

    secciones, advertencias, score = _build_secciones(state, municipio)

    return ESGReporte(
        municipio=municipio,
        estado=estado,
        periodo=_current_quarter(date.today()),
        fecha_generacion=datetime.utcnow().isoformat(),
        simulation_id=simulation_id,
        simulation_name=sim.name,
        secciones=secciones,
        advertencias=advertencias,
        auditor_score=score,
    )


@router.get("/public/template", response_model=ESGReporte)
async def get_esg_template():
    """Return a blank ESG template with all required indicators (no auth needed)."""
    secciones, _, _ = _build_secciones({}, "Municipio Ejemplo")
    return ESGReporte(
        municipio="Municipio Ejemplo",
        estado="San Luis Potosí",
        periodo=_current_quarter(date.today()),
        fecha_generacion=datetime.utcnow().isoformat(),
        simulation_id=None,
        simulation_name=None,
        secciones=secciones,
        advertencias=["Este es un reporte de plantilla sin datos reales."],
        auditor_score=0,
    )
