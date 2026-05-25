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


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(c["name"] == column for c in insp.get_columns(table))


def _table_exists(table: str) -> bool:
    bind = op.get_bind()
    return table in sa.inspect(bind).get_table_names()


def _index_exists(table: str, index: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(i["name"] == index for i in insp.get_indexes(table))


def upgrade() -> None:
    if not _column_exists("user_accounts", "client_segment"):
        op.add_column("user_accounts", sa.Column("client_segment", sa.String(40), nullable=True))
    if not _column_exists("user_accounts", "service_interest"):
        op.add_column("user_accounts", sa.Column("service_interest", sa.String(80), nullable=True))
    if not _column_exists("user_accounts", "organizacion"):
        op.add_column("user_accounts", sa.Column("organizacion", sa.String(200), nullable=True))
    if not _column_exists("user_accounts", "phone_verified_at"):
        op.add_column("user_accounts", sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True))
    if not _column_exists("user_accounts", "sms_enabled"):
        op.add_column(
            "user_accounts",
            sa.Column("sms_enabled", sa.Boolean(), nullable=False, server_default="false"),
        )
    if not _column_exists("user_accounts", "onboarding_completed_at"):
        op.add_column("user_accounts", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))
    if not _column_exists("user_accounts", "failed_login_count"):
        op.add_column(
            "user_accounts",
            sa.Column("failed_login_count", sa.Integer(), nullable=False, server_default="0"),
        )
    if not _column_exists("user_accounts", "locked_until"):
        op.add_column("user_accounts", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    if not _table_exists("sms_verification_codes"):
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
    if not _index_exists("sms_verification_codes", "ix_sms_codes_user_id"):
        op.create_index("ix_sms_codes_user_id", "sms_verification_codes", ["user_id"])
    if not _index_exists("sms_verification_codes", "ix_sms_codes_code_hash"):
        op.create_index("ix_sms_codes_code_hash", "sms_verification_codes", ["code_hash"])


def downgrade() -> None:
    if _table_exists("sms_verification_codes"):
        op.drop_table("sms_verification_codes")
    for col in (
        "locked_until",
        "failed_login_count",
        "onboarding_completed_at",
        "sms_enabled",
        "phone_verified_at",
        "organizacion",
        "service_interest",
        "client_segment",
    ):
        if _column_exists("user_accounts", col):
            op.drop_column("user_accounts", col)
