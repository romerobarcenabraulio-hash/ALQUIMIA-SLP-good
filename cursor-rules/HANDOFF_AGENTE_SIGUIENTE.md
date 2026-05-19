# HANDOFF — Continuidad para el siguiente agente ALQUIMIA

**Fecha:** 2026-05-19  
**Conversación origen:** sesión larga de auditoría UI + rigor analítico + 24 ítems  
**Estado del repo:** todo commiteado y pusheado a `main`; sin cambios locales pendientes

---

## 0. REGLAS OBLIGATORIAS

Antes de tocar código, **lee estos archivos en orden**:

1. `cursor-rules/PD&SA.md` — voz estratégica, anti-sycophancy, estándares PM
2. `cursor-rules/AUDITOR.md` — veto universal, seguridad jurídica, compliance
3. `cursor-rules/EJECUTOR.md` — stack técnico, disciplina de pruebas, estándares de código
4. `cursor-rules/NAVIGATOR.md` — geo/jurisdicción, SRID, fuentes oficiales
5. `cursor-rules/WALKME_SIMULATOR.md` — mapa editorial del simulador
6. `.cursor/rules/navigator.mdc` — regla siempre activa (EPSG, jurisdicción)

**Principio rector:** ALQUIMIA es una plataforma gov-tech de circularidad municipal mexicana. **Municipio ≠ Zona Metropolitana.** Todo número lleva fuente. Todo texto público lleva disclaimer. Nada es dictamen oficial.

---

## 1. ARQUITECTURA GENERAL

| Capa | Stack | Deploy | URL |
|------|-------|--------|-----|
| Frontend | Next.js 15, Tailwind, Zustand, Recharts, Mapbox GL | Vercel | `alquimia-slp.vercel.app` |
| Backend | FastAPI, SQLAlchemy, Alembic, Anthropic (agora) | Render | `api.alquimiaplatform.com` |
| BD | Postgres (Render internal) | Render | `DATABASE_URL` env var |

**Monorepo:** `/frontend` y `/backend` en raíz. Next.js en `/frontend`. FastAPI en `/backend`.

### Archivos clave del simulador

| Archivo | Qué hace |
|---------|----------|
| `frontend/src/app/simulator/page.tsx` | Layout principal: sidebar, ribbon, grid, DecisionModuleShell |
| `frontend/src/components/simulator/DecisionModuleShell.tsx` | Shell: nav, `ModuleContextHeader`, `ModuleEditorialBrief`, `GuidancePanel`, routing |
| `frontend/src/app/simulator/renderDecisionModule.tsx` | Switch por `module_id` → componente React (CityBaselineStack, RiskTrendsPanel, etc.) |
| `frontend/src/lib/audienceModules.ts` | Qué módulos ve cada audiencia (citizen/functionary/entrepreneur) |
| `frontend/src/lib/simulator/functionaryJourneyEnrichment.ts` | Labels, decisión, evidence, next_action por módulo |
| `frontend/src/data/moduleEditorialBriefs.ts` | Título, subtítulo_catchy, metodología 4-secciones, chart_briefs por módulo |
| `frontend/src/components/simulator/FuncionariosViviendaRsuModel.tsx` | Panel RSU de parámetros (mockup secciones 1–4) |
| `frontend/src/store/simulatorStore.ts` | Estado global Zustand (precios, horizonte, municipios, resultados) |
| `frontend/src/lib/calculator.ts` | Motor de cálculo: RSU, ingresos, CO₂e, empleo |

### Módulos del journey (funcionario)

| # | `module_id` | Componente principal | Estado |
|---|-------------|---------------------|--------|
| 1 | `city_baseline` | `CityBaselineStack` | Funcional, ExpandableChart integrado |
| 2 | `municipal_context` | `MunicipalContextStack` | Funcional, marco legal + sociodemográfico |
| 3 | `future_goals` | `FutureGoalsModule` (dynamic) | Funcional, tab mapa circularidad |
| 4 | `infrastructure_operations` | `InfrastructureOperationsStack` | Funcional |
| 5 | `market_traceability` | `MarketTraceabilityStack` | Funcional, grafo causal |
| 6 | `risk_trends` | `RiskTrendsPanel` | Funcional, 4 dimensiones con fórmulas |
| 7 | `inspeccion_predios` | `InspeccionStack` | Funcional |
| 8 | `scenarios_export` | `ScenariosExportStack` | Funcional |
| 9 | `source_traceability` | `ReferenciasCalculos` | Funcional, inyectado en FE |

