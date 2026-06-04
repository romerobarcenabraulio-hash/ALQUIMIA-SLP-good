"""
Router: /simulations

Simulation persistence API supporting save, load, export, import, versioning,
and audit logging for the ALQUIMIA platform. Multi-tenant and multi-user support.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import logging
from typing import Any, Optional

from app.db.session import get_db
from app.routers.auth import get_current_user, UserInfo
from app.models.simulation import Simulation, SimulationVersion, SimulationAuditLog

router = APIRouter(prefix="/simulations", tags=["simulations"])
logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────────────
# Schemas
# ────────────────────────────────────────────────────────────────────────────


class SaveSimulationRequest:
    """Request to save a simulation."""

    def __init__(self, name: str, description: Optional[str] = None, state: dict = None):
        self.name = name
        self.description = description
        self.state = state or {}


class SaveSimulationResponse:
    """Response after saving a simulation."""

    def __init__(self, id: str, name: str, saved_at: datetime):
        self.id = id
        self.name = name
        self.saved_at = saved_at

    def dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "savedAt": self.saved_at.isoformat(),
        }


# ────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ────────────────────────────────────────────────────────────────────────────


def _calculate_checksum(data: dict) -> str:
    """Calculate SHA256-like checksum of data for integrity verification."""
    import hashlib
    import json

    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()


def _log_audit(
    db: Session,
    simulation_id: str,
    action: str,
    actor_id: str,
    success: bool,
    message: str,
    details: Optional[dict] = None,
    duration_ms: Optional[int] = None,
) -> None:
    """Create an audit log entry."""
    log_entry = SimulationAuditLog(
        id=str(uuid.uuid4()),
        simulation_id=simulation_id,
        action=action,
        actor_id=actor_id,
        success=success,
        message=message,
        details=details,
        duration_ms=duration_ms,
    )
    db.add(log_entry)
    db.commit()


# ────────────────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────────────────


@router.post("/save")
async def save_simulation(
    name: str,
    description: Optional[str] = None,
    state: Optional[dict] = None,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save a new simulation or update existing one.
    Automatically creates a version snapshot for rollback capability.
    """
    start_time = datetime.utcnow()
    state_data = state or {}

    try:
        # Extract metadata from state
        municipios = state_data.get("municipiosActivos", [])
        horizonte = state_data.get("horizonte")

        # Calculate checksum for integrity
        checksum = _calculate_checksum(state_data)

        # Generate IDs
        sim_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())

        # Create simulation record
        simulation = Simulation(
            id=sim_id,
            user_id=user.user_id,
            tenant_id=user.tenant_id or "default",
            name=name,
            description=description,
            municipios=municipios,
            horizonte=horizonte,
            checksum=checksum,
        )

        # Create initial version
        version = SimulationVersion(
            id=version_id,
            simulation_id=sim_id,
            version_number=1,
            state_data=state_data,
            created_by=user.user_id,
            checkpoint_name="Initial save",
        )

        db.add(simulation)
        db.add(version)

        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Log audit
        _log_audit(
            db,
            sim_id,
            "simulation_saved",
            user.user_id,
            True,
            f'Saved simulation "{name}"',
            {"version": 1, "size": len(str(state_data))},
            duration_ms,
        )

        db.commit()

        return {
            "id": sim_id,
            "name": name,
            "savedAt": simulation.created_at.isoformat(),
        }

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to save simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to save simulation: {str(exc)}")


