# Propuesta 07 · Bitácora AUDITORIA 2900+ líneas

**Aprobación requerida:** humano (CSA/Auditor)

## Qué archivar

| Archivo | Acción |
|---------|--------|
| `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` | Split: líneas 1–2614 → `BITACORA_HISTORICO_pre_restore.md`; activo = sección `## Restore` only |

## Qué se pierde

- Un solo scroll infinito para @-mentions (hoy ~2900 líneas).

## Qué se gana

- Contexto LLM: agentes cargan ~200 líneas vigentes vs 2900.
- Histórico preservado en subarchivo con índice.

## Acción concreta

```bash
# Cortar en línea del encabezado "## Restore" (≈ L2614)
# BITACORA_AUDITORIA_PLANEACION.md ← solo Restore + forward
# BITACORA_HISTORICO_pre_restore.md ← append-only archive
```

**Prioridad:** MEDIA
