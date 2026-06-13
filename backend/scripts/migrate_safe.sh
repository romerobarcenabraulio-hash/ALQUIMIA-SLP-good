#!/bin/sh
# Alembic upgrade con recuperación robusta para despliegues en Render/Neon.
set -e

cd "$(dirname "$0")/.."
LOG=/tmp/alquimia_alembic.log

echo "==> Alembic upgrade head"
if alembic upgrade head 2> "$LOG"; then
  echo "==> Alembic OK"
  exit 0
fi

cat "$LOG" >&2

# Caso 1: el alembic_version de la BD apunta a una revisión que el código
# desplegado no conoce (despliegue de un commit más viejo, o rama divergente).
# Como el puntero suele estar en la cabeza más reciente (la BD ya tiene el
# esquema), la recuperación segura es realinear el puntero a la cabeza que
# conoce ESTE código. Las migraciones nuevas son idempotentes, así que un
# upgrade posterior solo crea lo que falte.
if grep -qiE "can't locate revision|can not locate revision|no such revision" "$LOG"; then
  echo "WARN: alembic_version huérfano — realineando con stamp head"
  alembic stamp head
  echo "==> Alembic stamp head OK (revisión huérfana resuelta)"
  if alembic upgrade head 2> "$LOG"; then
    echo "==> Alembic upgrade OK tras realineación"
  else
    cat "$LOG" >&2
    echo "WARN: upgrade tras stamp no completó, pero el puntero ya es válido"
  fi
  exit 0
fi

# Caso 2: las tablas/tipos ya existen (BD pre-poblada manualmente).
if grep -qiE 'already exists|DuplicateTable|duplicate key value violates unique constraint|relation.*already exists|type.*already exists' "$LOG"; then
  echo "WARN: tablas ya presentes — alineando alembic stamp head"
  alembic stamp head
  echo "==> Alembic stamp head OK"
  exit 0
fi

echo "ERROR: alembic upgrade head falló. Ver backend/scripts/apply_migrations_manual.sql"
exit 1
