#!/bin/sh
set -e

echo "==> ALQUIMIA backend starting (PORT=${PORT:-8000})"

# Monorepo: modules/, config/, data/ viven un nivel arriba de backend/
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${REPO_ROOT}:${BACKEND_ROOT}${PYTHONPATH:+:$PYTHONPATH}"
echo "==> PYTHONPATH includes repo root: ${REPO_ROOT}"
echo "==> Deploy commit: ${RENDER_GIT_COMMIT:-unknown}"

if [ ! -d "${REPO_ROOT}/modules/planning" ]; then
  echo "ERROR: monorepo incompleto (${REPO_ROOT}/modules/planning ausente)."
  echo "       Render → Root Directory debe estar VACÍO (raíz del repo), no backend/."
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL no está definida. El deploy no puede continuar."
  exit 1
fi

"$(dirname "$0")/migrate_safe.sh"

echo "==> Uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
