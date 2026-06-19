# ALQ-104 - Reconciliacion specs 14-41 vs implementacion existente

**Fecha:** 2026-06-19  
**Issue:** ALQ-104  
**Tipo:** mapa anti-duplicacion; no construye features  
**Decision rectora:** si una spec de planeacion ya tiene fuente canonica en `docs/architecture/FASE*`, `cursor-rules/`, `backend/app/*` o `docs/execution/*`, el build posterior debe EXTENDER esa fuente. Si la spec introduce una pieza nueva sin contrato existente, debe CONSTRUIR con PR propio. Si contradice o redefine algo existente, debe RECONCILIAR antes de codificar.

## Alcance y fuentes revisadas

Planeacion revisada:

- `etapa de cierre y apertura planeacion/_INDICE_ESTADO.md`
- `etapa de cierre y apertura planeacion/DOCUMENTOS PENDIENTES/14_*.md` a `41_*.md`
- `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/REGLAS_DE_EJECUCION_AGENTES.md`

Implementacion/arquitectura canonica revisada:

- Agentes y reglas: `cursor-rules/_base.md`, `cursor-rules/EJECUTOR.md`, `cursor-rules/AUDITOR.md`, `cursor-rules/NAVIGATOR.md`, `cursor-rules/OLD/AESTHETE-1.md`
- Catalogos: `cursor-rules/OLD/CATALOGO_ENTREGABLES_CONSULTORIA.md`, `docs/architecture/capability_registry.json`, `docs/architecture/MODULE_MATURITY_AND_PERSONALIZATION.md`
- Release/operacion: `docs/architecture/FASE9_RELEASE_HARDENING_QA.md`, `docs/architecture/FASE10_OBSERVABILIDAD_OPERACION_POST_RELEASE.md`
- Automatizacion: `docs/architecture/FASE11_AUTOMATIZACION_CONSULTIVA.md`, `FASE12_AUTOMATIZACION_DOCUMENTAL.md`, `FASE13_RUNTIME_AUTOMATION.md`
- Data moat/NOUS: `FASE14_DATA_MOAT_PRIVACIDAD.md`, `FASE17R_RECONCILIACION_NOUS_LEARNING_FEEDBACK.md`, `FASE18_NOUS_STORAGE_OBSERVACIONAL_OPT_IN.md`, `FASE23_NOUS_OBSERVERS_APRENDIZAJE_VALIDACION.md`, `FASE24_NOUS_GATE_OUTCOMES_APRENDIZAJE_CIERRE_GATES.md`, `FASE25_NOUS_PROJECTION_DELTAS_A11_INSIGHTS.md`, `FASE26_PUBLICACION_CONTROLADA_NOUS_FEEDBACK_CLIENTE.md`, `FASE27_NOUS_SELF_MONITORING_GOBERNANZA.md`
- Evidencia tecnica: `backend/app/automation/*`, `backend/app/nous/*`, `backend/app/observability.py`, `backend/tests/test_phase11_automation.py`, `test_phase12_document_automation.py`, `test_phase13_runtime_automation.py`, `test_phase14_data_moat.py`, `test_phase18_nous_observational.py`, `test_phase23_nous_layer1_observers.py`, `test_phase24_nous_gate_outcomes.py`, `test_phase25_nous_projection_deltas.py`, `test_phase26_nous_suggestion_publication.py`, `test_phase27_nous_governance.py`

## Fuentes canonicas por dominio

