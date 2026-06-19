"""Container inventory table (ALQ-13 — GOV close).

Revision ID: 20260618_0020
Revises: 20260610_0019
Create Date: 2026-06-18 13:00:00.000000

Migration is additive and idempotent: the table is only created if it does
not already exist (IF NOT EXISTS semantics via _has_table guard).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import Connection


revision = '20260618_0020'
down_revision = '20260610_0019'
branch_labels = None
depends_on = None


def _has_table(bind: Connection, name: str) -> bool:
    return sa.inspect(bind).has_table(name)


def upgrade() -> None:
    bind = op.get_bind()

    if not _has_table(bind, 'containers'):
        op.create_table(
            'containers',
            sa.Column('id', sa.String(36), nullable=False, primary_key=True),
            sa.Column(
                'tenant_id', sa.String(36), sa.ForeignKey('admin_tenants.id'),
                nullable=False, index=True
            ),
            sa.Column('tipo', sa.String(60), nullable=False),
            sa.Column('capacidad_litros', sa.Integer(), nullable=True),
            sa.Column('color', sa.String(30), nullable=True),
            sa.Column('material', sa.String(60), nullable=True),
            sa.Column('ubicacion', sa.String(255), nullable=False),
            sa.Column('zona_interna', sa.String(120), nullable=True),
            sa.Column('municipio', sa.String(200), nullable=True),
            sa.Column('clave_inegi', sa.String(10), nullable=True),
            sa.Column('lat', sa.Float(), nullable=True),
            sa.Column('lon', sa.Float(), nullable=True),
            sa.Column('frecuencia_recoleccion', sa.String(60), nullable=True),
            sa.Column('proveedor_recoleccion', sa.String(200), nullable=True),
            sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column('notas', sa.Text(), nullable=True),
            sa.Column(
                'created_at',
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text('NOW()'),
            ),
            sa.Column(
                'updated_at',
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text('NOW()'),
            ),
        )
        # Indexes for common query patterns
        op.create_index('ix_containers_tipo', 'containers', ['tipo'])
        op.create_index('ix_containers_clave_inegi', 'containers', ['clave_inegi'])


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, 'containers'):
        op.drop_table('containers')
