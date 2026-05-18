# Module UI rollout — plan Front vs mockups (ALQUIMIA)

Documento de **coordinación** entre equipos que tocan el simulador por `module_id`. No sustituye el detalle de filas en **`FRONTEND DEFINITIVO/MODULE_MAP.md`** ni la plantilla operativa en **`frontend/docs/AGENT_PROMPT_TEMPLATE.md`**.

## Alcance de este README

- **Incluido:** orden de merge, paralelismo, tabla **agente ↔ path** y conflictos conocidos en el **router de módulos** (`renderDecisionModule.tsx`).
- **Fuera de alcance habitual:** cambiar código de componentes desde el rol *agente soporte docs* salvo que otro artefacto lo mande explícitamente.

## Fuente visual y de producto

| Artefacto | Ruta repo |
|-----------|-----------|
| Matriz módulo ↔ mockup (Row ID) | `FRONTEND DEFINITIVO/MODULE_MAP.md` |
| Plantilla de prompt por módulo | `frontend/docs/AGENT_PROMPT_TEMPLATE.md` |

Al abrir un PR de UI, el executor debe citar al menos un **Row ID** coherente con el mockup tocado.

## Navigator / territorio institucional

Cualquier copy, leyenda o mapa que **asigne cifras a municipio, entidad o ZM** debe respetar la separación de jurisdicción y SRID definida en **`cursor-rules/NAVIGATOR.md`** (almacenamiento EPSG:4326, visualización web 3857, métricas SLP/NL/QRO en 6369; no mezclar alcance ZM con actos municipales sin desglose).

## Paralelismo y ondas de merge

**Regla:** trabajo **SHARED** (contratos y shell) se integra **antes** que ramas que solo tocan hojas de un `module_id`. Así se reduce el rebasing sobre el `switch` central.

### Onda 0 — SHARED (bloqueante para el resto)

| Prioridad | Ruta (desde raíz repo) | Notas |
|-----------|------------------------|--------|
| P0 | `frontend/src/lib/simulator/decisionModuleRenderContext.ts` | Forma de `DecisionModuleRenderContext`; cambios aquí obligan revisar todos los callsites. |
| P0 | `frontend/src/app/simulator/renderDecisionModule.tsx` | **Router único** por `module_id` y audiencia; máxima probabilidad de conflicto Git. |
| P1 | `frontend/src/components/simulator/DecisionModuleShell.tsx` | Cáscara tabs / orden de módulos visible. |
| P1 | `frontend/src/lib/audienceModules.ts` | Lista canónica de `module_id` por audiencia. |
| P1 | `frontend/src/app/simulator/page.tsx` | Gate baseline, props a `renderDecisionModule`, ribbon territorial. |

### Onda 1 — Por `module_id` (después de verde Onda 0 en `main`)

Cada fila es un “paquete” que puede ir a agentes distintos **en paralelo** si **no** editan la misma sub-rama del `switch` simultáneamente sin coordinar.

| `module_id` | Componentes / rutas típicas (hojas) | Rama `switch` en `renderDecisionModule.tsx` |
|-------------|--------------------------------------|-----------------------------------------------|
| `city_baseline` | `frontend/src/components/simulator/SectionHero.tsx`, `ImpactoAmbiental.tsx`, `MultiplicadoresEco.tsx` | `citizen` → `case 'city_baseline'`; `functionary` → `case 'city_baseline'` (grid distinto). |
| `municipal_context` | `frontend/src/components/simulator/SocialDemographicContextPanel.tsx`, `MarcoLegal.tsx`, `CoberturaNacional.tsx` | `citizen` y `functionary` bajo `municipal_context`. |
| `citizen_inputs` | `frontend/src/components/simulator/EducacionCiudadana.tsx` | Solo `audience === 'citizen'`. |
| `impact_finance` | `ImpactoAmbiental.tsx`, `MultiplicadoresEco.tsx` | Solo ciudadano (lite). |
| `future_goals` | `frontend/src/components/simulator/FutureGoalsModule.tsx` (dynamic `ssr: false`) | `case 'future_goals'`; incluye fallback de carga. |
| `infrastructure_operations` | `CentrosAcopio.tsx`, `Logistica.tsx`, `OperacionPERBitacora.tsx`, `PortalEmpresarial.tsx`, `FlujosResiduos.tsx`, `SankeyFlujoResiduos.tsx`, `HojaRuta.tsx` | Bloque largo `default` funcionario. |
| `market_traceability` | `ReasoningGraphPanel.tsx` (dynamic); empresario: `PortalEmpresarial.tsx` | Ojo: mismo id en **functionary** vs **entrepreneur** con componente distinto. |
| `inspeccion_predios` | `InspeccionForm.tsx` | `default` funcionario. |
| `scenarios_export` | `ImpactoFinanciero.tsx`, `ExportarSection.tsx`, `ExportadorReporte.tsx`, `DashboardKPIs.tsx`, `AlertasPanel.tsx`, `GovernancePanel.tsx`, `LaunchChecklist.tsx` | Bloque muy ancho; **alto riesgo de conflicto** si dos PRs tocan imports o orden. |
| `source_traceability` | `ReferenciasCalculos.tsx` | Última pestaña funcionario. |
| Empresa / org | `DeclaracionWizard.tsx`, `ExportarSection.tsx`, `PortalEmpresarial.tsx` | Primer `switch`: `isOrganizationJourney \|\| audience === 'entrepreneur'`. |

