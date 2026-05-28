# Bitacora de incidentes operativos

Esta bitacora registra incidentes post-release de ALQUIMIA. No sustituye el issue tracker; es el registro minimo para que la operacion no dependa de memoria humana.

| Fecha/hora | Severidad | Area | Sintoma | Impacto | Decision | Responsable | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-28 | P1 | Release QA | Suite backend completa falla en tests dependientes de PostgreSQL local `localhost:5432` | Bloquea release publico; permite staging/demo controlada | Provisionar PostgreSQL local/CI y rerun suite completa | BIOS/KRONOS | Abierto | `docs/architecture/FASE9_RELEASE_HARDENING_QA.md` |

## Formato obligatorio para nuevos incidentes

- Fecha/hora:
- Severidad: P0 / P1 / P2 / P3
- Area: acceso, datos, export, visual, backend, frontend, infraestructura
- Sintoma observado:
- Comando o ruta que lo reproduce:
- Tenant afectado:
- Impacto:
- Decision operativa:
- Responsable:
- Estado:
- Evidencia:
- Fecha de cierre:
