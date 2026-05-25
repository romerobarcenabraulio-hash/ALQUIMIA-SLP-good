# Módulos de dominio · ALQUIMIA

Lógica de negocio reutilizable. Los routers HTTP viven en `backend/app/`; aquí vive lo que los agentes Wave 1 construyen y comparten.

| Agente | Ruta | Rubros |
|--------|------|--------|
| **HERMES** | `logistics/` | plan_generator · weight_receiver · kpi_calculator |
| **KRONOS** | `planning/gates/` | gate_tracker G1–G5, alertas 30/15/7 |
| **AURUM** | `planning/budget/` | cost_structure · EVM feed · reportes financieros |
| **BIOS** | `lifecycle/` | LCA · CO2e · sensibilidad · activos |
| **POLIS** | `personalization/` | perfiles municipales · plantillas · coherencia |

## Punto de entrada por dominio

```python
from modules.logistics.kpi_calculator import run_daily_summary_pipeline
from modules.planning.budget import run_aurum_pipeline
from modules.planning.gates import get_current_gate, check_gate_alerts
from modules.lifecycle import run_bios_pipeline
from modules.personalization import load_profile, validate_coherence
```

## Mapa estructural

Ver [`/system/state/architecture_map.md`](../system/state/architecture_map.md).
