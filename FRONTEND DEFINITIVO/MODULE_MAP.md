# Matriz FRONTEND DEFINITIVO ↔ código (ALQUIMIA)

Referencia visual: mockups PNG en esta carpeta. Cada fila enlaza el arte con `module_id` del contrato `GET /city/journey/steps` y los componentes React que implementan el contenido hoy.

> **Política de archivos en línea:** solo PDFs se sirven desde `public/reglamentos/`. Los `.doc` no van en línea; cuando se obtenga el PDF oficial se agrega al catálogo. Adendos jurídicos los generan los agentes de ALQUIMIA; el frontend los consume, no los produce.

| Row ID | Archivo(s) mockup | module_id (principal) | Audiencia | Componentes / rutas | Brecha |
|--------|-------------------|------------------------|-----------|---------------------|--------|
| M01 | MODULO 1.png, MODULO 1 PAG 2.png | `city_baseline` | citizen (solo `SectionHero`) · functionary (grid: `SectionHero` + `ImpactoAmbiental` + `MultiplicadoresEco`) | [`SectionHero`](../frontend/src/components/simulator/SectionHero.tsx), [`ImpactoAmbiental`](../frontend/src/components/simulator/ImpactoAmbiental.tsx), [`MultiplicadoresEco`](../frontend/src/components/simulator/MultiplicadoresEco.tsx) | Literales y KPIs pueden diferir del mockup; revisar jerarquía tipográfica en Fase mockup. |
| M02 | MODULO 2 PAG 1.png, MODUO 2 PAG 2.png | `municipal_context` | citizen · functionary | [`SocialDemographicContextPanel`](../frontend/src/components/simulator/SocialDemographicContextPanel.tsx), [`MarcoLegal`](../frontend/src/components/simulator/MarcoLegal.tsx), [`CoberturaNacional`](../frontend/src/components/simulator/CoberturaNacional.tsx) | Densidad del mockup > UI actual; usar progressive disclosure. |
| M04 | MODULO 4.png, MODULO 4, PAG 2.png | `infrastructure_operations` | functionary | [`CentrosAcopio`](../frontend/src/components/simulator/CentrosAcopio.tsx), [`Logistica`](../frontend/src/components/simulator/Logistica.tsx), [`OperacionPERBitacora`](../frontend/src/components/simulator/OperacionPERBitacora.tsx), [`PortalEmpresarial`](../frontend/src/components/simulator/PortalEmpresarial.tsx), [`FlujosResiduos`](../frontend/src/components/simulator/FlujosResiduos.tsx), [`SankeyFlujoResiduos`](../frontend/src/components/simulator/SankeyFlujoResiduos.tsx), [`HojaRuta`](../frontend/src/components/simulator/HojaRuta.tsx) | Orden interno vs mockup no auditado píxel a píxel. |
| M06 | MODULO 6.png, MODULO 6 PAG 1.png, MODULO 6.6.png | `scenarios_export` | functionary | [`ImpactoFinanciero`](../frontend/src/components/simulator/ImpactoFinanciero.tsx), [`ExportarSection`](../frontend/src/components/simulator/ExportarSection.tsx), [`ExportadorReporte`](../frontend/src/components/simulator/ExportadorReporte.tsx), [`DashboardKPIs`](../frontend/src/components/simulator/DashboardKPIs.tsx), [`AlertasPanel`](../frontend/src/components/simulator/AlertasPanel.tsx), [`GovernancePanel`](../frontend/src/components/simulator/GovernancePanel.tsx), [`LaunchChecklist`](../frontend/src/components/simulator/LaunchChecklist.tsx) | Varias pantallas del mockup pueden corresponder a sub-secciones (tabs futuros). |
| M07 | MOD 7 (mercado / causalidad) referencia visual legacy | `market_traceability` | funcionario (city_plan) | [`ReasoningGraphPanel`](../frontend/src/components/simulator/ReasoningGraphPanel.tsx) — causalidad mercado | Distinto del módulo dedicado `risk_trends` (M08). |
| M08 | Módulo riesgos y tendencias (prototipo / capturas “nuevo”) | `risk_trends` | functionary | [`RiskTrendsPanel`](../frontend/src/components/simulator/RiskTrendsPanel.tsx), [`/api/trendscape`](../frontend/src/app/api/trendscape/route.ts), [`trendscapeBaseline`](../frontend/src/data/trendscapeBaseline.ts) | Tendencias: upstream opcional `TRENDSCAPE_*`; sin clave, baseline curada ALQUIMIA. |
| INS | MODULO INSPECCION.png | `inspeccion_predios` | functionary | [`InspeccionForm`](../frontend/src/components/simulator/InspeccionForm.tsx) | — |
| META | (sin PNG único; línea temporal) | `future_goals` | functionary | [`FutureGoalsModule`](../frontend/src/components/simulator/FutureGoalsModule.tsx) (carga dinámica) | — |
| CIT1 | — | `citizen_inputs` | citizen | [`EducacionCiudadana`](../frontend/src/components/simulator/EducacionCiudadana.tsx) | No mapeado a PNG dedicado en carpeta. |
| CIT2 | — | `impact_finance` | citizen | [`ImpactoAmbiental`](../frontend/src/components/simulator/ImpactoAmbiental.tsx), [`MultiplicadoresEco`](../frontend/src/components/simulator/MultiplicadoresEco.tsx) | Vista lite ciudadana. |
| ORG | — | `organization_profile` · `containers_provider` · `market_traceability` · `organization_report` | entrepreneur (`entry=organization`) | [`DeclaracionWizard`](../frontend/src/components/simulator/DeclaracionWizard.tsx), placeholder contenedores, [`PortalEmpresarial`](../frontend/src/components/simulator/PortalEmpresarial.tsx), [`ExportarSection`](../frontend/src/components/simulator/ExportarSection.tsx) | Journey distinto (`journey_for` organization). |
| TRACE | (inyectado en FE) | `source_traceability` | functionary | [`ReferenciasCalculos`](../frontend/src/components/simulator/ReferenciasCalculos.tsx) | No viene del JSON del backend; se añade en cliente. |