@router.get("/")
async def list_simulations(
    page: int = 1,
    limit: int = 10,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List simulations for current user/tenant.
    Paginated response with metadata only (not full state).
    """
    try:
        # Query simulations for this user/tenant
        query = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user.user_id,
                Simulation.tenant_id == (user.tenant_id or "default"),
            )
            .order_by(Simulation.updated_at.desc())
        )

        total = query.count()

        offset = (page - 1) * limit
        simulations = query.offset(offset).limit(limit).all()

        return {
            "simulations": [sim.to_dict() for sim in simulations],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }

    except Exception as exc:
        logger.error(f"Failed to list simulations: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to list simulations: {str(exc)}")


@router.get("/{simulation_id}")
async def load_simulation(
    simulation_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Load a specific simulation with full state.
    Returns the latest version by default.
    """
    start_time = datetime.utcnow()

    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.user_id,
                Simulation.tenant_id == (user.tenant_id or "default"),
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Get latest version
        latest_version = (
            db.query(SimulationVersion)
            .filter(SimulationVersion.simulation_id == simulation_id)
            .order_by(SimulationVersion.version_number.desc())
            .first()
        )

        if not latest_version:
            raise HTTPException(status_code=404, detail="Simulation has no versions")

        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Log audit
        _log_audit(
            db,
            simulation_id,
            "simulation_loaded",
            user.user_id,
            True,
            f'Loaded simulation "{simulation.name}"',
            {"version": latest_version.version_number},
            duration_ms,
        )

        return {
            "state": latest_version.state_data,
            "metadata": simulation.to_dict(),
            "versionNumber": latest_version.version_number,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to load simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to load simulation: {str(exc)}")


@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a simulation and all its versions/audit logs.
    """
    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.user_id,
                Simulation.tenant_id == (user.tenant_id or "default"),
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Delete cascades to versions and audit logs
        db.delete(simulation)
        db.commit()

        logger.info(f"Deleted simulation {simulation_id} for user {user.user_id}")

        return {"success": True, "id": simulation_id}

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to delete simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to delete simulation: {str(exc)}")


@router.get("/{simulation_id}/versions")
async def get_simulation_versions(
    simulation_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get version history for a simulation.
    Returns metadata only (not full state) to keep response small.
    """
    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.user_id,
                Simulation.tenant_id == (user.tenant_id or "default"),
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Get all versions
        versions = (
            db.query(SimulationVersion)
            .filter(SimulationVersion.simulation_id == simulation_id)
            .order_by(SimulationVersion.version_number.desc())
            .all()
        )

        return {
            "simulationId": simulation_id,
            "versions": [
                {
                    "id": v.id,
                    "versionNumber": v.version_number,
                    "createdAt": v.created_at.isoformat(),
                    "createdBy": v.created_by,
                    "checkpointName": v.checkpoint_name,
                }
                for v in versions
            ],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to get simulation versions: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to get simulation versions: {str(exc)}")


@router.post("/{simulation_id}/restore/{version_id}")
async def restore_simulation_version(
    simulation_id: str,
    version_id: str,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Restore a simulation to a previous version.
    Creates a new version as a checkpoint of the restoration.
    """
    start_time = datetime.utcnow()

    try:
        # Verify user owns this simulation
        simulation = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.user_id,
                Simulation.tenant_id == (user.tenant_id or "default"),
            )
            .first()
        )

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Get the version to restore
        version_to_restore = (
            db.query(SimulationVersion)
            .filter(
                SimulationVersion.id == version_id,
                SimulationVersion.simulation_id == simulation_id,
            )
            .first()
        )

        if not version_to_restore:
            raise HTTPException(status_code=404, detail="Version not found")

        # Get next version number
        max_version = db.query(SimulationVersion).filter(
            SimulationVersion.simulation_id == simulation_id
        ).count()

        # Create new version as restoration checkpoint
        new_version = SimulationVersion(
            id=str(uuid.uuid4()),
            simulation_id=simulation_id,
            version_number=max_version + 1,
            state_data=version_to_restore.state_data,
            created_by=user.user_id,
            checkpoint_name=f"Restored from v{version_to_restore.version_number}",
        )

        db.add(new_version)

        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Log audit
        _log_audit(
            db,
            simulation_id,
            "simulation_restored",
            user.user_id,
            True,
            f"Restored from version {version_to_restore.version_number}",
            {"fromVersion": version_to_restore.version_number, "toVersion": max_version + 1},
            duration_ms,
        )

        db.commit()

        return {
            "success": True,
            "versionNumber": max_version + 1,
            "restoredFrom": version_to_restore.version_number,
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to restore simulation version: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to restore simulation version: {str(exc)}")


@router.post("/audit-logs/batch")
async def batch_audit_logs(
    entries: list[dict],
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Batch insert audit log entries from frontend.
    Frontend collects audit logs locally and syncs periodically.
    """
    try:
        inserted_count = 0

        for entry in entries:
            # Find the simulation this log entry relates to
            # If no simulation_id in entry, skip or handle gracefully
            if "resource" not in entry or entry["resource"].get("type") != "simulation":
                continue

            sim_id = entry["resource"].get("id")
            if not sim_id:
                continue

            # Create audit log
            log_entry = SimulationAuditLog(
                id=entry.get("id", str(uuid.uuid4())),
                simulation_id=sim_id,
                action=entry.get("action", "unknown"),
                actor_id=user.user_id,
                success=entry.get("success", False),
                message=entry.get("message", ""),
                details=entry.get("details"),
                duration_ms=entry.get("duration"),
            )

            db.add(log_entry)
            inserted_count += 1

        db.commit()

        logger.info(f"Batch inserted {inserted_count} audit logs for user {user.user_id}")

        return {"success": True, "inserted": inserted_count}

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to batch insert audit logs: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to batch insert audit logs: {str(exc)}")
