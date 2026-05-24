"""User accounts — registro, verificación email, TOTP, access logs

Revision ID: 0005_user_accounts
Revises: 0004_logistics_kpi
Create Date: 2026-05-23
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_user_accounts"
down_revision: Union[str, None] = "0004_logistics_kpi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("apellido_paterno", sa.String(120), nullable=False),
        sa.Column("apellido_materno", sa.String(120), nullable=True),
        sa.Column("telefono", sa.String(32), nullable=True),
        sa.Column("cargo", sa.String(200), nullable=False),
        sa.Column("dependencia", sa.String(200), nullable=False),
        sa.Column("municipio_nombre", sa.String(200), nullable=True),
        sa.Column("estado_mx", sa.String(100), nullable=True),
        sa.Column("zm", sa.String(20), nullable=False, server_default="SLP"),
        sa.Column("rol", sa.String(40), nullable=False, server_default="funcionario"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("totp_secret_enc", sa.String(512), nullable=True),
        sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_user_accounts_email", "user_accounts", ["email"], unique=True)

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_email_verification_token_hash", "email_verification_tokens", ["token_hash"], unique=True)
    op.create_index("ix_email_verification_user_id", "email_verification_tokens", ["user_id"])

    op.create_table(
        "access_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("event", sa.String(64), nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("path", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_access_logs_user_id", "access_logs", ["user_id"])
    op.create_index("ix_access_logs_created_at", "access_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("access_logs")
    op.drop_table("email_verification_tokens")
    op.drop_table("user_accounts")