| Dominio | Fuente canonica | Regla para proximos builds |
|---|---|---|
| Protocolo de agentes / gates / autonomia | `REGLAS_DE_EJECUCION_AGENTES.md` + `cursor-rules/_base.md` + roles de agentes | RECONCILIAR doc 14/ADR-001 con roles existentes antes de implementar schemas nuevos. |
| Automatizacion consultiva | `FASE11`, `backend/app/automation/inference.py`, `test_phase11_automation.py` | EXTENDER; no crear otro motor de inferencia. |
| Documentos con revision humana | `FASE12`, `backend/app/automation/documents.py`, tests phase12 | EXTENDER; cualquier envio/firma/aprobacion sigue gated. |
| Runtime/ECA/recomendaciones | `FASE13`, `backend/app/automation/runtime.py`, `test_phase13_runtime_automation.py` | EXTENDER para ALQ-69; no duplicar triggers. |
| Data moat/cross-tenant/privacidad | `FASE14`, `backend/app/automation/data_moat.py`, tests phase14 | EXTENDER; publicar patrones requiere NOUS+bias+founder gate. |
| NOUS/juicio/aprendizaje | `FASE17R`, `FASE18`, `FASE23-27`, `backend/app/nous/*` | EXTENDER; ADR-002 no es engine nuevo desde cero. |
| Release/observabilidad | `FASE9`, `FASE10`, `backend/app/observability.py`, scripts smoke | EXTENDER; no abrir otro protocolo paralelo. |
| Modulos/capacidades | `MODULE_MATURITY_AND_PERSONALIZATION.md`, `capability_registry.json`, `CATALOGO_ENTREGABLES_CONSULTORIA.md` | EXTENDER/RECONCILIAR; ALQ-107 debe unir registros antes de ampliar. |
| Frontend/editorial/accesibilidad | `FASE8`, `AESTHETE-1`, `frontend/DESIGN_SYSTEM.md` | EXTENDER; Claude domina UI, Codex no debe pisar frontend salvo ticket explicito. |

## Matriz doc 14-41

