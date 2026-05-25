# Registro de agentes ALQUIMIA

| agente | dominio | módulos | estado |
|--------|---------|---------|--------|
| HERMES | Logística y rutas | `modules/logistics/*` | activo 2026-05-22 |
| KRONOS | Planeación / EVM / gates | `modules/planning/gates/`, `modules/planning/budget/` (feed), `backend/app/planning/` (routers) | activo |
| AURUM | Costos y presupuesto | `modules/planning/budget/` | activo 2026-05-25 |
| BIOS | Ciclo de vida / LCA | `modules/lifecycle/` | activo 2026-05-25 |
| POLIS | Personalización municipal | `modules/personalization/` | activo 2026-05-25 |
| EIDOS | Terminología y tono | `docs/style/`, `backend/app/agents/eidos_*` | activo |
| OCCAM | Simplificación | `system/occam/` | activo 2026-05-25 |
| LOGOS | Pedagogía documental | `docs/style/bloques_qhc.md`, reportes QHC | activo 2026-05-25 |
| KOSMOS | Arquitectura estructural | `system/state/`, `system/kosmos/` | activo 2026-05-25 |
| SUPREME | Síntesis e integración | `cursor-rules/supreme.md`, `system/state/master_plan.md` | wave 3 cerrada |
| FORGE | Auth y onboarding | `backend/app/auth/*`, `frontend/src/app/{login,register,onboarding}/*` | activo 2026-05-25 |
| ATLAS | Deploy, CI, migraciones | `.github/workflows/`, `backend/DEPLOY.md`, Alembic | activo 2026-05-25 |

## HERMES · módulos embebidos

| id | ruta | función |
|----|------|---------|
| HERMES-PLAN | `modules/logistics/plan_generator/` | Plan diario depot→colonias→depot |
| HERMES-WEIGHT | `modules/logistics/weight_receiver/` | Ingesta tonelaje por fracción |
| HERMES-KPI | `modules/logistics/kpi_calculator/` | KPI + daily_summary → KRONOS/AURUM |

## KRONOS · gates (migrado a modules)

| id | ruta | función |
|----|------|---------|
| KRONOS-GATES | `modules/planning/gates/gate_tracker.py` | G1–G5, alertas 30/15/7 días |
| _(shim)_ | `backend/app/planning/scheduling/gate_tracker.py` | re-export compatibilidad |

## AURUM · presupuesto

| id | ruta | función |
|----|------|---------|
| AURUM-PIPE | `modules/planning/budget/pipeline.py` | `run_aurum_pipeline` |
| AURUM-DATA | `data/financial/costs/`, `data/financial/reports/` | AC, reportes PMO/inversionista |

## BIOS · ciclo de vida

| id | ruta | función |
|----|------|---------|
| BIOS-PIPE | `modules/lifecycle/pipeline.py` | `run_bios_pipeline` |
| BIOS-DATA | `data/environmental/`, `data/assets/`, `data/lifecycle/` | LCA, inventario, sensibilidad |

## POLIS · municipal

| id | ruta | función |
|----|------|---------|
| POLIS-CORE | `modules/personalization/` | perfiles, plantillas, coherencia |
| POLIS-DATA | `data/municipalities/` | SLP + templates |

## API FastAPI (routers)

Ver índice completo en [`backend/app/README.md`](../backend/app/README.md).

### HERMES · `/api/v1/logistics`

- `GET /health`, `GET /config`
- `POST /plan/generate`, `POST /weight/ingest`
- `POST /daily-summary/run`, `GET /daily-summary/{fecha}`

### KRONOS · `/api/v1/planning`

- `GET /narrative`, `GET|POST /weekly-status`
- `POST /gantt`, `/pert`, `/raci`, `/all`
- `GET|POST /risk/*`, `GET|POST /financial-model/*`

### AURUM · `/api/v1/planning/budget`

- `POST /aurum/run`, `GET /aurum/structure`, `GET /aurum/ac/latest`
- `POST /kronos/sync-hermes`, `POST /evm`

### BIOS · `/api/v1/lifecycle`

- `POST /pipeline/run`, `GET /co2e/latest`, `GET /assets/inventory`
- `GET /financial/lifecycle`, `GET /financial/sensitivity`

## Cron (Render)

- `GET /api/v1/cron/manifest` — schedules públicos
- `POST /api/v1/cron/logistics-daily-summary` — 19:00 MX (header `X-Cron-Secret`)
- `POST /api/v1/cron/weekly-status` — lunes semanal

## KRONOS sync manual

- `POST /api/planning/budget/kronos/sync-hermes` — HERMES + AURUM sin cron

## Evento Kafka (MVP → archivo)

Topic: `alquimia/events/logistics/daily_summary`  
Archivo: `/data/logistics/daily_summary/{YYYY-MM-DD}.json`

## Mapa estructural

Ver [`/system/state/architecture_map.md`](../system/state/architecture_map.md).
