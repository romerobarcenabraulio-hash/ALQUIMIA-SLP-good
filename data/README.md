# Datos del sistema · ALQUIMIA

Archivos JSON/MD que alimentan pipelines y reportes. Separados del código para auditoría y versionado independiente.

| Rubro | Ruta | Agente | Contenido |
|-------|------|--------|-----------|
| **Logística** | `logistics/` | HERMES | daily_summary por fecha |
| **Financiero** | `financial/costs/` | AURUM | AC, estructura de costos, snapshots |
| **Reportes** | `financial/reports/` | AURUM | PMO e inversionista (JSON + MD con QHC) |
| **Ambiental** | `environmental/` | BIOS | factores LCA, CO2e latest, informes MD |
| **Reportes ambientales** | `environmental/reports/` | BIOS + LOGOS | informe CO₂e/VPN con bloques QHC |
| **Activos** | `assets/` | BIOS | inventario de infraestructura |
| **Ciclo de vida** | `lifecycle/` | BIOS | financial_latest, sensitivity |
| **Municipios** | `municipalities/` | POLIS | perfiles SLP, plantillas, marco legal |

## Datos en backend (legacy, en migración)

| Ruta | Contenido | Destino propuesto |
|------|-----------|-------------------|
| `backend/data/state/` | gate_status.json | permanece hasta propuesta SUPREME |
| `backend/data/planning/` | weekly_status | `data/planning/` |
| `backend/data/risk/` | risk_register.json | `data/planning/risk/` |

## Convención de nombres

- `*_latest.json` — puntero al último cálculo válido
- `snapshots/` — histórico inmutable por fecha
- `templates/` — plantillas POLIS (no instancias)