---

## 2. LO QUE SE HIZO EN ESTA SESIÓN (resumen ejecutivo)

### Título + subtítulo en cada módulo
- `ModuleContextHeader` en `DecisionModuleShell`: título serif grande + subtítulo verde legible + territorio + tooltip RSU
- `ModuleEditorialBrief` conectado con prop `suppressTitle` dentro del shell
- `ModuleMetodologiaMobile` para pantallas < xl

### Panel RSU rediseñado (mockup MODULO 1.png)
- 4 paneles numerados: (1) Vivienda condominio, (2) Ajustar RSU, (2.3/2.4) Merma+precio, (3) Composición fija, (4) Entierro
- Layout ancho completo debajo de ciudad+propuestas
- Eliminado texto basura redundante
- Sliders vivienda edificio/casa INEGI conservados con pills de segmento
- Tests 9/9 pasan

### Componentes creados previamente (sesión larga)
- `ExpandableChart.tsx` — wrapper modal, solo integrado en M01
- `GlosarioTooltip.tsx` + `glosario.ts` — 25 términos, solo usado en ModuleContextHeader (RSU)
- `CircularidadRoadmapMap.tsx` — mapa Mapbox, integrado en M03 (FutureGoalsModule tab)
- `RiskTrendsPanel.tsx` — 4 dimensiones riesgo con fórmulas documentadas
- `MunicipalContextStack.tsx` con `MunicipioIntroHeader` dinámico
- `moduleEditorialBriefs.ts` — briefs completos para 9 módulos

### Backend
- Adapters: `conapo.py`, `coneval.py`, `denue.py`
- PERT 3 puntos en `backend/app/planning/builder.py`
- `riesgo_system.md` con 4 dimensiones y fórmulas
- Fix import circular en `backend/app/db/base.py`
- Alembic inicializado para Proyecto Vivo

---

## 3. PENDIENTES EXPLÍCITOS — EL SIGUIENTE AGENTE DEBE ATACAR ESTOS

### A. Estudio social / módulo de decisión social
**Estado:** hay 16 componentes `Social*` creados (SocialDemographicContextPanel, SocialRiskMatrixCards, SocialQuantitativeVizSection, etc.) y una capa de prompts completa en `cursor-rules/PROMPTS_CAPA_SOCIAL_POR_AGENTE.md` y `cursor-rules/PROMPTS_CIERRE_EPICO_SOCIAL_DELEGACION.md`.

**Lo que falta:**
- Integrar estos componentes en un **módulo de decisión dedicado** o como sub-panel dentro de `municipal_context` (M02)
- Los prompts 16–28 en `PROMPTS_CIERRE_EPICO_SOCIAL_DELEGACION.md` están escritos pero no todos ejecutados
- Conectar datos INEGI de `fuentes de calculo/` Excel al snapshot versionado TS (`frontend/src/data/inegiCensus2020StateFacts.ts` existe parcial)
- El `SocialContextHandoffPanel` y `SocialContextExportPreviewSection` necesitan revisión visual y conexión real

### B. Módulo de capacitación (idea nueva del usuario)
**Concepto:** submódulo o módulo independiente para capacitación ciudadana / operadores / funcionarios.
- Podría vivir como sub-tab en `infrastructure_operations` (M04) o como módulo independiente
- Relacionado con `EducacionCiudadana.tsx` (ya existe para ciudadano)
- El usuario quiere un plan de capacitación ligado al Gantt/PERT

**Acción sugerida:** crear `module_id: 'capacitacion'` con stack que incluya:
- Plan de formación por fase (conectado a `FASES_CA`)
- Materiales por audiencia (ciudadano, barrendero, inspector)
- Indicadores de adopción (liga con capa social)

### C. Gantt / PERT / infraestructura
**Estado:**
- `GanttMaestroView.tsx` existe en frontend
- `backend/app/planning/builder.py` tiene PERT 3 puntos implementado
- `FutureGoalsModule.tsx` tiene tab para metas y calendario

**Lo que falta:**
- Vista Gantt interactiva con dependencias visuales
- Conectar PERT del backend con la vista Gantt del frontend (hoy es estático)
- El usuario mencionó "sub-módulo para la parte de infraestructura o del PERT o del Gantt" — probablemente quiere Gantt como tab dentro de M04 o M03

