"""NOUS observational storage and aggregate opt-in.

Revision ID: 0013_nous_observational_storage
Revises: 0012_tenant_document_drafts
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013_nous_observational_storage"
down_revision: Union[str, None] = "0012_tenant_document_drafts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("admin_tenants", sa.Column("analytics_aggregate_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("admin_tenants", sa.Column("analytics_aggregate_opt_in_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("admin_tenants", sa.Column("analytics_aggregate_opt_in_by", sa.String(length=200), nullable=True))
    op.add_column("admin_tenants", sa.Column("analytics_aggregate_opt_in_source", sa.String(length=200), nullable=True))

    op.create_table(
        "nous_inference_corrections",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("field_id", sa.String(length=160), nullable=False),
        sa.Column("inferred_value", sa.JSON(), nullable=False),
        sa.Column("validation_action", sa.String(length=32), nullable=False),
        sa.Column("corrected_value", sa.JSON(), nullable=True),
        sa.Column("delta_percentage", sa.String(length=40), nullable=True),
        sa.Column("corrected_by_role", sa.String(length=120), nullable=False),
        sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_used_for_inference", sa.JSON(), nullable=False),
        sa.Column("municipality_profile", sa.JSON(), nullable=False),
        sa.Column("included_in_aggregate", sa.Boolean(), nullable=False),
        sa.Column("aggregate_exclusion_reason", sa.String(length=200), nullable=True),
        sa.Column("audit", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_nous_inference_corrections_tenant_id", "nous_inference_corrections", ["tenant_id"])
    op.create_index("ix_nous_inference_corrections_module_id", "nous_inference_corrections", ["module_id"])
    op.create_index("ix_nous_inference_corrections_field_id", "nous_inference_corrections", ["field_id"])

    op.create_table(
        "nous_gate_outcomes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("gate", sa.String(length=3), nullable=False),
        sa.Column("outcome", sa.String(length=40), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("days_to_close", sa.Integer(), nullable=False),
        sa.Column("module_state_at_close", sa.JSON(), nullable=False),
        sa.Column("municipality_profile", sa.JSON(), nullable=False),
        sa.Column("political_context", sa.JSON(), nullable=False),
        sa.Column("payer_configuration", sa.String(length=20), nullable=True),
        sa.Column("included_in_aggregate", sa.Boolean(), nullable=False),
        sa.Column("aggregate_exclusion_reason", sa.String(length=200), nullable=True),
        sa.Column("audit", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_nous_gate_outcomes_tenant_id", "nous_gate_outcomes", ["tenant_id"])
    op.create_index("ix_nous_gate_outcomes_gate", "nous_gate_outcomes", ["gate"])

    op.create_table(
        "nous_projection_deltas",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("metric_id", sa.String(length=160), nullable=False),
        sa.Column("projected_value", sa.String(length=80), nullable=False),
        sa.Column("actual_value", sa.String(length=80), nullable=False),
        sa.Column("measurement_period", sa.String(length=16), nullable=False),
        sa.Column("delta_absolute", sa.String(length=80), nullable=False),
        sa.Column("delta_percentage", sa.String(length=80), nullable=False),
        sa.Column("delta_direction", sa.String(length=32), nullable=False),
        sa.Column("measurement_quality", sa.String(length=20), nullable=False),
        sa.Column("municipality_profile", sa.JSON(), nullable=False),
        sa.Column("included_in_aggregate", sa.Boolean(), nullable=False),
        sa.Column("aggregate_exclusion_reason", sa.String(length=200), nullable=True),
        sa.Column("audit", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_nous_projection_deltas_tenant_id", "nous_projection_deltas", ["tenant_id"])
    op.create_index("ix_nous_projection_deltas_module_id", "nous_projection_deltas", ["module_id"])
    op.create_index("ix_nous_projection_deltas_metric_id", "nous_projection_deltas", ["metric_id"])

    op.create_table(
        "nous_patterns",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("pattern_layer", sa.Integer(), nullable=False),
        sa.Column("pattern_description_natural", sa.Text(), nullable=False),
        sa.Column("pattern_description_technical", sa.JSON(), nullable=False),
        sa.Column("observations_count", sa.Integer(), nullable=False),
        sa.Column("confidence_level", sa.String(length=32), nullable=False),
        sa.Column("statistical_significance", sa.String(length=80), nullable=True),
        sa.Column("contributing_tenant_profiles", sa.JSON(), nullable=False),
        sa.Column("bias_check_status", sa.String(length=32), nullable=False),
        sa.Column("founder_gate_status", sa.String(length=32), nullable=False),
        sa.Column("published_to_clients", sa.Boolean(), nullable=False),
        sa.Column("retired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("retired_reason", sa.Text(), nullable=True),
        sa.Column("audit", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("nous_patterns")
    op.drop_index("ix_nous_projection_deltas_metric_id", table_name="nous_projection_deltas")
    op.drop_index("ix_nous_projection_deltas_module_id", table_name="nous_projection_deltas")
    op.drop_index("ix_nous_projection_deltas_tenant_id", table_name="nous_projection_deltas")
    op.drop_table("nous_projection_deltas")
    op.drop_index("ix_nous_gate_outcomes_gate", table_name="nous_gate_outcomes")
    op.drop_index("ix_nous_gate_outcomes_tenant_id", table_name="nous_gate_outcomes")
    op.drop_table("nous_gate_outcomes")
    op.drop_index("ix_nous_inference_corrections_field_id", table_name="nous_inference_corrections")
    op.drop_index("ix_nous_inference_corrections_module_id", table_name="nous_inference_corrections")
    op.drop_index("ix_nous_inference_corrections_tenant_id", table_name="nous_inference_corrections")
    op.drop_table("nous_inference_corrections")
    op.drop_column("admin_tenants", "analytics_aggregate_opt_in_source")
    op.drop_column("admin_tenants", "analytics_aggregate_opt_in_by")
    op.drop_column("admin_tenants", "analytics_aggregate_opt_in_at")
    op.drop_column("admin_tenants", "analytics_aggregate_opt_in")