**Dynamic imports en SHARED del router:** `FutureGoalsModule` y `ReasoningGraphPanel` se declaran en la cabecera del archivo; los cambios ahí compiten en **Onda 0**.

## Tabla agente ↔ path (resolver conflictos conservando filas)

Si dos PRs tocan el mismo archivo, **no borrar filas ajenas** en esta tabla al rebasar; mantener el cruce **agente/stream ↔ path** actualizado en el commit de resolución.

| Agente / stream | Rutas principales (raíz repo) |
|-----------------|--------------------------------|
| **SHARED / contrato render** | `frontend/src/app/simulator/renderDecisionModule.tsx`, `frontend/src/lib/simulator/decisionModuleRenderContext.ts` |
| **Shell / journey** | `frontend/src/components/simulator/DecisionModuleShell.tsx`, `frontend/src/lib/simulator/functionaryJourneyEnrichment.ts` (módulo trazabilidad) |
| **Page / baseline gate** | `frontend/src/app/simulator/page.tsx` |
| **Audiencias** | `frontend/src/lib/audienceModules.ts` |
| **Capa social / PR3–PR5** | `frontend/src/components/simulator/SocialDemographicContextPanel.tsx`, `SocialOfficialStatsSection.tsx`, `OfficialStatCard.tsx`, datos bajo `frontend/src/data/socialStats/` |
| **Finanzas / escenarios** | `frontend/src/components/simulator/ImpactoFinanciero.tsx`, `ExportarSection.tsx`, `ExportadorReporte.tsx`, … |
| **Infra operativa** | `CentrosAcopio.tsx`, `Logistica.tsx`, `OperacionPERBitacora.tsx`, `FlujosResiduos.tsx`, `SankeyFlujoResiduos.tsx` |
| **ÁGORA / hub (fuera del switch pero acoplado narrativa)** | `frontend/src/app/hub/page.tsx`, `frontend/src/lib/hubPaqueteZip.ts`, `frontend/src/data/hubDocumentosCapitulo.ts` |

## Conflictos conocidos sobre `renderDecisionModule.tsx`

1. **Mismo `case` concurrente:** dos PRs que reordenan imports o fragmentos dentro de un `module_id` generan conflictos pesados; conviene serializar o dividir (uno solo mueve JSX, otro solo estilos en el hijo).
2. **`market_traceability` dual:** comportamiento distinto para `entrepreneur` (bloque inicial) vs `functionary` (`ReasoningGraphPanel`); no unificar sin revisar `AUDIENCE_MODULES`.
3. **`future_goals` + dynamic:** fallos de bundle se ven como mensaje rojo en cliente; cambios en `next/dynamic` o en path del import requieren prueba manual.
4. **Ciudadano vs funcionario en `city_baseline` / `municipal_context`:** estructuras distintas; un diff que “unifica” puede romper una audiencia.

## Política de archivos en línea y adendos

- **Solo PDFs** se sirven desde `public/reglamentos/`. Archivos `.doc` no van en línea.
- **Adendos jurídicos** los generan los agentes de ALQUIMIA; el frontend los consume, no los produce. `frontend/src/data/adendos.ts` es semilla/template.

## Qué no hace este documento

- No añade dependencias npm ni rutas Next nuevas.
- No sustituye la verificación visual contra PNG en `FRONTEND DEFINITIVO/`.

## Checklist rápido antes de merge (executor)

1. Row ID y mockup citados (plantilla `AGENT_PROMPT_TEMPLATE.md`).
2. Onda de merge respetada (SHARED primero si hubo cambio de contrato).
3. `npx tsc --noEmit` y pruebas acordadas en `frontend/`.
4. Si el módulo muestra territorio o cifras geo-referenciadas: revisión **Navigator** según `cursor-rules/NAVIGATOR.md`.

---

*Última actualización documental: alineado a árbol con `renderDecisionModule` en `frontend/src/app/simulator/renderDecisionModule.tsx` y `AUDIENCE_MODULES` en `frontend/src/lib/audienceModules.ts`.*
