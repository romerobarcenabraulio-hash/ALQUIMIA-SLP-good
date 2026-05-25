# Agenda · próxima activación del sistema

> **SUPREME** · programación Wave 4

---

## Cuándo

| Campo | Valor |
|-------|-------|
| **Fecha** | **2026-06-01 (domingo)** |
| **Hora sugerida** | 10:00 CST |
| **Duración** | 90 min (3 waves comprimidas si CI green) |

---

## Quién

| Wave | Agentes | Modo |
|------|---------|------|
| 1 | HERMES · KRONOS · AURUM · BIOS · POLIS | 5 ventanas paralelas |
| 2 | EIDOS · OCCAM · LOGOS · KOSMOS | 4 ventanas paralelas |
| 3 | SUPREME | 1 ventana integradora |

**Agentes embebidos adicionales (no wave completa):**
- **FORGE** — solo si auth/onboarding incompleto al 2026-05-31
- **ATLAS** — solo si CI o deploy rojo

---

## Por qué

1. Cerrar Plan Maestro 2026-05-26→06-01 contra [`system_baseline.md`](system_baseline.md)
2. Verificar KOS-01/KOS-02 ejecutados (planning + lifecycle healthy en `module_health.json`)
3. Decidir KOS-03 migración física de datos (semana 2)
4. Publicar `master_plan.md` v2 (7 días 2026-06-02→06-08)

---

## Pre-requisitos (bloquean activación si fallan)

- [ ] CI green en `main` el 2026-05-31
- [ ] `master_plan.md` semana 1: ≥5/7 ítems done
- [ ] Auth staging: flujo registro completo probado
- [ ] `pytest backend/tests/test_portfolio_zip.py` green

---

## Prompt a usar

Copiar íntegro [`cursor-rules/prompt_maestro_ejecucion.md`](../cursor-rules/prompt_maestro_ejecucion.md) bloque `=== INICIO ===` … `=== FIN ===`.

---

## Output esperado Wave 4

| Agente | Entregable mínimo |
|--------|-------------------|
| SUPREME | `master_plan.md` v2 + baseline v2 |
| KRONOS | `backend/app/planning/` thin (solo routers) |
| BIOS | `modules/lifecycle` status healthy |
| FORGE | onboarding prod + SMS opt-in documentado |
| ATLAS | runbook deploy en `backend/DEPLOY.md` actualizado |
