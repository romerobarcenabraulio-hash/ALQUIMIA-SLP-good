#!/usr/bin/env bash
# ─── db_migrate.sh ────────────────────────────────────────────────────────────
# Helper para correr migraciones Alembic en el entorno backend de ALQUIMIA.
#
# Uso:
#   ./db_migrate.sh            — aplica todas las migraciones pendientes (upgrade head)
#   ./db_migrate.sh downgrade  — revierte la última migración
#   ./db_migrate.sh status     — muestra el historial de migraciones
#   ./db_migrate.sh generate "descripcion"  — genera una nueva migración auto-detectada
#
# Variables de entorno requeridas:
#   DATABASE_URL  — postgresql://user:pass@host:5432/dbname
#                   (o configurada en backend/.env)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activar virtualenv si existe
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

ACTION="${1:-upgrade}"

case "$ACTION" in
    upgrade)
        echo "▶  Aplicando migraciones pendientes..."
        alembic upgrade head
        echo "✅  Base de datos actualizada."
        ;;
    downgrade)
        echo "◀  Revirtiendo última migración..."
        alembic downgrade -1
        echo "✅  Reversión completada."
        ;;
    status)
        echo "📋  Historial de migraciones:"
        alembic history --verbose
        echo ""
        echo "🔍  Revisión actual:"
        alembic current
        ;;
    generate)
        MSG="${2:-auto}"
        echo "🔧  Generando nueva migración: $MSG"
        alembic revision --autogenerate -m "$MSG"
        echo "✅  Archivo de migración creado en alembic/versions/"
        ;;
    *)
        echo "Uso: $0 [upgrade|downgrade|status|generate \"descripcion\"]"
        exit 1
        ;;
esac
