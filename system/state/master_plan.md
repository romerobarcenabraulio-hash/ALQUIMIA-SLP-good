# Plan Maestro · 7 días · ALQUIMIA

> **SUPREME** · baseline post-activación Wave 3  
> **Vigencia:** 2026-05-26 → 2026-06-01  
> **Medición:** contra [`system_baseline.md`](system_baseline.md)

---

## Objetivo de la semana

Cerrar la brecha **producto ↔ gobernanza**: plataforma en producción con auth/onboarding estable, CI verde permanente, y migración estructural planning/lifecycle iniciada con shims (sin romper export ZIP ni simulador).

---

## Calendario accionable

| Día | Fecha | Responsable | Entregable verificable | Criterio de done |
|-----|-------|-------------|------------------------|------------------|
| **L1** | 2026-05-26 | **FORGE** | Auth + onboarding commiteados; `alembic upgrade head` en Render | `/auth/status` 200 · registro→verify→TOTP→login en staging |
| **L1** | 2026-05-26 | **ATLAS** | CI green en `main`; Vercel = último commit | `gh run list` success · preview URL responde |
| **L2** | 2026-05-27 | **KRONOS** | Fase 2 propuesta 02: mover `weekly_status.py` → `modules/planning/evm/` | shim backend · `test_evm_engine.py` green |
| **L2** | 2026-05-27 | **Ejecutor** | OCCAM-03: stub encuesta documentado o Forms mínimo | `survey` router sin link roto en UI |
| **L3** | 2026-05-28 | **KRONOS** | Completar `evm_engine` + `evm_integration` en `modules/planning/evm/` | `test_wave1_integration.py` green |
| **L3** | 2026-05-28 | **AURUM** | Validar feed HERMES→AC tras cron 19:00 MX | `data/financial/` AC del día o log explícito |
| **L4** | 2026-05-29 | **BIOS** | Propuesta 03 fase 1: `modules/lifecycle/schemas.py` sin `app.*` | `test_bios_lifecycle.py` green sin mock app |
| **L4** | 2026-05-29 | **POLIS** | Perfil SLP auditado vs reglamento PDF gate | `profile.json` coherente con municipio `slp` |
| **L5** | 2026-05-30 | **BIOS** | Propuesta 03 fase 2: calculator adapter en lifecycle router | `module_health` lifecycle → healthy |
| **L5** | 2026-05-30 | **KOSMOS** | Propuesta 04 fase read-only: índice `data/` vs `backend/data/` | doc en `architecture_map.md` § datos |
| **L6** | 2026-05-31 | **KRONOS** | Mover `builder.py` + `narrative.py` → `modules/planning/gantt/` | export ZIP Gantt sin regresión |
| **L6** | 2026-05-31 | **LOGOS** | QHC en 2 reportes nuevos post-migración | 0 tecnicismos sin bloque QHC |
| **L7** | 2026-06-01 | **SUPREME** | Wave 4 handoff + baseline v2 | `module_health.json` wave_3 closed |

---

## Decisiones ya tomadas (no reabrir)

Ver [`decisions_wave3.md`](decisions_wave3.md). Resumen:

| ID | Decisión |
|----|----------|
| KOS-01 | **APROBADA** migración planning fase 2 — KRONOS L2–L6 |
| KOS-02 | **APROBADA** desacople lifecycle — BIOS L4–L5 |
| KOS-03 | **APROBADA** consolidación datos — KOSMOS L5, ejecución física L7+ |
| KOS-05 | **EJECUTADA** — COLA archivada; foco = este plan |
| OCCAM-07 | **DIFERIDA** — bitácora requiere CSA humano |

---

## Integraciones críticas a vigilar

```
HERMES (19:00 cron) → AURUM AC → KRONOS EVM → frontend Kronos stacks
POLIS profile → AURUM municipal_context → export PDF municipal
FORGE auth → middleware cookie → simulator/hub protegidos
```

---

## Riesgos de la semana

| Riesgo | Mitigación | Dueño |
|--------|------------|-------|
| Dual path planning rompe export ZIP | shims + test `test_portfolio_zip.py` en cada PR KRONOS | KRONOS |
| Auth WIP sin migración prod | ATLAS ejecuta `alembic upgrade head` post-deploy | ATLAS |
| lifecycle decouple rompe `/lifecycle/pipeline/run` | adapter en router antes de borrar imports app.* | BIOS |
| 10 agentes paralelos sin merge | un PR por agente/día; SUPREME resuelve conflictos L7 | SUPREME |

---

## Fuera de scope esta semana

- Migración física `backend/data/` → `data/` (semana 2)
- Playwright smoke completo (Ejecutor backlog)
- Fase B épico B1/B2/B3 (archivado con COLA)

---

*Próxima activación:* [`next_activation.md`](next_activation.md)
