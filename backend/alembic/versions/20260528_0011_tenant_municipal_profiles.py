"""Tenant municipal profiles for Fase 6.

Revision ID: 0011_tenant_municipal_profiles
Revises: 0010_admin_tenants
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011_tenant_municipal_profiles"
down_revision: Union[str, None] = "0010_admin_tenants"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenant_municipal_profiles",
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False),
        sa.Column("antecedentes", sa.JSON(), nullable=False),
        sa.Column("mapa_social", sa.JSON(), nullable=False),
        sa.Column("organigrama_servicio", sa.JSON(), nullable=False),
        sa.Column("provenance_status", sa.String(length=40), nullable=False),
        sa.Column("updated_by", sa.String(length=200), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("tenant_id"),
    )


def downgrade() -> None:
    op.drop_table("tenant_municipal_profiles")
