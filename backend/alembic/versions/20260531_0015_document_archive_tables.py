"""ARCHIVO document gaps and tenant documents.

Revision ID: 0015_document_archive_tables
Revises: 0014_nous_layer1_pattern_status
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0015_document_archive_tables"
down_revision: Union[str, None] = "0014_nous_layer1_pattern_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "document_gaps",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("document_type", sa.String(length=80), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("detection_method", sa.String(length=60), nullable=False, server_default="initial_inference"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("marked_not_applicable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("fulfilled_by_document_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_document_gaps_tenant_id", "document_gaps", ["tenant_id"])
    op.create_index("ix_document_gaps_module_id", "document_gaps", ["module_id"])
    op.create_index("ix_document_gaps_document_type", "document_gaps", ["document_type"])

    op.create_table(
        "tenant_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("uploaded_by_user_id", sa.String(length=64), nullable=False, server_default="mvp_user"),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("document_type", sa.String(length=80), nullable=False),
        sa.Column("original_filename", sa.String(length=260), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_path_or_url", sa.Text(), nullable=False),
        sa.Column("upload_status", sa.String(length=32), nullable=False, server_default="received"),
        sa.Column("classification_confidence", sa.String(length=32), nullable=False, server_default="suggested_by_filename"),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenant_documents_tenant_id", "tenant_documents", ["tenant_id"])
    op.create_index("ix_tenant_documents_module_id", "tenant_documents", ["module_id"])
    op.create_index("ix_tenant_documents_document_type", "tenant_documents", ["document_type"])


def downgrade() -> None:
    op.drop_index("ix_tenant_documents_document_type", table_name="tenant_documents")
    op.drop_index("ix_tenant_documents_module_id", table_name="tenant_documents")
    op.drop_index("ix_tenant_documents_tenant_id", table_name="tenant_documents")
    op.drop_table("tenant_documents")
    op.drop_index("ix_document_gaps_document_type", table_name="document_gaps")
    op.drop_index("ix_document_gaps_module_id", table_name="document_gaps")
    op.drop_index("ix_document_gaps_tenant_id", table_name="document_gaps")
    op.drop_table("document_gaps")
