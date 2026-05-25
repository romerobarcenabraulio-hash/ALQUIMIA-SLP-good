# Propuesta 06 · Símbolos @deprecated en frontend (batch)

**Aprobación requerida:** Ejecutor

## Qué eliminar

| Archivo | Símbolo | Reemplazo canónico |
|---------|---------|-------------------|
| `frontend/src/lib/chapterNarratives.ts` | `shouldOfferChapterCover`, `isChapterCoverDismissed`, `dismissChapterCover` | Renombrar a `*ChapterIndex*` o inline |
| `frontend/src/components/simulator/ChapterIndex.tsx` | `export { ChapterIndex as ChapterCover }` | Eliminar alias |
| `frontend/src/data/organigramaDiagnostico.ts` | Re-exports de tipos ya en `organigramaMunicipalCanon.ts` | Migrar imports en 4 archivos |
| `frontend/src/lib/calculator.ts` | Función deprecated L560 | Solo `monteCarloTriangular*` |
| `frontend/src/lib/socialContextPlaceholder.ts` | Constante deprecated L39 | `SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER` |

## Qué se pierde

- Aliases legacy para persistencia localStorage (keys `chapterCoverDismissed*`).

## Qué se gana

- ~200 LOC menos, grep `@deprecated` → 0 en producción.
- Migración storage: renombrar keys en `simulatorPersistMigrate.ts` (ya existe patrón).

## Acción concreta

Script codemod + test `editorialInventory.test.ts` + `simulatorPersistMigrate` v2.

**Prioridad:** MEDIA
