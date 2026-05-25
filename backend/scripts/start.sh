#!/bin/sh
set -e

echo "==> ALQUIMIA backend starting (PORT=${PORT:-8000})"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL no está definida. El deploy no puede continuar."
  exit 1
fi

echo "==> Alembic upgrade head"
if ! alembic upgrade head; then
  echo "ERROR: alembic upgrade head falló. Revisa logs y scripts/apply_migrations_manual.sql"
  exit 1
fi

echo "==> Uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
