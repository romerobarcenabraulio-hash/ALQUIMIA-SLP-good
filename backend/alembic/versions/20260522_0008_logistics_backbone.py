"""Data Backbone logístico — tablas operativas HERMES.

Revision ID: 0008_logistics_backbone
Revises: 0007_user_municipio_reglamento
Create Date: 2026-05-22
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008_logistics_backbone"
down_revision: Union[str, None] = "0007_user_municipio_reglamento"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "logistics_daily_summaries",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("zm_id", sa.String(length=32), nullable=True),
        sa.Column("semaforo", sa.String(length=10), nullable=False),
        sa.Column("costo_logistico_mxn", sa.Float(), nullable=False, server_default="0"),
        sa.Column("km_totales", sa.Float(), nullable=False, server_default="0"),
        sa.Column("emisiones_co2e_kg", sa.Float(), nullable=False, server_default="0"),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("published_path", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("municipio_id", "fecha", name="uq_logistics_daily_summary_mun_fecha"),
    )
    op.create_index("ix_logistics_daily_summaries_fecha", "logistics_daily_summaries", ["fecha"])
    op.create_index("ix_logistics_daily_summaries_municipio_id", "logistics_daily_summaries", ["municipio_id"])

    op.create_table(
        "logistics_route_plans",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("fuente", sa.String(length=64), nullable=False),
        sa.Column("km_totales", sa.Float(), nullable=False, server_default="0"),
        sa.Column("plan_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logistics_route_plans_fecha", "logistics_route_plans", ["fecha"])
    op.create_index("ix_logistics_route_plans_municipio_id", "logistics_route_plans", ["municipio_id"])

    op.create_table(
        "logistics_weight_events",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("fraccion", sa.String(length=32), nullable=False),
        sa.Column("toneladas", sa.Float(), nullable=False),
        sa.Column("pureza_pct", sa.Float(), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logistics_weight_events_fecha", "logistics_weight_events", ["fecha"])
    op.create_index("ix_logistics_weight_events_municipio_id", "logistics_weight_events", ["municipio_id"])


def downgrade() -> None:
    op.drop_index("ix_logistics_weight_events_municipio_id", table_name="logistics_weight_events")
    op.drop_index("ix_logistics_weight_events_fecha", table_name="logistics_weight_events")
    op.drop_table("logistics_weight_events")
    op.drop_index("ix_logistics_route_plans_municipio_id", table_name="logistics_route_plans")
    op.drop_index("ix_logistics_route_plans_fecha", table_name="logistics_route_plans")
    op.drop_table("logistics_route_plans")
    op.drop_index("ix_logistics_daily_summaries_municipio_id", table_name="logistics_daily_summaries")
    op.drop_index("ix_logistics_daily_summaries_fecha", table_name="logistics_daily_summaries")
    op.drop_table("logistics_daily_summaries")
