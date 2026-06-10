"""Phase D: generador registry, residue records, municipal aggregates,
decision tree sessions y compliance templates.

Estas tablas existían como modelos pero nunca tuvieron migración, y sus FK
apuntaban a una tabla inexistente ('tenants'). Aquí se crean con tipos
String(36) consistentes con admin_tenants.id y user_accounts.id.

Revision ID: 20260610_0019
Revises: 20260604_0018
Create Date: 2026-06-10 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260610_0019'
down_revision = '20260604_0018'
branch_labels = None
depends_on = None


# Enums (nombres en minúscula = lo que genera SQLAlchemy por defecto)
_GENERADOR_TIPO = sa.Enum(
    'empresa', 'hospital', 'hotel', 'comercio', 'residencial', 'industria',
    'construccion', 'restaurante', 'escuela', 'otro',
    name='generadortipo',
)
_GENERADOR_SOURCE = sa.Enum(
    'denue', 'manual', 'decision_tree', 'bulk_upload', 'admin',
    name='generadorsource',
)
_DECISION_TREE_TYPE = sa.Enum(
    'construccion', 'hospital', 'comercio', 'restaurante', 'industria',
    'hotel', 'escuela', 'residencial',
    name='decisiontreetype',
)


def upgrade() -> None:
    bind = op.get_bind()
    _GENERADOR_TIPO.create(bind, checkfirst=True)
    _GENERADOR_SOURCE.create(bind, checkfirst=True)
    _DECISION_TREE_TYPE.create(bind, checkfirst=True)

    op.create_table(
        'generador_entities',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.String(36), sa.ForeignKey('admin_tenants.id'), nullable=False, index=True),
        sa.Column('nombre', sa.String(255), nullable=False),
        sa.Column('tipo', _GENERADOR_TIPO, nullable=False),
        sa.Column('rfc', sa.String(13), nullable=True, index=True),
        sa.Column('clave_inegi', sa.String(50), nullable=True),
        sa.Column('municipio', sa.String(255), nullable=False, index=True),
        sa.Column('estado_mx', sa.String(50), nullable=False),
        sa.Column('direccion', sa.Text(), nullable=True),
        sa.Column('latitud', sa.Float(), nullable=True),
        sa.Column('longitud', sa.Float(), nullable=True),
        sa.Column('contacto_nombre', sa.String(255), nullable=True),
        sa.Column('contacto_email', sa.String(255), nullable=True),
        sa.Column('contacto_telefono', sa.String(20), nullable=True),
        sa.Column('sector_isic', sa.String(10), nullable=True),
        sa.Column('sector_desc', sa.String(255), nullable=True),
        sa.Column('capacidad_generacion_ton_mes', sa.Float(), nullable=True),
        sa.Column('materiales_generados', sa.JSON(), nullable=True),
        sa.Column('frecuencia_generacion', sa.String(50), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('verificado', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('compliance_level', sa.String(50), nullable=True),
        sa.Column('source', _GENERADOR_SOURCE, nullable=False),
        sa.Column('source_metadata', sa.JSON(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Index('idx_generador_tenant_municipio', 'tenant_id', 'municipio'),
        sa.Index('idx_generador_tenant_tipo', 'tenant_id', 'tipo'),
        sa.Index('idx_generador_tenant_activo', 'tenant_id', 'activo'),
        sa.Index('idx_generador_rfc', 'rfc'),
    )

    op.create_table(
        'generator_residue_records',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('generador_id', sa.String(36), sa.ForeignKey('generador_entities.id'), nullable=False, index=True),
        sa.Column('tenant_id', sa.String(36), sa.ForeignKey('admin_tenants.id'), nullable=False, index=True),
        sa.Column('fecha_generacion', sa.String(10), nullable=False),
        sa.Column('materiales_json', sa.JSON(), nullable=False),
        sa.Column('cantidad_total_tons', sa.Float(), nullable=False),
        sa.Column('validado', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('es_outlier', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('confianza_pct', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('comentario', sa.Text(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Index('idx_residue_generador_fecha', 'generador_id', 'fecha_generacion'),
        sa.Index('idx_residue_tenant_fecha', 'tenant_id', 'fecha_generacion'),
    )

    op.create_table(
        'municipal_residue_aggregates',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.String(36), sa.ForeignKey('admin_tenants.id'), nullable=False, index=True),
        sa.Column('municipio', sa.String(255), nullable=False, index=True),
        sa.Column('estado_mx', sa.String(50), nullable=False),
        sa.Column('fecha', sa.String(10), nullable=False),
        sa.Column('periodo', sa.String(20), nullable=False, server_default='diario'),
        sa.Column('total_generadores', sa.Float(), nullable=False, server_default='0'),
        sa.Column('total_tons', sa.Float(), nullable=False, server_default='0'),
        sa.Column('materiales_desglose', sa.JSON(), nullable=False),
        sa.Column('promedio_generador_tons', sa.Float(), nullable=True),
        sa.Column('completitud_pct', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('cambio_semana_pct', sa.Float(), nullable=True),
        sa.Column('cambio_mes_pct', sa.Float(), nullable=True),
        sa.Column('proyeccion_mes_tons', sa.Float(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Index('idx_agg_tenant_fecha', 'tenant_id', 'fecha'),
        sa.Index('idx_agg_municipio_fecha', 'municipio', 'fecha'),
    )

    op.create_table(
        'decision_tree_sessions',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.String(36), sa.ForeignKey('admin_tenants.id'), nullable=True, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('user_accounts.id'), nullable=True, index=True),
        sa.Column('tree_type', _DECISION_TREE_TYPE, nullable=False),
        sa.Column('estado_mx', sa.String(50), nullable=True),
        sa.Column('municipio', sa.String(255), nullable=True),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('sector_isic', sa.String(10), nullable=True),
        sa.Column('sector_desc', sa.String(255), nullable=True),
        sa.Column('residue_generation_tons_mes', sa.Float(), nullable=True),
        sa.Column('residue_breakdown', sa.JSON(), nullable=True),
        sa.Column('materiales_generados', sa.JSON(), nullable=True),
        sa.Column('compliance_guide_json', sa.JSON(), nullable=True),
        sa.Column('compliance_guide_html', sa.Text(), nullable=True),
        sa.Column('completado', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Index('idx_session_tenant_type', 'tenant_id', 'tree_type'),
        sa.Index('idx_session_user', 'user_id'),
    )

    op.create_table(
        'compliance_templates',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('tree_type', _DECISION_TREE_TYPE, nullable=False, unique=True),
        sa.Column('version', sa.String(20), nullable=False, server_default='1.0'),
        sa.Column('sections', sa.JSON(), nullable=False),
        sa.Column('resources', sa.JSON(), nullable=False),
        sa.Column('regulations', sa.JSON(), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Index('idx_template_type_active', 'tree_type', 'activo'),
    )


def downgrade() -> None:
    op.drop_table('compliance_templates')
    op.drop_table('decision_tree_sessions')
    op.drop_table('municipal_residue_aggregates')
    op.drop_table('generator_residue_records')
    op.drop_table('generador_entities')
    bind = op.get_bind()
    _DECISION_TREE_TYPE.drop(bind, checkfirst=True)
    _GENERADOR_SOURCE.drop(bind, checkfirst=True)
    _GENERADOR_TIPO.drop(bind, checkfirst=True)
