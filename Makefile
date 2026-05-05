# ─── ALQUIMIA — Comandos de verificación ─────────────────────────────────────
# Usar nativo (fuera de Docker) para type-check, build y test.
# Docker exec en macOS tiene EPERM en bind mounts — esto es un artefacto del
# virtualizador de Docker Desktop, no un bug del código.

.PHONY: check build test all up down logs

FRONTEND_DIR := frontend
BACKEND_DIR  := backend

# ── Verificación completa ──────────────────────────────────────────────────
all: check build test
	@echo "✅  Todo pasa — Fase 1 cierre verificable"

# ── Frontend ───────────────────────────────────────────────────────────────
check:
	@echo "→ TypeScript type-check..."
	cd $(FRONTEND_DIR) && npm run type-check

build:
	@echo "→ Next.js build..."
	cd $(FRONTEND_DIR) && npm run build

# ── Backend ────────────────────────────────────────────────────────────────
test:
	@echo "→ pytest..."
	cd $(BACKEND_DIR) && .venv/bin/pytest tests/ -v

# ── Docker ─────────────────────────────────────────────────────────────────
up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f
