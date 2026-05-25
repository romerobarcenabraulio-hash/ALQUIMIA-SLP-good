# Mapa arquitectónico · ALQUIMIA

> Post-intervención KOSMOS · 2026-05-25  
> Fuente de verdad estructural del monorepo. Actualizar en cada wave.

---

## 1. Capas del sistema

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTACIÓN          frontend/          Next.js simulador │
├─────────────────────────────────────────────────────────────┤
│  API (thin routers)    backend/app/       FastAPI           │
├─────────────────────────────────────────────────────────────┤
│  DOMINIO               modules/           Wave 1 agents     │
├─────────────────────────────────────────────────────────────┤
│  DATOS                 data/              JSON/MD pipelines   │
├─────────────────────────────────────────────────────────────┤
│  GOBERNANZA            system/state/      KOSMOS + SUPREME    │
│                        cursor-rules/      agent specs         │
│                        agents/registry.md agent index       │
└─────────────────────────────────────────────────────────────┘
```

**Regla vigente:** lógica de negocio en `modules/`; `backend/app/` expone HTTP y orquesta DB.

---

## 2. Agentes y módulos

| Agente | Wave | Módulos canónicos | API backend | Datos |
|--------|------|-------------------|-------------|-------|
| HERMES | 1 | `modules/logistics/*` | `backend/app/logistics/` | `data/logistics/` |
| KRONOS | 1 | `modules/planning/gates/` · `modules/planning/budget/` (EVM feed) | `backend/app/planning/` | `backend/data/state/`, `backend/data/planning/` |
| AURUM | 1 | `modules/planning/budget/` | `backend/app/planning/budget/` | `data/financial/` |
| BIOS | 1 | `modules/lifecycle/` | `backend/app/lifecycle/` | `data/environmental/`, `data/assets/`, `data/lifecycle/` |
| POLIS | 1 | `modules/personalization/` | _(CLI; sin router prod)_ | `data/municipalities/` |
| EIDOS | 2 | — | `backend/app/agents/eidos_*` | `docs/style/` |
| OCCAM | 2 | — | — | `system/occam/` |
| LOGOS | 2 | — | — | `docs/style/`, QHC en `data/*/reports/` |
| KOSMOS | 2 | — | — | `system/state/` |
| SUPREME | 3 | — | — | `system/state/master_plan.md` |

---

## 3. Árbol `modules/` (post KOSMOS 2026-05-25)

```
modules/
├── README.md
├── logistics/              HERMES
│   ├── plan_generator/
│   ├── weight_receiver/
│   └── kpi_calculator/
├── planning/               KRONOS + AURUM
│   ├── paths.py            rutas compartidas KRONOS
│   ├── gates/              ← gate_tracker (migrado desde backend)
│   │   └── gate_tracker.py
│   └── budget/             AURUM pipeline
├── lifecycle/              BIOS
│   ├── pipeline.py
│   ├── co2e_engine.py
│   └── ...
└── personalization/        POLIS
    ├── profile_loader.py
    └── ...
