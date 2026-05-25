# API backend · ALQUIMIA

Routers FastAPI. La lógica de negocio vive en `modules/`; este árbol expone HTTP, DB y orquestación.

## Rubros por dominio

| Rubro | Subdominios | Agente / dueño |
|-------|-------------|----------------|
| **Logística** | `logistics/` | HERMES |
| **Planeación** | `planning/`, `planning/budget/`, `planning/risk/`, `planning/financial_model/` | KRONOS + AURUM |
| **Ciclo de vida** | `lifecycle/` | BIOS |
| **Cron / jobs** | `cron/` | HERMES + KRONOS |
| **Simulador** | `routers/simulate.py`, `city/`, `scenarios/` | producto |
| **Legal / gobernanza** | `legal/`, `governance/`, `standards/` | POLIS / jurídico |
| **Datos externos** | `data/`, `market/`, `national/`, `research/` | plataforma |
| **Export / reportes** | `export/`, `dashboard/` | SUPREME / PMO |
| **Auth / admin** | `auth/`, `routers/admin.py`, `access/` | plataforma |
| **Infra transversal** | `db/`, `models/`, `schemas/`, `services/` | plataforma |

## Endpoints Wave 1 (prefijo `/api/v1` salvo nota)

### HERMES · `/logistics`

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/logistics/health` | health check |
| GET | `/logistics/config` | límites API |
| POST | `/logistics/plan/generate` | plan diario |
| POST | `/logistics/weight/ingest` | tonelaje por fracción |
| POST | `/logistics/daily-summary/run` | pipeline KPI → archivo |
| GET | `/logistics/daily-summary/{fecha}` | lectura daily_summary |

### KRONOS · `/planning`

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/planning/narrative` | narrativa G1–G5 |
| GET/POST | `/planning/weekly-status` | reporte semanal CPI/SPI |
| POST | `/planning/gantt`, `/pert`, `/raci`, `/all` | artefactos planeación |
| GET/POST | `/planning/risk/*` | riesgos y gates |
| GET/POST | `/planning/financial-model/*` | precios ancla |

### AURUM · `/planning/budget`

| Método | Ruta | Función |
|--------|------|---------|
| POST | `/planning/budget/aurum/run` | pipeline costos completo |
| GET | `/planning/budget/aurum/structure` | CAPEX/OPEX |
| GET | `/planning/budget/aurum/ac/latest` | AC para EVM |
| POST | `/planning/budget/kronos/sync-hermes` | HERMES → AURUM → EVM |
| POST | `/planning/budget/evm` | cálculo EVM |

### BIOS · `/lifecycle`

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/lifecycle/health` | health check |
| POST | `/lifecycle/pipeline/run` | pipeline BIOS completo |
| GET | `/lifecycle/co2e/latest` | reporte CO2e |
| GET | `/lifecycle/assets/inventory` | inventario activos |
| GET | `/lifecycle/financial/lifecycle` | VPN/TIR/payback |
| GET | `/lifecycle/financial/sensitivity` | tornado sensibilidad |

### Cron · `/cron`

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/cron/manifest` | schedules públicos |
| POST | `/cron/logistics-daily-summary` | 19:00 MX |
| POST | `/cron/weekly-status` | lunes semanal |

## Integraciones cross-agente (Wave 1 cerrada)

```
HERMES daily_summary → AURUM hermes_consumer → AC → KRONOS EVM/weekly_status
POLIS profile.json   → AURUM municipal_context (ca_mix, viviendas)
BIOS asset_registry  → AURUM pipeline warnings (RUL)
LOGOS QHC            → AURUM report_templates → data/financial/reports/
```

## Mapa estructural

Ver [`/system/state/architecture_map.md`](../../system/state/architecture_map.md).