## Decisión: `risk_trends` (city_plan)

- **Backend:** paso en [`journey_for`](../backend/app/city/repository.py) entre `market_traceability` e `inspeccion_predios`.
- **Frontend:** visible solo funcionario en [`AUDIENCE_MODULES`](../frontend/src/lib/audienceModules.ts); UI en [`RiskTrendsPanel`](../frontend/src/components/simulator/RiskTrendsPanel.tsx). Tendencias vía [`GET /api/trendscape`](../frontend/src/app/api/trendscape/route.ts): si existen `TRENDSCAPE_UPSTREAM_URL` (y opcional `TRENDSCAPE_API_KEY`) el servidor reenvía al proveedor; si no, responde baseline en [`trendscapeBaseline`](../frontend/src/data/trendscapeBaseline.ts).

## Decisión: `market_traceability` (city_plan)

- **Backend:** ya devuelve el paso en [`journey_for`](../backend/app/city/repository.py) para `city_plan`.
- **Frontend:** se **expone al funcionario** en [`AUDIENCE_MODULES`](../frontend/src/lib/audienceModules.ts) con UI dedicada (**grafo causal**), para no duplicar el bloque de [`PortalEmpresarial`](../frontend/src/components/simulator/PortalEmpresarial.tsx) que sigue en `infrastructure_operations`.

## Uso en prompts de agente

Citar **Row ID** (p. ej. `M04`) y el mockup correspondiente. Ver plantilla en [`frontend/docs/AGENT_PROMPT_TEMPLATE.md`](../frontend/docs/AGENT_PROMPT_TEMPLATE.md).
