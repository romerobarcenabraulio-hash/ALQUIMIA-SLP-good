#!/bin/sh
# Alembic upgrade con recuperación si tablas ya existen (SQL manual en Neon).
set -e

cd "$(dirname "$0")/.."
LOG=/tmp/alquimia_alembic.log

echo "==> Alembic upgrade head"
if alembic upgrade head 2> "$LOG"; then
  echo "==> Alembic OK"
  exit 0
fi

cat "$LOG" >&2

if grep -qiE 'already exists|DuplicateTable|duplicate key value violates unique constraint' "$LOG"; then
  echo "WARN: tablas ya presentes — alineando alembic stamp head"
  alembic stamp head
  echo "==> Alembic stamp head OK"
  exit 0
fi

echo "ERROR: alembic upgrade head falló. Ver backend/scripts/apply_migrations_manual.sql"
exit 1
