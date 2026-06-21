"""Simulation persistence tables for save/load/export/import functionality

Revision ID: 20260604_0017
Revises: 20260604_0016
Create Date: 2026-06-04 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260604_0017'
down_revision = '20260604_0016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create simulations table
    op.create_table(
        'simulations',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(255), nullable=False, index=True),
        sa.Column('tenant_id', sa.String(255), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('municipios', sa.JSON(), nullable=True),
        sa.Column('horizonte', sa.Integer(), nullable=True),
        sa.Column('checksum', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Index('idx_user_tenant', 'user_id', 'tenant_id'),
        sa.Index('idx_user_created', 'user_id', 'created_at'),
        sa.Index('idx_tenant_updated', 'tenant_id', 'updated_at'),
    )

    # Create simulation_versions table
    op.create_table(
        'simulation_versions',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('simulation_id', sa.String(36), nullable=False, index=True),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('state_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('created_by', sa.String(255), nullable=False),
        sa.Column('checkpoint_name', sa.String(255), nullable=True),
        sa.Column('checkpoint_description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['simulation_id'], ['simulations.id'], ondelete='CASCADE'),
        sa.Index('idx_simulation_version', 'simulation_id', 'version_number'),
        sa.Index('idx_version_created', 'simulation_id', 'created_at'),
    )

    # Create simulation_audit_logs table
    op.create_table(
        'simulation_audit_logs',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('simulation_id', sa.String(36), nullable=False, index=True),
        sa.Column('action', sa.String(64), nullable=False, index=True),
        sa.Column('actor_id', sa.String(255), nullable=False, index=True),
        sa.Column('success', sa.Boolean(), nullable=False, default=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.ForeignKeyConstraint(['simulation_id'], ['simulations.id'], ondelete='CASCADE'),
        sa.Index('idx_simulation_action', 'simulation_id', 'action'),
        sa.Index('idx_action_timestamp', 'action', 'timestamp'),
        sa.Index('idx_actor_timestamp', 'actor_id', 'timestamp'),
    )


def downgrade() -> None:
    op.drop_table('simulation_audit_logs')
    op.drop_table('simulation_versions')
    op.drop_table('simulations')
