#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────────────────────
# ALQUIMIA SLP — Arranque local nativo (sin Docker)
# Uso: ./dev.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"

# ── Verificaciones previas ──────────────────────────────────────────────────
if [[ ! -f "$ROOT/backend/.venv/bin/uvicorn" ]]; then
  echo "ERROR: uvicorn no encontrado. Ejecuta primero:"
  echo "  $ROOT/backend/.venv/bin/pip install uvicorn[standard]==0.30.1"
  exit 1
fi

if [[ ! -f "$NODE_BIN" ]]; then
  echo "ERROR: node no encontrado en $NODE_BIN"
  exit 1
fi

# ── Levantar Backend ─────────────────────────────────────────────────────────
echo "▶ Levantando backend en http://localhost:8000 ..."
(
  cd "$ROOT/backend"
  DATABASE_URL="sqlite:///./alquimia_local.db" \
  SECRET_KEY="${SECRET_KEY:-alquimia-secret-dev-local}" \
  PYTHONPATH="$ROOT/backend" \
  .venv/bin/uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --reload-dir "$ROOT/backend/app" &
  echo "Backend PID: $!"
)

# Esperar a que el backend esté listo
sleep 2
echo "  Healthcheck: $(curl -s http://localhost:8000/health)"

# ── Levantar Frontend ────────────────────────────────────────────────────────
echo "▶ Levantando frontend en http://localhost:3000 ..."
(
  cd "$ROOT/frontend"
  NEXT_PUBLIC_API_URL=http://localhost:8000 \
  NEXT_TELEMETRY_DISABLED=1 \
  "$NODE_BIN" node_modules/.bin/next dev --port 3000 &
  echo "Frontend PID: $!"
)

echo ""
echo "✓ App corriendo:"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:8000"
echo "  API Docs : http://localhost:8000/docs"
echo ""
echo "Para detener: kill \$(lsof -ti:3000,8000)"

wait
