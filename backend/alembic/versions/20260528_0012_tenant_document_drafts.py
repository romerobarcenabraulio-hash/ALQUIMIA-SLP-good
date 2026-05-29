"""Tenant document drafts for Fase 12.

Revision ID: 0012_tenant_document_drafts
Revises: 0011_tenant_municipal_profiles
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012_tenant_document_drafts"
down_revision: Union[str, None] = "0011_tenant_municipal_profiles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenant_document_drafts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True),
        sa.Column("document_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("qa_status", sa.String(length=24), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("claim_ledger", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.JSON(), nullable=False),
        sa.Column("standards", sa.JSON(), nullable=False),
        sa.Column("blockers", sa.JSON(), nullable=False),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column("human_review_sections", sa.JSON(), nullable=False),
        sa.Column("versions", sa.JSON(), nullable=False),
        sa.Column("review_history", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.String(length=200), nullable=False),
        sa.Column("updated_by", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["admin_tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenant_document_drafts_tenant_id", "tenant_document_drafts", ["tenant_id"])
    op.create_index("ix_tenant_document_drafts_document_type", "tenant_document_drafts", ["document_type"])


def downgrade() -> None:
    op.drop_index("ix_tenant_document_drafts_document_type", table_name="tenant_document_drafts")
    op.drop_index("ix_tenant_document_drafts_tenant_id", table_name="tenant_document_drafts")
    op.drop_table("tenant_document_drafts")