```

### Shim de compatibilidad (temporal)

| Legacy | Canónico | Estado |
|--------|----------|--------|
| `backend/app/planning/scheduling/gate_tracker.py` | `modules/planning/gates/gate_tracker.py` | **migrado** — shim re-exporta |
| `backend/app/planning/weekly_status.py` | _(pendiente)_ `modules/planning/evm/` | propuesta 02 |
| `backend/app/planning/builder.py` | _(pendiente)_ `modules/planning/gantt/` | propuesta 02 |
| `backend/app/planning/budget/evm_engine.py` | _(pendiente)_ `modules/planning/evm/` | propuesta 02 |

---

## 4. Árbol `backend/app/` (dominios API)

Routers montados en `main.py`. Subdominios de planning aún contienen lógica pendiente de migrar:

```
backend/app/
├── logistics/router.py     → modules.logistics
├── planning/
│   ├── router.py           Gantt/PERT/RACI + weekly_status endpoints
│   ├── builder.py          ← migrar a modules/planning/gantt/
│   ├── weekly_status.py    ← migrar a modules/planning/evm/
│   ├── budget/router.py    → modules.planning.budget
│   ├── risk/               ← migrar risk_register a data/planning/
│   ├── scheduling/         shim → modules.planning.gates
│   └── financial_model/    precios ancla AURUM
├── lifecycle/router.py     → modules.lifecycle
└── cron/                   jobs HERMES + KRONOS
```

---

## 5. Capítulos pedagógicos ↔ código

Referencia completa: `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md`

| Capítulo | Rubros visibles | Backend / modules |
|----------|-----------------|-------------------|
| 1 Diagnóstico | Ambiental · Social · Gobernanza · Normativo · Financiero · Teoría de cambio | `backend/app/city/`, `data/`, simulador |
| 2 Planificación | Estratégico · Operativo · Económico | `modules/planning/`, `backend/app/planning/` |
| 3 Modelo | Institucional · Financiero · Gobernanza | `modules/lifecycle/`, `data/financial/` |
| 4 Control | Cumplimiento · Monitoreo · Reporteo | gates, EVM, `data/financial/reports/` |

---

## 6. Dependencias cruzadas (vigilar)

| Origen | Destino | Riesgo | Acción |
|--------|---------|--------|--------|
| `modules/lifecycle/` | `app.schemas.simulate`, `app.services.calculator` | inversión de capas | propuesta 03 |
| `backend/app/planning/` | `modules/planning/budget/` | dual path | propuesta 02 (en curso) |
| `modules/planning/gates/` | `backend/data/state/` | ruta legacy | propuesta 04 |

---

## 7. Eventos / cron

| Job | Ruta | Agente |
|-----|------|--------|
| daily_summary | `POST /api/v1/cron/logistics-daily-summary` | HERMES |
| weekly_status | `POST /api/v1/cron/weekly-status` | KRONOS |
| sync-hermes | `POST /api/planning/budget/kronos/sync-hermes` | KRONOS + AURUM |

Topics Kafka (MVP → archivo): `data/logistics/daily_summary/`, `backend/data/planning/`.

---

## 8. Índices de un nivel arriba

| Capítulo | README | Rubros visibles |
|----------|--------|-----------------|
| `modules/` | ✅ | ✅ |
| `data/` | ✅ | ✅ |
| `docs/` | ✅ | ✅ |
| `system/` | ✅ | ✅ |
| `backend/app/` | ✅ | ✅ |
| repo root | `README.md` | ⚠️ parcial (sin rubros agente) |

**Score:** 5/6 capítulos PASS · 1 PARCIAL

Verificación detallada: [`chapter_readability.md`](chapter_readability.md).

---

## 9. Historial de movimientos estructurales

| Fecha | Movimiento | Agente |
|-------|------------|--------|
| 2026-05-25 | `gate_tracker` → `modules/planning/gates/` + shim backend | KOSMOS |
| 2026-05-25 | Creado `system/state/` (mapa, salud, issues) | KOSMOS |
| 2026-05-25 | READMEs capítulo en modules/, data/, docs/, system/ | KOSMOS |
| 2026-05-25 | `agents/registry.md` actualizado (10 agentes wave) | KOSMOS |
| 2026-05-25 | `backend/app/README.md` índice rubros API | KOSMOS |
| 2026-05-25 | `wave_handoff.md` síntesis Wave 1+2 | KOSMOS |
| 2026-05-25 | gate_tracker shim sync path (tests green) | KOSMOS |

Changelog completo: [`/changelog/kosmos.md`](../../changelog/kosmos.md).

---

## 10. Wave 1–3 · síntesis (2026-05-25)

Handoff canónico: [`wave_handoff.md`](wave_handoff.md) (KOSMOS Wave 1+2 · SUPREME Wave 3).

| Agente | Wave | Cierre |
|--------|------|--------|
| HERMES · KRONOS · AURUM · BIOS · POLIS | 1 | ✅ entregables en changelogs |
| EIDOS · OCCAM · LOGOS · KOSMOS | 2 | ✅ LOGOS/KOSMOS cerrados |
| SUPREME | 3 | ✅ master_plan + decisions_wave3 |
| FORGE · ATLAS | embebidos | activos semana 1 |

Integraciones operativas: HERMES→AURUM→KRONOS · POLIS→AURUM · BIOS→AURUM · LOGOS→reportes · FORGE→middleware.
