# Sistema · metadatos y gobernanza arquitectónica

Capa de coordinación entre agentes. No contiene lógica de negocio.

| Ruta | Agente | Función |
|------|--------|---------|
| `state/` | **KOSMOS + SUPREME** | mapa, salud, issues, plan maestro, baseline |
| `occam/propuestas/` | **OCCAM** | simplificaciones pendientes de aprobación |
| `kosmos/propuestas/` | **KOSMOS** | reorganizaciones estructurales (decisiones en `decisions_wave3.md`) |

## Lectura obligatoria al boot

1. [`state/master_plan.md`](state/master_plan.md) — **plan semana en curso**
2. [`state/system_baseline.md`](state/system_baseline.md) — baseline medible
3. [`state/architecture_map.md`](state/architecture_map.md)
4. [`state/module_health.json`](state/module_health.json)
5. [`state/open_issues.md`](state/open_issues.md)
6. [`state/wave_handoff.md`](state/wave_handoff.md) — cierre waves 1–3
7. [`state/next_activation.md`](state/next_activation.md) — Wave 4 · 2026-06-01

## Agentes embebidos (no wave completa)

| Agente | Rule | Cuándo activar |
|--------|------|----------------|
| FORGE | `cursor-rules/forge.md` | auth · onboarding · TOTP |
| ATLAS | `cursor-rules/atlas.md` | CI rojo · deploy · alembic |
