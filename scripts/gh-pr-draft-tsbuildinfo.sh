#!/usr/bin/env bash
# Borrador PR: rama cursor/frontend-tsbuildinfo-incremental → main
set -euo pipefail
cd "$(dirname "$0")/.."
gh auth status >/dev/null 2>&1 || {
  echo "Primero: ./scripts/gh-auth-web.sh" >&2
  exit 1
}
gh pr create --draft --base main --head cursor/frontend-tsbuildinfo-incremental \
  --title "chore(frontend): refresh tsconfig.tsbuildinfo after typecheck" \
  --body "## Resumen

Actualiza \`frontend/tsconfig.tsbuildinfo\` tras corrida de TypeScript incremental. Sin cambios de código ni de comportamiento en runtime.

## Alcance y jurisdicción

- [ ] **¿Este cambio mezcla alcance Municipio ↔ ZM o sugiere sanciones a nivel ZM?** (Si marcás \"sí\", documentá separación explícita en código/copy y citá \`cursor-rules/NAVIGATOR.md\`.)  
  **No aplica** — solo artefacto incremental de TypeScript.

## Checklist habitual

- [x] Tipos / linters verdes en los paths tocados (pre-push \`tsc --noEmit\` OK)
- [ ] Contratos API (si aplica): tests o nota de compatibilidad hacia atrás — No aplica

## Referencias

Mantenimiento de toolchain; sin blueprint ni ADR."
