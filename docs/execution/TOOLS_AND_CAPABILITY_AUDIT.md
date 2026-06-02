# Auditoria de herramientas y capacidades ALQUIMIA

Fecha: 2026-06-02

## Conclusion operativa

ALQUIMIA no esta corta de herramientas. El problema principal es integracion, prioridad y cuarentena de legacy.

El repo ya contiene capas suficientes para sostener el MVP consultivo:

- investigacion y cache bibliografico;
- precios y mercado de materiales;
- reglamento y diagnostico legal;
- perfil nacional/municipal;
- centros de acopio y compradores;
- macrogeneradores y privado urbano;
- operaciones, rutas, inspeccion y PER;
- estandares/readiness;
- planeacion, riesgos, presupuesto y escenarios;
- razonamiento/evidencia;
- export institucional;
- frontend modular, diagramas y citas Chicago;
- simulador legacy con visualizaciones rescatables.

La accion correcta no es crear mas piezas paralelas. Es conectar estas herramientas al `CityConsultingContext`, `Evidence Kernel`, `/v`, `/p`, `/e` y `/admin`.

## Capacidades backend existentes

| Capacidad | Rutas/codigo | Uso correcto en MVP | Estado |
|---|---|---|---|
| Investigacion Serper/cache | `backend/app/research/*`, `/research/findings`, `/research/cache/summary` | Obtener bibliografia publica, reglamentos, benchmarks, precios y antecedentes. | Existe, subutilizado |
| Registro bibliografico operativo | `backend/app/research/bibliography_registry.py`, `/research/bibliography*` | Organizar fuentes, cobertura, recomendaciones y claim-ledger con Chicago. | Nuevo, conectado a research |
| Compatibilidad bibliografica | `backend/app/automation/bibliography_intelligence.py`, `/admin/bibliography*` | Recomendar evidencia comparable cross-tenant sin LLM ni recalibracion automatica. | Existe, util |
| Perplexity | `backend/app/research/perplexity_service.py` | Segunda capa futura de validacion con cita; no depender de ella para MVP. | Diferido |
| Modelos DB research | `ResearchItem`, `PriceSeries`, `RegulatorySource`, `ModelCalibration` | Base de datos de bibliografia, precios, reglamentos y calibraciones. | Existe |
| Perfil nacional | `backend/app/national/router.py` | Perfil territorial, municipios, cobertura legal, mapas y heatmaps. | Existe |
| Data provenance | `backend/app/data/router.py`, adapters INEGI/Banxico/CONAPO/CONEVAL/SEMARNAT/DENUE | Capa de fuentes oficiales y fallback trazado. | Existe |
| Legal | `backend/app/legal/router.py` | Reglamentos, source manifests, diagnostico legal, estrategia e inserciones. | Existe |
| Mercado | `backend/app/market/router.py`, `backend/app/planning/financial_model/material_prices.py` | Compradores, oportunidades, precio ancla, mix de precios. | Existe |
| Centros de acopio | `backend/app/centros_acopio/*` | Compradores, operadores, cobertura, sincronizacion Places/DENUE. | Existe |
| Macrogeneradores | `backend/app/macros/*` | Captura privada urbana y estimacion por categoria. | Existe |
| Operaciones/logistica | `backend/app/operations/*`, `backend/app/logistics/*`, `backend/app/routing/*`, `backend/app/google/*` | Rutas, PER, pesajes, evidencias, Google routes/places. | Existe |
| Encuestas | `backend/app/survey/router.py` | Percepcion ciudadana, CSV/PDF, resultados por municipio. | Existe |
| Estadistica | `backend/app/statistical/*` | Monte Carlo, PERT, sectores IO, derrama. | Existe |
| Planeacion | `backend/app/planning/*`, `backend/app/roadmap/*`, `backend/app/implementation/*` | Hoja de ruta, Gantt, PERT, RACI, riesgos, presupuesto. | Existe |
| Estandares | `backend/app/standards/*` | Readiness tecnico y mapeos de cumplimiento. | Existe |
| ReasoningGraph | `backend/app/reasoning/*` | Nodos fuente/claim/decision con explicaciones. | Existe |
| Export | `backend/app/export/*` | PDF/expediente/index/reportes con fuentes y limites. | Existe |
| Admin/tenant state | `backend/app/routers/admin.py`, `backend/app/admin/tenant_state.py` | Centro de mando, tenants, documentos, gates, bibliografia. | Existe |

## Capacidades frontend existentes

