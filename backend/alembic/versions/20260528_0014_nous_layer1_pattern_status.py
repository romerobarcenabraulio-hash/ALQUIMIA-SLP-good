"""NOUS layer-1 pattern review state.

Revision ID: 0014_nous_layer1_pattern_status
Revises: 0013_nous_observational_storage
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014_nous_layer1_pattern_status"
down_revision: Union[str, None] = "0013_nous_observational_storage"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "nous_patterns",
        sa.Column("pattern_status", sa.String(length=40), nullable=False, server_default="draft_observed"),
    )


def downgrade() -> None:
    op.drop_column("nous_patterns", "pattern_status")
