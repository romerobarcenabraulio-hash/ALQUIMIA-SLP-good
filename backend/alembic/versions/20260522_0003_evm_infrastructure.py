"""EVM infrastructure — tablas para control presupuestal KRONOS.

Revision ID: 0003_evm
Revises: 0002_research
Create Date: 2026-05-22

Tablas: evm_snapshots, budget_actuals, gate_status_log
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_evm"
down_revision: Union[str, None] = "0002_research"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "evm_snapshots",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("gate_id", sa.String(length=2), nullable=False),
        sa.Column("municipio_id", sa.String(length=64), nullable=True),
        sa.Column("bac", sa.Float(), nullable=False),
        sa.Column("pv", sa.Float(), nullable=False),
        sa.Column("ev", sa.Float(), nullable=False),
        sa.Column("ac", sa.Float(), nullable=False),
        sa.Column("cpi", sa.Float(), nullable=True),
        sa.Column("spi", sa.Float(), nullable=True),
        sa.Column("tcpi", sa.Float(), nullable=True),
        sa.Column("eac_likely", sa.Float(), nullable=True),
        sa.Column("eac_optimistic", sa.Float(), nullable=True),
        sa.Column("eac_conservative", sa.Float(), nullable=True),
        sa.Column("vac", sa.Float(), nullable=True),
        sa.Column("vac_pct", sa.Float(), nullable=True),
        sa.Column("semaforo", sa.String(length=10), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_evm_snapshots_fecha", "evm_snapshots", ["fecha"])
    op.create_index("ix_evm_snapshots_gate_id", "evm_snapshots", ["gate_id"])

    op.create_table(
        "budget_actuals",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("categoria", sa.String(length=100), nullable=False),
        sa.Column("subcategoria", sa.String(length=100), nullable=True),
        sa.Column("monto_mxn", sa.Float(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("fuente", sa.String(length=200), nullable=True),
        sa.Column("gate_id", sa.String(length=2), nullable=True),
        sa.Column("municipio_id", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_budget_actuals_fecha", "budget_actuals", ["fecha"])
    op.create_index("ix_budget_actuals_categoria", "budget_actuals", ["categoria"])

    op.create_table(
        "gate_status_log",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("gate_id", sa.String(length=2), nullable=False),
        sa.Column("status_anterior", sa.String(length=20), nullable=True),
        sa.Column("status_nuevo", sa.String(length=20), nullable=False),
        sa.Column("fecha_cambio", sa.Date(), nullable=False),
        sa.Column("nota", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gate_status_log_gate_id", "gate_status_log", ["gate_id"])


def downgrade() -> None:
    op.drop_index("ix_gate_status_log_gate_id", table_name="gate_status_log")
    op.drop_table("gate_status_log")
    op.drop_index("ix_budget_actuals_categoria", table_name="budget_actuals")
    op.drop_index("ix_budget_actuals_fecha", table_name="budget_actuals")
    op.drop_table("budget_actuals")
    op.drop_index("ix_evm_snapshots_gate_id", table_name="evm_snapshots")
    op.drop_index("ix_evm_snapshots_fecha", table_name="evm_snapshots")
    op.drop_table("evm_snapshots")
