"""Onboarding segment, SMS verification and account lockout

Revision ID: 0006_onboarding_sms
Revises: 0005_user_accounts
Create Date: 2026-05-23
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_onboarding_sms"
down_revision: Union[str, None] = "0005_user_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_accounts", sa.Column("client_segment", sa.String(40), nullable=True))
    op.add_column("user_accounts", sa.Column("service_interest", sa.String(80), nullable=True))
    op.add_column("user_accounts", sa.Column("organizacion", sa.String(200), nullable=True))
    op.add_column("user_accounts", sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user_accounts", sa.Column("sms_enabled", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("user_accounts", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user_accounts", sa.Column("failed_login_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("user_accounts", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    op.alter_column("user_accounts", "cargo", server_default="")
    op.alter_column("user_accounts", "dependencia", server_default="")

    op.create_table(
        "sms_verification_codes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("purpose", sa.String(32), nullable=False),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_sms_codes_user_id", "sms_verification_codes", ["user_id"])
    op.create_index("ix_sms_codes_code_hash", "sms_verification_codes", ["code_hash"])


def downgrade() -> None:
    op.drop_table("sms_verification_codes")
    op.drop_column("user_accounts", "locked_until")
    op.drop_column("user_accounts", "failed_login_count")
    op.drop_column("user_accounts", "onboarding_completed_at")
    op.drop_column("user_accounts", "sms_enabled")
    op.drop_column("user_accounts", "phone_verified_at")
    op.drop_column("user_accounts", "organizacion")
    op.drop_column("user_accounts", "service_interest")
    op.drop_column("user_accounts", "client_segment")