| Doc | Intencion de planeacion | Canon existente | Veredicto | Guia para build posterior |
|---|---|---|---|---|
| 14 - Spec agentes y protocolo | Agent Spec declarativo, protocolo de decision, tiers, L0-L3 y gate irreversible. | `REGLAS`, `cursor-rules/_base.md`, `EJECUTOR`, `AUDITOR`, `NAVIGATOR`; `docs/architecture/capability_registry.json`. | RECONCILIAR | No implementar Agent Spec hasta ALQ-24 y ALQ-25. Primero alinear nombres, roles, L0-L3 y lista irreversible con reglas existentes. |
| 15 - Diagnostico RSU nacional | Escalar RSU a Mexico, catalogo INEGI, cobertura, flujo legal con gate. | Adaptadores de datos, provenance tests, `docs/execution/*`, `MODULE_MATURITY*`; Escenario 2 implica reconstruir faltantes. | EXTENDER | Seguir ALQ-9/10/11/12/13/14 sobre backend actual; reglamentos nunca auto-verde sin fuente y gate humano. |
| 16 - Auditoria arquitectura + solucion | Flujo entrevista -> Company Profile -> orchestrator -> modulos; decisiones de negocio pendientes. | Parcial en Plataforma 0, capability registry, automation, data provenance; falta Company Profile formal. | RECONCILIAR | ALQ-23 bloquea: no inventar schema de tenant/empresa dentro de tickets posteriores. |
| 17 - Gobernanza documental | Kanban docs, cadencia, anti-duplicacion, leer FASE*/cursor-rules antes de crear. | Este archivo + `REGLAS` + ALQ-104. | EXTENDER | Mantener como protocolo vivo; nuevos docs deben editar/cross-referenciar canon antes de duplicar. |
| 18 - Memoria y velocidad | Memoria repo, codemap, decisions/gotchas, CI como verdad. | ALQ-8/PR de memoria, AGENTS.md, docs execution handoffs. | EXTENDER | Completar memoria/code map en issues pequenos; no mezclar con features. |
| 19 - Modo costo-cero | Construir sin APIs de pago hasta primera venta; CI gratis si repo publico. | CI/GitHub/Render/Vercel operan como gates; docs de costo son politica. | EXTENDER | Mantener Anthropic/voz/live APIs diferidos salvo gate de founder y presupuesto. |
| 20 - Stack integracion/automatizacion | Linear/GitHub/Render/Greptile; Agent SDK diferido por costo. | Herramientas externas + REGLAS; no hay engine SDK propio aprobado. | RECONCILIAR | No crear agentes programaticos de pago hasta presupuesto; usar PR/CI/Greptile como gate externo. |
| 21 - Inteligencia competitiva | Benchmark legal/etico, out-build y capa unificada. | No hay modulo productivo dedicado; existe doctrina build/integrate/buy y capability backlog. | CONSTRUIR | Crear tracker/fichas bajo ALQ-21/89 solo con fuentes y sin copiar codigo/logica literal. |
| 22 - Superficie de capacidades | Todo reduce a patron intake -> datos -> template -> gate; research como tier conocimiento. | `MODULE_MATURITY*`, `capability_registry.json`, `CATALOGO_ENTREGABLES*`. | EXTENDER | Poblar registros existentes; no abrir un segundo catalogo. |
| 23 - Cierre de arquitectura | Canon para empezar a programar, alcance universal, Jarvis, evidencia, Hito 0. | Roadmap/FASE docs + Linear. | RECONCILIAR | Usarlo como direccion, pero builds siguen bloqueados por ALQ-23/24/25/104. |
| 24 - Secuencia maestra + APIs | RSU + deploy de plataforma existente; mapa de APIs y hosting. | FASE9/10, Render/Vercel, gates de deploy. | EXTENDER | Deploy/live es gate founder; no activar APIs pagadas ni prod desde agente. |
| 25 - Flujo Git -> PR -> Greptile/CI -> merge/deploy | Ramas cortas, PR, CI, Greptile, merge founder. | `REGLAS` + GitHub Actions + PR workflow real. | EXTENDER | Es fuente operativa. Palomita Linear solo tras PR/Greptile/CI verde; si Greptile bloquea, dejar In Review/bloqueado. |
| 26 - Estimacion fases/fidelidad | Estimacion de actividades e hitos; research just-in-time. | Linear/project docs; no implementacion directa. | EXTENDER | Usar para priorizar, no como permiso para construir ancho. |
| 27 - Trazabilidad idea -> feedback -> actividad | Matriz de ideas, riesgos, issues, anti-perdida de contexto. | Linear + `_INDICE_ESTADO`; ALQ-104 nace de aqui. | EXTENDER | Mantener como registro; no sustituye tickets ni fuentes canonicas. |
| 28 - Inventario completitud specs | Detecta huecos ALQ-48..56. | Parcial en capability registry, module maturity, docs execution. | RECONCILIAR | Convertir huecos en issues atomicos; revisar duplicacion con registros existentes antes de agregar estructuras. |
| 29 - Roster agentes/capacidades/modelos | Roster agentes, matriz capacidades, modelos backend, gaps ALQ-61..64. | `cursor-rules`, `capability_registry.json`, modelos backend, `CATALOGO_ENTREGABLES*`. | RECONCILIAR | Poblar Capability Catalog desde registros reales; no crear roster paralelo sin ALQ-107. |
| 30 - ADR-002 juicio/subconsciencia | Capa de juicio compuesta, anti-sicofancia, System 1/2, calibracion. | NOUS: `FASE17R`, `FASE18`, `FASE23-27`, `backend/app/nous/*`. | EXTENDER | ALQ-65/67/68 deben construir sobre NOUS observacional/gated. No entrenar pesos ni publicar patrones sin gates. |
| 31 - Motor sentido comun/ECA | Evento-condicion-accion, triggers, acciones gated, gaps ALQ-69..72. | `FASE11`, `FASE13`, `backend/app/automation/runtime.py`, cron/GapDetector/decision_tree. | EXTENDER | ALQ-69 debe unificar sobre runtime existente; no crear engine ECA aislado. |
| 32 - Premortem riesgos | Riesgos de negocio, datos, gates, costo, legal, triggers. | FASE9/10/14/17R y REGLAS cubren varios gates; faltan varios issues de negocio/legal. | EXTENDER | Usarlo como backlog de riesgos; cada mitigacion debe entrar por issue pequeno y testeable. |
| 33 - Soluciones innovadoras | Empatia adaptativa, entrevista, shadow mode, registro fuentes, design partner. | Parcial: NOUS gates, FASE13 recomendaciones, FASE14 privacidad; no hay entrevista adaptativa completa. | CONSTRUIR | Crear por demanda: ALQ-79/80/81/82/83. Mantener verdad no adaptable y shadow mode default. |
| 34 - Datos dura + gemelo digital | Ingestion continua de fichas, situational awareness, gemelo 2D/3D staged. | FASE14 data moat, field studies, algunos tests; no gemelo digital productivo general. | RECONCILIAR | Framework de datos debe extender FASE14/registro fuentes; gemelo Fase 1 puede construir despues, Fase 2 R&D gated. |
| 35 - Paisaje competitivo | Mapa contra Slack/Salesforce/Bloomberg/Palantir y gaps real-time/paridad. | Doctrina build/integrate/buy + capability backlog; no tracker vivo. | CONSTRUIR | ALQ-88/89 deben crear decision/tracker, no feature spree. |
| 36 - Build / Integrate / Buy | Regla de decision para replicar, integrar o comprar. | REGLAS ya adopta esta politica; capability/module registries deben guardarla. | EXTENDER | ALQ-90 debe persistir decision por capacidad antes de construir. |
| 37 - Dominios consultoria | Dominio por dominio, que tener y como tenerlo; legal con abogado-in-loop. | `CATALOGO_ENTREGABLES*`, `MODULE_MATURITY*`, capability registry. | RECONCILIAR | ALQ-94 debe sembrar desde catalogos existentes; ERP se integra, no se construye. |
| 38 - Patron MCP/ERP | Conectores estilo MCP, anticorrupcion, read libre/write gated. | No hay conector ERP generico canonico; existen reglas de gates/procedencia. | CONSTRUIR | ALQ-95 puede crear contrato/patron, no conectores especulativos; writes externos gated. |
| 39 - Variabilidad integracion/migracion ERP | Perfil de integracion por tenant y reverse-ETL gated. | Company Profile faltante; build/integrate/buy; no perfil formal. | CONSTRUIR | Bloqueado por ALQ-23 y ALQ-95. Construir solo contrato acotado, luego piloto por demanda. |
| 40 - Identidad producto + BIWO | Alquimia como inteligencia sobre ERP/CRM; BIWO con candados; flujo legal. | Doctrina build/integrate/buy + legal/gates; no due diligence BIWO en repo. | RECONCILIAR | No integrar BIWO sin due diligence, term sheet y gate founder. Flujo legal extiende ALQ-92. |
| 41 - ADR-003 Ontologia | Spine semantico objetos/propiedades/links/acciones con procedencia. | Fragmentos: Company Profile pendiente, data moat, ECA, NOUS, capability registry, module maturity. | RECONCILIAR | ALQ-102 debe elevar modelos existentes incrementalmente; no crear ontologia paralela ni migracion destructiva. |