### D. Mapas de circularidad y auditoría
**Estado:**
- `CircularidadRoadmapMap.tsx` — integrado en M03 (tab mapa)
- `ZmCircularityHeatmapMap.tsx` — heatmap por ZM
- `HorizonteCircularidad.tsx` — timeline de circularidad
- Backend: `circularity_heatmap.py` con `data_quality` field

**Lo que falta (mencionado ayer):**
- Auditoría de calidad de datos por capa geográfica
- Conectar badges de calidad del backend al frontend
- Validar fuentes geográficas con Navigator (MGN INEGI primero)

### E. ExpandableChart en todos los módulos
Solo está en M01 (CityBaselineStack). Plan original: aplicarlo en M02–M08 donde hay `chart_briefs` definidos en `moduleEditorialBriefs.ts`.

### F. GlosarioTooltip masivo
Solo aparece el tooltip de "RSU" en el header. Plan: aplicar en KPIs, labels de sliders, términos técnicos en cada módulo.

### G. `data-chart-id` para sidebar contextual
- `useChartSectionObserver.ts` funciona con IntersectionObserver
- Solo `ExpandableChart` y `RiskTrendsPanel` tienen `data-chart-id`
- Falta agregar en M02 (diagnóstico-jurídico), M03 (gantt-maestro), M04 (mapa-centros-acopio), etc.

### H. BD Proyecto Vivo
- Alembic inicializado pero `alembic upgrade head` **no se ha corrido en Render**
- La ruta `/api/v1/proyecto/` da 500 (`relation "proyectos_municipales" does not exist`)
- Acción: entrar a Render Shell → `cd backend && alembic upgrade head`

### I. Deploy / producción
- Frontend despliega automático en Vercel desde `main`
- Backend en Render: manual o auto (verificar)
- El usuario SIEMPRE debe hacer hard refresh (`Cmd+Shift+R`) para ver cambios

---

## 4. PATRONES DE DISEÑO UI VIGENTES

### Paleta
| Token | Hex | Uso |
|-------|-----|-----|
| Verde ALQUIMIA | `#3B6D11` | Acciones, sliders, acentos principales |
| Verde claro | `#EAF3DE` | Backgrounds activos, badges |
| Hueso | `#FDFCFA` | Cards, fondo módulos |
| Arena | `#F4F2ED` | Background general |
| Borde | `#E8E4DC` | Bordes de cards y divisores |
| Texto principal | `#1C1B18` | Headings, valores |
| Texto secundario | `#6B6760` | Descripciones |
| Texto terciario | `#A8A49C` | Labels, hints |
| Amber | `#D4881E` | Warnings, CO₂e, disposición |

### Tipografía
- Títulos: `font-serif` (Georgia/Times)
- Body: system sans (Inter/system-ui)
- Datos: `font-mono` (monospace)
- Micro-labels: `text-[10px] uppercase tracking-[0.06em]`

### Componentes reutilizables
- `ExpandableChart` — wrapper con modal fullscreen
- `GlosarioTooltip` / `TerminoTooltip` — hover definition
- `ModuleEditorialBrief` — caja verde de lectura ejecutiva
- `ScopeAnclaKicker` — disclaimer de alcance
- `OfficialSourcesReadingDisclosure` — advertencia fuentes
- `MetricCard` / `MiniFact` / `KpiChip` — chips de KPI

### Bordes y redondeos
- Cards: `rounded-[12px]` exterior, `rounded-[10px]` interior, `rounded-[8px]` chips
- Shadows: `shadow-[0_2px_12px_rgba(28,27,24,0.06)]` para shells principales

---

## 5. CURSOR RULES — MAPA DE APLICACIÓN

| Archivo | Cuándo aplicar |
|---------|---------------|
| `PD&SA.md` | Cuando el usuario pide dirección estratégica, viabilidad, stakeholders |
| `AUDITOR.md` | Antes de merge, validación legal/editorial, veto de copy público |
| `EJECUTOR.md` | Para implementación: stack, tests, disciplina de código |
| `NAVIGATOR.md` | Para temas geo: coordenadas, capas, jurisdicción, fuentes cartográficas |
| `WALKME_SIMULATOR.md` | Para editar briefings, walk-me, copys del simulador |
| `PROMPTS_CAPA_SOCIAL_POR_AGENTE.md` | Para continuar el epic de capa social (prompts 1–15 hechos, 16+ pendientes) |
| `PROMPTS_CIERRE_EPICO_SOCIAL_DELEGACION.md` | Para cerrar/delegar el epic social |
| `PLAN_Y_PROMPTS_AGENTES_EPICO_SIGUIENTE.md` | Para la fase post-runtime: prompts 29–36 |

