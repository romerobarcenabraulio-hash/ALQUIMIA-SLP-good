# Changelog · KOSMOS · Arquitectura estructural

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-25 | system/state/ | Creado: architecture_map, module_health, open_issues, chapter_readability | fuente de verdad arquitectura |
| 2026-05-25 | modules/planning/gates/ | gate_tracker migrado desde backend/app/planning/scheduling/ | dominio KRONOS en modules/ |
| 2026-05-25 | modules/planning/paths.py | Rutas compartidas KRONOS (gate_status_path) | paths centralizados |
| 2026-05-25 | backend/.../gate_tracker.py | Shim re-export → modules.planning.gates | compatibilidad imports legacy |
| 2026-05-25 | modules/__init__.py | Registro dominios Wave 1 | discoverability |
| 2026-05-25 | modules/README.md | Índice con rubros HERMES/KRONOS/AURUM/BIOS/POLIS | legibilidad un nivel arriba |
| 2026-05-25 | data/README.md | Índice rubros datos por agente | legibilidad un nivel arriba |
| 2026-05-25 | docs/README.md | Índice capítulos pedagógicos + rutas | legibilidad un nivel arriba |
| 2026-05-25 | system/README.md | Índice state/occam/kosmos | legibilidad un nivel arriba |
| 2026-05-25 | agents/registry.md | 10 agentes wave actualizados (AURUM/BIOS/POLIS activos) | boot _base.md paso 1 |
| 2026-05-25 | cursor-rules/kosmos.md | Cursor rule KOSMOS escrito | wave 2 agent spec |
| 2026-05-25 | system/kosmos/propuestas/ | 5 propuestas estructurales (4 pendientes SUPREME) | deuda arquitectónica documentada |
| 2026-05-25 | cierre wave | wave_handoff.md + module_health wave_2 closed | handoff SUPREME |
| 2026-05-25 | backend/app/README.md | Índice rubros API — propuesta 05 ejecutada | legibilidad 5/6 |
| 2026-05-25 | gate_tracker shim | Wrappers sync GATE_STATUS_PATH — 22 tests green | regresión migración |