| Capacidad | Codigo | Uso correcto en MVP | Estado |
|---|---|---|---|
| Stage workspace | `frontend/src/components/platform/StageWorkspace.tsx` | Base comun de `/v`, `/p`, `/e`. | Existe |
| Platform page | `frontend/src/components/platform/PlatformPage.tsx` | Navegacion modular y shell editorial. | En rescate |
| Consulting package engine | `frontend/src/lib/consultingPackageEngine.ts` | Diagnostico, brechas, escenarios, hoja de ruta, riesgos. | Existe, en correccion |
| Input registry | `frontend/src/lib/consultingInputRegistry.ts` | Fuente unica de readiness por documentos/API/datos. | Existe |
| API layer contracts | `frontend/src/lib/consultingApiLayerContracts.ts`, `consultingApiLayerFetchers.ts` | Conectar APIs existentes sin crear namespaces paralelos. | Existe |
| Bibliography intelligence | `frontend/src/lib/bibliographyIntelligence.ts` | Recomendaciones de evidencia en UI/export. | Existe |
| Citas Chicago | `frontend/src/lib/citations.ts`, `CITATION_REGISTRY` | Bibliografia y notas por cifra. | Existe |
| Modulos M00-M21 | `frontend/src/lib/validationModuleSpecs.ts` | Indice homogeneo por ciudad y etapa. | Existe |
| Diagramas consultivos | `frontend/src/components/platform/ConsultingDiagrams.tsx` | Sankey/flujo/cascada/riesgos/matriz evidencia. | Existe, falta poblar mas con datos |
| Graficas legacy rescatables | `frontend/src/components/charts/*` | Waterfall, cashflow, Monte Carlo, tornado, CO2, volumen, empleos. | Rescatar selectivamente |
| Datos base | `frontend/src/data/*` | Precios, recicladoras, INEGI, estandares, organigramas, sankey, adendos. | Existe |
| Export ZIP | `frontend/src/app/api/tenants/[id]/export-zip/route.ts` | Paquete institucional con claims y bibliografia. | Existe |
| Guardrails cliente | `frontend/src/lib/clientFacingConsultingGuardrails.test.ts` | Evitar simulador, nombres internos, SLP hardcodeado y claims sin fuente. | Existe |
| Simulador legacy | `frontend/src/app/simulator`, `frontend/src/components/simulator`, `simulatorStore` | Laboratorio founder/admin; no cliente-facing. | Cuarentena |

## Perks que no debemos olvidar

1. `ResearchItem` ya permite guardar bibliografia por categoria, municipio, ZM, URL, titulo, dominio, confianza, valor numerico y fecha.
2. `PriceSeries` ya permite guardar precios por material, fecha, municipio/ZM y fuente.
3. `RegulatorySource` ya permite guardar reglamentos o fuentes normativas por municipio.
4. `ModelCalibration` ya permite calibrar parametros por alcance y fuente primaria.
5. `CITATION_REGISTRY` ya soporta Chicago en frontend.
6. `MATERIAL_PRICE_RESEARCH` ya existe para mix de precios bibliografico cuando no hay comprador local.
7. `consultingApiLayerContracts` ya evita crear APIs paralelas.
8. `ReasoningGraph` ya puede representar fuente -> claim -> decision.
9. `standards_map.json` y `metricStandardsTrace` ya dan base de cumplimiento/readiness.
10. `survey` ya cubre percepcion ciudadana y difusion aprobada por cliente.
11. `statistical` ya contiene Monte Carlo, PERT y derrama.
12. Las graficas viejas no deben borrarse en masa: varias son utiles si dejan de leer `simulatorStore`.

## Brechas reales

| Brecha | Impacto | Correccion |
|---|---|---|
| Bibliografia dispersa entre DB, fixtures y frontend | El sistema cae a "brecha critica" aunque hay evidencia comparable. | Centralizar en Evidence Registry y resolver en cascada. |
| Graficas utiles atadas a `simulatorStore` | Se pierde visualizacion profesional o contamina cliente. | Extraer componentes puros con props. |
| Demo confundido con municipio vacio | UI parece rota y sin calculos. | Demo debe ser ciudad real trazada o sandbox claramente interno. |
| APIs existentes no siempre entran al paquete consultivo | Se reimplementan cosas o se queda informacion dormida. | `CityConsultingContext` debe llamar contratos existentes. |
| Reglamento tratado a veces como una brecha mas | Puede bloquear o desbloquear incorrectamente. | Reglamento unico bloqueo formal; otros faltantes condicionan claims. |
| Legacy visual todavia visible | Producto se ve mezclado y desordenado. | Cuarentena por imports y rescate selectivo de graficas. |

## Orden recomendado de rescate

1. Consolidar `Evidence Registry`: research DB + fallback publico + citas Chicago + claim ledger.
2. Conectar `CityConsultingContext` a APIs existentes: national, data, legal, market, centros, macros, operations, standards, research.
3. Rescatar graficas puras: Sankey RSU, cascada economica, sensibilidad/precios, riesgo-impacto, costo de no actuar, CO2/factores, Monte Carlo admin.
4. Rehacer demo como ciudad trazable, no `municipio-demo` vacio.
5. Limpiar `simulatorStore` de cliente-facing con pruebas de import.
6. Exportar solo claims con fuente, formula o documento cliente.

## Regla de decision

Si una herramienta ya existe y puede entregar fuente, fecha, metodo, alcance y confianza, se conecta.

Si una herramienta existe pero depende de `simulatorStore`, se rescata solo como componente puro o motor deterministico.

Si una herramienta muestra sliders, demo fake, SLP hardcodeado, nombres internos o claims sin ledger en cliente, se cuarentena.

Si una herramienta no aporta evidencia, calculo, visualizacion, export, admin o operacion, se elimina despues de confirmar cero imports activos.
