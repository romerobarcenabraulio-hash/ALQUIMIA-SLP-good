"""Plataforma 0 admin tenants MVP.

Revision ID: 0010_admin_tenants
Revises: 0009_geo_centros_nacional
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_admin_tenants"
down_revision: Union[str, None] = "0009_geo_centros_nacional"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_tenants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("estado_mx", sa.String(length=100), nullable=False),
        sa.Column("municipio_id", sa.String(length=64), nullable=False),
        sa.Column("inegi_clave", sa.String(length=16), nullable=False),
        sa.Column("tier_comercial", sa.String(length=40), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_tenants_municipio_id", "admin_tenants", ["municipio_id"])

    op.create_table(
        "tenant_states",
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("current_stage", sa.String(length=32), nullable=False),
        sa.Column("fecha_ingreso", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_cambio_stage", sa.DateTime(timezone=True), nullable=False),
        sa.Column("transition_mode", sa.String(length=32), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("tenant_id"),
    )

    op.create_table(
        "tenant_gates",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("gate_id", sa.String(length=2), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("evidencia_url", sa.Text(), nullable=True),
        sa.Column("evidencia_label", sa.String(length=300), nullable=True),
        sa.Column("decisor_humano", sa.String(length=200), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenant_gates_tenant_id", "tenant_gates", ["tenant_id"])
    op.create_index("ix_tenant_gates_gate_id", "tenant_gates", ["gate_id"])

    op.create_table(
        "tenant_capabilities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("source", sa.String(length=60), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenant_capabilities_tenant_id", "tenant_capabilities", ["tenant_id"])
    op.create_index("ix_tenant_capabilities_module_id", "tenant_capabilities", ["module_id"])

    op.create_table(
        "tenant_audit_log",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("actor", sa.String(length=200), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenant_audit_log_tenant_id", "tenant_audit_log", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_tenant_audit_log_tenant_id", table_name="tenant_audit_log")
    op.drop_table("tenant_audit_log")
    op.drop_index("ix_tenant_capabilities_module_id", table_name="tenant_capabilities")
    op.drop_index("ix_tenant_capabilities_tenant_id", table_name="tenant_capabilities")
    op.drop_table("tenant_capabilities")
    op.drop_index("ix_tenant_gates_gate_id", table_name="tenant_gates")
    op.drop_index("ix_tenant_gates_tenant_id", table_name="tenant_gates")
    op.drop_table("tenant_gates")
    op.drop_table("tenant_states")
    op.drop_index("ix_admin_tenants_municipio_id", table_name="admin_tenants")
    op.drop_table("admin_tenants")
