# Propuesta 05 · Doble ruta planning: backend/app vs modules/

**Estado:** PARCIAL — fase 1 ejecutada por KOSMOS (2026-05-25)

**Aprobación requerida:** KOSMOS + SUPREME (fase 2 → KOS-01)

## Fase 1 ejecutada (KOSMOS 2026-05-25)

- `modules/planning/gates/gate_tracker.py` migrado
- Shim en `backend/app/planning/scheduling/gate_tracker.py`
- Ver [`kosmos/propuestas/propuesta_02_planning_migration_phase2.md`](../../kosmos/propuestas/propuesta_02_planning_migration_phase2.md) para fase 2

## Qué fusionar (fase 2 — pendiente SUPREME)

| Ruta A | Ruta B | Solapamiento |
|--------|--------|--------------|
| `backend/app/planning/` (Gantt, PERT, RACI, weekly_status) | `modules/planning/budget/` (AURUM costos, EVM feed) | Router importa `run_aurum_pipeline` desde modules |

## Qué se pierde

- Separación mental "API en backend, lógica en modules" si se fusiona mal.

## Qué se gana

- Un árbol `modules/planning/` con subpackages `evm/`, `budget/`, `gates/`.
- `backend/app/planning/` queda como thin router (FastAPI only).
- Alineación con `_base.md` dominio KRONOS = `/modules/planning/`.

## Acción concreta

```
modules/planning/
  evm/          ← mover weekly_status, gate_tracker
  budget/       ← ya existe (AURUM)
  gantt/        ← mover builder.py, narrative.py
backend/app/planning/router.py  ← solo imports
```

**Prioridad:** ALTA
