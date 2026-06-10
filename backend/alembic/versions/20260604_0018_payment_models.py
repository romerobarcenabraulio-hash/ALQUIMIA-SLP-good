"""Payment models: methods, subscriptions, invoices, transactions

Revision ID: 20260604_0018
Revises: 20260604_0017
Create Date: 2026-06-04 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '20260604_0018'
down_revision = '20260604_0017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'payment_methods',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('payment_provider', sa.String(50), nullable=False, server_default='stripe'),
        sa.Column('provider_id', sa.String(100), nullable=False),
        sa.Column('method_type', sa.String(20), nullable=False),
        sa.Column('last_four', sa.String(4), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['admin_tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_payment_methods_tenant_id', 'tenant_id'),
    )

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('tier', sa.Enum('free', 'starter', 'professional', 'enterprise', name='subscriptiontier'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('billing_cycle', sa.String(10), nullable=False, server_default='monthly'),
        sa.Column('monthly_cost', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('user_limit', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('document_storage_gb', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('renews_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['admin_tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', name='uq_subscription_tenant'),
        sa.Index('ix_subscriptions_tenant_id', 'tenant_id'),
    )

    op.create_table(
        'invoices',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('draft', 'issued', 'paid', 'overdue', 'cancelled', name='invoicestatus'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['admin_tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number', name='uq_invoice_number'),
        sa.Index('ix_invoices_tenant_id', 'tenant_id'),
    )

    op.create_table(
        'transactions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('invoice_id', sa.String(36), nullable=True),
        sa.Column('payment_method_id', sa.String(36), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded', name='paymentstatus'), nullable=False),
        sa.Column('provider_transaction_id', sa.String(100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['admin_tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_transactions_tenant_id', 'tenant_id'),
    )


def downgrade() -> None:
    op.drop_table('transactions')
    op.drop_table('invoices')
    op.drop_table('subscriptions')
    op.drop_table('payment_methods')
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS invoicestatus")
    op.execute("DROP TYPE IF EXISTS subscriptiontier")
