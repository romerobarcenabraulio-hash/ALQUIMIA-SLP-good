# Propuesta 04 · COLA_Y_ROLES_AGENTES.md vs sistema wave

**Aprobación requerida:** SUPREME + humano

## Qué eliminar

| Archivo | Acción |
|---------|--------|
| `COLA_Y_ROLES_AGENTES.md` | Archivar a `cursor-rules/OLD/COLA_Y_ROLES_AGENTES_2026-05-15.md` |
| Referencias `@COLA_Y_ROLES_AGENTES.md` en workflows | Migrar a `@cursor-rules/_base.md` + `@agents/registry.md` |

## Qué se pierde

- Ancla de estado del modelo mono-contexto (Prompts 29–36, Fase B B1/B2/B3).
- Tabla "Reglas en repo" con roles Ejecutor/Auditor/Aesthete (parcialmente obsoletos).

## Qué se gana

- Un solo modelo operativo: wave agents + `prompt_maestro_ejecucion.md`.
- Menos confusión entre "cola serial" y "10 agentes paralelos".

## Acción concreta

1. Extraer ítems GOV 8–10 pendientes a `system/state/open_issues.md`.
2. Mover archivo a OLD con banner `[ARCHIVO — superseded 2026-05-25]`.
3. Actualizar `AJUSTES.ALQUIMIA/README.md` enlace.

**Prioridad:** ALTA
