"""
Router: /simulations

Simulation persistence API supporting save, load, export, import, versioning,
and audit logging for the ALQUIMIA platform. Multi-tenant and multi-user support.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
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


class SaveSimulationRequest(BaseModel):
    """Request to save a simulation."""

    name: str
    description: Optional[str] = None
    state: Optional[dict] = None


class LoadSimulationResponse(BaseModel):
    """Response after loading a simulation."""

    state: dict
    metadata: dict
    versionNumber: int


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
    request: SaveSimulationRequest,
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save a new simulation or update existing one.
    Automatically creates a version snapshot for rollback capability.
    """
    start_time = datetime.utcnow()
    state_data = request.state or {}

    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

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
            user_id=user.id,
            tenant_id=tenant_id,
            name=request.name,
            description=request.description,
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
            user.id,
            True,
            f'Saved simulation "{request.name}"',
            {"version": 1, "size": len(str(state_data))},
            duration_ms,
        )

        db.commit()

        return {
            "id": sim_id,
            "name": request.name,
            "savedAt": simulation.created_at.isoformat(),
        }

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to save simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to save simulation: {str(exc)}")


@router.get("/")
async def list_simulations(
    page: int = 1,
    page_size: int = 10,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    """
    List simulations for current user/tenant.
    Paginated response with metadata only (not full state).
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

    try:
        # Query simulations for this user/tenant
        query = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .order_by(Simulation.updated_at.desc())
        )

        total = query.count()

        offset = (page - 1) * page_size
        simulations = query.offset(offset).limit(page_size).all()

        return {
            "simulations": [sim.to_dict(user.id) for sim in simulations],
            "total": total,
            "page": page,
            "pageSize": page_size,
        }

    except Exception as exc:
        logger.error(f"Failed to list simulations: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to list simulations: {str(exc)}")


@router.get("/stats/overview")
async def get_simulations_stats(
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    """
    Get statistics about user's simulations.
    Returns summary data for dashboard display.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

    try:
        # Count simulations
        total_simulations = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .count()
        )

        # Get newest simulation
        newest = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .order_by(Simulation.created_at.desc())
            .first()
        )

        # Get most recently modified
        most_recent = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .order_by(Simulation.updated_at.desc())
            .first()
        )

        # Count total versions
        total_versions = (
            db.query(SimulationVersion)
            .join(Simulation, SimulationVersion.simulation_id == Simulation.id)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .count()
        )

        # Count total audit log entries
        total_operations = (
            db.query(SimulationAuditLog)
            .join(Simulation, SimulationAuditLog.simulation_id == Simulation.id)
            .filter(
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .count()
        )

        return {
            "totalSimulations": total_simulations,
            "totalVersions": total_versions,
            "totalOperations": total_operations,
            "newestSimulation": {
                "id": newest.id,
                "name": newest.name,
                "createdAt": newest.created_at.isoformat(),
            } if newest else None,
            "mostRecentlyModified": {
                "id": most_recent.id,
                "name": most_recent.name,
                "updatedAt": most_recent.updated_at.isoformat(),
            } if most_recent else None,
        }

    except Exception as exc:
        logger.error(f"Failed to get simulation stats: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to get simulation stats: {str(exc)}")


@router.get("/{simulation_id}")
async def load_simulation(
    simulation_id: str,
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Load a specific simulation with full state.
    Returns the latest version by default.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"
    start_time = datetime.utcnow()

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
            user.id,
            True,
            f'Loaded simulation "{simulation.name}"',
            {"version": latest_version.version_number},
            duration_ms,
        )

        return {
            "state": latest_version.state_data,
            "metadata": simulation.to_dict(user.id),
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
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a simulation and all its versions/audit logs.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

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

        # Delete cascades to versions and audit logs
        db.delete(simulation)
        db.commit()

        logger.info(f"Deleted simulation {simulation_id} for user {user.id}")

        return {"success": True, "id": simulation_id}

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to delete simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to delete simulation: {str(exc)}")


@router.post("/{simulation_id}/duplicate")
async def duplicate_simulation(
    simulation_id: str,
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Duplicate an existing simulation and create a copy with a new name.
    Creates a new simulation with the same state as the latest version of the original.
    """
    # Extract tenant_id from header
    tenant_id = http_request.headers.get("x-tenant-id", "default") if http_request else "default"

    try:
        # Verify user owns the original simulation
        original = (
            db.query(Simulation)
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user.id,
                Simulation.tenant_id == tenant_id,
            )
            .first()
        )

        if not original:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Get the latest version to copy
        latest_version = (
            db.query(SimulationVersion)
            .filter(SimulationVersion.simulation_id == simulation_id)
            .order_by(SimulationVersion.version_number.desc())
            .first()
        )

        # Create a new simulation
        new_sim_id = str(uuid.uuid4())
        new_simulation = Simulation(
            id=new_sim_id,
            user_id=user.id,
            tenant_id=tenant_id,
            name=f"{original.name} (Copy)",
            description=f"Copy of {original.name}",
            latest_version=1,
        )
        db.add(new_simulation)

        # Create the first version of the new simulation (copy of latest version)
        if latest_version:
            new_version = SimulationVersion(
                id=str(uuid.uuid4()),
                simulation_id=new_sim_id,
                version_number=1,
                state_data=latest_version.state_data,
                checksum=latest_version.checksum,
                metadata=latest_version.metadata,
            )
            db.add(new_version)

        # Log audit
        _log_audit(
            db,
            new_sim_id,
            "simulation_duplicated",
            user.id,
            True,
            f"Duplicated from {original.name}",
            {"source_simulation_id": simulation_id},
        )

        db.commit()

        logger.info(f"Duplicated simulation {simulation_id} to {new_sim_id} for user {user.id}")

        return {
            "success": True,
            "id": new_sim_id,
            "name": new_simulation.name,
            "description": new_simulation.description,
        }

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to duplicate simulation: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to duplicate simulation: {str(exc)}")


@router.get("/{simulation_id}/versions")
async def get_simulation_versions(
    simulation_id: str,
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get version history for a simulation.
    Returns metadata only (not full state) to keep response small.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

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
    http_request: Request,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Restore a simulation to a previous version.
    Creates a new version as a checkpoint of the restoration.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"
    start_time = datetime.utcnow()

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
            created_by=user.id,
            checkpoint_name=f"Restored from v{version_to_restore.version_number}",
        )

        db.add(new_version)

        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Log audit
        _log_audit(
            db,
            simulation_id,
            "simulation_restored",
            user.id,
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


@router.get("/{simulation_id}/compare/{version_id_1}/with/{version_id_2}")
async def compare_versions(
    simulation_id: str,
    version_id_1: str,
    version_id_2: str,
    request: Request = None,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compare two simulation versions to identify differences.
    Returns a delta showing what changed between versions.
    """
    # Extract tenant_id from header
    tenant_id = request.headers.get("x-tenant-id", "default") if request else "default"

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

        # Get both versions
        version1 = (
            db.query(SimulationVersion)
            .filter(
                SimulationVersion.id == version_id_1,
                SimulationVersion.simulation_id == simulation_id,
            )
            .first()
        )

        version2 = (
            db.query(SimulationVersion)
            .filter(
                SimulationVersion.id == version_id_2,
                SimulationVersion.simulation_id == simulation_id,
            )
            .first()
        )

        if not version1 or not version2:
            raise HTTPException(status_code=404, detail="One or both versions not found")

        # Compare states
        import json
        state1 = version1.state_data or {}
        state2 = version2.state_data or {}

        differences = []
        all_keys = set(state1.keys()) | set(state2.keys())

        for key in sorted(all_keys):
            val1 = state1.get(key)
            val2 = state2.get(key)

            # Skip if values are the same (use JSON serialization for comparison)
            if json.dumps(val1, sort_keys=True, default=str) == json.dumps(val2, sort_keys=True, default=str):
                continue

            differences.append({
                "field": key,
                "oldValue": val1,
                "newValue": val2,
                "changed": True,
            })

        return {
            "simulation_id": simulation_id,
            "version1": {
                "id": version1.id,
                "number": version1.version_number,
                "createdAt": version1.created_at.isoformat(),
            },
            "version2": {
                "id": version2.id,
                "number": version2.version_number,
                "createdAt": version2.created_at.isoformat(),
            },
            "differences": differences,
            "total_differences": len(differences),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to compare versions: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to compare versions: {str(exc)}")


@router.get("/{simulation_id}/audit-logs")
async def get_simulation_audit_logs(
    simulation_id: str,
    limit: int = 50,
    offset: int = 0,
    user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get audit logs for a specific simulation.
    Returns the operation history with pagination.
    """
    try:
        # Verify simulation exists and user owns it
        simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()

        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")

        # Check ownership
        if simulation.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this simulation")

        # Get audit logs
        logs = (
            db.query(SimulationAuditLog)
            .filter(SimulationAuditLog.simulation_id == simulation_id)
            .order_by(SimulationAuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        total = db.query(SimulationAuditLog).filter(SimulationAuditLog.simulation_id == simulation_id).count()

        return {
            "logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "actor_id": log.actor_id,
                    "success": log.success,
                    "message": log.message,
                    "timestamp": log.created_at.isoformat(),
                    "details": log.details,
                    "duration_ms": log.duration_ms,
                }
                for log in logs
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to fetch audit logs: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(exc)}")


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
                actor_id=user.id,
                success=entry.get("success", False),
                message=entry.get("message", ""),
                details=entry.get("details"),
                duration_ms=entry.get("duration"),
            )

            db.add(log_entry)
            inserted_count += 1

        db.commit()

        logger.info(f"Batch inserted {inserted_count} audit logs for user {user.id}")

        return {"success": True, "inserted": inserted_count}

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to batch insert audit logs: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to batch insert audit logs: {str(exc)}")
