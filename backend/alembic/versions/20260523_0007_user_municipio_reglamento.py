"""Municipio vinculado a cuenta y PDF de reglamento

Revision ID: 0007_user_municipio_reglamento
Revises: 0006_onboarding_sms
Create Date: 2026-05-23
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_user_municipio_reglamento"
down_revision: Union[str, None] = "0006_onboarding_sms"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(c["name"] == column for c in insp.get_columns(table))


def _index_exists(table: str, index: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(i["name"] == index for i in insp.get_indexes(table))


def upgrade() -> None:
    if not _column_exists("user_accounts", "municipio_id"):
        op.add_column("user_accounts", sa.Column("municipio_id", sa.String(40), nullable=True))
    if not _column_exists("user_accounts", "clave_inegi"):
        op.add_column("user_accounts", sa.Column("clave_inegi", sa.String(10), nullable=True))
    if not _column_exists("user_accounts", "reglamento_uploaded_at"):
        op.add_column("user_accounts", sa.Column("reglamento_uploaded_at", sa.DateTime(timezone=True), nullable=True))
    if not _index_exists("user_accounts", "ix_user_accounts_municipio_id"):
        op.create_index("ix_user_accounts_municipio_id", "user_accounts", ["municipio_id"])


def downgrade() -> None:
    if _index_exists("user_accounts", "ix_user_accounts_municipio_id"):
        op.drop_index("ix_user_accounts_municipio_id", table_name="user_accounts")
    for col in ("reglamento_uploaded_at", "clave_inegi", "municipio_id"):
        if _column_exists("user_accounts", col):
            op.drop_column("user_accounts", col)
