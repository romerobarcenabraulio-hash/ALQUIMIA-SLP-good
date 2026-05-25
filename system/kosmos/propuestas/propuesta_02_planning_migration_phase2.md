# Propuesta 02 · Planning migration — fase 2

**Aprobación requerida:** SUPREME + KRONOS

## Contexto

Fase 1 ejecutada (2026-05-25): `gate_tracker` migrado a `modules/planning/gates/` con shim en backend.

## Qué mover (fase 2)

| Origen | Destino | Agente |
|--------|---------|--------|
| `backend/app/planning/weekly_status.py` | `modules/planning/evm/weekly_status.py` | KRONOS |
| `backend/app/planning/budget/evm_engine.py` | `modules/planning/evm/engine.py` | KRONOS |
| `backend/app/planning/budget/evm_integration.py` | `modules/planning/evm/integration.py` | KRONOS |
| `backend/app/planning/builder.py` + `narrative.py` | `modules/planning/gantt/` | KRONOS |
| `backend/app/planning/task_gate_map.py` | `modules/planning/gantt/task_gate_map.py` | KRONOS |

## Qué se pierde

- Imports `app.planning.*` en export/, proyecto/, cron — requieren actualización masiva (~15 archivos).

## Qué se gana

- Un árbol `modules/planning/` coherente: `gates/`, `evm/`, `gantt/`, `budget/`
- `backend/app/planning/` queda thin router (FastAPI only)
- Alineación con dominio KRONOS en `_base.md`

## Acción concreta (lista para ejecutar post-aprobación)

```bash
# 1. Crear subpackages
mkdir -p modules/planning/evm modules/planning/gantt

# 2. Mover archivos con shims en origen (mismo patrón gate_tracker)

# 3. Actualizar imports en:
#    backend/app/cron/jobs.py
#    backend/app/export/{package_renderer,gantt_hierarchy}.py
#    backend/app/proyecto/router.py
#    backend/tests/test_*.py

# 4. pytest backend/tests/test_gate_tracker.py test_evm_engine.py test_wave1_integration.py
```

**Prioridad:** ALTA  
**Depende de:** fase 1 gates ✅
