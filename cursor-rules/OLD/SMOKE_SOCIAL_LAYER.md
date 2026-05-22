# SMOKE_SOCIAL_LAYER — Smoke manual versionado (capa social / PR3–PR5)

**Decisión de ubicación:** este documento vive en `cursor-rules/` como **norma de QA por release menor** (misma familia que `EJECUTOR.md`); no en `frontend/docs/`, que queda para guías de producto locales.

**Versión doc:** 1.0 · Ejecutor ALQUIMIA  
**Ruta app:** `/simulator` (Next.js)

## Audiencias

| Audiencia | Alcance en este smoke |
|-----------|------------------------|
| **Funcionario** | Obligatoria. Flujo completo Gateway → módulo *Contexto municipal* (`municipal_context`). |
| **Ciudadano** | **N/A audiencia ciudadano (paso dedicado)** hasta que **Producto** publique un flag explícito OFF/ON para la capa social en portal ciudadano (nombre de env, default y criterio de corte). Hoy el código incluye `municipal_context` también para `citizen` en `frontend/src/lib/audienceModules.ts`; eso **no** sustituye la decisión de Producto — no se exige paso ciudadano en este checklist hasta el flag. |

## Precondiciones

- Entorno: staging o local con build del candidato a release **menor**.
- Navegador: **Chrome/Edge desktop**, ventana ≥ **1280×720** (criterio “viewport desktop”).
- Sin extensiones que bloqueen `localStorage` / clipboard.

## Script (≤ 15 pasos)

Marcar **Pass / Fail** en la última columna en cada release menor; documentar captura o nota en el Fail.

| # | Paso | Criterio (humano QA) | Pass/Fail |
|---|------|----------------------|-----------|
| 1 | Abrir `/simulator` frío (sin sesión o ventana privada). | Aparece **Audience gateway**; no se monta simulación hasta elegir audiencia. | |
| 2 | Elegir **Funcionario público** y confirmar. | Carga journey; header muestra audiencia funcionario; ribbon de simulación visible. | |
| 3 | En navegación de módulos, abrir **Contexto municipal** (ancla `municipal_context`). | Panel raíz con `data-testid="social-context-root"`; título *Marco de lectura sociodemográfica*. | |
| 4 | **Baseline lectura “INEGI / oficial”:** en **PR3 · Indicadores**, revisar al menos una ficha con valor (`data-testid="social-context-official-stat-card"`). | Badges **Fuente** (`social-official-badge-source`) y **vintage** (`social-official-badge-vintage`) legibles; bloque **Trazabilidad fuentes de cálculo** (`social-official-source-trace`) presente cuando hay fila trazada. | |
| 5 | Sin scroll vertical inicial: en la **primera tarjeta oficial** visible, comprobar que **caveat** (ámbar si aplica) + **traza** o **pie numérico** (`social-official-numeric-footer`) entran en el **viewport** (ajustar zoom 100%; si el módulo queda bajo el fold, scroll mínimo solo hasta la sección PR3, no más de una pantalla). | Disclaimers no quedan ocultos tras un solo scroll razonable hacia PR3. | |
| 6 | **Modo CVE vs marco estadístico:** con **un solo municipio** activo en la ZM (estado típico SLP centro o elección que dé/cve inequívoco). | `SocialOfficialStatsSection` muestra ámbito tipo *Municipio CVE …* en copy de ficha; `data-source-mode` en `social-context-official-stats` coherente con env (`NEXT_PUBLIC_SOCIAL_STATS_*` según despliegue). | |
| 7 | Activar **varios municipios** en la misma ZM (si la UI lo permite en el build) o dejar multi-selección equivalente. | Etiqueta de ámbito indica **ZM / sin CVE único**; si hay fila *otro ámbito*, aparece aviso **disponible_otro_ambito** (`social-context-official-stat-mismatch`) sin crashear. | |
| 8 | **Bitácora PR2:** si hay controles que escriben en bitácora de supuestos, registrar **una entrada de prueba** (texto corto distintivo). | Lista/bitácora refleja la entrada; sin error de consola. | |
| 9 | **Export / portapapeles PR5:** si `isSocialContextExportUiEnabled()` es true (no hay `NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN` ni `NEXT_PUBLIC_CITIZEN_UI` forzando ocultación). | Botón **copiar** (Markdown) muestra mensaje de éxito; pegar en editor muestra bloque con disclaimer + trazo PR3; alternativa **descargar .md** produce archivo. | |
| 10 | Si export está **oculto** por env: marcar **N/A** con nombre de variable y valor; verificar que el resto de PR3 sigue visible. | Coherencia env/UI documentada. | |
| 11 | **Hard refresh:** con sesión funcionario ya elegida, **Cmd+Shift+R** (o equivalente). | Tras recarga: **audiencia sigue funcionario** y módulo activo reciente es aceptable perder foco, pero **no** vuelve a gateway vacío salvo borrar storage; alineado a persist **PR2/PR5** en store: `partialize` persiste `audience` y `propuestaSlots` en `alquimia-simulator` y clave literal `alquimia.audience` (ver `frontend/src/store/simulatorStore.ts`). | |
| 12 | (Opcional regresión) Abrir en nueva pestaña **solo URL pública** `/simulator`, repetir pasos 2–4 mínimos. | Sin rutas internas inestables ni login fantasma. | |

**Fallo bloqueante:** crash, datos sin etiqueta geo/vintage en fichas, trazabilidad ausente en valores mostrados como “oficiales”, o persistencia de audiencia rota tras hard refresh en condiciones normales.

## Automatización ligera (no sustituye el smoke humano)

- **Vitest** (sin Playwright en CI por defecto): `frontend/src/lib/social/smokeSocialLayerSurface.test.ts` — aserta presencia estable de anclas en código fuente y orden de módulo funcionario.
- **Segunda PR / ampliación:** solo añadir E2E headful cuando exista `playwright.config` y job CI; hasta entonces, mantener este archivo + test de superficie.

## Archivos de referencia (tocados típicamente al ajustar el smoke o la capa)

- `frontend/src/app/simulator/page.tsx` — `municipal_context`, gateway audiencia.
- `frontend/src/lib/audienceModules.ts` — visibilidad por audiencia.
- `frontend/src/components/simulator/SocialDemographicContextPanel.tsx` — contenedor capa social.
- `frontend/src/components/simulator/SocialOfficialStatsSection.tsx` — PR3 bundle / CVE.
- `frontend/src/components/simulator/OfficialStatCard.tsx` — fichas, trazas, testids.
- `frontend/src/components/simulator/SocialContextExportPreviewSection.tsx` — copiar / .md PR5.
- `frontend/src/lib/social/pr5ExportConstants.ts` — gating export.
- `frontend/src/store/simulatorStore.ts` — persistencia audiencia / propuestas.
- `frontend/src/data/socialStats/SOURCE_TRACE.md` — contrato dato↔fuente.

## Lista archivos tocados — PR que introduce/actualiza smoke 21

| Archivo | Rol |
|---------|-----|
| `cursor-rules/SMOKE_SOCIAL_LAYER.md` | Este checklist versionado. |
| `frontend/src/lib/social/smokeSocialLayerSurface.test.ts` | Regresión ligera Vitest (opcional pero recomendado en el mismo PR). |
