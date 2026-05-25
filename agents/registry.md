# Registro de agentes ALQUIMIA

| agente | dominio | módulos | estado |
|--------|---------|---------|--------|
| HERMES | Logística y rutas | `/modules/logistics/plan_generator`, `weight_receiver`, `kpi_calculator` | activo 2026-05-22 |
| KRONOS | Planeación / EVM | `/backend/app/planning/` | activo |
| AURUM | Finanzas | — | pendiente wave 1 |
| BIOS | Ambiental | — | pendiente wave 1 |
| POLIS | Gobernanza territorial | — | pendiente wave 1 |

## HERMES · módulos embebidos

| id | ruta | función |
|----|------|---------|
| HERMES-PLAN | `modules/logistics/plan_generator/` | Plan diario depot→colonias→depot |
| HERMES-WEIGHT | `modules/logistics/weight_receiver/` | Ingesta tonelaje por fracción |
| HERMES-KPI | `modules/logistics/kpi_calculator/` | KPI + daily_summary → KRONOS/AURUM |

## API FastAPI

- `GET /api/v1/logistics/health`
- `GET /api/v1/logistics/config`
- `POST /api/v1/logistics/plan/generate`
- `POST /api/v1/logistics/weight/ingest`
- `POST /api/v1/logistics/daily-summary/run`
- `GET /api/v1/logistics/daily-summary/{fecha}`

## Evento Kafka (MVP → archivo)

Topic: `alquimia/events/logistics/daily_summary`  
Archivo: `/data/logistics/daily_summary/{YYYY-MM-DD}.json`
