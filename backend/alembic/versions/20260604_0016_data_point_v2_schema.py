"""DataPoint V2 schema · 7-category canonical data model

Revision ID: 20260604_0016
Revises: 20260531_0015
Create Date: 2026-06-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260604_0016'
down_revision = '20260531_0015'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create evidence_conflicts first (referenced by data_points via conflict_id FK)
    op.create_table(
        'evidence_conflicts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(64), nullable=False),
        sa.Column('data_point_1_id', sa.String(36), nullable=False),
        sa.Column('data_point_2_id', sa.String(36), nullable=False),
        sa.Column('conflict_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(32), nullable=False, server_default='warning'),
        sa.Column('resolution_status', sa.String(32), nullable=False, server_default='unresolved'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', sa.String(64), nullable=True),
        sa.Column('resolution_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_evidence_conflict_tenant', 'tenant_id'),
    )

    # data_points table
    op.create_table(
        'data_points',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(64), nullable=False),
        sa.Column('module_id', sa.String(100), nullable=False),
        sa.Column('field_key', sa.String(200), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(32), nullable=False, server_default='verificado'),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('unit', sa.String(100), nullable=True),
        sa.Column('confidence', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('source_id', sa.String(200), nullable=False),
        sa.Column('source_name', sa.String(300), nullable=False),
        sa.Column('source_institution', sa.String(200), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('source_year', sa.Integer(), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('method', sa.String(100), nullable=True),
        sa.Column('scope', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.String(64), nullable=True),
        sa.Column('conflict_id', sa.String(36), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['conflict_id'], ['evidence_conflicts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_data_point_tenant_module', 'tenant_id', 'module_id'),
        sa.Index('idx_data_point_source', 'source_id', 'tenant_id'),
    )

    # data_point_history table
    op.create_table(
        'data_point_history',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('data_point_id', sa.String(36), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=False),
        sa.Column('old_status', sa.String(32), nullable=True),
        sa.Column('new_status', sa.String(32), nullable=False),
        sa.Column('old_confidence', sa.Integer(), nullable=True),
        sa.Column('new_confidence', sa.Integer(), nullable=False),
        sa.Column('changed_by', sa.String(64), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reason', sa.String(200), nullable=True),
        sa.ForeignKeyConstraint(['data_point_id'], ['data_points.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_data_point_history_id', 'data_point_id'),
    )

    # module_completion_status table
    op.create_table(
        'module_completion_status',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(64), nullable=False),
        sa.Column('module_id', sa.String(100), nullable=False),
        sa.Column('percent_complete', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('blocking_gate', sa.String(200), nullable=True),
        sa.Column('blocking_gate_resolution', sa.Text(), nullable=True),
        sa.Column('required_data_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_data_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('minimum_confidence', sa.Integer(), nullable=False, server_default='70'),
        sa.Column('unblocked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dependencies', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'module_id', name='uq_tenant_module_completion'),
        sa.Index('idx_completion_blocking', 'tenant_id', 'blocking_gate'),
        sa.Index('idx_completion_tenant', 'tenant_id'),
    )

    # bibliography_entries table
    op.create_table(
        'bibliography_entries',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(64), nullable=True),
        sa.Column('source_id', sa.String(200), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('authors', sa.Text(), nullable=True),
        sa.Column('institution', sa.String(200), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('scope', sa.String(50), nullable=False),
        sa.Column('confidence_score', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('chicago_citation', sa.Text(), nullable=False),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('retrieved_by', sa.String(64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_bibliography_tenant', 'tenant_id'),
        sa.Index('idx_bibliography_source', 'source_id'),
        sa.Index('idx_bibliography_institution', 'institution', 'year'),
    )

    # tenant_data_snapshots table
    op.create_table(
        'tenant_data_snapshots',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(64), nullable=False),
        sa.Column('total_data_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('counts_by_category', sa.Text(), nullable=True),
        sa.Column('overall_confidence', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('conflict_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('can_generate_plan', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('can_generate_declaratoria', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('last_archivo_run', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_manual_update', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_snapshot_tenant', 'tenant_id'),
    )


def downgrade() -> None:
    op.drop_table('tenant_data_snapshots')
    op.drop_table('bibliography_entries')
    op.drop_table('module_completion_status')
    op.drop_table('data_point_history')
    op.drop_table('data_points')
    op.drop_table('evidence_conflicts')
