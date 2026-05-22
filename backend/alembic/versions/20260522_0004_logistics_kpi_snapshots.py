"""Logistics KPI snapshots — contrato HERMES→KRONOS opción B (G3).

Revision ID: 0004_logistics_kpi
Revises: 0003_evm
Create Date: 2026-05-22

Tabla: logistics_kpi_snapshots — máx. 1 snapshot/día/municipio (aplicar en app layer).
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_logistics_kpi"
down_revision: Union[str, None] = "0003_evm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "logistics_kpi_snapshots",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("zm_id", sa.String(length=32), nullable=True),
        sa.Column("clave_inegi", sa.String(length=10), nullable=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("fase_producto", sa.String(length=8), nullable=False, server_default="0-1"),
        sa.Column("fuente", sa.String(length=64), nullable=False, server_default="dimensionamiento_conceptual"),
        sa.Column("total_camiones_requeridos", sa.Integer(), nullable=False),
        sa.Column("visitas_mes_estimadas", sa.Float(), nullable=False),
        sa.Column("brecha_ton_dia", sa.Float(), nullable=False),
        sa.Column("cap_instalada_ton_dia", sa.Float(), nullable=False),
        sa.Column("merma_logistica_pct", sa.Float(), nullable=True),
        sa.Column("km_recorrido_dia_estimado", sa.Float(), nullable=True),
        sa.Column("pureza_promedio_pct", sa.Float(), nullable=True),
        sa.Column("opex_logistica_anual_estimado_mxn", sa.Float(), nullable=True),
        sa.Column("confianza", sa.Float(), nullable=True),
        sa.Column("modulos_prerequisitos_ok", sa.Boolean(), nullable=True),
        sa.Column("advertencia_gate", sa.Text(), nullable=True),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("municipio_id", "fecha", name="uq_logistics_kpi_municipio_fecha"),
    )
    op.create_index("ix_logistics_kpi_municipio_id", "logistics_kpi_snapshots", ["municipio_id"])
    op.create_index("ix_logistics_kpi_fecha", "logistics_kpi_snapshots", ["fecha"])


def downgrade() -> None:
    op.drop_index("ix_logistics_kpi_fecha", table_name="logistics_kpi_snapshots")
    op.drop_index("ix_logistics_kpi_municipio_id", table_name="logistics_kpi_snapshots")
    op.drop_table("logistics_kpi_snapshots")