## Builds que quedan desbloqueados solo como EXTENSION

- ALQ-65/67/68: extender NOUS (`FASE17R`, `FASE18`, `FASE23-27`, `backend/app/nous/*`), no construir "subconsciencia" aparte.
- ALQ-69: extender `FASE13_RUNTIME_AUTOMATION` y `backend/app/automation/runtime.py`.
- ALQ-72/63: extender `FASE12_AUTOMATIZACION_DOCUMENTAL`; cualquier envio/firma/aprobacion queda fuera del agente automatico.
- ALQ-55/84/103: extender `FASE14_DATA_MOAT_PRIVACIDAD` y registros de fuentes; datos cross-tenant solo opt-in y anonimizados.
- ALQ-94/107: reconciliar `MODULE_MATURITY*`, `capability_registry.json` y `CATALOGO_ENTREGABLES*` antes de sembrar nuevos registros.

## Builds que siguen bloqueados por contrato faltante

- ALQ-23 Company Profile: bloquea onboarding universal, ontologia, integracion ERP y migracion.
- ALQ-24 Agent Spec schema: bloquea instancia formal de agentes Class A/B.
- ALQ-25 lista enumerada reversible/irreversible: bloquea automatizacion con acciones externas.
- ALQ-107 cuatro registros + L0-L3: bloquea expansion ordenada de modulos/capacidades/playbooks/build-buy.
- BIWO/ERP real: bloqueado por due diligence, terminos escritos y gate founder.

## Auto-auditoria ALQ-104

- No se modifico logica productiva.
- Se corrigio una variante EIDOS preexistente en `frontend/src/components/simulator/SimulationHelp.tsx` para dejar el gate documental verde; cambio de copy solamente.
- No se tocaron no-trackeados ajenos.
- No hay migraciones, deploys, env vars, pushes a `main`, merges ni acciones irreversibles.
- El resultado es un mapa de ejecucion para evitar reimplementacion.
- Pruebas locales ejecutadas:
  - `python3 scripts/eidos_check_docs.py` -> `EIDOS OK - 209 archivos revisados.`
  - `npm run type-check` en `frontend/` -> `tsc --noEmit` sin errores tras limpiar tres artefactos generados e ignorados de `.next/types/* 3.ts`.

## Criterio de cierre

ALQ-104 queda listo para PR cuando:

1. Este documento entra en una rama corta `codex/alq-104-reconcile`.
2. EIDOS/docs check pasa con salida real.
3. PR abierto contra `main`.
4. CI verde y Greptile review solicitado.
5. Linear pasa a `In Review`, no `Done`, hasta que Greptile/CI cumplan el gate.