---

## 6. FILOSOFÍA PARA EL SIGUIENTE AGENTE

1. **Sé crítico, no complaciente.** El usuario quiere un producto que sobreviva a un cabildo, no a un demo.
2. **Sé innovador.** Si algo puede ser un sub-módulo interactivo en vez de un párrafo, hazlo.
3. **Respeta la estética.** El mockup MODULO 1.png (en `FRONTEND DEFINITIVO/`) es la referencia. Paneles numerados, sliders limpios, sin texto basura.
4. **Municipio ≠ ZM.** Nunca mezclar alcances jurisdiccionales.
5. **Todo número tiene fuente.** INEGI, SEMARNAT, CONEVAL, CONAPO — nunca inventar.
6. **Todo copy público lleva disclaimer.** "No es dictamen oficial."
7. **Tests obligatorios.** Vitest con jsdom, `data-testid` estables.
8. **Lee el PD&SA.md** — anti-sycophancy protocol §12 antes de entregar cualquier recomendación.

---

## 7. PRIORIDADES SUGERIDAS (próxima sesión)

| P | Tarea | Impacto |
|---|-------|---------|
| P0 | Correr `alembic upgrade head` en Render Shell | Desbloquea Proyecto Vivo |
| P1 | Módulo capacitación: diseñar e implementar como tab en M04 o módulo propio | Idea nueva del usuario |
| P1 | Estudio social: conectar componentes Social* al journey | 16 componentes sin usar |
| P2 | ExpandableChart en M02–M08 | Consistencia visual |
| P2 | GlosarioTooltip en KPIs y labels técnicos | UX educativa |
| P2 | Gantt interactivo conectado a PERT backend | Completar M03/M04 |
| P3 | `data-chart-id` en todos los stacks para sidebar contextual | GuidancePanel dinámico |
| P3 | Auditoría mapas circularidad + badges calidad datos | Navigator compliance |

---

## 8. CÓMO VERIFICAR QUE EL SIMULADOR FUNCIONA

```bash
# Frontend local
cd frontend && npm run dev
# Abrir http://localhost:3000/simulator
# Seleccionar audiencia "Funcionario"
# Seleccionar estado → municipio
# Verificar: panel RSU arriba, módulos con título+subtítulo abajo
# Verificar: sidebar "Consideraciones" a la derecha en xl+

# Tests
cd frontend && npm test -- --run

# Backend
cd backend && uvicorn app.main:app --reload
# GET /health/deep → agora_pipeline: ok
```

---

---

## 9. EPICS DOCUMENTADOS EN CURSOR-RULES (sistema de prompts seriales)

El usuario construyó un sistema de prompts por agente, organizado en épicos. Estos archivos contienen instrucciones detalladas que el siguiente agente puede usar directamente:

| Archivo | Contenido | Prompts |
|---------|-----------|---------|
| `PROMPTS_CAPA_SOCIAL_POR_AGENTE.md` | Epic capa social/demografía — 5 bloques, 15 prompts por rol | 1–15 (parcialmente ejecutados) |
| `PROMPTS_CIERRE_EPICO_SOCIAL_DELEGACION.md` | Cierre y delegación post-epic social | 16–22 |
| `PROMPTS_ETAPA_RUNTIME_ORDEN_SERIAL.md` | Deploy, smoke, QA — orden serial estricto | 23–28 |
| `PROMPTS_ETAPA_RUNTIME_Y_OPERACION.md` | Detalle de cada paso runtime | 23–28 (detallado) |
| `PLAN_Y_PROMPTS_AGENTES_EPICO_SIGUIENTE.md` | Post-runtime: deuda técnica + siguiente pista producto | 29–36 |
| `SMOKE_SOCIAL_LAYER.md` | Script de smoke test manual para capa social (12 pasos) | QA release |
| `SMOKE_INFRA_POST_DEPLOY.md` | Smoke test infra post-deploy | QA infra |

### Cómo usar los prompts
1. Abrir chat nuevo en Cursor
2. Escribir `@cursor-rules/AUDITOR.md` (o el rol que indique el prompt)
3. Dejar línea en blanco
4. Pegar desde "Actúa como..." hasta el final del bloque de TAREA

---

## 10. AUDIENCIAS Y SUS MÓDULOS

