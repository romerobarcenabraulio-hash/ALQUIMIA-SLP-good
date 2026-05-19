"""Initial schema — Proyecto Vivo tables

Revision ID: 0001_initial
Revises: (none)
Create Date: 2026-05-18 18:00:00.000000

Crea las 8 tablas del sistema Proyecto Vivo:
  clientes, proyectos_municipales, revisiones_proyecto,
  actividades_proyecto, alertas_proyecto, mapa_actores,
  impacto_real, benchmark_municipal, checkpoint_costos
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── clientes ──────────────────────────────────────────────────────────────
    op.create_table(
        "clientes",
        sa.Column("id",                  sa.String(36),  primary_key=True),
        sa.Column("nombre",              sa.String(200), nullable=False),
        sa.Column("email",               sa.String(200), nullable=True),
        sa.Column("municipio_id",        sa.String(50),  nullable=False),
        sa.Column("zm",                  sa.String(20),  nullable=False),
        sa.Column("estado_mx",           sa.String(100), nullable=True),
        sa.Column("plan",                sa.String(50),  nullable=False, server_default="diagnostico"),
        sa.Column("consultor_asignado",  sa.String(200), nullable=True),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("activo",              sa.Boolean(),   nullable=False, server_default="true"),
    )

    # ── proyectos_municipales ─────────────────────────────────────────────────
    op.create_table(
        "proyectos_municipales",
        sa.Column("id",               sa.String(36),  primary_key=True),
        sa.Column("cliente_id",       sa.String(36),  sa.ForeignKey("clientes.id"), nullable=False),
        sa.Column("municipio_id",     sa.String(50),  nullable=False),
        sa.Column("zm",               sa.String(20),  nullable=False),
        sa.Column("nombre",           sa.String(300), nullable=False, server_default="Programa de Circularidad Municipal"),
        sa.Column("estado",           sa.String(30),  nullable=False, server_default="draft"),
        sa.Column("negociacion",      sa.String(50),  nullable=False, server_default="municipal_directo"),
        sa.Column("fecha_inicio",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_objetivo",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("horizonte_semanas", sa.Integer(),  nullable=False, server_default="52"),
        sa.Column("campeon_nombre",   sa.String(200), nullable=True),
        sa.Column("campeon_cargo",    sa.String(200), nullable=True),
        sa.Column("campeon_email",    sa.String(200), nullable=True),
        sa.Column("is_showcase",      sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_proyectos_municipio_id", "proyectos_municipales", ["municipio_id"])
    op.create_index("ix_proyectos_estado",       "proyectos_municipales", ["estado"])

    # ── revisiones_proyecto ───────────────────────────────────────────────────
    op.create_table(
        "revisiones_proyecto",
        sa.Column("id",                 sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",        sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("numero",             sa.Integer(),   nullable=False, server_default="0"),
        sa.Column("scenario_id",        sa.String(36),  nullable=True),
        sa.Column("snapshot_kpis",      sa.JSON(),      nullable=True),
        sa.Column("research_findings",  sa.JSON(),      nullable=True),
        sa.Column("cost_overrides",     sa.JSON(),      nullable=True),
        sa.Column("simulate_result",    sa.JSON(),      nullable=True),
        sa.Column("ton_rsu_modeladas",  sa.Float(),     nullable=True),
        sa.Column("ton_rsu_medidas",    sa.Float(),     nullable=True),
        sa.Column("nota",               sa.Text(),      nullable=True),
        sa.Column("generado_por",       sa.String(100), nullable=False, server_default="sistema"),
        sa.Column("created_at",         sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── actividades_proyecto ──────────────────────────────────────────────────
    op.create_table(
        "actividades_proyecto",
        sa.Column("id",                  sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",         sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("gantt_task_id",       sa.String(50),  nullable=False),
        sa.Column("nombre",              sa.String(300), nullable=False),
        sa.Column("descripcion",         sa.Text(),      nullable=True),
        sa.Column("fase",                sa.String(100), nullable=False, server_default="Diseño"),
        sa.Column("ejecutor",            sa.String(30),  nullable=False, server_default="municipio"),
        sa.Column("estado",              sa.String(30),  nullable=False, server_default="pendiente"),
        sa.Column("semana_inicio",       sa.Integer(),   nullable=False, server_default="1"),
        sa.Column("duracion_semanas",    sa.Integer(),   nullable=False, server_default="2"),
        sa.Column("semana_real_inicio",  sa.Integer(),   nullable=True),
        sa.Column("semana_real_fin",     sa.Integer(),   nullable=True),
        sa.Column("es_critica",          sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("costo_mxn",           sa.Float(),     nullable=False, server_default="0"),
        sa.Column("responsable",         sa.String(200), nullable=True),
        sa.Column("nota_completado",     sa.Text(),      nullable=True),
        sa.Column("completado_en",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_actividades_estado", "actividades_proyecto", ["estado"])

    # ── alertas_proyecto ──────────────────────────────────────────────────────
    op.create_table(
        "alertas_proyecto",
        sa.Column("id",              sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",     sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("tipo",            sa.String(50),  nullable=False),
        sa.Column("severidad",       sa.String(20),  nullable=False, server_default="advertencia"),
        sa.Column("titulo",          sa.String(300), nullable=False),
        sa.Column("descripcion",     sa.Text(),      nullable=False),
        sa.Column("accion_sugerida", sa.Text(),      nullable=True),
        sa.Column("resuelta",        sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resuelta_en",     sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_alertas_resuelta",  "alertas_proyecto", ["resuelta"])
    op.create_index("ix_alertas_severidad", "alertas_proyecto", ["severidad"])

    # ── mapa_actores ──────────────────────────────────────────────────────────
    op.create_table(
        "mapa_actores",
        sa.Column("id",                      sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",             sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("nombre",                  sa.String(200), nullable=False),
        sa.Column("cargo",                   sa.String(200), nullable=False),
        sa.Column("organizacion",            sa.String(200), nullable=True),
        sa.Column("tipo",                    sa.String(50),  nullable=False, server_default="interno"),
        sa.Column("influencia",              sa.String(20),  nullable=False, server_default="media"),
        sa.Column("sentimiento",             sa.String(20),  nullable=False, server_default="neutral"),
        sa.Column("interes",                 sa.String(20),  nullable=False, server_default="medio"),
        sa.Column("preocupacion_principal",  sa.Text(),      nullable=True),
        sa.Column("tactica_engagement",      sa.Text(),      nullable=True),
        sa.Column("ultimo_contacto",         sa.DateTime(timezone=True), nullable=True),
        sa.Column("es_campeon",              sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("es_bloqueador",           sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("created_at",              sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at",              sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── impacto_real ──────────────────────────────────────────────────────────
    op.create_table(
        "impacto_real",
        sa.Column("id",                      sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",             sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("periodo",                 sa.String(20),  nullable=False),
        sa.Column("ton_rsu_generadas",       sa.Float(),     nullable=True),
        sa.Column("ton_rsu_desviadas",       sa.Float(),     nullable=True),
        sa.Column("ton_rsu_disposicion",     sa.Float(),     nullable=True),
        sa.Column("tasa_desvio_pct",         sa.Float(),     nullable=True),
        sa.Column("co2e_evitadas_ton",       sa.Float(),     nullable=True),
        sa.Column("ingreso_materiales_mxn",  sa.Float(),     nullable=True),
        sa.Column("ahorro_disposicion_mxn",  sa.Float(),     nullable=True),
        sa.Column("valor_capturado_mxn",     sa.Float(),     nullable=True),
        sa.Column("empleos_generados",       sa.Integer(),   nullable=True),
        sa.Column("fuente",                  sa.String(100), nullable=False, server_default="auto_reporte"),
        sa.Column("verificado",              sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("notas",                   sa.Text(),      nullable=True),
        sa.Column("created_at",              sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_impacto_periodo",    "impacto_real", ["periodo"])
    op.create_index("ix_impacto_verificado", "impacto_real", ["verificado"])

    # ── benchmark_municipal ───────────────────────────────────────────────────
    op.create_table(
        "benchmark_municipal",
        sa.Column("id",                          sa.String(36),  primary_key=True),
        sa.Column("zm",                          sa.String(20),  nullable=False),
        sa.Column("rango_poblacion",             sa.String(50),  nullable=False),
        sa.Column("periodo",                     sa.String(20),  nullable=False),
        sa.Column("tasa_desvio_promedio_pct",    sa.Float(),     nullable=True),
        sa.Column("tasa_desvio_p75_pct",         sa.Float(),     nullable=True),
        sa.Column("tasa_desvio_p25_pct",         sa.Float(),     nullable=True),
        sa.Column("tir_promedio_pct",            sa.Float(),     nullable=True),
        sa.Column("capex_per_capita_mxn",        sa.Float(),     nullable=True),
        sa.Column("ingreso_per_ton_mxn",         sa.Float(),     nullable=True),
        sa.Column("semanas_a_primera_oleada",    sa.Float(),     nullable=True),
        sa.Column("n_municipios",                sa.Integer(),   nullable=False, server_default="1"),
        sa.Column("created_at",                  sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_benchmark_zm_periodo",   "benchmark_municipal", ["zm", "periodo"])

    # ── checkpoint_costos ─────────────────────────────────────────────────────
    op.create_table(
        "checkpoint_costos",
        sa.Column("id",                    sa.String(36),  primary_key=True),
        sa.Column("proyecto_id",           sa.String(36),  sa.ForeignKey("proyectos_municipales.id"), nullable=False),
        sa.Column("revision_id",           sa.String(36),  nullable=True),
        sa.Column("supuestos",             sa.JSON(),      nullable=False),
        sa.Column("completado",            sa.Boolean(),   nullable=False, server_default="false"),
        sa.Column("completado_por",        sa.String(200), nullable=True),
        sa.Column("completado_en",         sa.DateTime(timezone=True), nullable=True),
        sa.Column("n_supuestos_total",     sa.Integer(),   nullable=False, server_default="5"),
        sa.Column("n_supuestos_ajustados", sa.Integer(),   nullable=False, server_default="0"),
        sa.Column("created_at",            sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("checkpoint_costos")
    op.drop_table("benchmark_municipal")
    op.drop_table("impacto_real")
    op.drop_table("mapa_actores")
    op.drop_table("alertas_proyecto")
    op.drop_table("actividades_proyecto")
    op.drop_table("revisiones_proyecto")
    op.drop_table("proyectos_municipales")
    op.drop_table("clientes")
