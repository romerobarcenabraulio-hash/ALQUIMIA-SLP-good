# CLAUDE.md - Working Memory De Claude Code

Claude Code debe cargar primero `AGENTS.md` y la fuente canonica:

- `AGENTS.md`
- `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/REGLAS_DE_EJECUCION_AGENTES.md`

## Dominio Principal

Claude Code trabaja principalmente en:
- `frontend/`
- SCR, UI, experiencia de cliente/admin, accesibilidad y design system.
- Auditorias visuales y editoriales.

Codex trabaja principalmente en:
- `backend/`
- migraciones, datos, Render, repo, memoria y seguridad.

No tocar los mismos archivos el mismo dia sin coordinacion explicita.

## Frontend DoD

- Respetar `frontend/DESIGN_SYSTEM.md` si existe o las reglas vigentes en docs.
- WCAG 2.2 AA, foco visible, navegacion teclado y targets razonables.
- Admin y cliente separados: admin prepara; cliente consume salida consultiva.
- No revivir vocabulario de simulador en la experiencia cliente si la tarea es MVP/client-facing.
- Correr build/type-check/test aplicable y pegar salida real.
