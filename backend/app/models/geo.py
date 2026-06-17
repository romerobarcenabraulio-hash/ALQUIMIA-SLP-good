"""Modelos geo — centros de acopio nacional + sync cursor + rutas residenciales UI."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

JsonColumn = JSONB().with_variant(JSON(), "sqlite")


class GeoCentroAcopio(Base):
    __tablename__ = "geo_centro_acopio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    centro_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(512), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False, server_default="otro")
    direccion: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    municipio: Mapped[str] = mapped_column(String(256), nullable=False)
    estado: Mapped[str] = mapped_column(String(256), nullable=False, server_default="")
    clave_inegi: Mapped[str | None] = mapped_column(String(5), nullable=True, index=True)
    zm: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    materiales: Mapped[list] = mapped_column(JsonColumn, nullable=False, server_default="[]")
    precio_compra: Mapped[dict] = mapped_column(JsonColumn, nullable=False, server_default="{}")
    telefono: Mapped[str | None] = mapped_column(String(64), nullable=True)
    horario: Mapped[str | None] = mapped_column(String(256), nullable=True)
    acepta_publico: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    acepta_empresa: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    rol_instalacion: Mapped[str] = mapped_column(String(64), nullable=False, server_default="centro_acopio")
    es_operador_principal: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false", index=True)
    operador_nombre: Mapped[str | None] = mapped_column(String(256), nullable=True)
    fuente: Mapped[str] = mapped_column(String(64), nullable=False, server_default="usuario")
    verificado: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    score_confianza: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.5")
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    payload_json: Mapped[dict] = mapped_column(JsonColumn, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class GeoMunicipioSync(Base):
    __tablename__ = "geo_municipio_sync"

    clave_inegi: Mapped[str] = mapped_column(String(5), primary_key=True)
    municipio: Mapped[str] = mapped_column(String(256), nullable=False, server_default="")
    estado: Mapped[str] = mapped_column(String(256), nullable=False, server_default="")
    estado_id: Mapped[str | None] = mapped_column(String(2), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="pending", index=True)
    total_centros: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    total_candidatos_operador: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    fuente: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class LogisticsResidentialRoute(Base):
    __tablename__ = "logistics_residential_routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    zm: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    clave_inegi: Mapped[str | None] = mapped_column(String(5), nullable=True, index=True)
    municipio_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    traced: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    source: Mapped[str] = mapped_column(String(64), nullable=False, server_default="draft")
    depot_json: Mapped[dict | None] = mapped_column(JsonColumn, nullable=True)
    plan_json: Mapped[dict] = mapped_column(JsonColumn, nullable=False)
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("route_id", "zm", name="uq_logistics_residential_route_zm"),
    )


class ApiUsageDaily(Base):
    __tablename__ = "api_usage_daily"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usage_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    service_key: Mapped[str] = mapped_column(String(64), nullable=False)
    call_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("usage_date", "service_key", name="uq_api_usage_daily_service"),
    )
