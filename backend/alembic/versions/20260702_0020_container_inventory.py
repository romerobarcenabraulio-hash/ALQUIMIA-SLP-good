"""Container inventory table (ALQ-13).

Revision ID: 20260702_0020
Revises: 20260610_0019
Create Date: 2026-07-02 17:30:00.000000

Upgrade is additive and idempotent. Downgrade is intentionally non-destructive:
dropping tenant inventory data requires an explicit founder gate and backup.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.engine import Connection


revision = "20260702_0020"
down_revision = "20260610_0019"
branch_labels = None
depends_on = None


def _has_table(bind: Connection, name: str) -> bool:
    return sa.inspect(bind).has_table(name)


def upgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "containers"):
        return

    op.create_table(
        "containers",
        sa.Column("id", sa.String(36), nullable=False, primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("admin_tenants.id"), nullable=False, index=True),
        sa.Column("tipo", sa.String(60), nullable=False, index=True),
        sa.Column("capacidad_litros", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(30), nullable=True),
        sa.Column("material", sa.String(60), nullable=True),
        sa.Column("ubicacion", sa.String(255), nullable=False),
        sa.Column("zona_interna", sa.String(120), nullable=True),
        sa.Column("municipio", sa.String(200), nullable=True),
        sa.Column("clave_inegi", sa.String(10), nullable=True, index=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lon", sa.Float(), nullable=True),
        sa.Column("frecuencia_recoleccion", sa.String(60), nullable=True),
        sa.Column("proveedor_recoleccion", sa.String(200), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("source", sa.String(120), nullable=False, server_default="manual_user_input"),
        sa.Column("source_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("source_method", sa.String(120), nullable=False, server_default="container_inventory_api"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_containers_tenant_tipo", "containers", ["tenant_id", "tipo"])
    op.create_index("idx_containers_tenant_activo", "containers", ["tenant_id", "activo"])
    op.create_index("idx_containers_tenant_clave_inegi", "containers", ["tenant_id", "clave_inegi"])


def downgrade() -> None:
    # Non-destructive by design. A physical drop of tenant inventory data must
    # be approved separately with backup evidence.
    return
