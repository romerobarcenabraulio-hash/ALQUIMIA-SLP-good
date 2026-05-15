# Trazabilidad sociodemográfica — Capa social (ALQUIMIA)

**Historial de extractos y plantilla de bitácora legal–editorial:** `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md`.

## Ubicación única del snapshot (contrato)

| Artefacto | Propósito |
|-----------|-----------|
| `frontend/public/data/social-stats/slices-*.json` | **Snapshot público versionado** consumido en runtime (fetch). Cada slice con números mostrables debe incluir: `indicatorId`, `value`, `unit`, `geoLevel`, `geoLabel`, `vintageLabel`, y **uno** de `sourceSpreadsheetTab` \| `excelRowHint`; opcional `lastExtractedGitShaOpcional`. |
| `frontend/src/data/socialStats/embeddedBundle.ts` | **Bundle embebido** (misma forma) como fallback offline; mismo contrato de trazabilidad. |
| `frontend/src/lib/social/socialStatsSourceTrace.ts` | Validación en tiempo de construcción de tests; lista canónica `SOCIAL_STATS_CAPA_SOCIAL_INDICATOR_IDS`. |

Barrel opcional: `frontend/src/data/socialStats/index.ts` reexporta tipos/helpers del slice.

## Auditoría rápida del repo (valores INEGI / sociodemográficos — rutas reales)

Búsqueda orientadora (`rg "inegi|INEGI|poblaci|dem_pea|CENSO|sociodem" frontend backend`):

- **Capa social (objetivo de este ticket)**  
  - `frontend/src/data/socialStats/embeddedBundle.ts`  
  - `frontend/public/data/social-stats/slices-20260507a.json`  
  - `frontend/src/components/simulator/OfficialStatCard.tsx` (UI + bloque trazabilidad)  
  - `frontend/src/data/socialSliceCatalog.ts`, `frontend/src/lib/socialSliceSource.ts`  
  - `frontend/src/lib/social/socialStatsSourceTrace.ts`

- **Otras referencias sociodemográficas / INEGI** (no necesariamente capa social; ver OUT OF SCOPE)  
  - `frontend/src/data/viviendaInegiDemo.ts`, `frontend/src/data/inegiCensus2020StateFacts.ts`  
  - `frontend/src/constants.ts` ( población ejemplo copy )  
  - `frontend/src/components/simulator/CoberturaNacional.tsx`, `MexicoRsuFootprintMap.tsx`  
  - `backend/app/national/rsu_demographics_seed.py`, `rsu_footprint_map.py`, schemas/router

## Procedimiento human-in-the-loop (hoja cambió → PR)

1. **Responsable datos** actualiza el libro bajo `fuentes de calculo/` (o exporta CSV firmado con misma estructura de indicadores).
2. **Responsable datos** anota en el libro o en commit message: pestaña lógica (`sourceSpreadsheetTab`), fila o clave (`excelRowHint`), y vintage (año / etiqueta INEGI).
3. **Implementación** actualiza **solo** el snapshot `frontend/public/data/social-stats/slices-*.json` (nuevo sufijo de versión si aplica) y alinea `embeddedBundle.ts` si se usa embed.
4. **Implementación** ejecuta `npm test -- socialStatsSourceTrace` y `npx tsc --noEmit` en `frontend/`.
5. **Auditor (norma reviewer)** verifica que cada `indicatorId` de capa social listado en `socialStatsSourceTrace.ts` sigue teniendo `geoLevel`, `vintageLabel` no vacío, y tab o hint; revisa diff del JSON.
6. **Auditor** aprueba o pide corrección; no merge sin trazas completas en números públicos.
7. **MR** lo abre quien hace el cambio de código/JSON (**Ejecutor**); **Auditor** es reviewer obligatorio en capa social. Registro de versiones de extracto: `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md`.

### Automatización opcional

- Script Node/Python **solo** si no requiere credenciales ni rutas absolutas secretas. Si no es seguro, **alternativa válida PR1-operativa**: export manual desde Excel a CSV, pegar/validar columnas (`indicatorId`, `value`, `unit`, `geoLevel`, `geoLabel`, `vintageLabel`, `sourceSpreadsheetTab` o `excelRowHint`), regenerar JSON con revis humana.

## OUT OF SCOPE (este ticket)

- Sustituir todas las fuentes backend (seed Python, footprint map) por el mismo snapshot; unificación cross-stack es trabajo aparte.
- Certificar legalmente cifras INEGI o reclamar officialidad más allá de etiquetas `sourceLabel` / vintage.
- Scraping automático del sitio INEGI.
- Refactor completo de `constants.ts` o copy marketing no ligado a tarjetas oficiales de capa social.
- Generación automática de PDFs o libros maestros nuevos en repo CI.

## Enlace maestro

Ver `fuentes de calculo/README.md` (sección Capa social / Demografía) para el nombre lógico de pestaña y convención de hints.
