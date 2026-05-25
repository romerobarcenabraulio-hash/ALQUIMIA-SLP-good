# Propuesta 04 · Consolidar rutas de datos planning

**Aprobación requerida:** SUPREME

## Problema

Datos de planeación fragmentados:

| Archivo | Ruta actual |
|---------|-------------|
| gate_status.json | `backend/data/state/` |
| weekly_status | `backend/data/planning/` |
| risk_register.json | `backend/data/risk/` |
| reportes AURUM | `data/financial/reports/` |

## Destino propuesto

```
data/planning/
├── gates/gate_status.json
├── reports/weekly_status_latest.json
├── risk/risk_register.json
└── evm/                    ← snapshots EVM
```

## Qué se pierde

- Rutas hardcodeadas en `gate_tracker`, `weekly_status`, `risk_register` — actualizar a `modules/planning/paths.py`.

## Qué se gana

- Un solo árbol `data/` auditable
- `data/README.md` como índice completo
- Fin de `backend/data/` como almacén de negocio

## Acción concreta

1. Extender `modules/planning/paths.py` con helpers planning/risk/evm
2. Migrar archivos con symlink temporal o copia + deprecación
3. Actualizar paths en modules y shims backend
4. Documentar en `architecture_map.md` §7

**Prioridad:** MEDIA  
**Depende de:** propuesta 02 (evm paths)
