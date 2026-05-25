# Propuesta 01 · Actualizar agents/registry.md

**Estado:** EJECUTADA 2026-05-25 por KOSMOS

**Aprobación requerida:** ~~SUPREME~~ resuelto (C-04 en wave_handoff.md)

## Qué eliminar / reemplazar

| Archivo | Acción |
|---------|--------|
| `agents/registry.md` (contenido actual) | Reemplazar tabla completa |

## Qué se pierde

- Snapshot histórico que marca AURUM/BIOS/POLIS como "pendiente wave 1" (ya implementados en repo).

## Qué se gana

- Una sola fuente de verdad de agentes activos (10 agentes wave + embebidos).
- Fin de boot incorrecto según `_base.md` paso 1.

## Acción concreta (lista para ejecutar)

```markdown
| agente | dominio | módulos | estado |
| HERMES | Logística | modules/logistics/* | activo |
| KRONOS | Planeación/EVM | backend/app/planning/, modules/planning/ | activo |
| AURUM | Costos | modules/planning/budget/ | activo 2026-05-25 |
| BIOS | LCA/financiero | modules/lifecycle/ | activo 2026-05-25 |
| POLIS | Municipal | modules/personalization/ | activo 2026-05-25 |
| EIDOS | Terminología | docs/style/, backend/app/agents/eidos_* | activo |
| OCCAM | Simplificación | system/occam/ | activo |
| LOGOS | Pedagogía | docs/ (intervenciones) | wave 2 |
| KOSMOS | Arquitectura | system/state/ | wave 2 |
| SUPREME | Síntesis | cursor-rules/supreme.md | wave 3 |
```

**Prioridad:** ALTA
