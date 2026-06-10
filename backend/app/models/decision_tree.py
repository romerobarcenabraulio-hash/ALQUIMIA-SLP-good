from sqlalchemy import Column, String, JSON, Boolean, DateTime, Enum, Float, Text, Index, ForeignKey
from datetime import datetime
import enum
import uuid

from app.db.base import Base


class DecisionTreeType(str, enum.Enum):
    construccion = "construccion"
    hospital = "hospital"
    comercio = "comercio"
    restaurante = "restaurante"
    industria = "industria"
    hotel = "hotel"
    escuela = "escuela"
    residencial = "residencial"


class DecisionTreeSession(Base):
    __tablename__ = "decision_tree_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("admin_tenants.id"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("user_accounts.id"), nullable=True, index=True)

    # Session context
    tree_type = Column(Enum(DecisionTreeType), nullable=False)
    estado_mx = Column(String(50), nullable=True)
    municipio = Column(String(255), nullable=True)

    # User inputs (JSON to store all responses)
    answers = Column(JSON, nullable=False, default={})

    # Generated results
    sector_isic = Column(String(10), nullable=True)
    sector_desc = Column(String(255), nullable=True)
    residue_generation_tons_mes = Column(Float, nullable=True)
    residue_breakdown = Column(JSON, nullable=True, default={})  # {material: tons, ...}
    materiales_generados = Column(JSON, nullable=True, default=[])

    # Compliance guide (HTML rendered from template)
    compliance_guide_json = Column(JSON, nullable=True)
    compliance_guide_html = Column(Text, nullable=True)

    # Status
    completado = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_session_tenant_type", "tenant_id", "tree_type"),
        Index("idx_session_user", "user_id"),
    )


class ComplianceTemplate(Base):
    __tablename__ = "compliance_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Template metadata
    tree_type = Column(Enum(DecisionTreeType), nullable=False, unique=True)
    version = Column(String(20), nullable=False, default="1.0")

    # Template content (stored as JSON for structure)
    sections = Column(JSON, nullable=False, default=[])
    resources = Column(JSON, nullable=False, default=[])
    regulations = Column(JSON, nullable=False, default=[])

    # Status
    activo = Column(Boolean, nullable=False, default=True)
    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_template_type_active", "tree_type", "activo"),
    )