```
citizen:       city_baseline, municipal_context, citizen_inputs, impact_finance
functionary:   city_baseline, municipal_context, future_goals, infrastructure_operations,
               market_traceability, risk_trends, inspeccion_predios, scenarios_export,
               source_traceability
entrepreneur:  organization_profile, containers_provider, market_traceability, organization_report
```

Si se crea un nuevo módulo (capacitación, estudio social como módulo propio), **debe agregarse a `AUDIENCE_MODULES`** en `frontend/src/lib/audienceModules.ts` y tener su brief en `moduleEditorialBriefs.ts`.

---

## 11. COMPONENTES SOCIAL* EXISTENTES (16 archivos, sin integrar al journey)

Todos en `frontend/src/components/simulator/`:

- `SocialDemographicContextPanel.tsx` (+ test) — panel raíz
- `SocialRiskMatrixCards.tsx` — tarjetas de riesgo social
- `SocialQuantitativeVizSection.tsx` (+ test) — visualización cuantitativa
- `SocialOfficialStatsSection.tsx` — indicadores INEGI/oficiales
- `SocialStatsLightBarChart.tsx` — barras ligeras
- `SocialStatsDenseVirtualTable.tsx` — tabla virtual de stats
- `SocialAssumptionsLog.tsx` — bitácora de supuestos
- `SocialContextHandoffPanel.tsx` (+ test) — panel de transferencia
- `SocialContextExportPreviewSection.tsx` (+ test) — export preview
- `SocialContextMarkdownPreview.tsx` — preview markdown
- `SocialPr4MetadataFooter.tsx` — footer de metadatos

Estos componentes fueron generados siguiendo los prompts del epic social pero **no están conectados al journey del simulador**. El módulo `municipal_context` (M02) ya existe como stack separado. La decisión pendiente es: ¿integrarlos como sub-panel de M02, o crear un nuevo `module_id: 'social_study'`?

---

---

## 12. DOCUMENTOS DE CONTINUIDAD DEL PROYECTO (bitácora + cola)

| Archivo | Qué es | Cuándo leer |
|---------|--------|-------------|
| `COLA_Y_ROLES_AGENTES.md` (raíz) | Ancla de continuidad: foco actual, próximos pasos, fase activa, bloqueadores, mapeo rol→archivo. Última sync: 2026-05-15 | **Siempre al arrancar** |
| `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` | Log append-only de auditoría (3700+ líneas). Entradas nuevas bajo `## Restore` desde 2026-05-14 | Cuando necesites historial de decisiones |
| `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/RELEASE_OPS_2026-05.md` | Playbook de release: env vars, health checks, rollback para Render + Vercel | Antes de deploy |
| `frontend/docs/AGENT_PROMPT_TEMPLATE.md` | Template fill-in-the-blanks para rediseñar cualquier módulo del simulador | Antes de crear módulo nuevo |
| `frontend/docs/module-ui-rollout/README.md` | Estrategia de merge por oleadas (Onda 0 shared, Onda 1 per module) | Antes de PR multi-módulo |

### Archivos del epic social (handoff code-level)

| Archivo | Función |
|---------|---------|
| `frontend/src/types/socialBacklogHandoff.ts` | Tipos TS para elementos de backlog social |
| `frontend/src/lib/social/pr5HandoffProductSpec.ts` | Spec de producto para export handoff social |
| `frontend/src/lib/social/socialHandoffMarkdown.ts` (+test) | Builder de markdown para handoff |
| `frontend/src/lib/social/buildSocialContextExportMarkdown.ts` | Builder de markdown para export general |
| `frontend/src/lib/social/buildSocialBacklogElements.ts` | Constructor de elementos de backlog |

### Utilidades PERT/Gantt ya existentes

| Archivo | Función |
|---------|---------|
| `frontend/src/lib/pertUtils.ts` | Cálculos PERT (optimista, probable, pesimista) |
| `frontend/src/data/hitosTimeline.ts` | Datos de hitos para timeline |
| `frontend/src/components/simulator/GanttMaestroView.tsx` | Vista Gantt maestro |
| `frontend/src/components/simulator/ImplementacionEspacioTiempo.tsx` | Vista espacio-tiempo |
| `backend/app/planning/builder.py` | PERT 3 puntos backend |
| `backend/app/planning/router.py` | API de planning |

---

*Este documento reemplaza la necesidad de leer la conversación anterior. El siguiente agente debe leerlo completo antes de su primer mensaje.*
