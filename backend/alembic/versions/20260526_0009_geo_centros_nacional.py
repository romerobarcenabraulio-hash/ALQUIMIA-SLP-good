"""Geo nacional + rutas residenciales UI + api usage.

Revision ID: 0009_geo_centros_nacional
Revises: 0008_logistics_backbone
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009_geo_centros_nacional"
down_revision: Union[str, None] = "0008_logistics_backbone"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "geo_centro_acopio",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("centro_id", sa.String(length=128), nullable=False),
        sa.Column("nombre", sa.String(length=512), nullable=False),
        sa.Column("tipo", sa.String(length=64), nullable=False, server_default="otro"),
        sa.Column("direccion", sa.Text(), nullable=False, server_default=""),
        sa.Column("municipio", sa.String(length=256), nullable=False),
        sa.Column("estado", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("clave_inegi", sa.String(length=5), nullable=True),
        sa.Column("zm", sa.String(length=32), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lon", sa.Float(), nullable=True),
        sa.Column("materiales", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("precio_compra", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("telefono", sa.String(length=64), nullable=True),
        sa.Column("horario", sa.String(length=256), nullable=True),
        sa.Column("acepta_publico", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("acepta_empresa", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("rol_instalacion", sa.String(length=64), nullable=False, server_default="centro_acopio"),
        sa.Column("es_operador_principal", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("operador_nombre", sa.String(length=256), nullable=True),
        sa.Column("fuente", sa.String(length=64), nullable=False, server_default="usuario"),
        sa.Column("verificado", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("score_confianza", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("place_id", sa.String(length=256), nullable=True),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("centro_id"),
    )
    op.create_index("ix_geo_centro_acopio_clave_inegi", "geo_centro_acopio", ["clave_inegi"])
    op.create_index("ix_geo_centro_acopio_zm", "geo_centro_acopio", ["zm"])
    op.create_index("ix_geo_centro_acopio_operador", "geo_centro_acopio", ["es_operador_principal"])

    op.create_table(
        "geo_municipio_sync",
        sa.Column("clave_inegi", sa.String(length=5), nullable=False),
        sa.Column("municipio", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("estado", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("estado_id", sa.String(length=2), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("total_centros", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_candidatos_operador", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fuente", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("clave_inegi"),
    )
    op.create_index("ix_geo_municipio_sync_status", "geo_municipio_sync", ["status"])
    op.create_index("ix_geo_municipio_sync_estado_id", "geo_municipio_sync", ["estado_id"])

    op.create_table(
        "logistics_residential_routes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("route_id", sa.String(length=128), nullable=False),
        sa.Column("zm", sa.String(length=32), nullable=False),
        sa.Column("clave_inegi", sa.String(length=5), nullable=True),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("traced", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="draft"),
        sa.Column("depot_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("plan_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("route_id", "zm", name="uq_logistics_residential_route_zm"),
    )
    op.create_index("ix_logistics_residential_routes_zm", "logistics_residential_routes", ["zm"])
    op.create_index("ix_logistics_residential_routes_clave", "logistics_residential_routes", ["clave_inegi"])

    op.create_table(
        "api_usage_daily",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("service_key", sa.String(length=64), nullable=False),
        sa.Column("call_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("usage_date", "service_key", name="uq_api_usage_daily_service"),
    )
    op.create_index("ix_api_usage_daily_date", "api_usage_daily", ["usage_date"])


def downgrade() -> None:
    op.drop_index("ix_api_usage_daily_date", table_name="api_usage_daily")
    op.drop_table("api_usage_daily")
    op.drop_index("ix_logistics_residential_routes_clave", table_name="logistics_residential_routes")
    op.drop_index("ix_logistics_residential_routes_zm", table_name="logistics_residential_routes")
    op.drop_table("logistics_residential_routes")
    op.drop_index("ix_geo_municipio_sync_estado_id", table_name="geo_municipio_sync")
    op.drop_index("ix_geo_municipio_sync_status", table_name="geo_municipio_sync")
    op.drop_table("geo_municipio_sync")
    op.drop_index("ix_geo_centro_acopio_operador", table_name="geo_centro_acopio")
    op.drop_index("ix_geo_centro_acopio_zm", table_name="geo_centro_acopio")
    op.drop_index("ix_geo_centro_acopio_clave_inegi", table_name="geo_centro_acopio")
    op.drop_table("geo_centro_acopio")
