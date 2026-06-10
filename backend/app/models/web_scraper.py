from sqlalchemy import Column, String, JSON, Boolean, DateTime, Enum, Text, Integer, Index, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum
import uuid

from app.db.base import Base


class ScraperSource(str, enum.Enum):
    dof = "dof"
    semarnat = "semarnat"
    cofemer = "cofemer"
    inegi = "inegi"
    asf = "asf"


class ScraperSchedule(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class ScrapedDocument(Base):
    __tablename__ = "scraped_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Source and metadata
    source = Column(Enum(ScraperSource), nullable=False, index=True)
    titulo = Column(String(500), nullable=False)
    descripcion = Column(Text, nullable=True)
    url = Column(String(2000), nullable=False, unique=True)
    fecha_publicacion = Column(String(10), nullable=True)

    # Content
    contenido_text = Column(Text, nullable=True)
    pdf_hash = Column(String(64), nullable=True, index=True)  # SHA256 for deduplication
    palabras_clave = Column(JSON, nullable=True, default=[])

    # Processing
    procesado = Column(Boolean, nullable=False, default=False)
    extraido_text = Column(Boolean, nullable=False, default=False)
    indexado = Column(Boolean, nullable=False, default=False)

    # Classification
    ambito = Column(String(50), nullable=True)  # federal, estatal, municipal
    tema = Column(String(100), nullable=True)  # residuos, construccion, agua, etc
    aplicable_rsu = Column(Boolean, nullable=False, default=False)
    aplicable_rcd = Column(Boolean, nullable=False, default=False)

    # Status
    activo = Column(Boolean, nullable=False, default=True)
    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_doc_source_fecha", "source", "fecha_publicacion"),
        Index("idx_doc_pdf_hash", "pdf_hash"),
        Index("idx_doc_tema", "tema"),
    )


class ScraperJob(Base):
    __tablename__ = "scraper_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Job config
    source = Column(Enum(ScraperSource), nullable=False, index=True)
    schedule = Column(Enum(ScraperSchedule), nullable=False)
    activo = Column(Boolean, nullable=False, default=True)

    # Timing
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    ultima_ejecucion_status = Column(String(50), nullable=True)  # success, failed, pending

    # Stats
    documentos_encontrados = Column(Integer, nullable=False, default=0)
    documentos_nuevos = Column(Integer, nullable=False, default=0)
    documentos_duplicados = Column(Integer, nullable=False, default=0)
    tiempo_ejecucion_segundos = Column(Integer, nullable=True)

    # Error handling
    intentos_fallidos = Column(Integer, nullable=False, default=0)
    ultimo_error = Column(Text, nullable=True)

    metadata_json = Column(JSON, nullable=True, default={})

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_job_source_schedule", "source", "schedule"),
        Index("idx_job_activo_next_run", "activo", "next_run_at"),
    )


class ScraperLog(Base):
    __tablename__ = "scraper_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("scraper_jobs.id"), nullable=False, index=True)

    # Execution details
    inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    fin = Column(DateTime, nullable=True)
    estado = Column(String(50), nullable=False)  # running, success, failed
    mensaje = Column(Text, nullable=True)

    # Results
    documentos_procesados = Column(Integer, nullable=False, default=0)
    errores = Column(JSON, nullable=True, default=[])

    metadata_json = Column(JSON, nullable=True, default={})

    __table_args__ = (
        Index("idx_log_job_fecha", "job_id", "inicio"),
    )
