"""
Simulation Persistence Models

Stores user simulations, versions, and audit logs for the ALQUIMIA platform.
Supports multi-tenant, multi-user scenarios with automatic versioning.
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    JSON,
    ForeignKey,
    Index,
    Boolean,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class Simulation(Base):
    """
    Top-level simulation record.
    Represents a saved simulation state for a user/tenant.
    """

    __tablename__ = "simulations"

    # Identifiers
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    tenant_id = Column(String(255), nullable=False, index=True)

    # Metadata
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Simulation configuration snapshot
    municipios = Column(JSON, nullable=True)  # Array of municipality IDs
    horizonte = Column(Integer, nullable=True)  # Time horizon in years

    # Data integrity
    checksum = Column(String(64), nullable=False)  # SHA-256 hex of state data

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    # Relations
    versions = relationship("SimulationVersion", back_populates="simulation", cascade="all, delete-orphan")
    audit_logs = relationship("SimulationAuditLog", back_populates="simulation", cascade="all, delete-orphan")

    # Indexes for common queries
    __table_args__ = (
        Index("idx_user_tenant", "user_id", "tenant_id"),
        Index("idx_user_created", "user_id", "created_at"),
        Index("idx_tenant_updated", "tenant_id", "updated_at"),
    )

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "municipios": self.municipios or [],
            "horizonte": self.horizonte,
            "userId": self.user_id,
            "tenantId": self.tenant_id,
        }


class SimulationVersion(Base):
    """
    Versioned snapshot of simulation state.
    Each save creates a new version to enable rollback and history viewing.
    """

    __tablename__ = "simulation_versions"

    # Identifiers
    id = Column(String(36), primary_key=True, index=True)
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=False, index=True)

    # Version sequence
    version_number = Column(Integer, nullable=False)  # Auto-increment within simulation

    # State data (complete simulation state JSON)
    state_data = Column(JSON, nullable=False)  # Serialized SimulatorState

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_by = Column(String(255), nullable=False)  # user_id who created this version

    # Optional checkpoint info
    checkpoint_name = Column(String(255), nullable=True)  # User-friendly version name
    checkpoint_description = Column(Text, nullable=True)  # Why this version was saved

    # Relations
    simulation = relationship("Simulation", back_populates="versions")

    # Indexes
    __table_args__ = (
        Index("idx_simulation_version", "simulation_id", "version_number"),
        Index("idx_version_created", "simulation_id", "created_at"),
    )

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "id": self.id,
            "versionNumber": self.version_number,
            "createdAt": self.created_at.isoformat(),
            "createdBy": self.created_by,
            "checkpointName": self.checkpoint_name,
            "checkpointDescription": self.checkpoint_description,
        }


class SimulationAuditLog(Base):
    """
    Audit trail for simulation operations.
    Tracks all saves, loads, exports, imports for compliance and debugging.
    """

    __tablename__ = "simulation_audit_logs"

    # Identifiers
    id = Column(String(36), primary_key=True, index=True)
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=False, index=True)

    # Operation info
    action = Column(String(64), nullable=False, index=True)  # simulation_saved, simulation_loaded, export_generated, etc.
    actor_id = Column(String(255), nullable=False, index=True)  # user_id

    # Result
    success = Column(Boolean, default=True, nullable=False)
    message = Column(Text, nullable=False)

    # Context
    details = Column(JSON, nullable=True)  # Action-specific details (format, size, etc.)
    duration_ms = Column(Integer, nullable=True)  # How long the operation took

    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relations
    simulation = relationship("Simulation", back_populates="audit_logs")

    # Indexes
    __table_args__ = (
        Index("idx_simulation_action", "simulation_id", "action"),
        Index("idx_action_timestamp", "action", "timestamp"),
        Index("idx_actor_timestamp", "actor_id", "timestamp"),
    )

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return {
            "id": self.id,
            "action": self.action,
            "actorId": self.actor_id,
            "success": self.success,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
            "durationMs": self.duration_ms,
        }
