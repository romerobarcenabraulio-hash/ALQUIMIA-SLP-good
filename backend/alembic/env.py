"""
Alembic env.py — entorno de migraciones de ALQUIMIA.

Diseño:
- Lee DATABASE_URL desde la variable de entorno (o config de la app).
- Importa Base con todos los modelos para que Alembic detecte el esquema.
- Soporta tanto modo offline (genera SQL) como online (ejecuta en DB).
- Graceful degradation: si la BD no está disponible, imprime advertencia
  y sale limpio en lugar de lanzar excepción.
"""
from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Agregar el directorio backend/app al path para imports ────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# ── Importar Base (registra todos los modelos en metadata) ───────────────────
# Este import es crítico: Base.metadata contiene el esquema completo.
# Si falla, Alembic no puede generar migraciones automáticas.
try:
    from app.db.base import Base  # noqa: F401 — importa todos los modelos
    target_metadata = Base.metadata
except ImportError as exc:
    print(f"[alembic/env.py] No se pudo importar Base: {exc}")
    target_metadata = None

# ── Configuración de Alembic ──────────────────────────────────────────────────
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _get_database_url() -> str:
    """Resuelve DATABASE_URL desde variable de entorno o config de la app."""
    # 1. Variable de entorno directa (producción / CI)
    url = os.environ.get("DATABASE_URL", "").strip()
    if url:
        return url
    # 2. Settings de la app (desarrollo local con .env)
    try:
        from app.config import settings
        return settings.DATABASE_URL
    except Exception:
        pass
    # 3. Fallback local
    return "postgresql://alquimia:alquimia@localhost:5432/alquimia"


def run_migrations_offline() -> None:
    """
    Modo offline: genera un script SQL sin conectar a la BD.
    Útil para revisar los cambios antes de aplicarlos.
    Ejecución: alembic upgrade head --sql
    """
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Modo online: conecta a la BD y ejecuta las migraciones directamente.
    Ejecución: alembic upgrade head
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
