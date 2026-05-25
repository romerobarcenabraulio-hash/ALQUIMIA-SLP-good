# Decisiones Wave 3 · SUPREME

> **Fecha:** 2026-05-25  
> Conflictos resueltos — no reabrir sin nueva evidencia.

---

## KOS-01 / C-01 · Dual path planning

**Conflicto:** lógica en `backend/app/planning/` y `modules/planning/`.

**Decisión:** **APROBAR** [`propuesta_02`](../kosmos/propuestas/propuesta_02_planning_migration_phase2.md) fase 2 completa.

**Ejecutor:** KRONOS (L2–L6 del Plan Maestro).

**Patrón obligatorio:** mover con shim re-export en origen (mismo patrón `gate_tracker` 2026-05-25).

**No hacer:** big-bang sin shims; no tocar `export/package_renderer.py` sin test portfolio ZIP.

---

## KOS-02 / C-02 · Lifecycle acoplado a app.*

**Conflicto:** `modules/lifecycle` importa `app.schemas.simulate` y `app.services.calculator`.

**Decisión:** **APROBAR** [`propuesta_03`](../kosmos/propuestas/propuesta_03_lifecycle_decouple.md) en dos fases.

| Fase | Acción | Dueño |
|------|--------|-------|
| 1 | Extraer schemas mínimos a `modules/lifecycle/schemas.py` | BIOS |
| 2 | Adapter en `backend/app/lifecycle/router.py`; calculator compartido en `modules/lifecycle/calculator.py` | BIOS |

**No hacer:** mover calculator global sin adapter — simulador HTTP debe seguir respondiendo.

---

## KOS-03 / C-03 · Datos fragmentados

**Conflicto:** `backend/data/state/` y `backend/data/planning/` vs `data/`.

**Decisión:** **APROBAR** [`propuesta_04`](../kosmos/propuestas/propuesta_04_data_path_consolidation.md) **diferida semana 2**.

**Semana 1 (L5):** solo inventario + symlinks read-only documentados en `architecture_map.md`.

**Semana 2:** migración física con KRONOS + KOSMOS.

---

## KOS-05 / OCCAM-04 · COLA superseded

**Conflicto:** `COLA_Y_ROLES_AGENTES.md` contradice modelo wave 10 agentes.

**Decisión:** **EJECUTAR** archivo.

**Acción tomada:**
- Copia archivada en `cursor-rules/OLD/COLA_Y_ROLES_AGENTES_2026-05-15.md`
- Raíz reemplazada por redirect a `system/state/master_plan.md`

---

## OCCAM-03 · Survey link stub

**Decisión:** **APROBAR** implementación mínima Ejecutor L2 — endpoint devuelve URL placeholder documentada; sin Google Forms real hasta CSA.

---

## OCCAM-05 · Planning dual path

**Decisión:** **SUBSUMIDA** en KOS-01. Fase 1 gates ✅ cerrada.

---

## OCCAM-06 · Deprecated frontend symbols

**Decisión:** **CERRAR** alias eliminados. Rename storage `ChapterCover` → componente canónico: backlog Ejecutor, no bloqueante.

---

## OCCAM-07 · Bitácora

**Decisión:** **DIFERIR** — requiere CSA/Auditor humano. No modificar `BITACORA` sin ADR firmado.

---

## Nuevos agentes (próximas 2 semanas)

| Agente | Mandato | Cursor rule |
|--------|---------|-------------|
| **FORGE** | Auth, onboarding, cuentas, TOTP, SMS | `cursor-rules/forge.md` |
| **ATLAS** | CI, deploy, migraciones, env prod | `cursor-rules/atlas.md` |

**No crear aún:** agente de replicación municipal (POLIS cubre); agente de observabilidad (backlog Fase B).

---

## Escalaciones al humano

| Tema | Cuándo escalar |
|------|----------------|
| Gate político Cabildo | KRONOS alerta G1–G5 en rojo |
| Bitácora institucional | OCCAM-07 |
| Forms encuesta real | OCCAM-03 post-placeholder |
