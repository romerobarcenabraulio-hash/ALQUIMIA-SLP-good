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


def upgrade() -> None:
    op.add_column("user_accounts", sa.Column("municipio_id", sa.String(40), nullable=True))
    op.add_column("user_accounts", sa.Column("clave_inegi", sa.String(10), nullable=True))
    op.add_column("user_accounts", sa.Column("reglamento_uploaded_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_user_accounts_municipio_id", "user_accounts", ["municipio_id"])


def downgrade() -> None:
    op.drop_index("ix_user_accounts_municipio_id", table_name="user_accounts")
    op.drop_column("user_accounts", "reglamento_uploaded_at")
    op.drop_column("user_accounts", "clave_inegi")
    op.drop_column("user_accounts", "municipio_id")
