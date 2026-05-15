# CHANGELOG — Fuentes capa social (demografía PR3)

Registro de **extractos versionados** correlacionados con el snapshot JSON del frontend. El **semver de la aplicación** (p. ej. release `v0.x`) es independiente: aquí se documenta el artefacto **`buildId`** del bundle sociodemográfico.

Convención **`buildId`:** `YYYYMMDD` + sufijo alfabético opcional (`a`, `b`, …) para más de un extracto el mismo día. Debe coincidir con:

- `frontend/src/data/socialStats/embeddedBundle.ts` → constante exportada `SOCIAL_STATS_BUILD_ID`
- Archivo estático `frontend/public/data/social-stats/slices-<buildId>.json`
- Ruta de fetch modo static en `frontend/src/lib/social/socialStatsBundleCache.ts` (derivada de `SOCIAL_STATS_BUILD_ID`)

## Tabla extracto ↔ código

| buildId | Fecha doc (repo) | Archivo público | Notas |
|---------|------------------|-----------------|-------|
| `20260507a` | 2026-05-07 | `frontend/public/data/social-stats/slices-20260507a.json` | PR3 demo ilustrativa; pestaña lógica `MAESTRO_Demografia_CAPA_SOCIAL_v0`. |

*(Añadir una fila por cada bump de extracto; referenciar MR o commit en notas si aplica.)*

## Regenerar / actualizar el JSON (pasos reproducibles)

No hay script obligatorio en repo (sin credenciales). Flujo manual:

1. Actualizar o exportar desde el maestro en `fuentes de calculo/` (CSV/Excel) con columnas alineadas al contrato en `frontend/src/types/socialOfficialStats.ts` y `frontend/src/data/socialStats/SOURCE_TRACE.md`.
2. Elegir nuevo `buildId` si cambian cifras o vintage (o mantener el mismo solo si es corrección puramente editorial de trazas sin cambio de hechos).
3. Escribir **`frontend/public/data/social-stats/slices-<buildId>.json`** (`buildId` en la raíz del JSON = mismo string).
4. En **`frontend/src/data/socialStats/embeddedBundle.ts`:** asignar `SOCIAL_STATS_BUILD_ID = '<buildId>'` y alinear **todas** las filas `slices` con el JSON (mismos valores y trazas).
5. Verificar que `socialStatsBundleCache` resuelve la ruta (usa `SOCIAL_STATS_BUILD_ID` importado del embed; no editar a mano salvo regresión).
6. Desde `frontend/`:  
   `npm test -- socialStatsSourceTrace`  
   `npm test -- smokeSocialLayerSurface`  
   `npm run type-check`
7. Opcional: rellenar `lastExtractedGitShaOpcional` en slices si Auditor lo exige para el extracto.
8. Actualizar **esta tabla** (`CHANGELOG_FUENTES_SOCIAL.md`) y, si aplica, `SOURCE_TRACE.md`.

**Comando único de verificación** (después de editar datos):

```bash
cd frontend && npm test -- socialStatsSourceTrace && npm test -- smokeSocialLayerSurface && npm run type-check
```

## Gobierno de MR y OWNER

| Rol | Responsabilidad |
|-----|-----------------|
| **Ejecutor** | Abre el MR con cambios de JSON + `embeddedBundle` + fila en esta tabla; ejecuta tests localmente. |
| **Auditor** | Review obligatorio: trazabilidad (`geoLevel`, `vintageLabel`, tab/hint), diff numérico, alineación Navigator si aplica. |
| **Pair trimestral (mínimo)** | Misma dupla **Auditor + Ejecutor** revisa al término de cada trimestre civil que el `buildId` activo siga reflejando el maestro acordado aunque no haya release de app; si hay drift, MR de corrección o nota explícita en esta tabla. |

Quien **abre** el MR: **Ejecutor** (implementación). Quien **aprueba** merge en rama protegida: **Auditor** + convención del equipo.

## Tests de regresión (ajustar si cambia formato o ruta)

| Test / módulo | Qué cubre | Si cambia el JSON… |
|---------------|-----------|---------------------|
| `frontend/src/lib/social/socialStatsSourceTrace.test.ts` | Contrato de traza por slice en embed + **fixture público** (`slices-${SOCIAL_STATS_BUILD_ID}.json`). | Tras bump de `SOCIAL_STATS_BUILD_ID`, renombrar archivo JSON en `public/`; el test sigue el path derivado del embed. Si **nuevos campos obligatorios** en `OfficialStatSlice`, actualizar `validateCapaSocialSliceTrace` y tipos. |
| `frontend/src/lib/social/smokeSocialLayerSurface.test.ts` | Anclas TSX/source para capa social. | Solo si se renombran `data-testid` o rutas de módulo. |
| `frontend/src/types/socialOfficialStats.ts` | Forma del slice. | Cualquier cambio de forma implica migración JSON + embed + revisión de `validateBundle` en `socialStatsBundleCache.ts`. |

## Referencias

- `fuentes de calculo/README.md` — índice maestro y capa social.
- `frontend/src/data/socialStats/SOURCE_TRACE.md` — contrato y HITL hoja→PR.
