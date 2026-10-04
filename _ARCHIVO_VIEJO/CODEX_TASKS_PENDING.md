# Tareas Pendientes para Codex · 2026-07-02

Estado: **5 PRs draft listos para founder review**. Codex regresa ~2026-07-24 con más endpoints desbloqueados.

## PRs Draft Esperando Founder Approval

### Críticas (bloquean ALQ-12/15/20):
1. **PR #36** (ALQ-109): Eliminar 18 componentes huérfanos — 344 tests ✓
2. **PR #37** (ALQ-110): Refactor guardrails test a behavior-based — 348 tests ✓
3. **PR #38** (ALQ-114): Wire ContainersProvider + ErrorBoundary — 344 tests ✓
4. **PR #41** (Backend CI fixes): 4 pre-existing test failures arregladas — todos ✓

### Funcionales (listos para merge post ALQ-11):
5. **PR #30** (ALQ-12/15/20): SCR + PDF ejecutivo + WCAG 2.2 AA
   - Frontend: 344 tests ✓
   - Backend: 6/6 PDF tests ✓
   - Bloqueada por: ALQ-11 (endpoints Codex `GET /api/nacional/scr/municipios`, etc.)

### Secundarias (draft, listos para merge):
6. **PR #31** (ALQ-16): DESIGN_SYSTEM.md canónico — 293 líneas
7. **PR #32** (CI PostgreSQL): Fix 12 PostgreSQL connection failures
8. **PR #34** (ALQ-13): ContainerInventory modelo + servicio + router — 12/12 tests ✓
9. **PR #42** (ALQ-17): Alertas municipales — 915 líneas, 18/20 tests ✓
   - Monitorea cambios en cobertura, KPIs, brechas
   - Sistema de suscripciones por usuario/municipio
   - Endpoints REST + models + servicios completos
   - Bloqueada por: ALQ-11 (para integración en SCR)

## Pre-Existing Failures (12 tests, no ALQ-12/15/20 causados)

### 1. PostgreSQL CI (8 tests)
Resueltos por PR #32 una vez CI esté configurado:
```
test_centros_acopio_nacional.py::test_repository_includes_operador_principal
test_nacional_expansion.py::test_expansion_proposes_new_municipios
... (6 más)
```
Fix: `services: postgres:16` + `DATABASE_URL` env + `alembic upgrade head`

### 2. Pre-Existing Logic Bugs (1 test)
- `test_admin_tenants.py::test_check_lease_violation` — Lógica de tenant que necesita revisión

### 3. Tenant Context Logic (3 tests)
No relacionadas a ALQ-12/15/20:
- Guardails test failures (parcialmente resueltas por PR #37)
- Queued para ALQ-110 derivative work

## ALQ-11 Dependency · Endpoints Requeridos para ALQ-12 Go-Live

Una vez Codex implementa estos endpoints, PR #30 puede mergearse:

```python
# GET /api/nacional/scr/municipios
# Response: [{municipio_id, nombre, estado, bloqueos[], siguiente_accion, agora_bloqueado, demographics, rsu_ton_dia, per_capita}]

# GET /api/nacional/scr/municipio/{id}
# Response: FichaMunicipal con 3 KPIs + procedencia enlazada + estado por dimensión

# POST /api/nacional/pdf/ejecutivo/{id}
# Response: PDF bytes (ReportLab, 0 costo template)
```

## Next Steps for Codex (Post Day 24)

### Phase 1: Mergear y Estabilizar
1. Founder aprueba PRs #36/37/38/41 → merge a main
2. PR #32 (CI PostgreSQL) → merge + CI verde
3. Implementar ALQ-11 endpoints → desbloquea PR #30

### Phase 2: Nuevas Features
Post-ALQ-11, implementar:
- ALQ-17: Alerts y notificaciones para cambios municipales
- ALQ-18: Export Excel de cobertura municipal
- ALQ-19: Comparador multi-municipio

### Phase 3: Refinamiento
- Resolver 8 tests PostgreSQL connection
- Completar 3 tenant context bugs
- Performance audit en admin.py (4732 líneas)

## Trabajo Completado (June 17-July 2)

| ALQ | Descripción | Status | Tests |
|-----|-------------|--------|-------|
| ALQ-109 | Delete 18 dead components | Draft PR #36 | 344 ✓ |
| ALQ-110 | Guardrails behavior test | Draft PR #37 | 348 ✓ |
| ALQ-114 | Wire Containers + ErrorBoundary | Draft PR #38 | 344 ✓ |
| ALQ-12 | SCR + semáforo + ficha | Draft PR #30 | 344 ✓ |
| ALQ-15 | PDF ejecutivo municipal | Draft PR #30 | 6/6 ✓ |
| ALQ-16 | DESIGN_SYSTEM.md | Draft PR #31 | N/A |
| ALQ-20 | WCAG 2.2 AA compliance | Draft PR #30 | 344 ✓ |
| ALQ-13 | ContainerInventory | Draft PR #34 | 12/12 ✓ |
| ALQ-17 | Alertas municipales | Draft PR #42 | 18/20 ✓ |
| Backend CI | 4 fixes | Draft PR #41 | 4/4 ✓ |

## Arquitectura Notes para Codex

- **Multi-tenancy**: Todos los modelos tienen `tenant_id` FK
- **Data Provenance**: Cada cifra debe tener `data_provenance` source
- **WCAG 2.2 AA**: Color + texto siempre, nunca solo color
- **Minto/McKinsey**: Conclusión → cifra → evidencia
- **Zero Template Cost**: ReportLab PDF sin archivos .docx
- **Fixture-Based Tests**: SQLite en memoria para unidad, PostgreSQL para CI

## Archivos Key

- `frontend/DESIGN_SYSTEM.md` — Única fuente de verdad visual (PR #31)
- `backend/app/national/router.py` — SCR endpoints (ALQ-11 TODO)
- `frontend/src/app/gobierno/scr/page.tsx` — Dashboard SCR (ALQ-12)
- `backend/app/planning/budget/evm_integration.py` — EVM + HERMES (lookback 60 days)

---

Escrito: 2026-07-02 16:30 UTC · Esperando founder merge + Codex return 2026-07-24
