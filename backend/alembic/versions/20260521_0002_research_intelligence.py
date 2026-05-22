"""Research intelligence tables — Serper persistence

Revision ID: 0002_research
Revises: 0001_initial
Create Date: 2026-05-21

Tablas: research_items, price_series, regulatory_sources, model_calibrations
Perplexity: diferido — ver cursor-rules/RESEARCH_INTELLIGENCE_ROADMAP.md
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_research"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "research_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("municipio_id", sa.String(50), nullable=True),
        sa.Column("zm_id", sa.String(10), nullable=True),
        sa.Column("categoria", sa.String(40), nullable=False),
        sa.Column("material", sa.String(20), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=True),
        sa.Column("fuente_url", sa.Text(), nullable=False),
        sa.Column("fuente_titulo", sa.String(300), nullable=True),
        sa.Column("fuente_dominio", sa.String(100), nullable=True),
        sa.Column("tier_confianza", sa.Integer(), nullable=True),
        sa.Column("confianza", sa.Float(), nullable=True),
        sa.Column("valor_numerico", sa.Float(), nullable=True),
        sa.Column("unidad", sa.String(30), nullable=True),
        sa.Column("snippet", sa.Text(), nullable=True),
        sa.Column("motor_extraccion", sa.String(20), nullable=False, server_default="serper"),
        sa.Column("fecha_publicacion", sa.Date(), nullable=True),
        sa.Column("fecha_consulta", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("hash_canonico", sa.String(64), nullable=False),
        sa.Column("vigente", sa.Boolean(), nullable=False, server_default="true"),
        sa.UniqueConstraint("hash_canonico", name="uq_research_items_hash"),
    )
    op.create_index("ix_research_items_municipio", "research_items", ["municipio_id"])
    op.create_index("ix_research_items_categoria", "research_items", ["categoria"])

    op.create_table(
        "price_series",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("material", sa.String(20), nullable=False),
        sa.Column("precio_mxn", sa.Float(), nullable=True),
        sa.Column("precio_usd", sa.Float(), nullable=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("fuente_url", sa.Text(), nullable=True),
        sa.Column("tier_confianza", sa.Integer(), nullable=True),
        sa.Column("zm_id", sa.String(10), nullable=True),
        sa.Column("municipio_id", sa.String(50), nullable=True),
        sa.Column("research_item_id", sa.String(36), nullable=True),
        sa.UniqueConstraint("material", "fecha", "municipio_id", name="uq_price_series_mat_fecha_mun"),
    )
    op.create_index("ix_price_series_material", "price_series", ["material"])

    op.create_table(
        "regulatory_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("municipio_id", sa.String(50), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=True),
        sa.Column("tipo", sa.String(40), nullable=True),
        sa.Column("dof_fecha", sa.Date(), nullable=True),
        sa.Column("estado_vigencia", sa.String(20), nullable=True),
        sa.Column("fuente_url", sa.Text(), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("fecha_carga", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_regulatory_municipio", "regulatory_sources", ["municipio_id"])

    op.create_table(
        "model_calibrations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("scope", sa.String(20), nullable=False),
        sa.Column("scope_id", sa.String(50), nullable=False),
        sa.Column("parametro", sa.String(60), nullable=False),
        sa.Column("valor", sa.Float(), nullable=False),
        sa.Column("unidad", sa.String(30), nullable=True),
        sa.Column("confianza", sa.Float(), nullable=True),
        sa.Column("fuente_primaria", sa.String(200), nullable=True),
        sa.Column("metodologia", sa.Text(), nullable=True),
        sa.Column("vigente", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("fecha_calibracion", sa.Date(), nullable=True),
        sa.Column("fecha_expiracion", sa.Date(), nullable=True),
    )
    op.create_index("ix_calibration_scope", "model_calibrations", ["scope_id", "parametro"])


def downgrade() -> None:
    op.drop_table("model_calibrations")
    op.drop_table("regulatory_sources")
    op.drop_table("price_series")
    op.drop_table("research_items")
