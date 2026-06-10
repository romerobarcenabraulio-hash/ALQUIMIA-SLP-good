from sqlalchemy import Column, String, Float, JSON, Boolean, DateTime, Enum, Text, Index, ForeignKey
from datetime import datetime
import enum
import uuid

from app.db.base import Base


class GeneradorTipo(str, enum.Enum):
    empresa = "empresa"
    hospital = "hospital"
    hotel = "hotel"
    comercio = "comercio"
    residencial = "residencial"
    industria = "industria"
    construccion = "construccion"
    restaurante = "restaurante"
    escuela = "escuela"
    otro = "otro"


class GeneradorSource(str, enum.Enum):
    denue = "denue"
    manual = "manual"
    decision_tree = "decision_tree"
    bulk_upload = "bulk_upload"
    admin = "admin"


class GeneradorEntity(Base):
    __tablename__ = "generador_entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("admin_tenants.id"), nullable=False, index=True)

    # Identificación
    nombre = Column(String(255), nullable=False)
    tipo = Column(Enum(GeneradorTipo), nullable=False, default=GeneradorTipo.empresa)
    rfc = Column(String(13), nullable=True, index=True)  # México RFC
    clave_inegi = Column(String(50), nullable=True)      # INEGI reference

    # Localización
    municipio = Column(String(255), nullable=False, index=True)
    estado_mx = Column(String(50), nullable=False)
    direccion = Column(Text, nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

    # Contacto
    contacto_nombre = Column(String(255), nullable=True)
    contacto_email = Column(String(255), nullable=True)
    contacto_telefono = Column(String(20), nullable=True)

    # Sector ISIC
    sector_isic = Column(String(10), nullable=True)
    sector_desc = Column(String(255), nullable=True)

    # Generación de residuos
    capacidad_generacion_ton_mes = Column(Float, nullable=True)  # Estimated or actual
    materiales_generados = Column(JSON, nullable=True, default=[])  # List of material types
    frecuencia_generacion = Column(String(50), nullable=True, default="diaria")  # daily, weekly, monthly

    # Estados
    activo = Column(Boolean, nullable=False, default=True)
    verificado = Column(Boolean, nullable=False, default=False)
    compliance_level = Column(String(50), nullable=True)  # basic, intermediate, advanced

    # Auditoría
    source = Column(Enum(GeneradorSource), nullable=False, default=GeneradorSource.manual)
    source_metadata = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    # Índices para búsqueda rápida
    __table_args__ = (
        Index("idx_generador_tenant_municipio", "tenant_id", "municipio"),
        Index("idx_generador_tenant_tipo", "tenant_id", "tipo"),
        Index("idx_generador_tenant_activo", "tenant_id", "activo"),
        Index("idx_generador_rfc", "rfc"),
    )


class GeneratorResidueRecord(Base):
    __tablename__ = "generator_residue_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    generador_id = Column(String(36), ForeignKey("generador_entities.id"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("admin_tenants.id"), nullable=False, index=True)

    # Registro diario
    fecha_generacion = Column(String(10), nullable=False)  # YYYY-MM-DD
    materiales_json = Column(JSON, nullable=False, default={})  # {material: tons, ...}
    cantidad_total_tons = Column(Float, nullable=False)

    # Validación
    validado = Column(Boolean, nullable=False, default=False)
    es_outlier = Column(Boolean, nullable=False, default=False)
    confianza_pct = Column(Float, nullable=False, default=100.0)

    # Observaciones
    comentario = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_residue_generador_fecha", "generador_id", "fecha_generacion"),
        Index("idx_residue_tenant_fecha", "tenant_id", "fecha_generacion"),
    )


class MunicipalResidueAggregate(Base):
    __tablename__ = "municipal_residue_aggregates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("admin_tenants.id"), nullable=False, index=True)
    municipio = Column(String(255), nullable=False, index=True)
    estado_mx = Column(String(50), nullable=False)

    # Período
    fecha = Column(String(10), nullable=False)  # YYYY-MM-DD
    periodo = Column(String(20), nullable=False, default="diario")  # daily, weekly, monthly

    # Agregación
    total_generadores = Column(Float, nullable=False, default=0)
    total_tons = Column(Float, nullable=False, default=0)
    materiales_desglose = Column(JSON, nullable=False, default={})  # {material: {tons, pct, ...}}

    # Estadísticas
    promedio_generador_tons = Column(Float, nullable=True)
    completitud_pct = Column(Float, nullable=False, default=0.0)  # % de generadores que reportaron

    # Tendencias
    cambio_semana_pct = Column(Float, nullable=True)
    cambio_mes_pct = Column(Float, nullable=True)
    proyeccion_mes_tons = Column(Float, nullable=True)

    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_agg_tenant_fecha", "tenant_id", "fecha"),
        Index("idx_agg_municipio_fecha", "municipio", "fecha"),
    )
