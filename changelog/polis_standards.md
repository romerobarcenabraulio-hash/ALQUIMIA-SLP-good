# Changelog · POLIS · Credibilidad institucional (estándares)

| fecha | componente | cambio | criterio de cierre |
|-------|------------|--------|-------------------|
| 2026-05-27 | `InstitutionalBadge` | Barra GRI · ISO · PMI · CSRD bajo headline M00 (`GuiaCircularidadStack`) con tooltips desde conteo en `standards_map.json` | Visible en M00 |
| 2026-05-27 | `ModuleStandardsBadge` | Pills + panel lateral en índices de capítulo (`ChapterIndex`) | ≥2 portadas de capítulo |
| 2026-05-27 | `M18MaterialityBadge` | Header M18 (`DobleMaterialidadStack`) + referencia cruzada M15 (`ExpedienteCabildoStack`) | M18 y M15 |
| 2026-05-27 | M19 trazabilidad | `MetricSourceTraceLink` en M01 CO₂e → `MetricSourceTraceDetail` en `ReferenciasCalculos` (fuente, fórmula, estándar, módulos dependientes) | Click-to-source CO₂e |
| 2026-05-27 | `StandardsSidePanel` | Panel compartido con `StandardsFooter` (MARCOS) | Sin duplicar lógica |

## Capturas en producción (completar tras deploy)

1. **M00** — Hero «Pasos hacia la circularidad» con barra `GRI · ISO · PMI · CSRD` y tooltip al hover.
2. **Portada capítulo** — Fila de módulo con pills de estándar y panel «+N más».
3. **M18** — Badge «Doble materialidad — CSRD ESRS 1:2023 y GRI 3:2021» bajo entrada del módulo.
4. **M15** — Referencia cruzada de doble materialidad en expediente Cabildo.
5. **M01 → M19** — Click en KPI CO₂e evitado; M19 muestra bloque con fuente SEMARNAT/IPCC, fórmula y códigos GRI 306-x.

Rutas de verificación local: `/simulator` → M00 guía; abrir portada Cap. 1 o 3; M01 línea base (KPI CO₂e); M18; M15; M19 tras click.

## Archivos nuevos

- `frontend/src/components/credibility/*`
- `frontend/src/lib/standardsInstitutional.ts`
- `frontend/src/data/metricStandardsTrace.ts`
- `frontend/src/components/credibility/credibility.test.tsx`

## Restricciones respetadas (L2)

- Sin cambios de backend ni fórmulas del motor.
- Sin logos externos; solo tipografía.
- Datos de estándares solo desde `docs/architecture/standards_map.json`.
