"""
Router: /reports

PDF and document generation for simulations
Provides professional reporting capabilities for stakeholders
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import json

from app.db.session import get_db
from app.routers.auth import get_current_user, UserInfo
from app.models.simulation import Simulation

router = APIRouter(prefix="/reports", tags=["reports"])
logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────────────
# Report Generation Schemas
# ────────────────────────────────────────────────────────────────────────────


class SimulationReport:
    """Container for simulation data to be exported as PDF"""

    def __init__(self, simulation: Simulation, state_data: dict):
        self.simulation = simulation
        self.state = state_data
        self.generated_at = datetime.utcnow()


# ────────────────────────────────────────────────────────────────────────────
# Report Endpoints
# ────────────────────────────────────────────────────────────────────────────


@router.get("/{simulation_id}/metadata")
async def get_report_metadata(
    simulation_id: str,
    request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get metadata for a simulation report.
    Returns basic info needed for report generation without full state.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default")

    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        return {
            "id": simulation.id,
            "name": simulation.name,
            "description": simulation.description,
            "createdAt": simulation.created_at.isoformat(),
            "updatedAt": simulation.updated_at.isoformat(),
            "municipios": simulation.municipios or [],
            "horizonte": simulation.horizonte or 0,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to get report metadata: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to get report metadata: {str(exc)}")


@router.post("/{simulation_id}/generate-summary")
async def generate_summary_report(
    simulation_id: str,
    report_format: str = "json",
    request: Request = None,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a summary report of simulation results.
    Supports JSON and HTML formats (PDF requires frontend rendering).
    """
    # Extract tenant_id from header
    if request:
        tenant_id = request.headers.get("x-tenant-id", "default")
    else:
        tenant_id = "default"

    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Get latest version
        from app.models.simulation import SimulationVersion
        latest_version = (
            db.query(SimulationVersion)
            .filter(SimulationVersion.simulation_id == simulation_id)
            .order_by(SimulationVersion.version_number.desc())
            .first()
        )

        if not latest_version:
            raise HTTPException(status_code=404, detail="Simulation has no versions")

        state = latest_version.state_data

        # Build summary report
        report = {
            "metadata": {
                "title": f"Simulation Report: {simulation.name}",
                "generatedAt": datetime.utcnow().isoformat(),
                "simulation": {
                    "id": simulation.id,
                    "name": simulation.name,
                    "description": simulation.description,
                    "createdAt": simulation.created_at.isoformat(),
                    "updatedAt": simulation.updated_at.isoformat(),
                },
            },
            "summary": {
                "municipalities": state.get("municipiosActivos", []),
                "horizon": state.get("horizonte"),
                "preset": state.get("presetTrayectoria"),
            },
            "parameters": {
                "financial": {
                    "wacc": state.get("wacc"),
                    "exchangeRate": state.get("tipoCambio"),
                    "carbonPrice": state.get("precioCarbonoEsc"),
                },
                "operational": {
                    "truckCapacity": state.get("capCamionTon"),
                    "logisticLoss": state.get("mermaLogPct"),
                },
                "material_prices": state.get("precios", {}),
            },
            "journey": {
                "mode": state.get("journeyMode"),
                "gates_approved": len(state.get("gatesAprobados", [])),
                "institutional_phase": state.get("faseInstitucional"),
            },
        }

        if report_format == "json":
            return report
        elif report_format == "html":
            # Generate simple HTML representation
            html = _build_html_report(report)
            return {"html": html}
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {report_format}")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to generate summary report: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary report: {str(exc)}")


def _build_html_report(report: dict) -> str:
    """Build HTML representation of simulation report"""
    meta = report["metadata"]
    summary = report["summary"]
    params = report["parameters"]

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{meta['title']}</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }}
            .header {{ border-bottom: 2px solid #3B6D11; padding-bottom: 15px; margin-bottom: 30px; }}
            h1 {{ color: #1C1B18; margin: 0 0 10px 0; }}
            .subtitle {{ color: #6B6760; font-size: 14px; }}
            .section {{ margin-bottom: 30px; }}
            .section h2 {{ color: #3B6D11; border-bottom: 1px solid #E8E4DC; padding-bottom: 10px; }}
            .metadata {{ background: #FDFCFA; padding: 15px; border-radius: 6px; margin-bottom: 20px; }}
            .metadata p {{ margin: 8px 0; color: #6B6760; font-size: 13px; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
            .card {{ border: 1px solid #E8E4DC; border-radius: 6px; padding: 15px; }}
            .card h3 {{ color: #1C1B18; margin: 0 0 12px 0; font-size: 14px; }}
            .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0EDE5; }}
            .row:last-child {{ border-bottom: none; }}
            .label {{ color: #6B6760; font-size: 12px; }}
            .value {{ color: #1C1B18; font-weight: 500; }}
            .footer {{ color: #8E8980; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8E4DC; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{meta['title']}</h1>
            <p class="subtitle">Generated on {meta['generatedAt']}</p>
        </div>

        <div class="section">
            <div class="metadata">
                <p><strong>Simulation ID:</strong> {meta['simulation']['id']}</p>
                <p><strong>Created:</strong> {meta['simulation']['createdAt']}</p>
                <p><strong>Last Updated:</strong> {meta['simulation']['updatedAt']}</p>
            </div>
        </div>

        <div class="section">
            <h2>Summary</h2>
            <div class="grid">
                <div class="card">
                    <h3>Municipalities</h3>
                    <p>{', '.join(summary['municipalities']) if summary['municipalities'] else 'Not specified'}</p>
                </div>
                <div class="card">
                    <h3>Planning Horizon</h3>
                    <p>{summary['horizon']} years</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Financial Parameters</h2>
            <div class="card">
                <div class="row">
                    <span class="label">WACC</span>
                    <span class="value">{params['financial'].get('wacc', 'N/A')}%</span>
                </div>
                <div class="row">
                    <span class="label">Exchange Rate</span>
                    <span class="value">${params['financial'].get('exchangeRate', 'N/A')}</span>
                </div>
                <div class="row">
                    <span class="label">Carbon Price Scenario</span>
                    <span class="value">{params['financial'].get('carbonPrice', 'N/A')}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Operational Parameters</h2>
            <div class="card">
                <div class="row">
                    <span class="label">Truck Capacity</span>
                    <span class="value">{params['operational'].get('truckCapacity', 'N/A')} tons</span>
                </div>
                <div class="row">
                    <span class="label">Logistic Loss</span>
                    <span class="value">{params['operational'].get('logisticLoss', 'N/A')}%</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This report was automatically generated by ALQUIMIA.</p>
            <p>For questions or support, contact the platform administrator.</p>
        </div>
    </body>
    </html>
    """

    return html
