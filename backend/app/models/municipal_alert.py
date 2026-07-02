"""Modelo de alertas municipales para ALQ-17"""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Text, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.national.alerts import AlertType, AlertSeverity


class MunicipalAlertModel(Base):
    """Tabla de alertas municipales (auditable, inmutable)"""
    __tablename__ = "municipal_alerts"

    id = Column(Integer, primary_key=True, index=True)
    municipio_id = Column(String(50), index=True, nullable=False)  # INEGI code
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    changed_field = Column(String(100), nullable=True)             # Campo que cambió
    old_value = Column(String(255), nullable=True)                 # Valor anterior
    new_value = Column(String(255), nullable=True)                 # Valor nuevo
    metadata_json = Column(Text, nullable=True)                    # JSON extra context
    triggered_by = Column(String(100), default="system")           # 'system' o user_id
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    acknowledged = Column(Integer, default=0)                      # 0=unread, timestamp=read_at
    resolved = Column(Integer, default=0)                          # 0=open, timestamp=resolved_at

    __table_args__ = (
        Index("idx_municipio_created", "municipio_id", "created_at"),
        Index("idx_severity_created", "severity", "created_at"),
        Index("idx_alert_type_municipio", "alert_type", "municipio_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "municipio_id": self.municipio_id,
            "alert_type": self.alert_type.value,
            "severity": self.severity.value,
            "title": self.title,
            "description": self.description,
            "changed_field": self.changed_field,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "triggered_by": self.triggered_by,
            "created_at": self.created_at.isoformat(),
            "acknowledged": bool(self.acknowledged),
            "resolved": bool(self.resolved),
        }


class AlertSubscriptionModel(Base):
    """Suscripciones a alertas por usuario/equipo"""
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(100), index=True, nullable=False)
    alert_types = Column(Text, nullable=False)                     # JSON array de AlertType
    municipios = Column(Text, nullable=True)                       # JSON array de municipio_id o null=todos
    min_severity = Column(SQLEnum(AlertSeverity), nullable=False, default=AlertSeverity.MEDIUM)
    notify_via_email = Column(Integer, default=1)                  # 0=off, 1=on
    notify_via_dashboard = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "alert_types": self.alert_types,  # JSON string
            "municipios": self.municipios,    # JSON string or null
            "min_severity": self.min_severity.value,
            "notify_via_email": bool(self.notify_via_email),
            "notify_via_dashboard": bool(self.notify_via_dashboard),
        }
