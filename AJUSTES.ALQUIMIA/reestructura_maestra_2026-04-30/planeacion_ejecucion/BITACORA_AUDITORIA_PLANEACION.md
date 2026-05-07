# Bitacora Auditoria Planeacion

Fecha: 2026-04-30

## Decision de control

Se crea carpeta `planeacion_ejecucion/` para coordinar trabajo paralelo de CODEX y CODEX 2.

Regla permanente: los blueprints rectores `README_REESTRUCTURA.md` y `00_*.md` a `17_*.md` son constitucion del proyecto. No deben moverse a `archivos_ejecutados/`. Solo las ordenes operativas consumidas, como `ORDEN_CODEX.md` y `ORDEN_CODEX_2.md`, pueden moverse a `archivos_ejecutados/` cuando hayan sido ejecutadas y auditadas.

## Estado real observado

- `CONTROL_REESTRUCTURA.csv` marca todos los blueprints como listos y rectores.
- No existia `planeacion_ejecucion/`.
- El codigo actual ya contiene una implementacion parcial/reciente de Fase 10.1:
  - `backend/app/city/schemas.py`
  - `backend/app/city/repository.py`
  - `backend/app/city/router.py`
  - `backend/tests/test_fase10_1_portal_city_baseline.py`
  - `frontend/src/components/simulator/PortalEntrySelector.tsx`
  - `frontend/src/components/simulator/CityFirstSelector.tsx`
  - `frontend/src/components/simulator/CircularityBaselineCard.tsx`
  - cambios en store, tipos, API y `page.tsx`
- La implementacion 10.1 aun requiere auditoria formal de cierre: no se acepta como terminada por presencia de archivos.
- Fase 10.2 queda bloqueada hasta auditar 10.1.

## Asignacion lineal vigente

Decision posterior: se abandona ejecucion paralela por ahora. Ya habia un agente trabajando 10.1, por lo que se mantiene una sola estafeta activa: continuar y cerrar Fase 10.1. CODEX 2 / 16.2 queda en `pendiente_lineal` y no debe ejecutarse hasta que 10.1 sea entregada y auditada.

Razon: 10.1 toca `types`, `store`, `api` y `page.tsx`; es dependencia directa de 10.2 y de la entrada empresarial futura. Meter otro agente aumenta riesgo operativo y dificulta atribuir regresiones.

## Asignacion paralela original, ahora pausada

### CODEX - Fase 10.1

Razon: 10.1 es dependencia critica de navegacion modular, baseline, ciudad primero y entrada empresarial. Debe cerrarse antes de cualquier 10.2.

Riesgo: toca archivos compartidos de frontend (`types`, `store`, `api`, `page.tsx`). Por eso ningun otro agente debe tocar esos archivos en paralelo.

Verificar al regreso:

- Journey ciudad vs organizacion realmente distinto.
- Baseline visible antes de metas futuras.
- Baseline estimada no oficial con warnings.
- Cambio de ciudad invalida supuestos anteriores.
- No se copio S1-S20 dentro de tabs decorativos.

### CODEX 2 - Fase 16.2

Razon: se detecto riesgo sistemico independiente en descargas y persistencia documental. Puede ejecutarse en paralelo porque toca backend de paquetes/descarga y no depende de 10.1.

Riesgo: puede afectar exportacion existente. Debe preservar manifest, fuentes, ClaimLedger y compatibilidad de paquete, pero bloquear inputs maliciosos.

Verificar al regreso:

- `package_id` no permite traversal.
- ZIP no incluye rutas absolutas ni externas.
- Filenames peligrosos se rechazan o sanitizan.
- Endpoints de descarga no filtran rutas internas.
- No se tocaron archivos de portal 10.1.

## Dependencias bloqueadas

- 10.2 bloqueada hasta auditoria aprobada de 10.1.
- 11.0 se crea como nueva subfase de ingesta de fuentes legales oficiales y queda pendiente lineal hasta cerrar 10.1. Debe ejecutarse antes de 11.1 para que legal municipal use documentos localizados/descargados con manifest, checksum y estado de validacion, no URLs sembradas sin evidencia.
- 11.1 queda dependiente de 11.0 cuando el trabajo requiera reglamentos actuales. Sin 11.0, cualquier diagnostico legal debe permanecer en `pendiente_validacion_juridica`.
- 15.1 debe esperar seguridad 16.2 si involucra descarga profesional.
- 13.3 y 13.4 no deben iniciar hasta estabilizar entrada empresarial 10.1 y definir guard de residuos regulados.

## Decision sobre documentos de gobierno

Se decide no integrar descarga de reglamentos en 10.1 porque 10.1 gobierna entrada del portal, CityContext y baseline RSU, no legal municipal. Se crea Fase 11.0 como prerrequisito de Fase 11.1.

Reglas de 11.0:

- No existe API universal confiable para reglamentos municipales; se usaran adaptadores por fuente oficial configurada.
- Sitios municipales, periodicos oficiales estatales, Orden Juridico Nacional y portales de transparencia sirven como fuentes/localizadores segun municipio.
- Buscadores o LLMs no son fuente de verdad; a lo sumo ayudan a localizar una URL que luego debe verificarse contra dominio oficial.
- PDF descargado no equivale a reglamento vigente validado.
- Estado permitido por defecto: `localizado`, `descargado` o `pendiente_validacion_juridica`.
- Solo una validacion competente externa puede promover a `validado_externamente`.
- El checksum debe calcularse sobre bytes descargados cuando exista archivo, no solo sobre metadatos.

## Criterio de aceptacion de regreso

No aceptar cierres por "compila", "tests pasan" o cantidad de archivos. Solo aceptar prueba de solucion:

- contrato de datos;
- API o funcion observable;
- UI conectada cuando aplique;
- estados loading, empty, error y bloqueado;
- tests happy path y bloqueado;
- warnings y proveniencia;
- evidencia de seguridad/exportacion cuando aplique;
- lista clara de archivos modificados.

## Auditoria de regreso CODEX - Fase 10.1

Fecha: 2026-04-30

Dictamen: rechazado con avance. No se autoriza pasar a 10.2 ni a 11.0 hasta corregir brechas UI de cierre.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py -q`: 7 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- Backend tiene contratos para `PortalEntry`, `CityContext`, `CircularityBaseline` y `DecisionModule`.
- Baseline exige fuente, organismo, confianza, incertidumbre y warnings, y bloquea provenance oficial para baseline estimada.

Hallazgos:

- `frontend/src/app/simulator/page.tsx` renderiza secciones dependientes de metas futuras aunque `CircularityBaselineCard` este en loading, error o empty. Esto contradice el mensaje visible de que no se muestran metas futuras sin baseline y debilita el gate de 10.1.
- `frontend/src/components/simulator/PortalEntrySelector.tsx` no muestra `status`, `blocker` ni `next_action` de `DecisionModule`, aunque el contrato backend los define. Falta evidencia UI de estado bloqueado del journey.
- No hubo E2E contra frontend+backend vivos porque el backend dev server no arranco por falta de `uvicorn` en `.venv`. No se considera bloqueo de codigo 10.1, pero si evidencia pendiente para release.

Accion obligatoria:

- Devolver a CODEX con alcance minimo: gatear la pagina contra baseline loading/error/empty, mostrar estado bloqueado/next action en PortalEntrySelector y agregar prueba/evidencia de esos estados. No tocar legal, exportacion, package_store ni blueprints.

## Auditoria final CODEX - Fase 10.1

Fecha: 2026-04-30

Dictamen: aprobado con observaciones. Se autoriza avance lineal a la siguiente subfase seleccionada por direccion.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py -q`: 7 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- `frontend/src/app/simulator/page.tsx` ahora calcula `baselineValid` y muestra `BaselineGateBlocked` cuando no hay baseline valida, por loading, error o empty. En ese estado no renderiza metas futuras ni secciones dependientes.
- `frontend/src/components/simulator/PortalEntrySelector.tsx` muestra `DecisionModule.status`, `blocker` y `next_action`; los modulos `blocked` se presentan como bloqueados.
- `backend/tests/test_fase10_1_portal_city_baseline.py` valida journeys distintos, modulo bloqueado organizacional, separacion ciudad/ZM/municipio, baseline estimada no oficial, ciudad desconocida bloqueada, cambio de ciudad y contrato de fuente.

Observaciones no bloqueantes:

- No se ejecuto E2E navegador con backend vivo dentro de esta auditoria. Queda para release/17.1.
- La baseline sigue siendo estimada por contrato; para elevar confianza requiere 11.0/11.1 con fuentes municipales/operador y validacion competente.

Siguiente accion recomendada:

- Ejecutar Fase 11.0 - Ingesta de fuentes legales oficiales por municipio, antes de 11.1, para que los agentes trabajen con reglamentos localizados/descargados con manifest, checksum y estado de validacion.

## Auditoria final CODEX - Fase 10.2

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 11.0.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py -q`: 9 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- `frontend/src/components/simulator/DecisionModuleShell.tsx` existe y presenta navegacion por modulos, loading, error, empty, modulo bloqueado, decision, evidencia y siguiente accion.
- `frontend/src/app/simulator/page.tsx` dejo de renderizar S1-S20 como scroll largo primario; ahora usa `DecisionModuleShell` cuando la baseline es valida.
- `backend/app/city/repository.py` expone journeys diferenciados para `city_plan` y `organization`, con modulos listos y bloqueados.
- `backend/tests/test_fase10_1_portal_city_baseline.py` valida decision/evidence/status/next_action y cambio de audiencia sin alterar contexto/baseline.

Observaciones no bloqueantes:

- Algunos modulos aun reutilizan componentes legacy dentro del shell. Es aceptable para 10.2 porque el shell ya gobierna la experiencia primaria, pero fases futuras deberan endurecer contratos por modulo.
- No se ejecuto E2E navegador en esta auditoria. Queda para release/17.1.

Luz verde:

- Avanzar a Fase 11.0 - Ingesta de fuentes legales oficiales por municipio.
- No ejecutar 11.1 sin 11.0 si el objetivo es trabajar con reglamentos actuales.

Regla adicional solicitada:

- A partir de Fase 12 en adelante, programar auditoria recurrente de calidad e innovacion cada 15 minutos durante ventanas activas de ejecucion/auditoria. La auditoria debe revisar DoD, riesgos de producto, evidencia observable, seguridad, trazabilidad, legalidad municipal y oportunidades de mejora del sistema sin romper orden numerico.

## Automatizaciones pasivas de calidad

Fecha: 2026-05-01

Se crean automatizaciones de apoyo para mejorar codigo, texto, producto e innovacion sin comprometer roadmap.

Reglas:

- Son auditorias pasivas, no agentes ejecutores.
- No pueden editar archivos.
- No pueden cambiar estado de subfase.
- No pueden mover blueprints rectores.
- No pueden saltar orden numerico.
- Sus salidas son hallazgos, riesgos, pruebas recomendadas y propuestas minimas.

Automatizaciones creadas:

- `ALQUIMIA codigo reciente`: dias habiles 08:30, revisa cambios recientes, riesgos de calidad, rutas sin pruebas y deuda tecnica.
- `ALQUIMIA texto legal producto`: dias habiles 09:00, revisa lenguaje legal/producto, oficialidad, ciudad/municipio/ZM, RSU vs regulados y warnings.
- `ALQUIMIA innovacion y arquitectura`: viernes 16:30, revisa arquitectura, producto, economia circular, gestion publica e innovacion.
- `ALQUIMIA auditoria fase 12+`: cada 15 minutos en este hilo, condicionada a que la ejecucion este en Fase 12 o posterior.

Criterio de uso:

- Durante Fases 11.x, las automatizaciones sirven como observacion externa, pero no bloquean ni reemplazan auditoria humana de cierre.
- A partir de Fase 12, la auditoria cada 15 minutos puede producir acciones obligatorias si encuentra riesgo de DoD, seguridad, trazabilidad, legalidad municipal o degradacion de producto.

## Propuesta de ejecucion automatizada por fase

Fecha: 2026-05-01

Se propone automatizar ejecucion y auditoria sin fusionarlas como cierre automatico.

Arquitectura recomendada:

- `ALQUIMIA ejecutor fase siguiente`: toma solo la siguiente subfase pendiente en orden numerico, implementa cambios minimos, se auto-audita y se detiene. No puede avanzar a otra fase en la misma ejecucion.
- `ALQUIMIA auditor cierre fase`: revisa la fase candidata sin editar archivos y decide aprobar, aprobar con observaciones o rechazar.

Regla de cierre:

- Una fase no puede cerrarse si conserva riesgos bloqueantes, warnings no resueltos, mocks silenciosos, UI decorativa, ausencia de estados loading/empty/error/bloqueado, falta de contrato observable, falta de manifest/fuentes/ClaimLedger cuando aplique, falta de seguridad reproducible o lenguaje falso-oficial.
- La auto-auditoria del ejecutor sirve para correccion inmediata, pero no reemplaza la auditoria de cierre.
- Si una advertencia no puede resolverse, la fase queda bloqueada/devuelta con archivo, linea, causa y accion siguiente.

Estado:

- Se dejaron automatizaciones sugeridas/pausadas para evitar ejecucion autonoma no aprobada.
- Activarlas solo cuando direccion decida operar con ciclo automatizado.

## Auditoria final CODEX - Fase 11.0

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 11.1.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase11_0_legal_source_ingest.py -q`: 7 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_legal.py backend/tests/test_fase8_expansion_nacional_legal.py -q`: 214 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- `backend/app/legal/source_ingest.py` genera manifest por municipio con `retrieved_at`, URL oficial/descarga, `status_http`, `content_type`, checksum de bytes cuando hay contenido, estado de ingesta, estado de validacion, warnings, blockers y accion siguiente.
- `backend/app/legal/router.py` expone `GET/POST /legal/{municipio}/source-manifest` y rechaza `GET /legal/zm/{zm}/source-manifest` porque una ZM no puede producir fuente legal municipal unica.
- `backend/tests/test_fase11_0_legal_source_ingest.py` cubre ZM rechazada, fuente localizada no validada, checksum de bytes, descarga fallida, municipio sin documento y base64 invalido.

Observaciones no bloqueantes:

- 11.0 no realiza descarga HTTP externa; registra/localiza/ingesta manifest con bytes provistos. Esto es aceptable para cierre de contrato/proveniencia inicial, pero una fase futura podria agregar adaptadores HTTP/Playwright por fuente oficial.
- 11.0 no valida vigencia juridica. Correcto: todo queda `pendiente_validacion_juridica` salvo validacion competente externa.

Luz verde:

- Avanzar a Fase 11.1 - Legal municipal por municipio, usando 11.0 como fuente de manifest/proveniencia y manteniendo bloqueos si falta validacion juridica.

## Regla transversal de modelo tecnico-financiero-economico

Fecha: 2026-05-01

Se incorpora regla de seriedad para todas las fases pendientes despues de 11.1, especialmente Fases 12 a 15.

Principio: ALQUIMIA es simulador y planeador, pero su motor es un modelo tecnico-financiero-economico. No se aceptan numeros, graficas o escenarios como caja negra.

Requisitos:

- Toda grafica debe tener texto de ayuda que explique que estamos diciendo, como leerlo, supuestos, limites y que no debe inferirse.
- Todo output cuantitativo debe poder responder: que se calcula, como se calcula, por que se calcula asi, cuando aplica, para quien aplica, fuente, unidad, incertidumbre y limite de uso.
- Toda salida exportable con calculos debe incluir anexo tabular minimo:
  - nombre del calculo;
  - calculo que se hizo o formula;
  - fuente de los datos;
  - explicacion o razon del calculo.
- No se acepta KPI, ROI, TIR, VPN, payback, CO2e, CAPEX/OPEX, tonelaje, empleo, ahorro, impacto fiscal o escenario sin trazabilidad.
- Beneficio publico, flujo privado, externalidades, ahorro municipal e ingresos de negocio deben permanecer separados.

Impacto en roadmap:

- Fases 12.1, 12.2, 12.3, 13.1 y 13.2 deben explicar calculos y graficas cuando existan.
- Fases 14.1, 14.2 y 14.3 deben implementar anexos de calculo como criterio de cierre.
- Fase 15.1 debe exportar anexos de calculo y textos de ayuda junto con manifest, fuentes y ClaimLedger.

## Auditoria final CODEX - Fases 11.1 y 11.2

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 12.1.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase11_2_normative_proposals.py -q`: 8 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_legal.py backend/tests/test_fase11_0_legal_source_ingest.py backend/tests/test_fase11_2_normative_proposals.py -q`: 224 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- `backend/app/legal/schemas.py` agrega contratos de tecnica reglamentaria: `RegulatoryStructureNode`, `LegalValidationGate`, `NormativeInsertionProposal`, `MunicipalLegalInsertionMap`.
- `backend/app/legal/regulatory_structure.py` genera mapas de insercion municipal expositivos con Bis/Ter/Quater, lineamiento tecnico, anexo tecnico y transitorio.
- `backend/app/legal/router.py` expone `/legal/{municipio}/insertion-map` y rechaza `/legal/zm/{zm}/insertion-map`.
- Pruebas cubren municipio con fuente, municipio sin fuente, ZM bloqueada, Bis/Ter con validacion juridica, lineamiento tecnico no sustituto, transitorios no permanentes y ausencia de lenguaje de dictamen/oficialidad.

Observaciones no bloqueantes:

- La estructura reglamentaria sigue siendo aproximada/expositiva y requiere cotejo contra texto completo por jurista.
- Ninguna propuesta queda lista para uso oficial; todas conservan compuerta de validacion juridica competente.

Luz verde:

- Avanzar a Fase 12.1 - Educacion ciudadana y calculadora domestica.
- Desde 12.1 aplica la regla transversal: toda grafica o resultado cuantitativo requiere texto de ayuda y calculos anexables.

## Auditoria final CODEX - Fase 12.1

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 12.2.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py -q`: 11 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase10_1_portal_city_baseline.py -q`: 20 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- `POST /education/domestic-calculator` es observable y esta registrado en `backend/app/main.py`.
- `backend/app/education/domestic.py` calcula generacion domestica con formula, fuente, unidad, confianza, warnings y anexo de calculos.
- `frontend/src/components/simulator/EducacionCiudadana.tsx` muestra estados loading, empty, error, blocked, warning y resultado; incluye texto de ayuda y anexo de calculos.
- `frontend/src/app/simulator/page.tsx` integra `EducacionCiudadana` dentro del modulo `citizen_inputs`, antes de metas futuras.
- Revision de lenguaje: no hay uso operativo de multa/sancion/infraccion/castigo en el modulo educativo.

Observaciones no bloqueantes:

- La fuente por defecto es referencia nacional SEMARNAT DBGIR con warning; debera reemplazarse por medicion municipal cuando exista.
- El anexo de calculos existe en UI, pero la exportacion formal del anexo queda para Fase 15.1.

Luz verde:

- Avanzar a Fase 12.2 - Implementacion espacio-tiempo.
- Mantener regla transversal: cualquier timeline, grafica o resultado cuantitativo debe incluir texto de ayuda y calculo anexable.

## Auditoria CODEX - Fase 12.2

Fecha: 2026-05-01

Dictamen: rechazado con avance. No se autoriza avance a Fase 12.3 hasta corregir el contrato bloqueado UI/API.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_2_implementacion_espacio_tiempo.py -q`: 9 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase10_1_portal_city_baseline.py -q`: 29 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- Revision de lenguaje en `backend/app/implementation`, UI 12.2 y test 12.2: las palabras prohibidas solo aparecen dentro del test que las bloquea.
- El test 12.2 cubre que `rsu_total_ton_day=0` bloquea sin zonas a nivel de motor/contrato.
- `POST /implementation/territorial-plan` con `municipios=[]` produce `422`, aunque la UI ofrece probar estado bloqueado por falta de municipios.

Hallazgo bloqueante:

- `frontend/src/components/simulator/ImplementacionEspacioTiempo.tsx` activa `blockedDemo` enviando `municipios: []`, pero `backend/app/implementation/schemas.py` rechaza ese payload con validacion Pydantic antes de que `backend/app/implementation/territorial.py` pueda devolver `TerritorialImplementationPlan(status=blocked)`. Resultado: la UI muestra error generico, no estado bloqueado verificable.

Accion obligatoria:

- Alinear contrato y UI. Opcion preferida: permitir `municipios=[]` en el schema y devolver `status=blocked` con blocker/next_action; alternativa aceptable: cambiar el demo/UI para probar un bloqueo que el backend si modele como contrato, por ejemplo RSU total cero con municipio valido. Debe agregarse test API para este caso y prueba frontend/contrato.

## Re-auditoria CODEX - Fase 12.2

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 12.3.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_2_implementacion_espacio_tiempo.py -q`: 10 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase10_1_portal_city_baseline.py -q`: 30 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- Smoke API `POST /implementation/territorial-plan` con `municipios=[]`: 200, `status=blocked`, 0 zonas, blocker explicito y `next_action`.
- `backend/app/implementation/schemas.py` ya no bloquea municipios vacios como 422.
- `backend/app/implementation/territorial.py` convierte municipios vacios en bloqueo de dominio observable.
- Revision de lenguaje: las menciones a multas/sanciones/infracciones/documento oficial solo aparecen en el test que las prohíbe, no en el modulo operativo.

Observaciones no bloqueantes:

- Las colonias piloto siguen siendo propuestas no oficiales; debe conservarse esta advertencia en cualquier exportacion futura.
- La fuente territorial base es modelo ALQUIMIA de confianza media; debe poder reemplazarse por evidencia municipal en fases posteriores.

Luz verde:

- Avanzar a Fase 12.3, sin tocar legal, exportacion, ClaimLedger ni blueprints.
- Mantener como criterio duro: todo resultado cuantitativo o grafico requiere texto de ayuda y anexo de calculo con formula, fuente, unidad y razon.

## Auditoria CODEX - Fase 12.3

Fecha: 2026-05-01

Dictamen: rechazado con avance. No se autoriza avance a Fase 12.4 hasta corregir validacion de evidencia operativa.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_3_operacion_per_bitacora.py -q`: 8 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase10_1_portal_city_baseline.py -q`: 38 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- Smoke API caso feliz `POST /operations/per-plan`: 200, `status=ready`, 1 ruta, 1 evento, calculo mensual.
- Revision de lenguaje en archivos 12.3: menciones prohibidas solo aparecen en el test que las vigila.

Hallazgo bloqueante:

- `POST /operations/per-plan` acepta un evento con `evidencia=[{evidence_id:"", evidence_type:"", description:"", captured_at:"", captured_by:"", source:""}]` y responde `200 ready`. La bitacora conserva una lista de evidencia, pero no garantiza evidencia util, trazable ni auditable.

Accion obligatoria:

- Validar campos obligatorios de `OperationEvidence` como no vacios, ya sea con `Field(..., min_length=1)`/normalizacion o con blockers de dominio en `_event_blockers`.
- Agregar test donde evidencia con campos vacios no cierre `ready`; debe devolver `status=blocked` con blocker explicito o 422 deliberado y documentado. Preferencia de ALQUIMIA: bloqueo de dominio `200 blocked` cuando sea un dato faltante operativo.
- Repetir pruebas 12.3, regresion 10.1/12.1/12.2/12.3 y type-check antes de pedir nueva auditoria.

## Re-auditoria CODEX - Fase 12.3

Fecha: 2026-05-01

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 12.4.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_3_operacion_per_bitacora.py -q`: 9 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase10_1_portal_city_baseline.py -q`: 39 passed.
- `node node_modules/typescript/bin/tsc --noEmit` desde `frontend`: sin errores.
- Smoke API caso feliz `POST /operations/per-plan`: 200, `status=ready`, 1 ruta, 1 evento, sin blockers.
- Smoke API con evidencia hueca: 200, `status=blocked`, 0 rutas, 0 eventos, blockers por `evidence_id`, `evidence_type`, `description`, `captured_at`, `captured_by` y `source`.
- Revision de lenguaje en archivos 12.3: menciones prohibidas solo aparecen en el test que las vigila.

Observaciones no bloqueantes:

- La bitacora PER sigue siendo propuesta/planeacion operativa; no debe exportarse como documento oficial ni sustituir validacion del operador.
- La fuente PER es estimada ALQUIMIA; futuras fases deben permitir fuente operativa municipal con mayor confianza.

Luz verde:

- Avanzar a Fase 12.4 - Advertencias educativas y sanciones con gate legal.
- 12.4 debe separar advertencia educativa, inspeccion, sancion propuesta, debido proceso, validacion legal municipal y documento oficial. Municipio sin legal validado bloquea sancion, pero permite educacion.

## Diagnóstico de arranque local — Ejecutor

Fecha: 2026-05-02

### Causa raíz del fallo de arranque

Docker bloqueado/no disponible. El entorno nativo tampoco levantaba porque el `.venv` del backend estaba incompleto: solo tenía `fastapi`, `pydantic` y `pydantic-settings` instalados. Faltaban `uvicorn`, `pytest`, `httpx`, `python-multipart`, `python-dotenv`, `sqlalchemy`, `alembic`, `python-jose`, `passlib`, `python-docx`, `openpyxl` y `reportlab`.

Nota adicional: `psycopg2-binary==2.9.9` no tiene wheel precompilado para Python 3.14.0. Se omitió sin impacto porque `app.main` no importa psycopg2 directamente; la conexión a Postgres solo se activa si el `DATABASE_URL` apunta a PostgreSQL.

### Dependencias instaladas

```
uvicorn[standard]==0.30.1
python-multipart==0.0.9
httpx==0.27.0
python-dotenv==1.0.1
pytest==8.2.2
pytest-asyncio==0.23.7
sqlalchemy==2.0.30
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-docx>=1.1.0
openpyxl>=3.1.2
reportlab>=4.1.0
```

### Resolución del frontend

`npm` no estaba en el PATH del entorno de ejecución del agente. Se usó el Node.js interno de Cursor (`/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node` v22.22.0) para correr directamente `node_modules/.bin/next dev`.

### Evidencia de arranque nativo

- `GET http://localhost:8000/health` → `{"status":"ok","service":"alquimia-api"}`
- `GET http://localhost:3000/` → HTTP 200
- `POST http://localhost:8000/operations/legal-gated-action` (educational_warning, slp) → `{"status":"ready","educational_warning":{"creates_fine":false,...}}`
- `backend/.venv/bin/python -m pytest test_fase10_1 + test_fase12_1 + test_fase12_2 + test_fase12_3 + test_fase12_4 -q` → **50 passed, 0 failed**
- `tsc --noEmit` desde frontend → **sin errores**

### Script de arranque creado

`dev.sh` en la raíz del proyecto. Levanta backend (SQLite local, puerto 8000) y frontend (Next.js, puerto 3000) con un solo comando: `./dev.sh`

### Advertencias no bloqueantes

- `Watchpack Error: EMFILE: too many open files` en el frontend: el watcher de hot-reload no puede monitorear todos los archivos por el límite de file descriptors de macOS. La UI sirve y compila correctamente; solo afecta la detección automática de cambios. Solución cuando aplique: `ulimit -n 10240` antes de correr el frontend.
- `DeprecationWarning: asyncio.iscoroutinefunction deprecated` en pytest-asyncio: de Python 3.14; no bloquea tests.

### Estado

Status Ejecutor: TERMINADO — App corriendo nativamente, healthcheck OK, 50 tests pasados, tsc sin errores.

## Ejecutor - Fase 12.4 (en progreso)

- Objetivo actual: crear contrato backend de `EducationalWarning` y pruebas API para gate legal 12.4.
- Alcance inmediato: implementar `LegalGatedAction` para advertencia educativa, inspeccion, propuesta sancion y documento definitivo bloqueado; cubrir casos en `test_fase12_4_advertencias_sanciones_gate_legal.py`.
- Estado inicial: sin cambios implementados en esta sesion.
- Avance: contratos `legal_gate_schemas.py` y motor `legal_gate.py` ya modelan advertencia, inspeccion, propuesta y documento definitivo bloqueado; endpoint `/operations/legal-gated-action` expuesto en `router.py`.
- Pruebas ejecutadas: `backend/.venv/bin/python -m pytest backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py -q` → 10 passed.

### Correccion minima 12.4 (este hilo)

- Status Ejecutor: TERMINADO.
- Cambios:
  - Test adicional `test_debido_proceso_requiere_base_legal_y_bloquea_sin_validacion` en `backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py`.
  - UI `AdvertenciasGateLegal.tsx`: boton de `due_process`, checkbox para legal validado externamente, payload ajustado para probar sancion propuesta lista, y panel visible de `DueProcessGate` en estados `ready` y `blocked`.
- Evidencia de pruebas:
  - `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py -q` → 50 passed.
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke API `/operations/legal-gated-action`: educational_warning → 200 ready; proposed_sanction sin legal validado → 200 blocked; proposed_sanction con `legal_validation_status=validado_externamente` → 200 ready.

## Auditoria final CODEX - Fase 13.1

Fecha: 2026-05-02

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 13.2.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest test_fase10_1 + test_fase12_1 + test_fase12_2 + test_fase12_3 + test_fase12_4 + test_fase13_1 -q`: **58 passed, 0 failed**.
- `tsc --noEmit` desde frontend: sin errores.
- Smoke API via TestClient (puerto 8000 ocupado por proceso anterior del sandbox):
  - `POST /infrastructure/plan` (slp, P=1, capturable=5.0) → `status: ready | brecha: 0.0 | formula: capturable - capacidad_instalada | centros: 1`
  - `POST /infrastructure/plan` (municipio_id="") → `status: blocked | blockers: ['Falta municipio_id para planear centros de acopio.']`
  - `POST /infrastructure/plan` (sobredimensionado: capturable=3.0, P=2+M=1=25t/d) → `status: warning | warnings: ['Capacidad instalada excede flujo capturable: sobredimensionado.']`
- `backend/app/infrastructure/` existe con `__init__.py`, `schemas.py`, `plan.py`, `router.py`.
- `CalculoBrechaPlan` incluye `formula`, `fuente_capturable`, `fuente_capacidad`, `unidad`, `explicacion`, `incertidumbre` — todos no vacíos.
- Todos los centros generados tienen `estado='propuesto'`, `municipio_id` y `zona_id` presentes.
- `CentrosAcopio.tsx` conectado al backend con estados loading/empty/error/blocked/warning/ready; panel de brecha con fórmula, fuente, unidad y texto de ayuda; TIR etiquetada como "estimada del centro, no de la estrategia".
- `CA_CONFIG` preservado como semilla visual — no fue roto.

Observaciones no bloqueantes:

- `recicladoras_destino` se inicializa como `["recicladora_propuesta"]` (placeholder). Fases futuras deben reemplazarlo con recicladoras reales por zona/material.
- La distribución `_MATERIAL_DISTRIBUTION` es estimación nacional; debe poder sobreescribirse por municipio cuando haya datos locales.
- El smoke test del servidor live no pudo ejecutarse directamente porque el sandbox mantiene el proceso de uvicorn original del arranque previo (sin posibilidad de kill). La evidencia via TestClient es equivalente y suficiente para auditoría de contrato.

Luz verde:

- Avanzar a Fase 13.2 - Macrogeneradores municipales.

## Ejecutor - Fase 13.1 (en progreso)

- Objetivo actual: infraestructura y centros de acopio con plan observable y estados.
- Cambios backend:
  - Nuevo módulo `backend/app/infrastructure/` con contratos (`schemas.py`), motor (`plan.py`) y router `/infrastructure/plan`; registrado en `backend/app/main.py`.
  - Plan calcula brecha `capturable - capacidad_instalada`, capacidad por material estimada CA_CONFIG, warnings por brecha o sobredimensionamiento y bloqueos por municipio/mix/zona faltantes.
- Cambios frontend:
  - Tipos y API `getInfrastructurePlan` añadidos.
  - `CentrosAcopio.tsx` ahora consume `/infrastructure/plan`, muestra estados loading/empty/error/blocked/warning/ready, panel de brecha con fórmula/fuente/unidad, warnings, centros propuestos y ayuda; mantiene CA_CONFIG como semilla y etiqueta TIR como estimada del centro.
- Pruebas ejecutadas:
  - `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py backend/tests/test_fase13_1_infraestructura_centros_acopio.py -q` → 58 passed (warnings por deprecación asyncio en plugin).
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke API `/infrastructure/plan`: payload válido (municipio=slp, mix P=1, capturable=5) → 200 ready; payload con municipio vacío → 200 blocked. CA_CONFIG se conserva como semilla visual.

## Planner — Exportación estática y backlog ampliado (2026-05-02 PM)

- Se generó export estático con `output: 'export'` en `frontend/next.config.js` (images `unoptimized: true`). Carpeta resultante en la raíz: `audit_visual_maqueta/` (copia de `frontend/out`). No toca backend; dev server debe seguir funcionando, pero la optimización de imágenes queda desactivada.
- Lagunas detectadas (edad de piedra visual):
  - `CentrosAcopio.tsx`: sin resumen ejecutivo ni banda de KPIs, estados planos (loading texto, empty sin CTA, error genérico), sin diagrama RSU→capacidad→brecha→impacto, tabla densa de fases sin jerarquía, TIR presentada como dato fijo sin advertir que es semilla CA_CONFIG.
  - `AdvertenciasGateLegal.tsx`: estados sin badges de oficialidad (propuesta/definitivo), colores neutros, copy genérico (“Selecciona una acción...”), falta énfasis en alcance municipal y acción siguiente.
  - `app/simulator/page.tsx`: scroll largo de módulos; S13.1 no tiene ancla ni narrativa de gate municipal; falta plegar detalle operativo para evitar saturación.
- Nuevas fases creadas y añadidas al README rector:
  - `18_estandar_estetico_y_narrativo_elite.md` (ley visual vigente).
  - `19_refactorizacion_estetica_causal.md` (UI/UX causal de Centros de Acopio).
  - `20_ajuste_narrativo_institucional.md` (copy de consultoría y oficialidad en simulador).
- Orden para Ejecutor/Auditor tras cerrar la tarea actual:
  1. Aplicar 19_refactorizacion_estetica_causal.md sobre S13.1 respetando checklist del estándar 18.
  2. Aplicar 20_ajuste_narrativo_institucional.md para alinear lenguaje y estados (incluye AdvertenciasGateLegal y ancla S13.1 en page.tsx).
  3. Verificar que los cambios sigan funcionando en `audit_visual_maqueta/` (export estático) y en dev.

## Planner — Evolución Estratégica (2026-05-02 noche)

- Validación de estado: bitácora confirma 50 tests backend + `tsc --noEmit` previos ok; entorno “Bare Metal” reparado con `dev.sh` y dependencias instaladas (uvicorn, pytest, httpx, etc.).
- Export estática ya generada en `audit_visual_maqueta/` para análisis visual sin tocar dev; mantener config `output: 'export'` solo para auditoría, permitiendo revertir a SSR si se requiere.
- Nuevas subfases y blueprints insertados sin interrumpir al Ejecutor:
  - `13_1_b_refinamiento_narrativo_y_visual.md`: refina S13.1 con diagrama causal, banda de KPIs, estados con carácter y copy de autoridad.
  - `17_1_publicacion_y_control_de_acceso.md`: despliegue Vercel (frontend) + Railway/Supabase (backend/DB/Auth), DNS `.mx/.gob.mx`, Supabase Auth, landing de acceso de consultoría.
  - `18_estetica_causal_dinamica.md`: obligación de diagramas/causalidad y estados diferenciados.
  - `19_narrativa_institucional_elite.md`: léxico de consultoría, badges de oficialidad, ayudas con fuente/unidad/incertidumbre.
- Órdenes embebidas para próxima cola (Ejecutor/Auditor):
  1. Al terminar la tarea activa, ejecutar 13.1.b (UI causal y narrativa) respetando estándares 18/19.
  2. Aplicar blueprints 18 y 19 en todas las piezas de S13.1 y legales visibles.
  3. Planificar 17.1 (Auth + despliegue + landing de acceso) sin bloquear trabajo actual; preparar .env.example y flujo DNS/Vercel/Railway/Supabase.
- Criterio: Auditor debe rechazar entregas que no muestren diagrama de causalidad, badges de oficialidad o estados diferenciados; Ejecutor debe mantener compatibilidad con `audit_visual_maqueta/` y dev.

## Planner — Reserva de cola posterior a 20

- Para no romper orden cuando Ejecutor/Auditor alcancen 20, se agrega `21_pulido_final_release.md` como buffer de QA/Release controlado (auth + dominios + estándares 18/19). Se activará solo tras aprobar 20.

## Planner — Fase 17 (Despliegue, Auth y Control de Acceso) — 2026-05-02

- Estado actual: no hay evidencia de despliegue en Vercel/Railway/Supabase ni de dominio configurado. Solo existe export estática en `audit_visual_maqueta/`.
- Órdenes quirúrgicas (no interrumpir ejecuciones vigentes, dejar en cola):
  1. DNS/dominio: reservar dominio oficial (.mx o .gob.mx). Apuntar raíz/CNAME a Vercel; subdominio `api.` a Railway/Supabase con TLS.
  2. Vercel (frontend): configurar proyecto con envs `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Mantener export solo para auditorías; producción con SSR/híbrido según necesidad.
  3. Railway/Supabase (backend/DB): provisionar Postgres (Supabase o Railway). Env: `DATABASE_URL`, `ALQUIMIA_SECRET_KEY`, `SUPABASE_JWT_SECRET`.
  4. Supabase Auth: habilitar login/registro institucional; frontend con guardas en `/simulator`, `/ca-studio`, `/hub`; backend con middleware JWT Supabase. Tabla `access_logs` (user_id, email, ip_hash, ua, path, verb, at, payload_hash) para auditoría.
  5. UX de acceso: landing “carta de presentación” con badges de oficialidad, CTA dual (demo guiada / acceso institucional), aviso de registro de actividad.
  6. .env.example y pipeline: documentar vars para Vercel/Railway/Supabase; CI `tsc --noEmit` + `pytest` antes de deploy; health checks en Vercel/Railway.
- Instrucción al Auditor: no firmar 17.x sin dominio/DNS configurado, Supabase Auth operativo y bitácora de actividad persistente.

## Ejecutor - Fase 13.2 (en progreso)

- Objetivo actual: macrogeneradores municipales con variables por tipo, cálculo visible y advertencias de residuos regulados.
- Cambios backend:
  - `macros/schemas.py` extendido con `VariablesEspecificasTipo`, `CalculoVolumenMacro` y campos nuevos en `MacroGenerator` (variables, cálculo, residuos regulados, exclusión RSU domiciliario, temporalidad) más `generators` en `MacroImpactSummary`.
  - Nuevo `macros/estimator.py` con factores benchmark por tipo y validación de variables requeridas.
  - `macros/impact.py` aplica estimación, marca temporales, ajusta días/año por eventos, añade advertencias de residuos regulados y devuelve generadores con cálculo.
- Cambios frontend:
  - Tipos actualizados para macrogeneradores y cálculo.
  - `Macrogeneradores.tsx` muestra estados de bloqueo por municipio, impact panel con cálculos, badges temporal/permanente, “no suma RSU domiciliario”, panel de cálculo (fórmula, fuente, unidad, rango) y advertencias de residuos regulados o variables faltantes.
- Pruebas ejecutadas:
  - `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py backend/tests/test_fase13_1_infraestructura_centros_acopio.py backend/tests/test_fase13_2_macrogeneradores_municipales.py -q` → 65 passed (warnings deprecación pytest_asyncio).
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke API `/macros/impact`: hotel con variables → 200 ready, calculo_volumen presente; evento_masivo es_temporal=True; hospital con regulados devuelve advertencia de proveedor autorizado.

## Ejecutor - Fase 13.3 (en progreso)

- Objetivo actual: portal empresarial/institucional con `OrganizationalCircularityAssessment`, separación RSU/no-RSU, plan de contenedores y acciones 30/60/90 por tipo.
- Alcance inmediato: crear módulo `backend/app/organizations`, pruebas dedicadas 13.3, componente `PortalEmpresarial.tsx` con estados Blueprint 18 e integración en `page.tsx`.
- Status Ejecutor: TERMINADO.
- Cambios backend:
  - Nuevo módulo `backend/app/organizations/` con `schemas.py`, `assessment.py`, `router.py` e inclusión en `backend/app/main.py`.
  - Contrato incluye flujos RSU/no-RSU, plan de contenedores, acciones 30/60/90, cálculo de generación con fórmula/fuente/unidad/rango y warnings/blockers/next_action.
  - Motor bloquea municipio vacío; detecta no-RSU en hospital/empresa/industria con advertencia y proveedor autorizado.
- Cambios frontend:
  - `PortalEmpresarial.tsx` creado con H1 ejecutivo, badge de oficialidad, banda causal, selector de actividad, variables mínimas por tipo y estados loading/empty/error/blocked/warning/ready.
  - Integración en `frontend/src/app/simulator/page.tsx` bajo `infrastructure_operations`, después de `AdvertenciasGateLegal`.
  - Tipos y API agregados para `OrganizationalCircularity`*.
- Evidencia de pruebas:
  - `backend/.venv/bin/python -m pytest backend/tests/test_fase10_1_portal_city_baseline.py backend/tests/test_fase12_1_educacion_ciudadana.py backend/tests/test_fase12_2_implementacion_espacio_tiempo.py backend/tests/test_fase12_3_operacion_per_bitacora.py backend/tests/test_fase12_4_advertencias_sanciones_gate_legal.py backend/tests/test_fase13_1_infraestructura_centros_acopio.py backend/tests/test_fase13_2_macrogeneradores_municipales.py backend/tests/test_fase13_3_portal_empresarial.py -q` → 72 passed.
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke API `/organizations/assessment`:
    - hotel/slp → 200 ready, `container_plan`=3, `acciones_30_60_90`=3.
    - hospital con regulados → 200 warning, advertencia no vacía y `proveedor_ambiental_requerido=True`.
    - municipio vacío → 200 blocked.

## Ejecutor - Fase 13.4 (en progreso)

- Objetivo actual: modelar flujos de residuos municipales y diagnóstico de cierre de ciclo con brecha y oportunidades.
- Status Ejecutor: TERMINADO.
- Cambios backend:
  - Nuevo módulo `backend/app/waste_flows/` con `schemas.py`, `engine.py`, `router.py`, `__init__.py`.
  - Endpoint `POST /waste-flows/diagnosis` registrado en `backend/app/main.py`.
  - Reglas implementadas: bloqueos por municipio/generación inválida; warning por municipio sin recuperación activa; cálculo de flujos por corriente; brecha con fórmula/fuente SEMARNAT y oportunidad económica; acciones prioritarias por composición.
- Cambios frontend:
  - Nuevo componente `FlujosResiduos.tsx` con Blueprint 18: H1 ejecutivo, banda causal, loading skeleton, empty con CTA, error con reintento, blocked/warning/ready, KPIs, tabla de flujos, panel de trazabilidad de cálculo y acciones prioritarias.
  - Tipos agregados en `frontend/src/types/index.ts`.
  - API `diagnosisWasteFlows` agregada en `frontend/src/lib/api.ts`.
  - Integración en `frontend/src/app/simulator/page.tsx` dentro de `infrastructure_operations`.
- Evidencia de pruebas:
  - `cd backend && .venv/bin/python -m pytest tests/test_fase13_4_flujos_residuos.py -v` → 7 passed.
  - Regresión acumulada (10.1 + 12.1-12.4 + 13.1 + 13.2 + 13.3 + 13.4): 79 passed, 0 failed.
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke `/waste-flows/diagnosis`:
    - municipio vacío → 200 blocked.
    - mix no recuperable + recuperación 0% → 200 warning.
    - mix recuperable con composta → 200 ready.

## Ejecutor - Fase 13.5 (en progreso)

- Objetivo actual: generar hoja de ruta ejecutiva municipal 30/60/90 con prioridades y trazabilidad de diagnóstico.
- Status Ejecutor: TERMINADO.
- Cambios backend:
  - Nuevo módulo `backend/app/roadmap/` con `schemas.py`, `builder.py`, `router.py`, `__init__.py`.
  - Endpoint `POST /roadmap/generate` registrado en `backend/app/main.py`.
  - Reglas implementadas: bloqueos por municipio/generación; mínimo 6 acciones (2 por horizonte); priorización por brecha, orgánico crítico, residuos regulados, tasa baja, macrogeneradores y estado legal; resumen ejecutivo + KPIs meta 90 días.
- Cambios frontend:
  - Nuevo componente `HojaRuta.tsx` con Blueprint 18: H1 ejecutivo, banda causal, skeleton loading, empty con CTA, timeline 30/60/90, badges por prioridad, resumen ejecutivo y chips KPI 90 días.
  - Tipos de roadmap agregados en `frontend/src/types/index.ts`.
  - API `generateRoadmap` agregada en `frontend/src/lib/api.ts`.
  - Integración en `frontend/src/app/simulator/page.tsx`.
- Evidencia de pruebas:
  - `cd backend && .venv/bin/python -m pytest tests/test_fase13_5_roadmap_ejecutivo.py -v` → 8 passed.
  - `cd backend && .venv/bin/python -m pytest -q` → 605 passed (suite completa del repo, sin fallas).
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke `/roadmap/generate`:
    - caso feliz con brecha + regulados → 200 ready, 7 acciones.
    - caso blocked (municipio vacío) → 200 blocked.
    - caso warning (tasa 0 + sin corrientes críticas) → 200 warning.

## Ejecutor - Fase 13.6 (en progreso)

- Objetivo actual: exportación y reporte ejecutivo PDF/Excel modelado (sin binario real) con trazabilidad por sección.
- Status Ejecutor: TERMINADO.
- Cambios backend:
  - `backend/app/export/schemas.py` ampliado con `ExportFormat`, `ExportSection`, `ExportRequest`, `SeccionExportada`, `ExportResponse`.
  - Nuevo `backend/app/export/generator.py` con `build_export_report(req)` y reglas de bloqueo/metadata/secciones.
  - Nuevo `backend/app/export/router.py` con `POST /export/report`.
  - `backend/app/main.py` actualizado para registrar `export_router`.
- Cambios frontend:
  - Nuevo `frontend/src/components/simulator/ExportadorReporte.tsx` con Blueprint 18: H1 ejecutivo, banda causal, skeleton, empty con CTA, formulario de secciones/formato/toggles y previsualización por sección.
  - Tipos añadidos en `frontend/src/types/index.ts`: `SeccionExportada`, `ExportResponse`.
  - API añadida en `frontend/src/lib/api.ts`: `exportReport(payload)`.
  - Integración en `frontend/src/app/simulator/page.tsx`.
- Evidencia de pruebas:
  - `cd backend && .venv/bin/python -m pytest tests/test_fase13_6_exportacion_reporte.py -v` → 7 passed.
  - `cd backend && .venv/bin/python -m pytest -q` → 612 passed (suite completa, sin fallas).
  - `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → sin errores.
  - Smoke `/export/report`:
    - caso feliz PDF con 5 secciones → 200 ready, 5 secciones.
    - municipio vacío → 200 blocked.
    - secciones vacías → 200 blocked.

## Auditoria final CODEX - Fase 13.2

Fecha: 2026-05-02

Dictamen: aprobado con observaciones. Se autoriza avance numerico a Fase 13.3.

Evidencia verificada:

- `backend/.venv/bin/python -m pytest` regresión acumulada Fases 10.1 + 12.1–12.4 + 13.1 + 13.2: **65 passed, 0 failed**.
- `tsc --noEmit` desde frontend: sin errores.
- `estimator.py` cubre hotel, estadio, hospital, universidad, plaza_comercial, club_deportivo, evento_masivo, parque_industrial con factores benchmark propios y `check_required_variables`.
- Anti-doble-conteo: `excluir_del_conteo_domiciliario=True` invariable; `razon` declara "no suma RSU domiciliario".
- Temporalidad: `evento_masivo` → `es_temporal=True`, `dias_operacion_anio=24` (2 eventos/mes × 12).
- Regulados: hospital con `tiene_residuos_regulados=True` → `residuos_regulados_detectados=['biologico_infeccioso']`; advertencia contiene "proveedor autorizado"; sin "RSU ordinario" ni "reciclable".
- `benchmark_sectorial` con `confianza >= 0.9` + `status=verificado` → `ValueError` (contrato existente intacto).
- Smoke endpoint: hotel `calculo_volumen.formula` visible; evento_masivo `es_temporal=True`; hospital advertencia OK.
- Blueprint 18 — correcciones aplicadas: skeleton animado en loading, EmptyState con CTA "Agregar primer generador", banda de causalidad (5 nodos: Generador → Estimación por tipo → Impacto incremental → Logística / rutas → Mercado / recicladoras).

Observaciones no bloqueantes:

- Los factores benchmark por tipo son estimados nacionales (`fuente_factor="benchmark_sectorial ALQUIMIA"`); confianza máxima `0.65`. Fases futuras deben permitir fuente municipal con mayor confianza.
- `showForm` se inicializa en `true`: el formulario de creación abre por defecto. Revisar si esto es la UX deseada en producción.

Luz verde:

- Avanzar a Fase 13.3 - Portal empresarial e institucional.
- Desde 13.3 aplica Blueprint 18 como criterio duro de auditoría: skeleton en loading, EmptyState con CTA, diagrama de causalidad cuando aplique, H1 ejecutivo con alcance y badge de oficialidad.

## Planner — Veredicto estratégico Fase 13.1 (2026-05-02)

Diagnóstico cabrón:

- UI plana y decorativa: tablas densas sin resumen ejecutivo, tipografía uniforme sin jerarquía, tarjetas P/M/G sin storytelling de riesgo/impacto, ayudas diluidas.
- Causalidad oculta: no hay flujo visual RSU → capacidad instalada → brecha → costo/impacto → decisión.
- Lenguaje suena a mock: título genérico sin alcance ni oficialidad; TIR mostrada como dato fijo aunque es semilla CA_CONFIG estimada.
- Estados sin carácter: loading es texto plano; empty/error/blocked se sienten iguales y no guían la siguiente acción.

Reglas impuestas:

- Entra en vigor `18_estandar_estetico_y_narrativo_elite.md` como ley visual/narrativa para Fase 13+. La auditoría rechazará entregas sin jerarquía clara, trazabilidad visible (fórmula, unidad, fuente, incertidumbre) y advertencia de oficialidad.
- Prohibido marcar “listo” un módulo que oculte la causalidad o presente KPIs sin help text ejecutivo.

Órdenes quirúrgicas para el Ejecutor (aplicar ya en 13.1):

- `frontend/src/components/simulator/CentrosAcopio.tsx`
  - Encabezado ejecutivo: renombrar a “Plan de infraestructura con trazabilidad municipal” + badge “Simulación propuesta”. Bajo el título, banda de 3 KPIs con icono y ayuda (brecha t/día, cobertura de capacidad %, CAPEX/OPEX estimados MXN).
  - Estados con carácter: skeleton lineal para tablas/cards; empty con CTA “Configura mix P/M/G”; error en rojo con botón “Reintentar cálculo”; blocked en ámbar con icono y `next_action` destacado.
  - Causalidad visual: diagrama compacto RSU capturable → capacidad instalada → brecha → centros propuestos → CAPEX/OPEX → impacto (m², empleos). Texto máximo 2 líneas.
  - Tarjetas P/M/G: chip “propuesto/instalado”, icono de capacidad, microcopy aclarando que TIR es estimada del centro (no de la estrategia). Botones +/− con tooltip de costo marginal.
  - Panel de brecha: mover fórmula/fuente/unidad/incertidumbre a bloque “Trazabilidad del cálculo” con icono; brecha positiva en ámbar, negativa en verde.
  - Fases/KPIs: convertir tabla plana en líneas compactas con badges de fase y cobertura; agregar tooltip “Fuente: CA_CONFIG ALQUIMIA (confianza media)”.
- `frontend/src/app/simulator/page.tsx`
  - Introducir S13.1 como “Infraestructura con gate municipal” con ancla visual al diagrama de causalidad; plegar detalle de KPIs de fases en acordeón “Detalle operativo” para evitar scroll largo.
- `frontend/src/components/simulator/AdvertenciasGateLegal.tsx`
  - Copy para oficialidad: chips “propuesta/definitivo” y colores semánticos alineados al estándar 18; mantener iconografía warning/lock/info coherente.

Siguiente paso de auditoría:

- El Auditor validará contra el estándar 18: si falta diagrama de causalidad, advertencia de oficialidad o jerarquía de estados, la fase 13.1 será rechazada aunque las pruebas pasen.

## Auditoría Auditor — Fase 13.3 Portal Empresarial e Institucional (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura de módulo:**

- `backend/app/organizations/__init__.py`, `schemas.py`, `assessment.py`, `router.py` — todos presentes.
- `backend/tests/test_fase13_3_portal_empresarial.py` — 7 tests presentes.
- `frontend/src/components/simulator/PortalEmpresarial.tsx` — componente presente.
- `backend/app/main.py` — router registrado en `/organizations` con tag `organizations`.

**Regresión acumulada:**

- `pytest` Fases 10.1 + 12.1–12.4 + 13.1–13.3: **72 passed, 0 failed**.
- `tsc --noEmit`: sin errores.

**Contratos de negocio verificados (smoke directo):**

- Hotel SLP → `status=ready`, `container_plan=3`, `acciones_30_60_90=3`, fórmula visible: `habitaciones * ocupacion_pct * 1.8kg + e…`.
- Hospital con `tiene_residuos_regulados=True` → `status=warning`, `residuos_no_rsu_detectados=['residuo_regulado_no_rsu']`, `proveedor_ambiental_requerido=True`, advertencia contiene "proveedor a…".
- `municipio_id=""` → `status=blocked`, blocker "municipio_id es obligatorio para evaluación organizacional."

**Blueprint 18 (PortalEmpresarial.tsx):**

- `font-serif` + `propuesta` en H1 ejecutivo ✅.
- Banda de causalidad con `→` y `Fragment` ✅.
- `animate-pulse` skeleton en loading ✅.
- `EmptyState` con CTA "Selecciona tipo de organización para comenzar" + botón ✅.
- Banner `proveedor_ambiental_requerido` condicional ✅.
- `waste_streams` separa RSU / no-RSU con `es_rsu` ✅.
- `container_plan` y `acciones_30_60_90` renderizados ✅.

### Observaciones no bloqueantes

- La fórmula de hotel incluye empleados (`+ e…`); validar en fase futura que el factor por empleado esté documentado con fuente explícita.
- `EmptyState` invita a seleccionar tipo pero no hay CTA de formulario explícita (igual que en `Macrogeneradores`). Evaluar UX en revisión de usabilidad (Fase 17).

### Luz verde

**Avanzar a Fase 13.4** — Flujos de Residuos y Diagnóstico de Cierre de Ciclo.

- Blueprint 18 sigue siendo criterio duro: skeleton, EmptyState con CTA, causalidad, H1 ejecutivo con badge de oficialidad en todos los módulos de Fase 13+.

## Auditoría Auditor — Fase 13.4 Flujos de Residuos y Diagnóstico de Cierre de Ciclo (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura de módulo:**

- `backend/app/waste_flows/__init__.py`, `schemas.py`, `engine.py`, `router.py` — todos presentes.
- `backend/tests/test_fase13_4_flujos_residuos.py` — presente.
- `frontend/src/components/simulator/FlujosResiduos.tsx` — presente.
- `backend/app/main.py` — router `/waste-flows` registrado.
- `frontend/src/app/simulator/page.tsx` — `<FlujosResiduos />` integrado.
- `frontend/src/lib/api.ts` — función `diagnosisWasteFlows` apuntando a `/waste-flows/diagnosis`.

**Regresión acumulada:**

- `pytest` Fases 10.1 + 12.1–12.4 + 13.1–13.4: **79 passed, 0 failed**.
- `tsc --noEmit`: sin errores.

**Contratos de negocio verificados (smoke directo):**

- Mix `organico=0.5, papel=0.3, otro=0.2`, 10 t/día → `status=ready`, organico=5.0 t/día `es_recuperable=True`, papel=3.0 t/día.
- `tasa_circularidad_actual=5.0%`, `tasa_potencial=80.0%`.
- Brecha: fórmula `"(ton_recuperables_perdidas × 365 días × $800/ton)"`, fuente `"SEMARNAT 2023 precio mercado secundario promedio"`.
- Acciones: 3 strings específicos al mix (composta, papel/cartón, trazabilidad de rutas).
- `municipio_id=""` → `status=blocked`, blocker descriptivo.
- `generacion_total=0` → `status=blocked`, blocker descriptivo.

**Blueprint 18 (FlujosResiduos.tsx):**

- `font-serif` + `propuesta` en H1 ✅.
- Banda causalidad con `→` ✅.
- `animate-pulse` skeleton en loading ✅.
- EmptyState con CTA "Configura generación total y mix de corrientes para ver el diagnóstico" ✅.
- 3 KPI chips: Tasa actual %, Tasa potencial %, Oportunidad MXN/año ✅.
- Panel "Trazabilidad del cálculo" con fórmula y fuente ✅.

### Observaciones no bloqueantes

- `tasa_potencial=80%` cuando mix tiene 80% recuperable es correcto matemáticamente; documentar que asume recuperación al 100% del potencial (optimista); fases futuras deben agregar factor de eficiencia real.
- Acciones prioritarias son correctas pero genéricas para municipio pequeño; permitir personalización en futuras fases.

### Luz verde

**Avanzar a Fase 13.5** — Acciones 30/60/90 y Hoja de Ruta Ejecutiva Municipal.

## Auditoría Auditor — Fase 13.5 Hoja de Ruta Ejecutiva Municipal (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura de módulo:**

- `backend/app/roadmap/__init__.py`, `schemas.py`, `builder.py`, `router.py` — todos presentes.
- `backend/tests/test_fase13_5_roadmap_ejecutivo.py` — presente.
- `frontend/src/components/simulator/HojaRuta.tsx` — presente.
- `backend/app/main.py` — router `/roadmap` registrado.
- `frontend/src/app/simulator/page.tsx` — `<HojaRuta />` integrado en línea 174.
- `frontend/src/lib/api.ts` — función apuntando a `/roadmap/generate`.

**Regresión acumulada:**

- `pytest` Fases 10.1 + 12.1–12.4 + 13.1–13.5: **87 passed, 0 failed**.
- `tsc --noEmit`: sin errores.

**Contratos de negocio verificados (smoke directo):**

- Caso complejo (brecha=8t, regulados, macrogeneradores, gate_activo, corrientes orgánico+plástico): `status=ready`, 7 acciones, 2 críticas, distribución 30d=3 / 60d=2 / 90d=2.
- KPIs meta: 3 entradas (`tasa_circularidad`, `brecha_cubierta`, `trazabilidad_operativa`).
- `resumen_ejecutivo`: 319 chars, comienza "El municipio slp presenta una tasa actual de circularidad de 5.0%...".
- `municipio_id=""` → `status=blocked`, blocker descriptivo.
- `generacion_ton_dia=0` → `status=blocked`, blocker descriptivo.

**Blueprint 18 (HojaRuta.tsx):**

- `font-serif` + `propuesta` en H1 ✅.
- Banda causalidad con `→` ✅.
- `animate-pulse` skeleton en loading ✅.
- EmptyState con CTA "Completa los diagnósticos anteriores para generar la hoja de ruta" ✅.
- `resumen_ejecutivo` en `font-serif` ✅.
- `kpi_meta_90_dias` renderizado dinámico ✅.

### Observaciones no bloqueantes

- 3 KPIs meta en lugar de los 2 mínimos requeridos: correcto, excede el mínimo.
- `estado_legal` en el formulario muestra el valor crudo ("sancion_propuesta"); considerar labels legibles en UX final.

### Luz verde

**Avanzar a Fase 13.6** — Exportación y Reporte Ejecutivo PDF/Excel.

## Auditoría Auditor — Fase 13.6 Exportación y Reporte Ejecutivo (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura de módulo:**

- `backend/app/export/__init__.py`, `schemas.py`, `generator.py`, `router.py` — presentes.
- Renderers adicionales: `pdf_renderer.py`, `spreadsheet_renderer.py`, `document_renderer.py`, `package_renderer.py` — el Ejecutor extendió el módulo sin romper contratos.
- `backend/tests/test_fase13_6_exportacion_reporte.py` — presente.
- `frontend/src/components/simulator/ExportadorReporte.tsx` — presente.
- `backend/app/main.py` — router `/export` registrado.
- `frontend/src/app/simulator/page.tsx` — `<ExportadorReporte />` integrado bajo `case 'scenarios_export'`.
- `frontend/src/lib/api.ts` — función `exportReport` apuntando a `/export/report`.

**Regresión acumulada:**

- `pytest` Fases 10.1 + 12.1–12.4 + 13.1–13.6: **94 passed, 0 failed**.
- `tsc --noEmit`: sin errores.

**Contratos de negocio verificados (smoke directo):**

- 5 secciones PDF: `status=ready`, 5 SeccionExportada, titulos legibles, 2 datos_clave cada una, trazabilidad presente.
- `metadata`: `fecha_generacion`, `version`, `total_secciones` — los 3 requeridos.
- `municipio_id=""` → `status=blocked`, blocker descriptivo.
- `secciones=[]` → `status=blocked`, "Selecciona al menos una sección para exportar".

**Blueprint 18 (ExportadorReporte.tsx):**

- `font-serif` + badge `propuesta` en H1 ✅.
- Banda causalidad con `→` ✅.
- `animate-pulse` skeleton en loading ✅.
- EmptyState con CTA "Selecciona al menos una sección para previsualizar el reporte" ✅.
- Trazabilidad renderizada con prefijo ƒ en fondo diferenciado ✅.
- Metadata footer (fecha, versión, total) ✅.

### Observaciones no bloqueantes

- Los renderers adicionales (pdf_renderer, spreadsheet_renderer, etc.) no tienen tests propios; documentar en Fase 14+ cuando se implemente generación binaria real.
- `ExportadorReporte` está montado bajo `case 'scenarios_export'`, no como sección visible por defecto; verificar navegación en auditoría UX (Fase 17).

### Luz verde

**Avanzar a Fase 13.7** — Dashboard de Indicadores y KPIs Municipales.

## Auditoría Auditor — Fase 13.7 Dashboard de Indicadores y KPIs Municipales (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura de módulo:**

- `backend/app/dashboard/__init__.py`, `schemas.py`, `aggregator.py`, `router.py` — todos presentes.
- `backend/tests/test_fase13_7_dashboard_kpis.py` — presente.
- `frontend/src/components/simulator/DashboardKPIs.tsx` — presente.
- `backend/app/main.py` — router `/dashboard` registrado.
- `frontend/src/app/simulator/page.tsx` — `<DashboardKPIs />` integrado.
- `frontend/src/lib/api.ts` — función apuntando a `/dashboard/summary`.

**Regresión acumulada:**

- `pytest` Fases 10.1 + 12.1–12.4 + 13.1–13.7: **102 passed, 0 failed**.
- `tsc --noEmit`: sin errores.

**Contratos de negocio verificados (smoke directo):**

- Score óptimo (tasa=20, brecha=0, gate_activo, centros=3): `status=ready`, score=100, 5 KPIs, claves correctas, todos con formula+fuente.
- Brecha crítica (brecha=8): alerta "Brecha crítica: requiere centros de acopio urgentes" presente; tasa=3% → tendencia=deterioro.
- `municipio_id=""` → `status=blocked`.

**Blueprint 18 (DashboardKPIs.tsx):**

- `font-serif` + badge `propuesta` en H1 ✅.
- Banda causalidad con `→` ✅.
- `animate-pulse` skeleton en loading ✅.
- EmptyState con CTA "Ingresa los datos del municipio para calcular el dashboard" ✅.
- Score card `font-serif text-[48px]` con color semántico por rango ✅.
- Badge de tendencia: mejora/estable/deterioro con color diferenciado ✅.

### Observaciones no bloqueantes

- Score=100 cuando todas las condiciones óptimas son True: correcto matemáticamente; considerar escalar a 0-100 continuo en Fase futura para mayor granularidad.
- `estado_legal` muestra valor crudo en select: igual que 13.5/13.6, pendiente para revisión UX Fase 17.

### Luz verde

**Avanzar a Fase 13.8** — Comparador de Escenarios Municipales.

## Auditoría Auditor — Fase 13.8 Comparador de Escenarios Municipales (2026-05-02)

### Dictamen: ✅ AUTORIZADO

### Evidencia verificada

**Estructura:** `backend/app/scenarios/` completo, test y componente presentes, router registrado en `main.py`, `<ComparadorEscenarios />` integrado en `page.tsx`, `compareScenarios` en `api.ts`.

**Regresión acumulada:** 110 passed, 0 failed. `tsc --noEmit`: sin errores.

**Contratos verificados (smoke):**

- Base(score=20) vs Optimizado(score=100) → ganador="Optimizado", es_ganador=True, delta_score=80.0.
- Escenario con tasa=0 → advertencia "Escenario 'SinRecuperacion' sin recuperación activa".
- 1 escenario → blocked "Se requieren al menos 2 escenarios para comparar".
- 6 escenarios → blocked "Máximo 5 escenarios permitidos".

**Blueprint 18:** H1 serif+propuesta, causalidad→, skeleton, EmptyState CTA, fila ganadora bg-[#EAF8E3] + badge verde, resumen_comparativo en font-serif ✅.

### Luz verde — Avanzar a Fase 13.9: Alertas y Notificaciones Inteligentes.

## Auditoría Auditor — Fase 13.9 Alertas y Notificaciones Inteligentes (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Estructura:** `backend/app/alerts/` completo, test y componente presentes, router `/alerts` registrado, `<AlertasPanel />` integrado en `page.tsx`, `evaluateAlerts` en `api.ts`.

**Regresión acumulada:** 118 passed, 0 failed. `tsc --noEmit`: sin errores.

**Contratos verificados (smoke):**

- Municipio crítico (tasa=0, brecha=8, regulados, sanción, 3 macrogen sin padrón, score=20): 7 alertas, 4 críticas, todos los tipos correctos, resumen contextualizado.
- Municipio limpio (tasa=20, brecha=0, score=90): 1 alerta nivel=info.
- `municipio_id=""` → blocked con blocker descriptivo.

**Blueprint 18:** H1 serif+propuesta, causalidad→, skeleton, EmptyState CTA, banner rojo/verde por total_criticas, iconos por nivel (🔴🟠🟡ℹ️), accion_sugerida en cursiva con prefijo →, contadores por nivel ✅.

### Luz verde — Avanzar a Fase 13.10: Cierre de Fase 13 y Validación Integral.

## Auditoría Auditor — Fase 13.10 Cierre de Fase 13 y Validación Integral (2026-05-02)

### Dictamen: ✅ FASE 13 CERRADA

### Evidencia de cierre

**Suite total:** 636 passed, 0 failed, 0 errors.

**Routers registrados en main.py (9 de Fase 13 + anteriores):**

- /infrastructure, /organizations, /waste-flows, /roadmap, /export, /dashboard, /scenarios, /alerts — todos presentes con prefijo y tag correctos.

**Componentes integrados en page.tsx (9 de Fase 13):**

- AdvertenciasGateLegal (12.4), CentrosAcopio (13.1), Macrogeneradores (13.2), PortalEmpresarial (13.3), FlujosResiduos (13.4), HojaRuta (13.5), ExportadorReporte (13.6), DashboardKPIs (13.7), ComparadorEscenarios (13.8), AlertasPanel (13.9) — todos importados y renderizados.

**tsc --noEmit:** sin errores.

**Smoke cruzado (5 módulos representativos):**

- infraestructura: 200 warning ✅
- portal_empresarial: 200 ready ✅
- alertas: 200 ready ✅
- dashboard: 200 ready ✅
- comparador: 200 ready ✅

**Nota de auditoría:** El smoke del Ejecutor en 13.10 usó un payload incorrecto para /infrastructure/plan (campo mix_pct inexistente vs mix_centros real). No es un bug del módulo — el contrato correcto requiere zona_ids, rsu_capturable_ton_dia, horizonte_años, mix_centros. El Auditor corrigió el payload y confirmó 200. No impacta tests ni producción.

### FASE 13 CERRADA — Lista para Fase 14.

## Auditoría Auditor — Fase 14 Hardening, Seguridad y Preparación para Demo (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Tests:** 5 nuevos de hardening passing. Regresión total: 641 passed, 0 failed.

**Middlewares en main.py:**

- `RateLimitMiddleware`: clase implementada, `add_middleware(RateLimitMiddleware)` registrado en línea 98.
- Headers de seguridad: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Cache-Control: no-store` — aplicados en líneas 104-107.

**Validadores Pydantic:**

- `alerts/schemas.py`: `tasa_circularidad_pct Field(ge=0,le=100)`, `brecha Field(ge=0)`, `score Field(ge=0,le=100)`, `num_macrogeneradores Field(ge=0)` ✅
- `dashboard/schemas.py`: `generacion_ton_dia Field(ge=0)`, `tasa Field(ge=0,le=100)`, `brecha Field(ge=0)` ✅
- `scenarios/schemas.py`: `generacion_ton_dia Field(gt=0)`, `tasa Field(ge=0,le=100)`, `brecha Field(ge=0)` ✅

**tsc --noEmit:** sin errores.

### Luz verde — Avanzar a Fase 15: Auditoría de Código Muerto y Limpieza.

## Auditoría Auditor — Fase 15 Auditoría de Código Muerto y Limpieza (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Regresión:** 641 passed, 0 failed. `tsc --noEmit`: sin errores.

**Imports sin uso:** eliminados en `package_renderer.py` (uuid, datetime, timezone), `document_renderer.py` (qn, OxmlElement), `pdf_renderer.py` (TA_LEFT). Sin impacto en tests.

`**.gitignore` raíz:** creado con `__pycache__/`, `*.pyc`, `*.pyo`, `.DS_Store`. 117 artefactos .pyc desindicizados.

**Rutas "duplicadas":** las 4 rutas reportadas (`/admin/users`, `/legal/{municipio}/source-manifest`, `/macros/generators`, `/operations/routes`) son pares GET+POST sobre el mismo path — REST válido. Verificador exacto (mismo método + mismo path) reporta **0 duplicados reales**.

**Inconsistencias de nomenclatura documentadas (no bloqueantes):**

- `waste_flows/schemas.py`: mezcla `pct` vs `porcentaje`_ y modelos en inglés/español.
- `roadmap/schemas.py`: acrónimos técnicos (`kpi`, `status`) — aceptables.
- `export/schemas.py`: mezcla Fase 4 (inglés) con Fase 13.6 (español) — deuda heredada, pendiente unificación en Fase 17.

### Luz verde — Avanzar a Fase 16: Lanzamiento de App en Producción.

## Auditoría Auditor — Fase 16 Lanzamiento de App en Producción (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Regresión:** 641 passed, 0 failed. `tsc --noEmit`: sin errores.

**Health check:** GET /health → 200 `{"status":"ok","version":"1.0.0","environment":"development"}` ✅

**.env.example:** backend y frontend presentes con variables documentadas ✅

**Dockerfile (5 puntos):**

1. `FROM python:3.12-slim` ✅
2. `COPY requirements.txt` + `RUN pip install` antes de `COPY . .` ✅
3. `EXPOSE 8000` ✅
4. `CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]` ✅
5. Sin copia de .venv ✅

**docker-compose.yml (4 puntos):**

1. Health check en backend: `urlopen('http://localhost:8000/health')` ✅
2. `NEXT_PUBLIC_API_URL=http://backend:8000` en frontend ✅
3. Puertos 3000 y 8000 expuestos al host ✅
4. Servicio postgres:16-alpine con volumen persistente `pgdata` ✅

### Luz verde — Avanzar a Fase 17: Auditoría UX y Usabilidad.

## Auditoría Auditor — Fase 17 Auditoría UX y Usabilidad (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Regresión:** 641 passed, 0 failed. `tsc --noEmit`: sin errores.

**Selectores estado_legal (4 componentes):**

- HojaRuta, DashboardKPIs, ComparadorEscenarios, AlertasPanel — todos muestran "Sin gate activo" / "Gate activo" / "Sanción propuesta" con values internos correctos ✅

**Microcopy de oficialidad (ExportadorReporte.tsx línea 155):**
"Esta previsualización es una simulación propuesta. La generación de archivos PDF/Excel oficiales estará disponible en la próxima versión." ✅

**Tipografía/espaciado:** todos los componentes de Fase 13 tienen separación de secciones con mb-6/mb-8, space-y-4 o p-5 (equivalentes). PortalEmpresarial usa space-y-4 + p-5 en lugar de mb-6 — patrón válido, no es deuda. ✅

### FASE 17 CERRADA — Proyecto ALQUIMIA SLP completamente auditado y autorizado.

## Auditoría Auditor — Fase 18 Narrativa Institucional Élite y Estética Causal (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Regresión:** 641 passed, 0 failed. `tsc --noEmit`: sin errores.

**Checklist CentrosAcopio (7/7):**

- H1 "Plan de infraestructura con trazabilidad municipal · simulación propuesta" ✅
- Banda 3 KPIs: Brecha capturable, Cobertura de capacidad, CAPEX/OPEX estimados ✅
- Causalidad 6 nodos: RSU capturable → ... → Impacto m²/empleos ✅
- Chip semántico por estado de centro (operando=verde, propuesto=ámbar) ✅
- "Trazabilidad del cálculo" como título de bloque ✅
- Tooltip "CA_CONFIG ALQUIMIA · confianza media" en KPIs por fase ✅
- Badge "Simulación propuesta" en advertencia final ✅

**Checklist AdvertenciasGateLegal (2/2):**

- H1 con badge "simulación propuesta" ✅
- 4 chips semánticos: Educativo·no sanción (azul), Inspección·registro (gris), Sanción propuesta·no oficial (ámbar), Documento definitivo·gate bloqueado (rojo) ✅

**Copy transversal (9/9 componentes):**

- 0 instancias de "Cargando...", ">Error<", ">Resultados<", ">Sin datos<" en todos los componentes Fase 13 ✅

### Luz verde — Avanzar a Fase 19.

## Auditoría Auditor — Fase 19 Publicación y Control de Acceso (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Estructura:** `backend/app/access/__init__.py`, `schemas.py`, `middleware.py` presentes. Test presente.

**Regresión:** 646 passed, 0 failed. `tsc --noEmit`: sin errores.

**Contratos verificados (smoke):**

- sin header → 403 ✅
- rol publico → 403 ✅
- rol tecnico → 200 ready ✅
- rol admin → 200 ready ✅

**Implementación:** `get_access_context` + `verify_rol` importados en `export/router.py`; HTTP 403 con mensaje descriptivo. Frontend captura 403 y muestra "Acceso restringido · se requiere rol técnico o superior". ✅

### Luz verde — Avanzar a Fase 20.

## Auditoría Auditor — Fase 20 Gobernanza, Calidad y Riesgo (2026-05-02)

### Dictamen: ✅ AUTORIZADO

**Estructura:** `backend/app/governance/` completo, test y componente presentes. Router `/governance` registrado. `<GovernancePanel />` integrado. `evaluateGovernance` en `api.ts`.

**Regresión:** 653 passed, 0 failed. `tsc --noEmit`: sin errores.

**Contratos verificados (smoke):**

- Score máximo (todos flags True, tests=646, cobertura=9): score=100, status=aprobado, 4 métricas, 3 riesgos todos mitigados, 6 DoD items. ✅
- Score parcial (tests=500, varios flags False): score=30, status=bloqueado. ✅
- municipio_id="" → bloqueado con blocker. ✅

**Blueprint 18:** H1 serif + badge "interno", causalidad 4 nodos, skeleton, EmptyState CTA, score 48px con color semántico, chips de riesgos y ✅/❌ en DoD. ✅

### Luz verde — Avanzar a Fase 21.

## Auditoría Auditor — Fase 21 Checklist de Lanzamiento Reproducible (2026-05-03)

### Dictamen: ✅ AUTORIZADO — CICLO COMPLETO CERRADO

**Estructura:** `backend/app/launch/` completo, test presente, `LaunchChecklist.tsx` presente. Router `/launch` registrado. Componente integrado en `page.tsx`. `getLaunchChecklist` en `api.ts`.

**Regresión:** 659 passed, 0 failed. `tsc --noEmit`: sin errores.

**Smoke del checklist — 8/8 items OK:**

- [ok] tests            · Calidad
- [ok] rate_limit       · Seguridad
- [ok] security_headers · Seguridad
- [ok] health_endpoint  · Infraestructura
- [ok] access_control   · Seguridad
- [ok] env_example      · Configuración
- [ok] dockerfile       · Infraestructura
- [ok] gitignore        · Configuración

**score_lanzamiento: 100.0/100 · status: listo · version: 21.0**

Resumen: "Score de lanzamiento: 100.0/100. 8 items ok, 0 advertencias, 0 fallos."

**Blueprint 18:** H1 serif + badge "interno", causalidad 4 nodos, skeleton, `useEffect` auto-carga, score 48px con color, tabla por categoría, botón "Volver a verificar". ✅

---

## CIERRE DEFINITIVO DEL PROYECTO ALQUIMIA SLP (2026-05-03)

### Estado final del sistema

**Suite de tests:** 659 passed, 0 failed.
**TypeScript:** tsc --noEmit limpio.
**Score de lanzamiento:** 100/100 — todos los ítems de infraestructura, seguridad, calidad y configuración en verde.

### Módulos de backend activos (Fases 12–21)


| Prefijo         | Módulo                          | Fase      |
| --------------- | ------------------------------- | --------- |
| /education      | educacion ciudadana             | 12.1      |
| /implementation | implementacion espacio-tiempo   | 12.2      |
| /operations     | operacion PER bitácora          | 12.3      |
| /legal          | gate legal municipal            | 12.4      |
| /infrastructure | centros de acopio               | 13.1      |
| /macros         | macrogeneradores                | 13.2      |
| /organizations  | portal empresarial              | 13.3      |
| /waste-flows    | flujos de residuos              | 13.4      |
| /roadmap        | hoja de ruta 30/60/90           | 13.5      |
| /export         | exportación reportes (con auth) | 13.6 + 19 |
| /dashboard      | KPIs municipales                | 13.7      |
| /scenarios      | comparador escenarios           | 13.8      |
| /alerts         | alertas inteligentes            | 13.9      |
| /governance     | gobernanza y calidad            | 20        |
| /launch         | checklist de lanzamiento        | 21        |
| /health         | healthcheck                     | 16        |


### Componentes de frontend activos (Fase 13–21)

AdvertenciasGateLegal, CentrosAcopio, Macrogeneradores, PortalEmpresarial, FlujosResiduos, HojaRuta, ExportadorReporte, DashboardKPIs, ComparadorEscenarios, AlertasPanel, GovernancePanel, LaunchChecklist.

### Garantías de calidad entregadas

- Blueprint 18 (estética causal) aplicado en todos los módulos Fase 13+.
- Narrativa institucional élite (Blueprints 19+20) aplicada en Fase 18.
- Rate limiting + headers de seguridad (Fase 14).
- Validadores Pydantic ge/le/gt en todos los schemas críticos (Fase 14).
- Control de acceso por rol en /export/report (Fase 19).
- Docker + health check + .env.example listos para producción (Fase 16).
- .gitignore limpio, sin código muerto (Fase 15).

**PROYECTO ALQUIMIA SLP — FASES 12.1 A 21 — CERRADO Y AUDITADO.**

## Ejecutor - Fase 13.7 Dashboard de Indicadores y KPIs Municipales (2026-05-02)

### Status Ejecutor: TERMINADO

### Objetivo ejecutado

- Implementar módulo backend `dashboard` con agregación de score/KPIs, endpoint `POST /dashboard/summary`, pruebas dedicadas y componente frontend Blueprint 18 para visualización ejecutiva municipal.

### Cambios backend

- Se creó `backend/app/dashboard/__init__.py`.
- Se creó `backend/app/dashboard/schemas.py` con `TendenciaSentido`, `KPIIndicador`, `ResumenEjecutivoDashboard`, `DashboardRequest`, `DashboardResponse` (Pydantic v2).
- Se creó `backend/app/dashboard/aggregator.py` con `build_dashboard(req)` y reglas:
  - bloqueo por `municipio_id` vacío;
  - bloqueo por `generacion_ton_dia <= 0`;
  - score 0-100 con fórmula `base(20)+circularidad(30)+infraestructura(20)+legal(20)+centros(10)`;
  - mínimo 5 KPIs (`tasa_circularidad`, `brecha_infraestructura`, `cobertura_macrogeneradores`, `score_circularidad`, `eficiencia_legal`);
  - alerta de brecha crítica cuando `brecha_infraestructura_ton_dia > 5`;
  - advertencia por tasa 0 (`Sin recuperación activa... Fase 13.4`).
- Se creó `backend/app/dashboard/router.py` con `POST /summary`.
- Se registró router en `backend/app/main.py` con `app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])`.

### Cambios tests

- Se creó `backend/tests/test_fase13_7_dashboard_kpis.py` con 8 pruebas:
  - `test_municipio_vacio_blocked`
  - `test_generacion_cero_blocked`
  - `test_minimo_5_kpis_generados`
  - `test_score_circularidad_rango_0_100`
  - `test_score_con_todo_optimo`
  - `test_alerta_brecha_critica`
  - `test_kpi_tiene_formula_fuente`
  - `test_endpoint_200_caso_feliz`

### Cambios frontend (Blueprint 18)

- Se creó `frontend/src/components/simulator/DashboardKPIs.tsx`:
  - H1 con badge `propuesta` en `font-serif`.
  - banda causal de 4 nodos.
  - `animate-pulse` para estado loading.
  - EmptyState con CTA: "Ingresa los datos del municipio para calcular el dashboard".
  - formulario compacto de inputs requeridos.
  - score card con color semántico (`>=70` verde, `40-69` ámbar, `<40` rojo).
  - chips de resumen ejecutivo.
  - grid responsive de KPIs con badge de tendencia, barra de progreso, fórmula y alerta.
  - banner ámbar para advertencias.
- Se actualizaron tipos en `frontend/src/types/index.ts` (`KPIIndicador`, `ResumenEjecutivoDashboard`, `DashboardResponse`).
- Se agregó `getDashboardSummary` en `frontend/src/lib/api.ts`.
- Se integró `<DashboardKPIs />` en `frontend/src/app/simulator/page.tsx`.

### Evidencia de verificación

- `cd backend && .venv/bin/python -m pytest tests/test_fase13_7_dashboard_kpis.py -v` → **8 passed**.
- `cd backend && .venv/bin/python -m pytest -q` → **620 passed** (>= 102 requerido).
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

### Smoke dashboard (3 escenarios)

- **Score óptimo** (`tasa=20`, `brecha=0`, `gate_activo`, `centros=3`): `200`, `status=ready`, `score=100.0`.
- **Alerta brecha crítica** (`brecha=8.0`): `200`, `status=ready`, KPI `brecha_infraestructura.alerta` presente.
- **Blocked** (`municipio_id=""`): `200`, `status=blocked`, `score=0.0`.

## Ejecutor - Fase 13.8 Comparador de Escenarios Municipales (2026-05-02)

### Status Ejecutor: TERMINADO

### Objetivo ejecutado

- Implementar comparador municipal multi-escenario (2 a 5 escenarios), cálculo de score por escenario, ganador con desempate estable, deltas vs base y visualización ejecutiva Blueprint 18.

### Cambios backend

- Se creó `backend/app/scenarios/__init__.py`.
- Se creó `backend/app/scenarios/schemas.py` con:
  - `EscenarioInput`
  - `EscenarioResultado`
  - `ComparadorRequest`
  - `ComparadorResponse`
- Se creó `backend/app/scenarios/comparator.py` con `compare_scenarios(req)` y reglas:
  - `municipio_id` vacío → `blocked`;
  - `<2` escenarios → `blocked` con "Se requieren al menos 2 escenarios para comparar";
  - `>5` escenarios → `blocked` con "Máximo 5 escenarios permitidos";
  - score por escenario reutilizando lógica 13.7: `20 +30(tasa>=10) +20(brecha==0) +20(gate_activo) +10(centros>0)`;
  - `es_ganador=True` al mayor score (empate favorece primer escenario);
  - `diferencia_vs_base` respecto al primer escenario (`score`, `tasa`, `brecha`);
  - advertencia por tasa 0: `Escenario '{nombre}' sin recuperación activa`.
- Se creó `backend/app/scenarios/router.py` con `POST /compare`.
- Se registró router en `backend/app/main.py`:
  - `from app.scenarios.router import router as scenarios_router`
  - `app.include_router(scenarios_router, prefix="/scenarios", tags=["scenarios"])`.

### Cambios tests

- Se creó `backend/tests/test_fase13_8_comparador_escenarios.py` con 8 pruebas:
  - `test_municipio_vacio_blocked`
  - `test_menos_de_2_escenarios_blocked`
  - `test_mas_de_5_escenarios_blocked`
  - `test_ganador_es_el_de_mayor_score`
  - `test_diferencia_vs_base_calculada`
  - `test_resumen_comparativo_no_vacio`
  - `test_advertencia_si_tasa_cero`
  - `test_endpoint_200_caso_feliz`

### Cambios frontend (Blueprint 18)

- Se reemplazó `frontend/src/components/simulator/ComparadorEscenarios.tsx` por la versión 13.8:
  - H1 `font-serif` con badge `propuesta`.
  - Banda causal de 4 nodos con flechas `→`.
  - Loading con `animate-pulse`.
  - EmptyState con CTA: "Agrega al menos 2 escenarios para iniciar la comparación".
  - Panel de escenarios con botón "Agregar escenario" (máx 5), filas inline con inputs y eliminación condicionada.
  - Tabla comparativa con columnas requeridas y resaltado verde + badge "Ganador".
  - Bloque de `resumen_comparativo` con fondo `#FAF8F4` y tipografía serif.
  - Banner ámbar para advertencias.
- Se actualizaron tipos en `frontend/src/types/index.ts`:
  - `EscenarioResultado`
  - `ComparadorResponse`
- Se agregó `compareScenarios` en `frontend/src/lib/api.ts` apuntando a `/scenarios/compare`.
- Integración en `frontend/src/app/simulator/page.tsx`: se conserva `<ComparadorEscenarios />` dentro de `scenarios_export`.

### Evidencia de verificación

- `cd backend && .venv/bin/python -m pytest tests/test_fase13_8_comparador_escenarios.py -v` → **8 passed**.
- `cd backend && .venv/bin/python -m pytest -q` → **628 passed** (>= 110 requerido).
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

### Smoke comparador (3 escenarios)

- **Ganador correcto** (`Base` vs `Optimo`): `200`, `status=ready`, `escenario_ganador=Optimo`.
- **Blocked <2** (1 escenario): `200`, `status=blocked`, blocker de mínimo 2 escenarios presente.
- **Advertencia tasa=0** (escenario `CeroRecuperacion`): `200`, `status=ready`, `advertencias` incluye nombre del escenario.

## Ejecutor - Fase 13.9 Alertas y Notificaciones Inteligentes (2026-05-02)

### Status Ejecutor: TERMINADO

### Objetivo ejecutado

- Implementar motor de alertas inteligentes para municipio con evaluación de umbrales, clasificación por nivel, resumen ejecutivo y acciones sugeridas por tipo de riesgo.

### Cambios backend

- Se creó `backend/app/alerts/__init__.py`.
- Se creó `backend/app/alerts/schemas.py` con:
  - `AlertaNivel`
  - `AlertaTipo`
  - `Alerta`
  - `AlertasRequest`
  - `AlertasResponse`
- Se creó `backend/app/alerts/engine.py` con `generate_alerts(req)`:
  - bloqueo por `municipio_id` vacío;
  - reglas de generación por brecha, tasa, residuos regulados, gate legal, macrogeneradores sin padrón, score bajo y sin recuperación;
  - alerta `info` cuando no hay alertas activas;
  - cálculo de `total_criticas`, `total_alertas` y `resumen` con acción urgente.
- Se creó `backend/app/alerts/router.py` con `POST /evaluate`.
- Se registró router en `backend/app/main.py`:
  - `from app.alerts.router import router as alerts_router`
  - `app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])`.

### Cambios tests

- Se creó `backend/tests/test_fase13_9_alertas_notificaciones.py` con 8 pruebas:
  - `test_municipio_vacio_blocked`
  - `test_brecha_critica_genera_alerta_critica`
  - `test_tasa_cero_genera_dos_alertas_criticas`
  - `test_residuos_regulados_genera_alerta_critica`
  - `test_sin_alertas_produce_alerta_info`
  - `test_total_criticas_correcto`
  - `test_resumen_no_vacio`
  - `test_endpoint_200_caso_feliz`

### Cambios frontend (Blueprint 18)

- Se creó `frontend/src/components/simulator/AlertasPanel.tsx`:
  - H1 `font-serif` con badge `propuesta`.
  - banda causal de 4 nodos con flechas `→`.
  - loading con `animate-pulse`.
  - EmptyState con CTA: "Ingresa indicadores del municipio para evaluar alertas".
  - formulario compacto (tasa, brecha, score, sin padrón, residuos regulados, estado legal).
  - banner de resumen dinámico (rojo claro con críticas, verde sin críticas).
  - chips de conteo por nivel.
  - lista ordenada por nivel (`critica`, `alta`, `media`, `info`) con icono, chip de módulo y acción sugerida en cursiva.
- Se actualizaron tipos en `frontend/src/types/index.ts`:
  - `Alerta`
  - `AlertasResponse`
- Se agregó `evaluateAlerts` en `frontend/src/lib/api.ts` apuntando a `/alerts/evaluate`.
- Se integró `<AlertasPanel />` en `frontend/src/app/simulator/page.tsx` dentro de `scenarios_export`.

### Evidencia de verificación

- `cd backend && .venv/bin/python -m pytest tests/test_fase13_9_alertas_notificaciones.py -v` → **8 passed**.
- `cd backend && .venv/bin/python -m pytest -q` → **636 passed** (>= 118 requerido).
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

### Smoke alertas (3 escenarios)

- **Municipio crítico** (`tasa=0`, `brecha=8`, `regulados=True`, `sancion_propuesta`, `sin_padron=3`, `score=20`):
  - `200`, `status=ready`, `total_criticas=4`, `total_alertas=7`.
- **Municipio limpio con info** (`tasa=16`, `brecha=0`, `score=80`, sin regulados/sin padrón):
  - `200`, `status=ready`, `total_criticas=0`, `total_alertas=1` (alerta info).
- **Blocked** (`municipio_id=""`):
  - `200`, `status=blocked`, `total_alertas=0`.

## Cierre Fase 13 — Validación Integral (2026-05-02)

### Resultado de pytest

- `cd backend && .venv/bin/python -m pytest tests/ -q 2>&1 | tail -5` → **636 passed**, 0 failed, 0 errors.

### Routers Fase 13 confirmados en `backend/app/main.py`

- `/infrastructure` (Fase 13.1)
- `/macros` (Fase 13.2)
- `/organizations` (Fase 13.3)
- `/waste-flows` (Fase 13.4)
- `/roadmap` (Fase 13.5)
- `/export` (Fase 13.6)
- `/dashboard` (Fase 13.7)
- `/scenarios` (Fase 13.8)
- `/alerts` (Fase 13.9)

### Componentes Fase 13 confirmados en `frontend/src/app/simulator/page.tsx`

- `CentrosAcopio`
- `Macrogeneradores`
- `PortalEmpresarial`
- `FlujosResiduos`
- `HojaRuta`
- `ExportadorReporte`
- `DashboardKPIs`
- `ComparadorEscenarios`
- `AlertasPanel`

### Resultado TypeScript final

- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores de tipo**.

### Resultado smoke cruzado

- Script solicitado ejecutado sobre `infrastructure`, `organizations`, `alerts`, `dashboard`, `scenarios`.
- Nota de contrato: el payload de infraestructura del script original no coincide con el contrato vigente 13.1 (campos requeridos `zona_ids`, `rsu_capturable_ton_dia`, `horizonte_años`, `mix_centros` y `mix_centros` entero).
- Smoke corregido con contrato vigente:
  - `SMOKE OK: infraestructura, portal_empresarial, alertas, dashboard, comparador — todos 200`.

### Declaración de cierre

- **Fase 13 cerrada. Lista para Fase 14.**

## Ejecutor - Fase 14 Hardening, Seguridad y Preparación para Demo (2026-05-02)

### Status Ejecutor: TERMINADO

### Middlewares añadidos en `backend/app/main.py`

- Se agregó `RateLimitMiddleware` con ventana de 60 segundos por IP (`request.client.host`).
- Límite activo: más de 100 requests en 60s por IP retorna:
  - status `429`
  - body `{"detail":"Rate limit exceeded"}`
  - `content-type: application/json`
- Limpieza de contadores antiguos implementada de forma periódica (cada 10 requests) + filtrado por ventana en cada request.
- Se agregó middleware HTTP de headers de seguridad para todas las respuestas:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Cache-Control: no-store`

### Validadores Pydantic añadidos

- `backend/app/alerts/schemas.py`:
  - `tasa_circularidad_pct: Field(ge=0, le=100)`
  - `brecha_infraestructura_ton_dia: Field(ge=0)`
  - `score_circularidad: Field(ge=0, le=100)`
  - `num_macrogeneradores_sin_padron: Field(ge=0)`
- `backend/app/dashboard/schemas.py`:
  - `generacion_ton_dia: Field(ge=0)` (compatibilidad con regla existente de `blocked` para cero)
  - `tasa_circularidad_actual_pct: Field(ge=0, le=100)`
  - `brecha_infraestructura_ton_dia: Field(ge=0)`
- `backend/app/scenarios/schemas.py`:
  - `generacion_ton_dia: Field(gt=0)`
  - `tasa_circularidad_pct: Field(ge=0, le=100)`
  - `brecha_infraestructura_ton_dia: Field(ge=0)`

### Tests de hardening

- Se creó `backend/tests/test_fase14_hardening.py` con 5 pruebas:
  - `test_tasa_fuera_de_rango_422`
  - `test_score_fuera_de_rango_422`
  - `test_brecha_negativa_422`
  - `test_generacion_cero_o_negativa_422`
  - `test_menos_de_2_escenarios_blocked`

### Evidencia de verificación

- `cd backend && .venv/bin/python -m pytest tests/test_fase14_hardening.py -v` → **5 passed**.
- `cd backend && .venv/bin/python -m pytest -q 2>&1 | tail -3` → **641 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

## Ejecutor - Fase 15 Auditoría de Código Muerto y Limpieza (2026-05-02)

### Status Ejecutor: TERMINADO

### Imports sin uso encontrados y acción tomada

- Verificación de compilación: `cd backend && .venv/bin/python -m py_compile app/main.py` → `main OK`.
- Auditoría de imports en módulos 13-14 detectó imports no usados en `backend/app/export/`:
  - `package_renderer.py`: `uuid`, `datetime`, `timezone`.
  - `document_renderer.py`: `qn`, `OxmlElement`.
  - `pdf_renderer.py`: `TA_LEFT`.
- Acción tomada: se removieron esos imports no usados sin cambiar lógica funcional.

### Estado de `.gitignore`

- No existía `.gitignore` raíz en el repositorio.
- Se creó `.gitignore` en raíz con:
  - `__pycache__/`
  - `*.pyc`
  - `*.pyo`
  - `.DS_Store`
- Se eliminaron del tracking de git los artefactos compilados Python (`.pyc` / `__pycache`__) bajo `backend/` (117 paths untracked del índice).

### Inconsistencias de nomenclatura documentadas (sin corrección funcional)

- `backend/app/waste_flows/schemas.py`:
  - Mezcla español/inglés en símbolos (`WasteDestination` junto con `FlujoCorriente`, `BrechaCircularidad`).
  - Abreviación `tasa_recuperacion_actual_pct` usa `pct` (abreviado) mientras otros campos usan `porcentaje_...`.
- `backend/app/roadmap/schemas.py`:
  - `kpi_meta_90_dias` usa acrónimo `kpi` (aceptable en contexto técnico, pero abreviado).
  - Mezcla controlada de español con término técnico (`status`).
- `backend/app/export/schemas.py`:
  - Mezcla fuerte inglés/español por coexistencia de modelos Fase 4 (`DocumentTheme`, `RenderedAsset`, `RenderReport`) con Fase 13.6 (`SeccionExportada`, `ExportResponse`).
  - Campos abreviados heredados (`zm`) junto con nombres más descriptivos (`municipio_nombre`, `secciones_exportadas`).

### Verificación de endpoints duplicados

- Comando ejecutado sobre `app.main`:
  - `Rutas totales: 91`
  - Paths duplicados detectados por ruta (con métodos distintos):  
    - `/admin/users` (`GET`, `POST`)
    - `/legal/{municipio}/source-manifest` (`GET`, `POST`)
    - `/macros/generators` (`GET`, `POST`)
    - `/operations/routes` (`POST`, `GET`)
- Observación: no son colisiones de método+path; son rutas REST multi-método sobre el mismo path.

### Regresión final

- `cd backend && .venv/bin/python -m pytest tests/ -q 2>&1 | tail -3` → **641 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

## Ejecutor - Fase 16 Lanzamiento de App en Producción (2026-05-02)

### Status Ejecutor: TERMINADO

### Estado de `.env.example`

- `backend/.env.example`: **creado** con claves de producción:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `ALLOWED_ORIGINS`
  - `ENVIRONMENT=production`
  - `LOG_LEVEL=info`
  - `PORT=8000`
- `frontend/.env.example`: **creado** con:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_APP_ENV=production`

### Estado de `backend/Dockerfile` (5 puntos)

1. **Base Python >= 3.11:** ✅ `python:3.12-slim`.
2. **Instala dependencias antes de copiar código:** ✅ `COPY requirements.txt` + `pip install` antes de `COPY . .`.
3. **Expone puerto 8000:** ✅ `EXPOSE 8000`.
4. **CMD uvicorn host/port producción:** ✅ ajustado a `uvicorn app.main:app --host 0.0.0.0 --port 8000` (sin `--reload`).
5. **No copiar `.venv` dentro de imagen:** ✅ se agregó `backend/.dockerignore` con `.venv`.

### Estado de `docker-compose.yml` (4 puntos)

1. **Backend con healthcheck:** ✅ agregado healthcheck HTTP a `/health`.
2. **Frontend con `NEXT_PUBLIC_API_URL` al backend interno:** ✅ actualizado a `http://backend:8000`.
3. **Puertos host expuestos:** ✅ `3000:3000` y `8000:8000`.
4. **Servicio de base de datos con volumen persistente:** ✅ `db` (Postgres) + volumen `pgdata`.

### Health check FastAPI

- Endpoint `GET /health` actualizado en `backend/app/main.py` para retornar:
  - `status`
  - `version`
  - `environment` con `os.getenv("ENVIRONMENT", "development")`
- Verificación con TestClient:
  - `health: 200 {'status': 'ok', 'version': '1.0.0', 'environment': 'development'}`

### Verificación final

- `cd backend && .venv/bin/python -m pytest tests/ -q 2>&1 | tail -3` → **641 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

## Ejecutor - Fase 19 Publicación y Control de Acceso (2026-05-02)

### Status Ejecutor: TERMINADO

### Lectura blueprint 17.1 (extracción de criterios)

- Roles/contenidos de acceso institucional referenciados por blueprint: acceso autenticado institucional con trazabilidad y segmentación (frontend protegido en `/simulator`, `/ca-studio`, `/hub`; backend sensible autenticado, `/health` público).
- Endpoints/rutas sensibles a proteger según blueprint: rutas de operación/simulación y exportación; health se mantiene público.
- Mecanismo base de auth del blueprint: **Supabase Auth + JWT de Supabase** (trazabilidad en logs de acceso).
- UX bloqueada esperada: landing/carta de acceso institucional, aviso de trazabilidad y estado de acceso restringido cuando no hay permisos.

### Módulo `access/` creado

- `backend/app/access/__init__.py`
- `backend/app/access/schemas.py`
  - `RolAcceso`: `publico`, `tecnico`, `auditor`, `admin`
  - `ContextoAcceso`: `user_id`, `rol`, `municipio_id`
- `backend/app/access/middleware.py`
  - `get_access_context(request)`:
    - lee `X-Alquimia-Role`
    - default a `publico` si no existe o valor inválido
    - nunca lanza excepción
  - `verify_rol(context, required)` con orden:
    - `publico < tecnico < auditor < admin`

### Endpoint `/export/report` protegido

- Archivo: `backend/app/export/router.py`
- Se agregó control por rol:
  - `publico` o sin header -> `403`
  - mensaje:
    - `"Acceso restringido: se requiere rol técnico o superior para exportar reportes."`
  - `tecnico` o superior -> operación normal `200`

### Tests de control de acceso

- Nuevo archivo: `backend/tests/test_fase19_control_acceso.py`
- Cobertura implementada:
  - `test_export_sin_header_retorna_403`
  - `test_export_con_rol_publico_retorna_403`
  - `test_export_con_rol_tecnico_retorna_200`
  - `test_export_con_rol_admin_retorna_200`
  - `test_verify_rol_orden_correcto`

### Frontend: indicador de acceso restringido en `ExportadorReporte`

- Archivo: `frontend/src/components/simulator/ExportadorReporte.tsx`
- Manejo explícito de `403`:
  - si `res.status === 403` -> mensaje
    - `Acceso restringido · se requiere rol técnico o superior para exportar reportes.`
- Banner de error mantiene estilo institucional de incidencia:
  - `border-red-200`, `bg-red-50`
  - título visible: `Incidencia operativa`
  - CTA de reintento.

### Verificación final

- `cd backend && .venv/bin/python -m pytest tests/test_fase19_control_acceso.py -v` → **5 passed**.
- `cd backend && .venv/bin/python -m pytest -q 2>&1 | tail -3` → **646 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

### Smoke control de acceso (4 escenarios)

- `sin_header` -> `403 forbidden`
- `publico` -> `403 forbidden`
- `tecnico` -> `200 ready`
- `admin` -> `200 ready`

## Ejecutor - Fase 18 Narrativa Institucional Élite y Estética Causal (2026-05-02)

### Status Ejecutor: TERMINADO

### Checklist visual solicitado (completado ítem por ítem)

#### ✅ CentrosAcopio

- H1 actualizado a:
  - `Plan de infraestructura con trazabilidad municipal · simulación propuesta`
- Subtítulo de alcance agregado:
  - `Brecha operativa capturable por zona — validación competente pendiente de municipio.`
- Banda de 3 KPIs agregada (con `—` cuando no hay plan):
  - Brecha capturable
  - Cobertura de capacidad
  - CAPEX/OPEX estimados
- Banda de causalidad 6 nodos agregada (`RSU capturable → ... → Impacto m²/empleos`).
- Empty state ajustado con CTA:
  - `Configura el mix P/M/G de centros para calcular el plan de infraestructura.`
- Chip de estado por centro agregado en tarjetas (`operando` verde / resto ámbar).
- Título `Cálculo brecha` renombrado a `Trazabilidad del cálculo`.
- Tooltip/fuente en KPIs por fase agregado:
  - `Fuente: CA_CONFIG ALQUIMIA · confianza media · simulación propuesta`
- Bloque de advertencia final con badge inicial:
  - `Simulación propuesta`.

#### ✅ AdvertenciasGateLegal

- H1 actualizado con badge:
  - `Advertencias, inspección y propuestas · simulación propuesta`
- Chips semánticos por tipo de acción agregados:
  - `educational_warning` → `Educativo · no sanción` (azul)
  - `inspection` → `Inspección · registro` (gris)
  - `proposed_sanction` → `Sanción propuesta · no oficial` (ámbar)
  - `definitive_document` → `Documento definitivo · gate bloqueado` (rojo)

#### ✅ Ajuste narrativo transversal (9 componentes Fase 13)

- Revisión aplicada en:
  - `CentrosAcopio`
  - `Macrogeneradores`
  - `PortalEmpresarial`
  - `FlujosResiduos`
  - `HojaRuta`
  - `ExportadorReporte`
  - `DashboardKPIs`
  - `ComparadorEscenarios`
  - `AlertasPanel`
- No quedan textos visibles standalone de:
  - `Cargando...`
  - `Loading...`
  - `Resultados`
  - `Sin datos`
- Mensajería de fallback genérica de error actualizada en los módulos principales a redacción institucional:
  - `Incidencia operativa ...`
- Botones de acción se mantienen con copy específico por módulo (`Calcular`, `Evaluar`, `Generar`, `Exportar`), sin `Enviar`/`Submit`.

### Normalización tipográfica/espaciado aplicada

- Se reforzó estándar de labels y separación en:
  - `HojaRuta.tsx`
  - `DashboardKPIs.tsx`
  - `ComparadorEscenarios.tsx`
  - `AlertasPanel.tsx`
  - `ExportadorReporte.tsx`
  - `PortalEmpresarial.tsx`
  - `FlujosResiduos.tsx`
  - `Macrogeneradores.tsx`

### Verificación final

- `cd backend && .venv/bin/python -m pytest tests/ -q 2>&1 | tail -3` → **641 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

## Ejecutor - Fase 17 Auditoría UX y Usabilidad (2026-05-02)

### Status Ejecutor: TERMINADO

### Selectores `estado_legal` corregidos (labels legibles)

- `frontend/src/components/simulator/HojaRuta.tsx`
- `frontend/src/components/simulator/DashboardKPIs.tsx`
- `frontend/src/components/simulator/ComparadorEscenarios.tsx`
- `frontend/src/components/simulator/AlertasPanel.tsx`

Opciones normalizadas en los 4:

- `Sin gate activo`
- `Gate activo`
- `Sanción propuesta`

### Componentes con normalización de tipografía/espaciado

- `frontend/src/components/simulator/HojaRuta.tsx`
  - labels de formulario a `text-[13px] text-[#6B6860]`
  - separación principal con `mb-6` en bloques de formulario
- `frontend/src/components/simulator/DashboardKPIs.tsx`
  - labels de formulario a `text-[13px] text-[#6B6860]`
  - separación principal con `mb-6` en bloque de inputs
- `frontend/src/components/simulator/ComparadorEscenarios.tsx`
  - separación principal con `mb-6` en panel de escenarios
- `frontend/src/components/simulator/AlertasPanel.tsx`
  - labels de formulario a `text-[13px] text-[#6B6860]`
  - separación principal con `mb-6` en bloque de inputs
- `frontend/src/components/simulator/ExportadorReporte.tsx`
  - labels y controles de formulario normalizados a `text-[13px] text-[#6B6860]`
  - separación principal con `mb-6` en bloque de configuración
- `frontend/src/components/simulator/Macrogeneradores.tsx`
  - `h3` principal normalizado a `font-semibold text-[16px] text-[#1C1B18] mb-3`
  - labels de formulario avanzado normalizados a `text-[13px] text-[#6B6860]`
  - separación principal en cabecera con `mb-6`
- `frontend/src/components/simulator/PortalEmpresarial.tsx`
  - labels de formulario (`NumericField`, `BooleanField`) normalizados a `text-[13px] text-[#6B6860]`
- `frontend/src/components/simulator/FlujosResiduos.tsx`
  - labels de formulario normalizados a `text-[13px] text-[#6B6860]`
  - separación principal con `mb-6` en bloque de formulario

### Microcopy de oficialidad en `ExportadorReporte`

- Agregado debajo del botón `Exportar`:
  - "Esta previsualización es una simulación propuesta. La generación de archivos PDF/Excel oficiales estará disponible en la próxima versión."

### Verificación final

- `cd backend && .venv/bin/python -m pytest tests/ -q 2>&1 | tail -3` → **641 passed**.
- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **sin errores**.

## Ejecutor - Fase 20 Gobernanza, Calidad y Riesgo (2026-05-02)

### Status Ejecutor: TERMINADO

### PASO 1 - extracción del blueprint `17_gobernanza_calidad_riesgo_y_dod.md`

- Métricas de calidad base extraídas: contrato observable, tests de caso feliz/bloqueado, validación de inputs, errores explícitos, estados UI `loading/empty/error/blocked`, trazabilidad/proveniencia, seguridad y no-regresión.
- Definition of Done general extraída: contrato actualizado, API/UI observable, estados completos, pruebas unitarias/integración, warnings/fuente en estimaciones, no romper flujos, documentación de cierre y criterios de no aceptación revisados.
- Riesgos mapeados del documento: doble conteo, residuos regulados mal clasificados, legalidad sin base competente, volatilidad de precios, dependencia operativa, documento no defendible.
- Controles propuestos: checklists reproducibles, guardas normativas, control de acceso, headers y hardening, validación legal previa, ClaimLedger/proveniencia y criterios de bloqueo explícitos.

### PASO 2 - backend `governance/`

- Archivos creados:
  - `backend/app/governance/__init__.py`
  - `backend/app/governance/schemas.py`
  - `backend/app/governance/checker.py`
  - `backend/app/governance/router.py`
- Contratos Pydantic v2 implementados:
  - `RiesgoNivel`, `RiesgoIdentificado`, `MetricaCalidad`, `DoDItem`, `GovernanceRequest`, `GovernanceResponse`.
- Motor `evaluate_governance` implementado con:
  - bloqueo por `municipio_id` vacío;
  - score 0-100 según regla `15+15+15+15+15+15+10`;
  - estado por umbral (`aprobado` / `observaciones` / `bloqueado`);
  - métricas de calidad (tests, cobertura, headers, control acceso);
  - 3 riesgos fijos del proyecto con estado dinámico (`abierto`/`mitigado`);
  - checklist DoD (6 criterios mínimos) con evidencia textual;
  - resumen institucional con acción principal si no aprueba.
- Endpoint agregado:
  - `POST /governance/evaluate`.
- Registro de router:
  - `backend/app/main.py` incluye `governance_router` con prefijo `/governance`.

### PASO 3 - tests Fase 20

- Archivo creado: `backend/tests/test_fase20_gobernanza.py`.
- Cobertura implementada:
  - `test_municipio_vacio_bloqueado`
  - `test_score_maximo_todos_flags_activos`
  - `test_score_parcial_produce_observaciones`
  - `test_riesgos_mitigados_cuando_flags_activos`
  - `test_dod_tiene_6_items`
  - `test_resumen_contiene_score`
  - `test_endpoint_200_caso_feliz`

### PASO 4 - frontend `GovernancePanel`

- Archivo creado: `frontend/src/components/simulator/GovernancePanel.tsx`.
- Implementado con Blueprint 18:
  - H1 institucional con badge `interno`;
  - banda causal 4 nodos;
  - skeleton `animate-pulse` en loading;
  - empty state CTA;
  - formulario de inputs/checks;
  - score card grande con color semántico y badge de estado;
  - grid 2x2 para métricas;
  - riesgos con badge de nivel y chip de estado;
  - checklist DoD con `✅/❌` y evidencia.
- Integraciones realizadas:
  - Tipos agregados en `frontend/src/types/index.ts`:
    - `MetricaCalidad`, `RiesgoIdentificado`, `DoDItem`, `GovernanceResponse`.
  - API agregada en `frontend/src/lib/api.ts`:
    - `evaluateGovernance(payload)`.
  - Render en `frontend/src/app/simulator/page.tsx`:
    - `<GovernancePanel />` dentro de `scenarios_export`.

### PASO 5 - verificación final

- `backend/.venv/bin/python -m pytest backend/tests/test_fase20_gobernanza.py -v` → **7 passed**.
- `backend/.venv/bin/python -m pytest -q` → **653 passed**.
- `frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json` → **sin errores**.
- Smoke directo checker:
  - `score: 100.0 status: aprobado riesgos: 3 dod: 6`.

## Ejecutor - Fase 21 Checklist de Lanzamiento Reproducible (2026-05-02)

### Status Ejecutor: TERMINADO

### PASO 1 - backend `launch/` (artefacto de cierre reproducible)

- Módulo creado:
  - `backend/app/launch/__init__.py`
  - `backend/app/launch/schemas.py`
  - `backend/app/launch/checklist.py`
  - `backend/app/launch/router.py`
- Endpoint habilitado:
  - `GET /launch/checklist` (sin body, sin autenticación).
- Registro en app principal:
  - `backend/app/main.py` incluye `launch_router` con prefijo `/launch`.
- Ítems ejecutables implementados en `build_launch_checklist()`:
  - `tests`
  - `rate_limit`
  - `security_headers`
  - `health_endpoint`
  - `access_control`
  - `env_example`
  - `dockerfile`
  - `gitignore`
- Cálculo de score y estado:
  - `score_lanzamiento = (ok/total)*100`
  - `status`: `listo` (100), `advertencias` (>=75), `bloqueado` (<75)
  - `version`: `21.0`
  - `resumen`: formato institucional con conteo de ok/advertencias/fallos.

### PASO 2 - tests Fase 21

- Archivo creado: `backend/tests/test_fase21_checklist_lanzamiento.py`.
- Cobertura implementada:
  - `test_checklist_retorna_8_items`
  - `test_tests_item_estado_ok`
  - `test_health_item_estado_ok`
  - `test_access_control_item_estado_ok`
  - `test_score_mayor_75`
  - `test_endpoint_200`

### PASO 3 - frontend `LaunchChecklist`

- Archivo creado: `frontend/src/components/simulator/LaunchChecklist.tsx`.
- Implementado con Blueprint 18:
  - H1 institucional con badge `interno`.
  - Banda causalidad 4 nodos.
  - Auto-carga con `useEffect` al montar (sin formulario).
  - Skeleton `animate-pulse` en carga.
  - Score card (48px, color semántico), badge de estado y versión.
  - Tabla de items agrupada por categoría:
    - Estado (`✅/⚠️/❌`)
    - Descripción
    - Comando (monospace)
    - Detalle
  - Resumen en bloque `#FAF8F4`.
  - Botón `Volver a verificar`.
- Integraciones realizadas:
  - Tipos agregados en `frontend/src/types/index.ts`:
    - `ChecklistItem`
    - `LaunchChecklistResponse`
  - API agregada en `frontend/src/lib/api.ts`:
    - `getLaunchChecklist()`
  - Render agregado en `frontend/src/app/simulator/page.tsx`:
    - `<LaunchChecklist />` en `scenarios_export`.

### PASO 4 - verificación final

- `backend/.venv/bin/python -m pytest backend/tests/test_fase21_checklist_lanzamiento.py -v` → **6 passed**.
- `backend/.venv/bin/python -m pytest -q` → **659 passed**.
- `frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json` → **sin errores**.
- Smoke final checklist:
  - `score: 100.0 | status: listo | items: 8`
  - `[ok] tests`
  - `[ok] rate_limit`
  - `[ok] security_headers`
  - `[ok] health_endpoint`
  - `[ok] access_control`
  - `[ok] env_example`
  - `[ok] dockerfile`
  - `[ok] gitignore`

## Planner — Evolución Estratégica · Fase 22 (2026-05-03 noche)

Objetivo: Reestructura de Identidad y Prestigio. Fin de la "era de los bloques" mediante Gateway obligatorio de audiencia y NarrativeBridge en cada cálculo complejo.

Subdivisión de la fase 22:

- 22.0 · `22_0_audience_gateway.md` y reglas reforzadas (`cursor-rules/EJECUTOR.md`, `cursor-rules/AUDITOR.md`).
- 22.1 · Audience en `simulatorStore` + `AudienceGateway.tsx` que bloquea `/simulator` hasta selección.
- 22.2 · `lib/audienceModules.ts` filtra módulos por audiencia (poda ≥60% UI).
- 22.3 · `NarrativeBridge.tsx` con `compute(state)` insertado en `ImpactoFinanciero` (Monte Carlo, Tornado, Waterfall), `ReasoningGraphPanel`, `RecicladoarasSection`, `FlujosResiduos`, `ComparadorEscenarios`, `CentrosAcopio`.
- 22.4 · Sankey real (RecicladoarasSection, FlujosResiduos), Timeline horizontal (BenchmarkLATAM, OperacionPERBitacora), grafo dirigido (ReasoningGraphPanel), unificación de paleta editorial.
- 22.5 · Purga de strings huérfanos (`Evidencia:`, `LISTO`, `Demo`, `placeholder`), chips semánticos y resolución de `containers_provider` huérfano.
- 22.6 · Backend opcional: `audience` como dimensión ortogonal a `PortalEntry`, tests `test_fase22_audience.py`. Verificación full (tsc, pytest, export estática, capturas).

Órdenes embebidas para Ejecutor:

- Aplicar 22.x en orden, sin saltar 22.3 (NarrativeBridge) antes de 22.1/22.2.
- Mantener compatibilidad con `audit_visual_maqueta/` y dev nativo.
- Cumplir estándares 18/19 en cada subfase.

Órdenes embebidas para Auditor:

- Rechazar cualquier subfase 22.x con módulo visible sin NarrativeBridge conectado al store.
- Rechazar selección automática de audiencia (gateway debe ser explícito).
- Rechazar visibilidad de strings purgados en producción para audiencias no-demo.

## Ejecutor — Cierre Fase 22 (2026-05-03 noche)

Status Ejecutor: TERMINADO.

Resumen técnico:

- 22.0 Docs y reglas: blueprints `22_0` a `22_6`, README actualizado, `cursor-rules/EJECUTOR.md` y `cursor-rules/AUDITOR.md` reforzados (gateway obligatorio + NarrativeBridge obligatorio + purga).
- 22.1 Store: `Audience` y `AUDIENCE_TO_PORTAL` añadidos en `frontend/src/types/index.ts`; `simulatorStore` con `audience`, `setAudience`, `resetAudience` y persistencia local.
- 22.1 Gateway: `frontend/src/components/simulator/AudienceGateway.tsx` (Ciudadano/Funcionario/Empresario) bloquea `simulator/page.tsx` hasta selección. Auto-selección de `city_plan` eliminada.
- 22.2 Filtrado: `frontend/src/lib/audienceModules.ts` y filtro en `DecisionModuleShell` + `renderDecisionModule(audience)` en `page.tsx` (citizen → impact_finance lite, functionary completo, entrepreneur con `containers_provider`).
- 22.3 NarrativeBridge: `NarrativeBridge.tsx` con `summary` derivado de datos, insertado en `CentrosAcopio`, `ImpactoFinanciero` (Waterfall, Monte Carlo, Tornado), `ReasoningGraphPanel`, `RecicladoarasSection`, `FlujosResiduos`, `ComparadorEscenarios` y `OperacionPERBitacora`.
- 22.4 Visual: `FlujosSankey.tsx` (recharts.Sankey) reemplaza promesas en `RecicladoarasSection` y `FlujosResiduos`. `EditorialTimeline.tsx` aplicado en `BenchmarkLATAM` y `OperacionPERBitacora`. `ReasoningGraphCanvas.tsx` (SVG dirigido) reemplaza el contador textual en `ReasoningGraphPanel`. Paleta editorial unificada en `Precolocacion`, `CoberturaNacional`, `Macrogeneradores`.
- 22.5 Purga: `Evidencia:` huérfano renombrado a "Dato que sostiene"; badges `listo/bloqueado` cambiados a `Disponible / Requiere acción` con icono semántico.
- 22.5 Huérfanos: `ContainersProvider.tsx` resuelve el módulo `containers_provider` con NarrativeBridge informativo y CTA a contacto comercial.
- 22.6 Backend opcional: `backend/tests/test_fase22_audience.py` documenta el mapping audiencia→PortalEntry y bloquea regresiones del journey actual.

Evidencia de pruebas:

- Frontend: `node node_modules/typescript/bin/tsc --noEmit` → 0 errores.
- Backend: `pytest -q` → 663 passed, 0 failed.
- Export estática regenerada en `audit_visual_maqueta/` desde `frontend/out/`.

Pendiente para Auditor: validar contra `22_0_audience_gateway.md` … `22_6_evolucion_backend_audience.md` y firmar AUTORIZADO o emitir Prompt Quirúrgico de Corrección.

## Planner — Pulido extra Fase 22 (2026-05-04)

- Monte Carlo en `ImpactoFinanciero`: NarrativeBridge ahora usa percentiles P10/P50/P90 reales de la distribución (`monteCarlo(..., 2000)`), con warning cuando P10 cruza debajo de WACC.
- Cashflow y Stress test: cada bloque lleva NarrativeBridge con KPIs derivados del horizonte y VPN/TIR/DSCR base.
- `EducacionCiudadana`: NarrativeBridge ciudadano con datos del resultado + checkbox demo renombrado a “Modo demo guiada”.
- `ReasoningGraphPanel`: contenedor y CTAs alineados a paleta editorial (#FDFCFA / serif).
- `DecisionModuleShell`: subtítulo distingue audiencia (ciudadano / funcionario / empresario).
- `resetAudience`: limpia también `portalEntry` para estado consistente.
- Export estática regenerada en `audit_visual_maqueta/`.

## Planner — Síntesis Fase 22 y roadmap 23–25 (2026-05-05)

**Estado Fase 22 (código):** Según cierre Ejecutor registrado el 2026-05-03 y pulidos 2026-05-04, las subfases **22.0 a 22.5** y la parte documentada de **22.6** (tests `test_fase22_audience.py`) constan como ejecutadas en repo con evidencia `tsc`, `pytest` y export estático. La **extensión opcional** de backend (`audience` server-side + OpenAPI) permanece descrita en `22_6_evolucion_backend_audience.md` y solo se activa si Auditor detecta fuga de módulos vía API.

**Navigator (uso explícito):** No forma parte de la Fase 22. Entra en hitos **geoespaciales** bajo blueprint `**23_integridad_geoespacial_y_capas.md`** (mapas, capas, SRID, límites Municipio↔ZM, fuentes INEGI/MGN). Coordinación con `06_implementacion_espacio_tiempo`, `08_logistica_operativa_per` y `17_1_publicacion_y_control_de_acceso` cuando el mapa sea sensible.

**Nuevas fases documentadas:**


| Archivo                                 | Rol                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `23_integridad_geoespacial_y_capas.md`  | Navigator + Ejecutor + Auditor (+ Aesthete presentación mapa)              |
| `24_release_gate_e2e_observabilidad.md` | Ejecutor + Auditor; cierra brecha E2E backend vivo y observabilidad mínima |
| `25_tokens_y_design_as_code.md`         | Aesthete + Ejecutor; anti-drift tras paleta editorial 22                   |


**Órdenes embebidas**

- Ejecutor: no iniciar **23** sin checklist inicial firmado por Navigator (aunque sea borrador en PR).
- Auditor: mantener pendiente de firma formal la revisión 22.x contra blueprints `22_0`–`22_6`; **24** es prerequisito sugerido antes de release público.
- CSA: mantener `COLA_Y_ROLES_AGENTES.md` (raíz repo) como puntero operativo de fase y cola.

## Ejecutor — Cierre condiciones auditoría G22-01 a G22-03 (2026-05-04)

**Contexto:** PASS CONDICIONAL Fase 22.x; se cierran G22-01…G22-03 y ajuste narrativo en `ReasoningGraphPanel` sin ampliar alcance.

### G22-01 — phase-rules (cargable)

- **Fase 22.x: phase-rules cargable en `phase-rules/22.x.yaml`.**
- Archivo en raíz del repo: `phase-rules/22.x.yaml` con `phase`, `title`, `mandatory_checks` (6 ítems: id, rule, severity Blocker|High, auto_check) y `forbidden_in_production`.

### G22-02 — evidencia pytest y cobertura

- `cd backend && .venv/bin/python -m pytest tests/ -q` → **663 passed, 0 failed** (2026-05-04).
- Cobertura backend: `cd backend && .venv/bin/python -m pytest tests/ -q --cov=app --cov-report=term-missing` → **TOTAL 88%** (umbral normativo Auditor ≥85% → **cumple**).
- Dependencia `**pytest-cov==6.0.0`** registrada en `backend/requirements.txt` para reproducir el comando.

### G22-03 — accesibilidad / performance (mínimo viable)

- **Deuda explícita:** *Pendiente medición formal axe/Lighthouse sobre ruta `/simulator` en local (servidor Next + Chrome); en esta sesión no hubo `npx`/Lighthouse utilizable en el agente.* Próximo sprint: pegar score Accessibility y LCP (o equivalente). Hasta entonces el Auditor puede mantener **CONDICIONAL** solo en esta dimensión.

### Ajuste menor — ReasoningGraphPanel (coherencia Fase 18)

- En el `catch` del flujo grafo/explicación: se elimina el fallback *«Error generando explicación causal»*; mensaje usuario: *«Incidencia operativa al construir el grafo causal. Reintenta o revisa conexión con la API.»*

### Verificación obligatoria (re-auditoría)

- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **0 errores**.
- `cd backend && .venv/bin/python -m pytest tests/ -q` → **663 passed, 0 failed**.

---

## Auditor — Re-auditoría G22-01 a G22-03 (2026-05-04)

**Performativa (PIS):** `INFORM`  
**Status Auditor:** **AUTORIZADO CONDICIONAL**

### Veredicto


| Dimensión rúbrica §6     | Resultado                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| §6.1 — Tests             | **Cumple** — `pytest tests/ -q`: **663 passed, 0 failed** (verificado por Auditor en sesión).                                              |
| §6.1 — Cobertura backend | **Cumple** — Reporte Ejecutor **88%** con `--cov=app` (≥85% normativo); `pytest-cov==6.0.0` en `requirements.txt`.                         |
| §6.3 — A11y / CWV        | **Condicional** — Pendiente medición formal Lighthouse/axe en `/simulator`; deuda ya declarada por Ejecutor. Sin scores no se cierra §6.3. |
| §6.5 / G22               | **Cumple** — `phase-rules/22.x.yaml` en raíz (6 mandatory_checks + forbidden); bitácora G22-01 con frase explícita de cargabilidad.        |
| ReasoningGraphPanel      | **Cumple** — Sin cadena prohibida `Error generando explicación causal`; copy institucional en `catch` confirmado en repo.                  |
| Hub                      | **Cumple** — `Paquete preparado` presente en `hub/page.tsx`; sin `Paquete listo` en ese archivo.                                           |


### Hallazgo no bloqueante (Info)

- Los `auto_check` del YAML usan comando `rg`; en CI conviene documentar dependencia de **ripgrep** o equivalente con `grep` para portabilidad.

### Condición para AUTORIZADO pleno (solo §6.3)

1. Ejecutar Lighthouse (Chrome) o axe sobre `/simulator` en entorno local o CI.
2. **Append** en esta bitácora: score **Accessibility** y métrica **LCP** (u otro equivalente acordado).

### Chat (resumen una línea)

`AUTORIZADO CONDICIONAL` — abierta únicamente la dimensión §6.3 hasta pegar scores axe/Lighthouse.

---

## Ejecutor — Medición formal §6.3 `/simulator` e intención de CI `rg` (2026-05-04)

**Marco:** `cursor-rules/EJECUTOR.md` · Prioridad 1 = condición Auditor (scores a11y + LCP); Prioridad 2 = documentación portabilidad `rg`; **no** se inicia Fase 23 (geo).

### Prioridad 1 — Lighthouse / axe sobre `http://localhost:3000/simulator`


| Campo                                       | Valor                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fecha**                                   | 2026-05-04                                                                                                                                                   |
| **Entorno**                                 | Agente Cursor: shell login sin `**npm` / `npx` en PATH**; solo `node` (helper de Cursor); no se instaló Lighthouse ni se levantó `next dev` en esta corrida. |
| **URL objetivo**                            | `/simulator` (Next local típico `http://localhost:3000/simulator`)                                                                                           |
| **Scores Accessibility (Lighthouse o axe)** | **No medido en esta sesión** — falta toolchain Node completo + Chrome headless en el agente.                                                                 |
| **LCP (CWV)**                               | **No medido en esta sesión** — mismo bloqueo.                                                                                                                |


**Comando de referencia** (reproducir en estación con Node ≥18, npm y Chrome; Terminal A: `cd frontend && npm install && npm run dev`; Terminal B):

```bash
cd frontend && npx --yes lighthouse@12.8.2 http://localhost:3000/simulator \
  --only-categories=accessibility,performance \
  --preset=desktop \
  --output=json --output-path=./lighthouse-simulator-report.json \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```

**Lectura sugerida del JSON:** `categories.accessibility.score` (0–1 → ×100 %); `audits['largest-contentful-paint'].numericValue` (s) y `displayValue`.  
**Alternativa axe:** `npx --yes @axe-core/cli@latest http://localhost:3000/simulator` (con servidor arriba).

**Acción Auditor:** cuando existan números reales de un entorno controlado, **append** fila o sub-bloque con scores; hasta entonces §6.3 permanece condicional según veredicto 2026-05-04.

### Prioridad 2 — `phase-rules/22.x.yaml` y `rg` en CI (no bloqueante)

- Los `auto_check` documentados usan `**rg` (ripgrep)**; en ubuntu-latest de GitHub Actions `**rg` no está por defecto**. Opción: paso `sudo apt-get update && sudo apt-get install -y ripgrep` o imagen con ripgrep; o sustituir más adelante por script `grep`/Node si se exige máxima portabilidad sin dependencias OS.
- **Estado:** en la raíz del repo **no** hay workflow `.github/workflows` propio del proyecto (solo artefactos bajo `node_modules`); esta nota queda como guía para cuando CSA autorice pipeline.

### Verificación obligatoria (cierre de tarea, esta sesión)

- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **0 errores**.
- `cd backend && .venv/bin/python -m pytest tests/ -q` → **663 passed, 0 failed**.

---

## Norma de equipo — Quién puede actualizar la bitácora (2026-05-05)

**Decisión operativa (Usuario / ecosistema):** **Todos los roles** pueden y **deben** añadir entradas a este archivo — no es exclusivo del Auditor. Objetivo: visibilidad cruzada de lo que hizo cada compañero (Ejecutor, Navigator, Aesthete-1, CSA, Auditor, Planner) sin depender de memoria oral.

**Reglas (alineadas PIS §4 — bitácora append-only):**

1. **Solo añadir** al final (append). No borrar ni reescribir entradas ajenas; si se corrige algo, nueva entrada que **depreca** o aclara la anterior.
2. **Prefijo de sección** sugerido: `## <Rol> — <asunto corto> (YYYY-MM-DD)` o `###` bajo un bloque de fase ya existente.
3. **Contenido mínimo:** qué cambió, evidencia (comando, captura, hash commit/PR si aplica), y **siguiente paso** o bloqueante.
4. El **Auditor** sigue siendo quien emite veredictos normativos (`AUTORIZADO` / `VETO` / condicional); eso no impide que el Ejecutor registre entregas o el Navigator un checklist geo.
5. Si un agente no puede editar el `.md` en su herramienta, debe **pegar el bloque** al chat del operador humano para que lo incorpore — el principio es: **la bitácora refleja la verdad compartida del equipo.**

Esta norma complementa `COLA_Y_ROLES_AGENTES.md` (puntero de fase) y no sustituye el protocolo formal del PIS cuando se requieran performativas rastreables con `trace_id`.

---

## Navigator — Puerta formal Fase 23 y STANDBY operativo (2026-05-05)

**Performativa (PIS):** `INFORM`  
**Spec:** `cursor-rules/NAVIGATOR.md` · Blueprint `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/23_integridad_geoespacial_y_capas.md`

### Estado Navigator

**STANDBY:** CSA **no** abrió trabajo geoespacial activo en la semana iniciando **2026-05-04**. Navigator **no** emite commits ni ingestiones hasta **REQUEST** explícito CSA para Fase **23**.

### Puerta formal antes de código geo (Fase 23)

Cuando CSA ordene Fase **23**, **antes** de que Ejecutor modifique código geoespacial (mapas, geometrías, tiles/MVT, consultas espaciales, SRID en backend), Navigator debe entregar **checklist PASS/FAIL** para el **alcance concreto** que CSA declare (**identificador de capa** y/o **feature ID** del contrato de capa previsto en blueprint §3).

El checklist mínimo incluye:


| Bloque                   | Contenido                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§5.3 NAVIGATOR**       | ¿`jurisdiction_scope` por feature? ¿`municipio_id` (CVE INEGI)? ¿Si aplica ZM, `zm_id` ≠ confusión con municipio? ¿Sin mezcla indebida atribuciones Municipio↔ZM?               |
| **SRID**                 | Almacén/intercambio **EPSG:4326**; visualización web **EPSG:3857** sin métricas de área/distancia en 3857; cálculos métricos **EPSG:6369** (SLP / NL / QRO) según §3 NAVIGATOR. |
| **Fuentes INEGI/MGN**    | Origen citado (idealmente MGN/edición); URL o expediente de descarga y fecha; OSM no como fuente única para decisión pública.                                                   |
| `**jurisdiction_scope`** | Explícito por consulta/capa: `Municipality`                                                                                                                                     |


Este bloque queda registrado como **puerta formal del 2026-05-05**. **Ejecutor no debe iniciar Fase 23** en código geo sin checklist Navigator para ese alcance (coherente con blueprint §4 y síntesis Planner mismo día en esta bitácora).

Si CSA aún no declara capa/feature ID → checklist en estado **pendiente de intake** (bloqueo de inicio, no un FAIL sobre datos inexistentes).

### Exclusión

Navigator **no** revisa purga UI/copy **Fase 22** salvo que el cambio **toque mapa o geometría**.

---

## CSA — REQUEST · Apertura formal Fase 23.0 (2026-05-05)

**Performativa (PIS):** `REQUEST` (orden de trabajo) · rol **CSA / Planner**

Queda **abierta** la Fase **23** en su subfase **23.0** (intake jurisdiccional **sin** geometría publicada ni tiles). Objetivo: desbloquear a **Navigator** para emitir checklist **PASS/FAIL** normativo sobre el estado actual del repo **antes** de que **Ejecutor** implemente Mapbox/capas (**23.1**).

### Alcance concreto entregado a Navigator (feature / contrato)


| Campo                                   | Valor                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identificador de “capa” lógica**      | `ALQUIMIA-SEED-JURISDICCION-MUNICIPIO-ZM-v0`                                                                                                                                                                                                                                                                                 |
| **Feature IDs**                         | Claves `municipio_id` semilla en `backend/app/legal/repository.py`: **ZM SLP:** `slp`, `sol`, `csp`, `vip` · **ZM QRO:** `qro`, `cor`, `mar`, `hui` · **ZM MTY:** `mty`, `spg`, `snl`, `gua`, `apo`, `sca`, `gar`, `esc`, `jua` (catálogo interno actual; **CVE INEGI oficial** como deuda documentada hasta migración MGN). |
| **Atributos en scope**                  | `zm` (código ZM en semilla), `municipio_id` (clave interna ALQUIMIA), coherencia **municipio ≠ ZM** en narrativa y datos (`Reglamento` y repos relacionados).                                                                                                                                                                |
| **Nivel de decisión pública soportado** | **Simulación / propuesta** con datos semilla; sin afirmar geometría oficial de límites en esta subfase.                                                                                                                                                                                                                      |
| **Fuente declarada en código**          | Texto fuente por municipio en artículos/reglamento seed (POE URLs donde existan); **Navigator** valida si es suficiente para §4 NAVIGATOR hasta sustituir por MGN versionado.                                                                                                                                                |


### Órdenes

1. **Navigator:** responder con tabla **PASS/FAIL por ítem** (§5.3 aplicable a **datos lógicos**, SRID **N/A** salvo que detecte coordenadas implícitas, fuentes INEGI/MGN **condicional** según evidencia en repo). Append en esta bitácora o referencia cruzada clara.
2. **Ejecutor:** **no** iniciar **23.1** (SDK Mapbox con fuentes propias, GeoJSON territorial, tiles propios) hasta **PASS 23.0** de Navigator **o** nueva línea CSA que documente aceptación de riesgo paralelo.
3. **Auditor:** sin cambio de veto automático; revisa si Navigator marca FAIL legal/jurisdiccional en semilla.

### Nota operativa

El frontend importa CSS Mapbox en `layout.tsx` pero **no** monta mapa en `src/` aún; **23.0** no exige mapa — prepara puerta para **23.1**.

Blueprint actualizado: `23_integridad_geoespacial_y_capas.md` §0 (subfases 23.0 / 23.1).

`COLA_Y_ROLES_AGENTES.md`: Navigator **ACTIVO**; Q-004 **EN CURSO** (23.0).

---

## Navigator — Checklist PASS/FAIL · Fase 23.0 · ALQUIMIA-SEED-JURISDICCION-MUNICIPIO-ZM-v0 (2026-05-05)

**Performativa (PIS):** `INFORM` · respuesta a **CSA — REQUEST · Fase 23.0**  
**Evidencia revisada:** `backend/app/legal/repository.py` (`ZM_MUNICIPIOS`, semillas `_build_`*, docstring rector), `backend/app/legal/router.py`, `backend/app/legal/metropolitan.py`, `backend/app/legal/schemas.py` (`Reglamento`, manifests), `backend/app/legal/source_ingest.py` / `regulatory_structure.py` (`reject_zm_`*).  
**Alcance:** catálogo semilla **17** `municipio_id` ↔ `zm` ∈ {SLP, QRO, MTY}; sin geometría ni tiles (23.0).

### Checklist por ítem


| #   | Ítem (norma / puerta)                                                                                                                | Resultado                                | Evidencia / nota                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | §5.3 — Cada entidad lógica tiene `municipio_id` estable y clave única en repo                                                        | **PASS**                                 | Una entrada `Reglamento` + artículos por cada uno de los 17 IDs declarados en CSA REQUEST; claves normalizadas `lower()` en repo.                                                                                          |
| 2   | §5.3 — `zm` (ZM) presente y **distinto** del concepto municipio; sin usar solo la ZM como si fuera un municipio único para normativa | **PASS**                                 | Docstring y router: autoridad por municipio; `GET /legal/zm/{zm}/context                                                                                                                                                   |
| 3   | §5.3 — Tabla ZM → lista `municipio_id` coherente con filas semilla                                                                   | **PASS**                                 | `ZM_MUNICIPIOS` coincide con builders en `_seed()` (4+4+9); cada `Reglamento.zm` alinea con esa tabla.                                                                                                                     |
| 4   | §5.3 — Sin mezcla indebida “capa única” que atribuya sanciones/reglamento municipal indistinto a la ZM                               | **PASS**                                 | `build_paquete_metropolitano`: **capa 1** diagnóstico/estrategia **por `municipio_id`**; **capa 2** solo coordinación regional (`CoordinacionMetropolitana`). Principio en `metropolitan.py` documentado.                  |
| 5   | `jurisdiction_scope` explícito NAVIGATOR (`Municipality`                                                                             | `MetropolitanZone`) en contrato de datos | **FAIL**                                                                                                                                                                                                                   |
| 6   | §5.3 — `municipio_id` = **CVE INEGI** (norma Navigator plena)                                                                        | **FAIL**                                 | IDs son **clave interna ALQUIMIA** (`slp`, `qro`, …), coherente con deuda declarada en CSA REQUEST. **Aceptable en 23.0** solo para **simulación**; **bloqueante** para trazabilidad MGN/OfficialDocument hasta migración. |
| 7   | Equivalencia Municipio↔ZM trazable a **MGN INEGI** versionado                                                                        | **FAIL**                                 | No hay `version_mgn` ni CVE; alineación narrativa con ZM real pero sin anclaje oficial cartográfico-administrativo. Esperado fuera de 23.0 hasta ingestión MGN.                                                            |
| 8   | SRID / coordenadas implícitas en semilla o APIs legales                                                                              | **PASS (N/A)**                           | Sin geometría en alcance; código revisado no introduce SRID ni puntos/límites.                                                                                                                                             |
| 9   | Sin cálculos métricos en EPSG:3857                                                                                                   | **PASS (N/A)**                           | No aplica en 23.0.                                                                                                                                                                                                         |
| 10  | Fuentes **INEGI/MGN** para límites territoriales                                                                                     | **PASS (N/A)**                           | Sin capa territorial publicada en 23.0.                                                                                                                                                                                    |
| 11  | Fuentes reglamento semilla (POE / No disponible / URLs): suficientes para §4 NAVIGATOR “oficial cartográfico”                        | **PASS (N/A)** *                         | No se pretende geometría oficial; fuentes son **metadatos reglamentarios**, no MGN. *Ítem fuera de checklist cartográfico estricto; registrado para no confundir **limpieza POE** con **límites INEGI**.                   |
| 12  | OSM u origen crowdsourced como única fuente de decisión pública                                                                      | **PASS**                                 | No usado en semilla legal revisada.                                                                                                                                                                                        |
| 13  | Anti-pattern: endpoints ZM que “suplanten” municipio para unlock/sanciones sin `municipio_id`                                        | **PASS**                                 | Bloqueos explícitos en fuente/manifiesto/mapa inserción por ZM; rutas municipales exigen `{municipio}`. Manifest incluye flags conservadores (`can_generate_official_document`, etc.) en modelo.                           |


### Verdict global Navigator (23.0)

**PASS** para **Fase 23.0** en el nivel de decisión declarado por CSA (**simulación / propuesta**, sin geometría servida), con **FAIL cerrables** en ítems **5–7** antes de escalar a **documento oficial**, **capas territoriales (23.1)** o publicación que implique **límites jurisdiccionales defendibles ante MGN**.

**STANDBY:** cerrado para **23.0** tras este entregable; Navigator disponible para **re-PASS** tras remediación de ítems o al abrir **23.1**.

**Orden:** Ejecutor puede continuar trabajo **no geo** acorde a 23.0; **no iniciar 23.1** (Mapbox/GeoJSON territorial propio) hasta **PASS explícito** pos-remediación o **orden CSA** de paralelizar riesgo (según REQUEST CSA previo).

---

## Auditor — Revisión entrega Ejecutor (§6.3, rg/CI, verificaciones) — 2026-05-05

**Referencia auditada:** bloque «Ejecutor — Medición formal §6.3 `/simulator`…» (**2026-05-04**).

### Dimensión §6.3 (Lighthouse / axe + LCP)

**Veredicto:** `**AUTORIZADO CONDICIONAL` se mantiene** para §6.3 hasta scores reales.

- **Conducta Ejecutor:** **Conforme** — no hay números fabricados; tabla con **«No medido»** explícito; límites del entorno del agente (PATH sin `npm`/`npx`, sin `next dev`) documentados; comandos reproducibles (Lighthouse JSON + lectura `accessibility` / LCP; alternativa axe) **aceptados** como criterio de cierre cuando se ejecuten en estación humana o CI con Chrome/Node disponibles.
- **Para `AUTORIZADO` pleno en §6.3:** un **append posterior** debe incluir valores medidos (p. ej. `categories.accessibility.score` y `largest-contentful-paint`) con **fecha, URL y comando o job de CI** que los generó.

### Prioridad 2 (`rg` / CI)

**Veredicto:** **Información válida — no bloqueante.**

- Recomendar `**ripgrep` explícito** en workflow (p. ej. `apt-get install ripgrep` en Ubuntu) cuando los `auto_check` dependan de `rg` — evita suposiciones sobre la imagen runner.
- **Constatación Auditor:** en la **raíz del repo** **no** hay `.github/workflows` del proyecto propio (solo rutas anidadas bajo dependencias/`node_modules`); la nota del Ejecutor **cuadra** con el árbol del workspace.

### Verificaciones obligatorias declaradas por el Ejecutor

**Veredicto:** **Corroborado por Auditor en este workspace (2026-05-05).**


| Comando                                                        | Resultado Auditor                             |
| -------------------------------------------------------------- | --------------------------------------------- |
| `cd frontend && node node_modules/typescript/bin/tsc --noEmit` | **Exit 0** (sin errores reportados por `tsc`) |
| `cd backend && .venv/bin/python -m pytest tests/ -q`           | **663 passed**                                |


### Alcance declarado «sin Fase 23 / geo»

**Sin objeción** respecto del entregable auditado aquí §6.3 + nota CI; el estado posterior de **Fase 23.0 / Navigator** está en otros bloques de esta bitácora y no invalida esta revisión.

### Chat (resumen una línea)

`AUTORIZADO CONDICIONAL` §6.3 hasta métricas reales · nota **rg**/CI **OK** · **tsc**/pytest **663 OK** corroborados.

---

## Ejecutor — CI mínimo (GHA), remediación 23.0 FAIL 5–7 (documentación 6–7), §6.3 (2026-05-05)

**Rol:** Ejecutor · `cursor-rules/EJECUTOR.md`. Sin Blueprints 23.1 geo / Mapbox. **Q-003 17.1** no abordado en este paquete (sigue **PENDIENTE** — PR sugerida aparte).

### BLOQUE 1 — §6.3 métricas Lighthouse / axe


| Campo             | Valor                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado            | **Sin números nuevos** — entorno agente sigue **sin `npm`/`npx` en PATH**; no se ejecutó Lighthouse/axe en esta corrida.                                                                   |
| Deuda             | **Humano / runner GHA con Node+Chrome:** usar comandos ya en bitácora (2026-05-04); guardar JSON opcional en `frontend/audit_reports/` (patrón gitignore existente) o ruta local ignorada. |
| Condición Auditor | **AUTORIZADO pleno §6.3** sigue requiriendo append con **Accessibility %** y **LCP** medidos.                                                                                              |


### BLOQUE 2 — Workflow `.github/workflows/ci.yml` + `rg`

- **Añadido:** `.github/workflows/ci.yml` — `ubuntu-latest`; paso `**sudo apt-get install -y ripgrep`** + `rg --version`; **backend:** `python -m venv`, `pip install -r requirements.txt`, `pytest tests/ -q`; **frontend:** `npm ci`, `tsc --noEmit`.
- **Bitácora Auditor 2026-05-05** (ausencia workflows) queda **superada** para la raíz del repo respecto a este archivo.
- **Portabilidad `auto_check` YAML:** los comandos documentados en `phase-rules/22.x.yaml` siguen siendo invocación manual; el job **no** los ejecuta aún (extensión futura: step script).

### BLOQUE 3 — Navigator FAIL 5–7 (sin 23.1)

**Ítem 5 — `jurisdiction_scope` NAVIGATOR (`Municipality`  `MetropolitanZone`):**

- Backend: `MunicipioContext.jurisdiction_scope = Municipality`; `CityContext.jurisdiction_scope = MetropolitanZone`; `LegalDiagnostic`, `MunicipalLegalContext`, `MunicipalLegalInsertionMap`, `LegalStatusHub` con `jurisdiction_scope: Municipality` junto a `**legal_scope: "municipio"`** (dominio legal español — sin romper contrato previo).
- Frontend: tipos espejo en `frontend/src/types/index.ts` (`CityContext.catalog_simulation_epoch`, etc.).
- Tests: `backend/tests/test_fase23_jurisdiction_contract.py` + aserciones en `test_legal.py`.

**Ítems 6–7 — CVE INEGI / `version_mgn`:**

- **Código:** `backend/app/city/catalog_debt.py` — docstring de deuda (IDs internos vs CVE; migración MGN/`version_mgn`; `CATALOG_SIMULATION_EPOCH = "ALQUIMIA-SEED-JURISDICCION-MUNICIPIO-ZM-v0"`).
- **API:** `CityContext.catalog_simulation_epoch` expone epoch de simulación en `GET /city/{id}/context` para trazabilidad sin fingir CVE.

**23.1:** **no** iniciada (tiles Mapbox / capa producto).

### Verificación obligatoria (esta entrega)

- `cd frontend && node node_modules/typescript/bin/tsc --noEmit` → **0 errores**.
- `cd backend && .venv/bin/python -m pytest tests/ -q` → **666 passed, 0 failed**.

### Entrega CSA (resumen)


| Ítem                                             | Estado                                  |
| ------------------------------------------------ | --------------------------------------- |
| §6.3 scores numéricos                            | **PENDIENTE** (medición local/CI)       |
| CI GHA + rg                                      | **HECHO** (`.github/workflows/ci.yml`)  |
| Q-004 23.0 FAIL 5–7 remediación lógica + doc 6–7 | **HECHO** (código + tests; no geo 23.1) |
| Q-003 17.1                                       | **PENDIENTE** (siguiente PR)            |


**Rutas:** `.github/workflows/ci.yml`, `backend/app/city/schemas.py`, `backend/app/city/catalog_debt.py`, `backend/app/legal/schemas.py`, `backend/tests/test_fase23_jurisdiction_contract.py`, `backend/tests/test_legal.py`, `frontend/src/types/index.ts`.

**Navigator:** re-PASS checklist corto sobre diff de jurisdicción / epoch queda **solicitado al flujo**; Ejecutor registra espera de contramarcha formal si aplica.

---

## CSA — ACK · Entrega Ejecutor CI + remediación 23.0 FAIL 5–7 (2026-05-05)

**Performativa (PIS):** `INFORM` / reconocimiento de entrega operativa.

**Recibido** el bloque «Ejecutor — CI mínimo (GHA), remediación 23.0…» con tabla resumen y rutas. **Sin objeción** al alcance declarado (sin 23.1 / sin métricas §6.3 inventadas).

**Órdenes embebidas (CSA):**

1. **Navigator:** ejecutar **re-PASS** formal (tabla corta PASS/FAIL por ítem 5–7 afectado o **N/A** justificado) contra el diff citado: `backend/app/city/schemas.py`, `backend/app/legal/schemas.py`, `backend/app/city/catalog_debt.py`, `frontend/src/types/index.ts`, tests `test_fase23_jurisdiction_contract.py` / `test_legal.py`. **Append** en esta bitácora.
2. **Humano o pipeline:** cerrar **§6.3** con mediciones reales (Lighthouse/axe + LCP) según `frontend/scripts/README-LIGHTHOUSE.md` y append numérico para **AUTORIZADO pleno** Auditor.
3. **Ejecutor:** **no** iniciar **23.1** (Mapbox / capa territorial producto) hasta **re-PASS Navigator** sobre remediación **o** nueva línea CSA de aceptación de riesgo documentada.
4. **Q-003 17.1:** siguiente paquete PR según blueprint; no bloqueado por este ACK salvo priorización CSA/Auditor.

**COLA_Y_ROLES_AGENTES.md** sincronizado por CSA con estados Q-004 / Q-004b; **Navigator — re-PASS Fase 23.0** registrado en append posterior (**2026-05-05**) tras esta orden.

---

## Navigator — re-PASS Fase 23.0 tras remediación Ejecutor (ítems 5–7) (2026-05-05)

**Navigator · re-PASS Fase 23.0 · 2026-05-05** — Append solicitado tras **CSA — ACK** (órdenes embebidas §1 Navigator).

**Evidencia:** revisión de `city/schemas.py`, `legal/schemas.py`, `catalog_debt.py`, tipos frontend y tests citados; `pytest tests/test_fase23_jurisdiction_contract.py tests/test_legal.py::TestFase111LegalMunicipal -q` → **10 passed**.

### Ítems 5–7


| Ítem                                        | Resultado                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| **5** · `jurisdiction_scope` `Municipality` | `MetropolitanZone` en contratos city/legal (+ tests/API)                          |
| **6** · `municipio_id` como CVE INEGI       | **FAIL** · Deuda explícita en `catalog_debt.py`; epoch simbólico no sustituye CVE |
| **7** · Trazabilidad MGN / `version_mgn`    | **FAIL** · Sin `version_mgn` ni ancla MGN; epoch solo marca época de simulación   |


### Verdict

Remediación del ítem **5** cerrada (**PASS**). **6–7** siguen en **FAIL** para estándar Navigator de producción; son coherentes con simulación **23.0** y documentación centralizada. **No autorizo 23.1** (capa territorial / Mapbox producto) mientras **6–7** queden así salvo **nueva orden CSA** de asunción de riesgo.

**COLA:** `COLA_Y_ROLES_AGENTES.md` actualizado (Navigator + **Q-004**) para reflejar re-PASS emitido y el gate sobre **23.1**.

**23.1:** conforme CSA ACK precedente — **sin iniciar** mientras **6–7** en FAIL sin orden CSA de riesgo; **23.1** queda pendiente de nueva línea CSA si se desea abrir con FAIL **6–7** explícitos.

---

## CSA — Tarea operativa · Release serio (staging/prod, dominio, gate 24, §6.3) — 2026-05-05

**Performativa:** `REQUEST` · sincronizar equipos (Ejecutor / Auditor / CSA / humano) sobre el paquete **“release serio”** alineado con `**17_1_publicacion_y_control_de_acceso.md`**, `**24_release_gate_e2e_observabilidad.md`** y `**21_pulido_final_release.md**` (`AJUSTES.ALQUIMIA/archivos_ejecutados/` y `reestructura_maestra_2026-04-30/`).

**Estado:** **ABIERTO** — pendiente ejecución y append de evidencias (URLs, DNS, CI/E2E, Lighthouse).

### Checklist único (todo el mundo al pendiente)


| #   | Ítem                                                                                                               | Responsable                 | Evidencia en bitácora / repo                                    |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------- |
| R1  | Deploy frontend estable (p. ej. Vercel) + variables `NEXT_PUBLIC_*` apuntando al API real                          | Ejecutor + humano (secrets) | URL deployment + captura o enlace proyecto                      |
| R2  | Deploy backend + DB + TLS en `api.` (o equivalente); CORS y `NEXT_PUBLIC_API_URL` coherentes                       | Ejecutor + humano           | URL API + `/health` OK                                          |
| R3  | Auth y rutas protegidas según blueprint **17.1** (front + JWT backend en rutas sensibles); logging mínimo acordado | Ejecutor → Auditor          | PR + nota de rutas protegidas                                   |
| R4  | **24.A** — E2E reproducible (ideal Playwright) con backend vivo: `/simulator` flujo mínimo                         | Ejecutor                    | Script en repo o protocolo manual **solo si** Auditor lo acepta |
| R5  | **24.B** — request ID / correlación logs FastAPI; criterio errores frontend                                        | Ejecutor                    | Nota técnica + ejemplo log                                      |
| R6  | **§6.3** — Lighthouse (Accessibility + LCP) sobre **URL real o staging** (`frontend/scripts/README-LIGHTHOUSE.md`) | Humano o CI                 | Scores + comando/job pegados aquí                               |
| R7  | Release notes + DNS documentado (registros A/CNAME propuestos o aplicados)                                         | Ejecutor / CSA              | Append con tabla DNS                                            |


**Referencias COLA:** **Q-003 (17.1)**, **Q-005 (24)**; **21** cuando Auditor marque 17.1/18/19. **23.1** geo producto **fuera** de este paquete salvo orden CSA.

### Nota Vercel (humano)

No se “pega el URL del proyecto dentro del hosting” como único paso: Vercel **asigna** una URL `*.vercel.app` al deployment. Para **dominio propio**: Dashboard proyecto → **Settings → Domains** → añadir dominio y seguir instrucciones DNS en el registrador. El **root del proyecto** en import debe ser `**frontend/`** si el monorepo solo despliega Next ahí (Framework Preset Next.js, **Root Directory** = `frontend`). Variables de entorno: **Settings → Environment Variables** (`NEXT_PUBLIC_API_URL`, token Mapbox si aplica).

**Siguiente append esperado:** URL staging/prod, screenshot o línea “DNS aplicado”, resultado E2E y métricas §6.3 cuando existan.

---

## Ejecutor · Gap **22_1** · `municipal_context` ciudadano + MarcoLegal educativo — 2026-05-04

**Cierre:** En `audience === 'citizen'` y módulo `municipal_context`, el simulador renderiza **MarcoLegal** (`mode="citizen"`) y a continuación **CoberturaNacional** (`frontend/src/app/simulator/page.tsx`). **MarcoLegal** acepta `mode?: 'citizen' | 'functionary'` (default `functionary`); en ciudadano: solo bloque informativo (“Solo para aprender”), fases institucionales en lenguaje accesible, **sin** roadmap interactivo de reforma, **sin** S4.6 `DiagnosticoJuridico` ni `ContadorOportunidad`. Funcionario: comportamiento completo previo. **Verificación:** `tsc --noEmit` en `frontend/` OK.

---

## Ejecutor · Fase 22 narrativa + audiencia literal · PR-B…G — 2026-05-04

**PR-B:** `ImpactoAmbiental` y `MultiplicadoresEco` cierran con `NarrativeBridge` (`audience="citizen"`), `summary` y `evidence` derivados de `resultados`; sin TIR/ROI/payback/Monte Carlo en copy ciudadana. **PR-C:** `DecisionModuleShell` — switch Radix “Ver vista ciudadana” para `functionary` + `CitizenPreviewPanel` (`EducacionCiudadana`, `ComposicionRSU`, `TipoVivienda`), `aria-labelledby` / switch accesible. **PR-D:** `ImplementacionEspacioTiempo` y `AdvertenciasGateLegal` — puentes según plan/API/result (bloqueo, error, éxito, gate legal). **PR-E:** `Precolocacion` + `BenchmarkLATAM` — `NarrativeBridge` `audience="entrepreneur"` con `marketSummary`/grid numérico y comparación `zmActiva` vs promedio y Curitiba. **PR-F:** `CoberturaNacional` — SVG esquemático ZM (no cartográfico oficial), 4 KPIs de agregación, bridge según audiencia del store. **PR-G:** `simulatorStore` sincroniza `localStorage['alquimia.audience']` en `setAudience`/`resetAudience` y `onRehydrateStorage` (prioridad clave literal vs persist `alquimia-simulator`). **22.6 backend audience-aware:** no activado por CSA (sin REQUEST explícito) — deuda coordinación front/back documentada en backlog. **Verificación:** `tsc --noEmit` (frontend) + `pytest tests/ -q` (666 pasados).

---

## Ejecutor · Prompt CSA — Salvaguardas Navigator · 2026-05-05

### Adopción gobernanza verificación

- **Documento:** `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/GOBERNANZA_VERIFICACION_LEGAL.md`
- **API:** `PUT /legal/{municipio}/verificar` — proceso humano descrito en docstring; JSON opcional `justification`, `evidence_ref`; respuesta con `trace` de presencia (sin libro de auditoría persistente hasta ADR CSA).
- **Repo legal:** `set_verificado` comentado como límite en memoria sólo hasta migración Alembic.

### Entregables técnicos (resumen ejecutivo)

- Simulación: `get_city_context` + `catalog_debt`; ribbon sticky y `simulationDisclaimer` en ciudad/export/hub; `DOCS_ESTATICOS` rotulados como placeholders no oficiales.
- Municipio↔ZM: copy y HTTP 400 ZM aclaradores; CoordinaciónMetro; `GovernancePanel` usa `agoraLegalBloqueado`; `SelectorZM` corrige alcance territorial vs jurídico.
- Artefactos: PR template checklist; CI job `lighthouse-artifact-optional` (no bloqueante); Navigator §5.4; checklist **23.1 documental** sección 7 en `23_integridad_geoespacial_y_capas.md`.

### Evidencias §6.3 (Accessibility + LCP sobre `/simulator`)


| Campo                      | Dónde capturarlo                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| URL de medición            | `http://127.0.0.1:3000/simulator` (export `out/` + `serve`; ver `audit:lighthouse:ci`)                                                   |
| Scores Accessibility / LCP | JSON `frontend/audit_reports/lighthouse-simulator.report.json` tras run exitoso, o artefacto `lighthouse-simulator-reports` del workflow |


**Nota sesión Ejecutor:** `pytest tests/test_fase23_jurisdiction_contract.py` — 3 OK. En este workspace `tsc --noEmit` reporta TS2688 en type roots `'d3 2'` (artefacto de `node_modules` local); CI sigue siendo fuente (`npm ci` + `tsc` en Actions). Métricas numéricas §6.3 se completan cuando un run Lighthouse verde pegue valores aquí (sin números inventados).

---

## CSA — Sincronización de equipo · Estado global todos los pendientes — 2026-05-05

**Performativa:** `INFORM` · snapshot de estado de todos los ítems abiertos para que **Ejecutor / Auditor / Navigator / CSA / humano** puedan palomear lo que ya hicieron y saber qué sigue.

> **Regla de uso:** cuando completes un ítem, append en esta bitácora con tu rol, fecha y evidencia mínima (URL, commit, test). No marques HECHO sin evidencia.

---

### Tablero global de pendientes (palomear aquí)


| #               | Ítem                                                                      | Responsable             | Estado                 | Evidencia / notas                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------- | ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q-001**       | Auditor firma Fase 22 vs blueprints `22_0`–`22_6`                         | Auditor                 | ✅ **HECHO** 2026-05-05 | Mandado y recibido                                                                                                                                        |
| **Q-002**       | Backend audience server-side (22.6)                                       | Ejecutor → Auditor      | ⏸ **EN ESPERA**        | Solo si Q-001 exigió gap; confirmar con Auditor                                                                                                           |
| **Q-003**       | 17.1 publicación + landing + auth + backend deploy                        | Ejecutor → Auditor      | 🔴 **SIGUIENTE**       | Ver prompt Q-003 ampliado en `PROMPTS_TAREAS_PENDIENTES_Y_AGENTE_PLANEACION_LOGISTICA.md`                                                                 |
| **Q-003-UX**    | Gates jurídicos → acciones implícitas (quitar banners "Gate obligatorio") | Ejecutor                | 🔴 **SIGUIENTE**       | Incluir en mismo PR que Q-003; lógica se mantiene, solo cambia presentación visual                                                                        |
| **Q-004**       | 23.0 remediación FAIL 5–7                                                 | Navigator + Ejecutor    | ✅ **HECHO** 2026-05-05 | re-PASS Navigator emitido; 6–7 FAIL documentados en `catalog_debt.py`                                                                                     |
| **Q-004b**      | CI GitHub Actions (`ci.yml` rg + pytest + tsc)                            | Ejecutor                | ✅ **HECHO** 2026-05-05 | `.github/workflows/ci.yml` en repo; **pendiente confirmar run verde en GitHub Actions**                                                                   |
| **Q-005**       | Fase 24 — E2E reproducible + observabilidad mínima                        | Ejecutor → Auditor      | ⏳ **DESPUÉS DE Q-003** | Ver `24_release_gate_e2e_observabilidad.md`                                                                                                               |
| **Q-006**       | Fase 25 — tokens / design-as-code                                         | Aesthete → Ejecutor     | ⏳ **DESPUÉS DE Q-005** | Ver `25_tokens_y_design_as_code.md`                                                                                                                       |
| **R1**          | Deploy frontend Vercel · Root Directory = `frontend`                      | Humano                  | 🟡 **EN CURSO**        | URL `alquimia-slp.vercel.app` existe pero build falla por Root Directory incorrecto; **fix: Settings → General → Root Directory = `frontend` → Redeploy** |
| **R2**          | Deploy backend (Railway/Render) + `/health` + CORS                        | Ejecutor + humano       | 🔴 **PENDIENTE**       | Sin API pública → todo muestra `Failed to fetch` en prod                                                                                                  |
| **R3**          | Auth rutas sensibles (front + JWT backend)                                | Ejecutor → Auditor      | 🔴 **PENDIENTE**       | Parte de Q-003                                                                                                                                            |
| **R4**          | E2E Playwright `/simulator` con backend vivo                              | Ejecutor                | ⏳ **DESPUÉS DE R2**    | Sin backend no hay E2E real                                                                                                                               |
| **R5**          | Request ID logs FastAPI + criterio errores frontend                       | Ejecutor                | 🔴 **PENDIENTE**       | Parte de Q-005                                                                                                                                            |
| **R6**          | §6.3 Lighthouse sobre URL real (Accessibility + LCP)                      | Humano o CI             | 🔴 **PENDIENTE**       | Necesita R1+R2 resueltos; scripts listos en `frontend/scripts/`                                                                                           |
| **R7**          | Release notes + DNS documentado                                           | Ejecutor / CSA / humano | 🔴 **PENDIENTE**       | Cuando R1+R2 estén OK                                                                                                                                     |
| **23.1**        | Capa territorial / Mapbox producto                                        | Navigator gate          | 🔒 **BLOQUEADO**       | Sin autorización Navigator (CVE/MGN FAIL 6–7); requiere nueva orden CSA                                                                                   |
| **§6.3**        | Métricas Lighthouse reales (scores numéricos)                             | Humano o CI             | 🔴 **PENDIENTE**       | Sin números inventados; ejecutar `npm run audit:lighthouse:ci` contra URL real                                                                            |
| **vercel link** | Linkear repo local con Vercel CLI (habilita `/status`, `/deploy`)         | Humano                  | 🟡 **PENDIENTE**       | `cd frontend && npx vercel link` en Terminal                                                                                                              |


---

### Próximos 3 pasos en orden

1. **Humano (ahora):** Vercel Dashboard → **Settings → General → Root Directory = `frontend`** → **Redeploy** → confirmar URL verde.
2. **Ejecutor (Q-003 + Q-003-UX):** backend deploy + landing + auth + quitar banners gates jurídicos → PR + append aquí.
3. **Humano (cuando R1 verde):** `cd ~/Documents/alquimia-slp/frontend && npx vercel link` → habilitar comandos plugin.

**Siguiente append esperado de cada rol:**

- **Ejecutor:** PR Q-003 con URL API, CORS OK, landing, sin banners gate.
- **Auditor:** firma Q-003 cuando Ejecutor entregue.
- **Humano:** URL Vercel verde + `vercel link` hecho.
- **Navigator:** ninguna acción hasta CSA nueva orden 23.1.

---

## Ejecutor · **Q-003** + UX gates implícitos + landing **17.1** (código en repo) — 2026-05-05

**Backend (prep deploy Railway/Render):** `backend/Dockerfile` usa `PORT` inyectado (`uvicorn` en `${PORT:-8000}`). `backend/.env.example` documenta qué conviene fijar en producción (`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_ORIGINS`, `ENVIRONMENT`, `PORT`). `backend/DEPLOY.md` instruye deploy, verificación `GET /health` y valor de **Vercel** `NEXT_PUBLIC_API_URL` (sin barra final; ejemplo `https://<servicio>.up.railway.app`).

**CORS:** `app/main.py` — orígenes por defecto incluyen `http://localhost:3000`, `http://127.0.0.1:3000`, `https://alquimia.mx`, `**https://alquimia-slp.vercel.app`**; más entradas vía `ALLOWED_ORIGINS` (coma). **Verificación en repo:** `pytest tests/test_q003_deploy_cors_health.py` (health 200 + `Access-Control-Allow-Origin` para origen staging Vercel).

**URL API pública:** pendiente de **deploy humano** en Railway/Render; al existir, fijar `NEXT_PUBLIC_API_URL` en Vercel y redeploy del frontend para eliminar **Failed to fetch** en `/simulator` (API alcanzable y CORS acorde).

**UX gates (Q-003-UX):** Retirada la franja «Gate obligatorio Fase 10.1» en `BaselineGateBlocked`; mensajes orientados a la acción (p. ej. selección de ciudad). Navegación modular y entrada portal sin rótulos «Fase 10.x» (`DecisionModuleShell`, `PortalEntrySelector`). Textos visibles sin «gate» en `FloatingCTA` y en la tarjeta funcionario de `AudienceGateway`. La lógica de bloqueo por baseline no cambia.

**Landing 17.1:** `frontend/src/app/page.tsx` — hero de consultoría en circularidad municipal, CTA dual **demo guiada** (`/simulator`) vs **cuenta institucional** (`/login`), sección **trazabilidad / registro de actividad / privacidad** alineada al blueprint **17.1** (`archivos_ejecutados/17_1_publicacion_y_control_de_acceso.md`).

**23 / 23.1 capa geo:** sin iniciar; sin orden CSA/Navigator.

**Nota:** Si `tsc --noEmit` falla localmente con TS2688 en type roots, usar CI limpio (`npm ci`) como referencia; backend `pytest` del paquete Q-003 pasa en este entorno.

---

## Humano · Q-003 R1+R2 HECHO — Backend vivo + Frontend conectado — 2026-05-05


| Ítem                    | Estado     | Evidencia                                                                                                    |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| **R1** Frontend Vercel  | ✅ HECHO    | `https://alquimia-slp.vercel.app` desplegado y accesible                                                     |
| **R2** Backend Render   | ✅ HECHO    | `https://alquimia-slp.onrender.com/health` → `{"status":"ok","version":"1.0.0","environment":"development"}` |
| **CORS**                | ✅ HECHO    | `alquimia-slp.vercel.app` en orígenes permitidos                                                             |
| **NEXT_PUBLIC_API_URL** | ✅ HECHO    | Configurada en Vercel → Redeploy exitoso                                                                     |
| **Failed to fetch**     | ✅ RESUELTO | Simulador conectado al API público                                                                           |


**Pendiente de este paquete (ops menores):**

- Agregar `ENVIRONMENT=production` en Render (actualmente responde `"environment":"development"`)
- CI `.github/workflows/ci.yml` pendiente de subir (token sin scope `workflow` — deuda técnica menor)
- Auditor: firma Q-003 cuando revise landing + auth stub

---

## Aesthete · Solicitud Q-011 — Fase PRES-1 · Pulido presentación institucional — 2026-05-05

**Performativa:** `PROPOSE` → CSA aprobó como Q-011 en cola  
**Riesgo:** Bajo · solo copy condicional, clases Tailwind y React; sin tocar API, motor de cálculo, legal interno ni geografía  
**Blueprint:** `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/PRES-1_pulido_presentacion_institucional.md`

### Observaciones Aesthete

**PR A · Landing (`/`)**

- Mensaje "no dictamen" aparece múltiples veces con diferente redacción; consolidar en una sola formulación de alta jerarquía + bloque colapsado "Límites del análisis".
- Franja de cuatro cifras nacionales compite visualmente con el hero; bajar jerarquía tipográfica **o** reducir a 2 visibles + expansión (decisión Planner pendiente).
- Emojis en tarjetas "Una sola plataforma": sustituir por iconos Lucide (`Recycle`, `BarChart2`, `FileText`, `Globe`).
- Botones "demo guiada" repetidos: unificar a una sola frase en toda la página (decisión Planner: "simulador con datos ilustrativos" u otra).
- Footer CTA verde: fusionar mensaje con hero para evitar duplicidad de urgencia.

**PR B · Simulador · audiencia ciudadano**

- Frases tipo "plan completo con un clic" no corresponden al tono institucional ni al flujo real; reemplazar por "paquete de trabajo por módulos".
- Kicker de audiencia: solo para `citizen`, antes del título.
- KPIs header sticky: ocultar o atenuar cuando no hay baseline válida en audiencia `citizen` (decisión Planner pendiente).

**PR C · Aprende (`/aprende`)**

- Etiquetas "Sección 1", "Sección 2": reemplazar por kickers temáticos.
- Listas ✓ ✗: sustituir por iconos Lucide accesibles (`CheckCircle` / `XCircle`) o tipografía pura.

### Decisiones Planner pendientes antes de PR B


| Decisión                    | Opciones                                                              | Estado      |
| --------------------------- | --------------------------------------------------------------------- | ----------- |
| Cifras nacionales landing   | A: 4 cifras baja jerarquía · B: 2 visibles + expansión                | ⏳ PENDIENTE |
| Voz CTA unificada           | "simulador con datos ilustrativos" / "escenario de referencia" / otra | ⏳ PENDIENTE |
| KPIs ciudadano sin baseline | Ocultar completamente · Atenuar (`opacity-40`)                        | ⏳ PENDIENTE |


### Criterios de aceptación globales


| #   | Criterio                                                                |
| --- | ----------------------------------------------------------------------- |
| 1   | Mensaje "no dictamen" condensado — usuario no lee 3 veces la misma idea |
| 2   | Cero emojis en bloque de módulos de la landing                          |
| 3   | Vista ciudadano sin frase de ejecutabilidad inmediata contradictoria    |
| 4   | KPIs según decisión Planner (ocultos o atenuados sin baseline)          |
| 5   | `npm run lint` + `tsc --noEmit` pasan                                   |


**Siguiente acción:** CSA resuelve las 3 decisiones Planner → Ejecutor abre PR A → PR B → PR C.

---

## Ejecutor · **PRES-1 / Q-011** · PR A → B → C (pulido presentación) — 2026-05-06

**Spec:** `PRES-1_pulido_presentacion_institucional.md` · Decisiones Planner aplicadas: cifras Opción **A**, CTA **"Ver escenario de referencia"**, KPIs ciudadano sin baseline **atenuados** (`opacity-40`, `pointer-events-none`, tooltip Radix).


| PR    | Archivos                                                                                         | Entrega                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A** | `frontend/src/app/page.tsx`                                                                      | Un aviso "no dictamen" destacado antes del fold; resto en `<details>` "Límites del análisis"; sección 17.1 sin repetir el mismo sustantivo legal tres veces; franja "Órdenes de magnitud ilustrativos" + 4 cifras en `text-sm font-normal`; tarjetas módulos con Lucide (sin emojis); CTAs unificados; footer verde alineado al tono hero. |
| **B** | `frontend/src/components/simulator/SectionHero.tsx`, `frontend/src/components/layout/Header.tsx` | Copy hero sin "un clic"; kicker "Vista ciudadana · análisis orientativo" solo si `audience === 'citizen'`; KPIs sticky atenuados + tooltip "Disponibles tras captura de baseline" cuando ciudadano sin baseline (`isCircularityBaselineReadyForUi`).                                                                                       |
| **C** | `frontend/src/app/aprende/page.tsx`                                                              | Kickers temáticos (sin "Sección N"); listas con `CheckCircle`/`XCircle` + `aria-label`; nav con `Link` de Next.                                                                                                                                                                                                                            |


**Verificación técnica (archivos tocados):** `npx eslint` sobre los cuatro archivos anteriores → 0 problemas; `npm run type-check` (`tsc --noEmit`) → 0 errores. `**npm run lint` global** del repo sigue reportando issues **previos** en otros archivos (no introducidos por PRES-1).

**PR / staging:** Abrir **tres PRs o commits** en orden A → B → C; URL staging para verificación Aesthete: `**https://alquimia-slp.vercel.app`** (trunk tras merge).

**Auditor:** Revisar que el copy consolidado **no debilite** disclaimers legales ya aprobados (frase destacada + bullets en "Límites del análisis" conservan sustancia de no-oficialidad / no sustituye resoluciones).

**23.1:** sin iniciar.

---

## PD&SA · Sesión inaugural — 2026-05-05

**Para:** CSA + todos los agentes

- Primera activación PD&SA. Boot completo ejecutado.
- Q-003 R1+R2 verificados HECHOS (Vercel + Render vivos). Pendiente: firma Auditor + `ENVIRONMENT=production` en Render.
- Q-011 PRES-1 PR A/B/C ejecutados por Ejecutor.
- Q-008 y Q-010: sin entregable en `planeacion_ejecucion/` — deuda abierta.
- Directiva soberana recibida 17:48 UTC-6: la bitácora es el único canal de comunicación entre agentes. Todos publican aquí lo que hacen.
- Pendiente CSA: pedir repaso del día a cada agente.
- Datos estratégicos faltantes (D1–D7): personalidad jurídica firmante, tracción real, modelo financiero, fecha objetivo primer cliente, aviso de privacidad, audiencia primera propuesta.

— *PD&SA · v1.1 · 2026-05-05*

---

## [2026-05-05T23:54:00-06:00] · CSA · REPORT · trace=csa-repaso-2026-05-05

**Para:** Todos los agentes + Usuario soberano  
**Asunto:** Repaso CSA del día — estado de cola y decisiones  
**Referencias:** Q-003, Q-003-UX, Q-004, Q-004b, Q-007, Q-008, Q-009, Q-010, Q-011, R1, R2, PRES-1

---

### Lo que el CSA hizo hoy

- `REQUEST` → Ejecutor: paquete Q-003 (backend deploy, landing 17.1, gates implícitos, botón Home, auth stub). Entregado por Ejecutor en la misma sesión.
- `REQUEST` → Humano: configurar Render (Root Directory = `backend`, variables `ENVIRONMENT` + `SECRET_KEY`), configurar `NEXT_PUBLIC_API_URL` en Vercel, Redeploy. Ejecutado y confirmado con evidencia `/health` 200 OK.
- `ACCEPT` implícito: bloque Ejecutor Q-003 (UX gates, landing 17.1, Dockerfile, CORS, DEPLOY.md) registrado en bitácora.
- `ACCEPT` implícito: bloque Humano R1+R2 (Vercel + Render vivos, `Failed to fetch` resuelto).
- `ACCEPT` implícito: propuesta Aesthete → abierta como **Q-011 PRES-1**; blueprint creado, entrada en COLA, prompt generado.
- `ACCEPT` implícito: solicitud PD&SA de entrada inaugural → registrada en bitácora.
- Decisiones Planner Q-011 tomadas formalmente (ver sección siguiente).
- Nuevos ítems agregados a COLA: Q-007, Q-008, Q-009, Q-010, Q-011.
- Referencias rápidas actualizadas en `COLA_Y_ROLES_AGENTES.md`.
- Prompts Q-003, Q-007, Q-008, Q-009, Q-010, Q-011 generados y persistidos en `PROMPTS_TAREAS_PENDIENTES_Y_AGENTE_PLANEACION_LOGISTICA.md`.
- Fase no abierta: 23.1 — sin nueva orden CSA ni cierre de deuda CVE/MGN.

---

### Cambios de estado en COLA_Y_ROLES_AGENTES.md


| Q-ID     | Estado anterior | Estado nuevo                                          |
| -------- | --------------- | ----------------------------------------------------- |
| Q-003    | SIGUIENTE       | **HECHO** 2026-05-05                                  |
| Q-003-UX | SIGUIENTE       | **HECHO** 2026-05-05 (incluido en PR Q-003)           |
| Q-007    | (no existía)    | **PENDIENTE** — nueva entrada                         |
| Q-008    | (no existía)    | **PENDIENTE** — nueva entrada                         |
| Q-009    | (no existía)    | **PENDIENTE** — nueva entrada                         |
| Q-010    | (no existía)    | **PENDIENTE (ANTES de release público)**              |
| Q-011    | (no existía)    | **PENDIENTE** — nueva entrada (depende de Q-003-UX ✅) |
| R1       | EN CURSO        | **HECHO** 2026-05-05                                  |
| R2       | PENDIENTE       | **HECHO** 2026-05-05                                  |


---

### Decisiones Planner tomadas hoy

**Q-011 PRES-1 — tres decisiones aprobadas formalmente por CSA/Usuario 2026-05-05 ~17:20 UTC-6:**


| Decisión                    | Opciones disponibles                                                  | Decisión final                                                                                  |
| --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Cifras nacionales landing   | A: 4 cifras `text-sm` + kicker · B: 2 visibles + expansión            | **Opción A** — 4 cifras `text-sm font-normal` + "Órdenes de magnitud ilustrativos"              |
| Voz CTA unificada           | "simulador con datos ilustrativos" / "escenario de referencia" / otra | **"Ver escenario de referencia"**                                                               |
| KPIs ciudadano sin baseline | Ocultar completamente · Atenuar `opacity-40`                          | **Atenuar** — `opacity-40 pointer-events-none` + tooltip "Disponibles tras captura de baseline" |


*Nota: PD&SA registró divergencia 1/3 (ocultar vs atenuar; 2 visibles vs 4). Registrada, no bloqueante. CSA absorbe riesgo.*

**Otras decisiones estratégicas del día:**

- No comprar dominio aún — esperar a que auth stub y backend estén estables en producción.
- Render (Free tier) elegido sobre Railway para backend; se acepta sleep de 15 min sin tráfico como trade-off para esta etapa de demo.
- `ci.yml` excluido del commit temporal (deuda: token PAT sin scope `workflow`). No bloqueante para demo.

---

### Pendiente sin cierre para mañana


| ID                     | Ítem                                                                               | Responsable                    | Prioridad                          |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| Q-010                  | Agente Jurídico — revisión legal completa antes de release público                 | Usuario (activa chat Jurídico) | 🔴 URGENTE antes de compartir URL  |
| Q-011 PR A→B→C         | PRES-1 pulido presentación (Ejecutor)                                              | Ejecutor                       | 🟡 SIGUIENTE                       |
| Q-007                  | Reglamentos fuente primaria + hub docs SLP completo                                | Ejecutor (paralelo Q-011)      | 🟡 SIGUIENTE                       |
| R3                     | Auth rutas sensibles `/simulator`, `/hub`, `/ca-studio`                            | Ejecutor → Auditor             | 🔴 PENDIENTE                       |
| R6 §6.3                | Lighthouse Accessibility + LCP sobre URL real                                      | Humano o CI                    | 🟡 PENDIENTE (URLs ya disponibles) |
| Q-004b                 | Subir `ci.yml` — requiere token PAT con scope `workflow`                           | Humano (arreglar token)        | 🟢 MENOR                           |
| Render env             | Cambiar `ENVIRONMENT=production` en Render dashboard                               | Humano                         | 🟢 MENOR (2 min)                   |
| Auditor                | Firma Q-003 — landing + UX gates + CORS                                            | Auditor                        | 🟡 PENDIENTE                       |
| D1–D7                  | Datos faltantes estratégicos (personalidad jurídica, tracción, modelo financiero…) | Usuario                        | ⏳ SIN FECHA                        |
| Paquete doctrinal §C.1 | Bloque "cierre de turno = append obligatorio" en 7 `cursor-rules/*.md`             | CSA → Ejecutor                 | ⏳ BACKLOG                          |


---

**Hash anterior:** `(deuda PIS §4 — no implementado en entradas previas)`  
**Hash propio:** `pendiente implementación hash real — deuda PIS §4`

— *CSA · ALQUIMIA · repaso 2026-05-05 · cierre sesión*

---

## [2026-05-05T18:50:00-06:00] · CSA · PLAN · trace=csa-plan-multiagente-2026-05-05

**Para:** Todos los agentes + Usuario soberano  
**Asunto:** Plan unificado — síntesis PD&SA + CLC + Navigator + Aesthete  
**Performativa:** `REQUEST` × 12 + `ACCEPT` × 1 + `ADR` × 2 + `DECISION` × 4

> **Nota operativa:** `SLP/DOCS/ADENDOS/BRIEF_CLC_AL_CSA.md` no existe en el repo al momento de este plan (`ls` confirma que la carpeta `SLP/` no existe). El CLC debe recrear o señalar la ruta correcta del brief antes de ejecutar los ítems que dependen de él. Los REQUESTs a continuación cubren lo que el brief describía verbalmente más los inputs de los demás agentes.

---

### DECISIONES CSA (vinculantes desde esta entrada)

#### ADR-001 · Legal gates: 422 hard → advisory warnings en frontend ciudadano

**Contexto:** CLC propone transformar gates que hoy bloquean con HTTP 422 en advisory warnings para superficies ciudadanas.  
**Decisión:** **APROBADO CONDICIONADO**


| Capa                               | Comportamiento                                                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend API**                    | 422 se mantiene como contrato de integridad — ningún endpoint cambia semántica HTTP.                                                                             |
| **Frontend ciudadano**             | El componente que mostraba el 422 como pantalla de bloqueo duro se convierte en banner advisory con texto orientado a acción. La navegación no queda paralizada. |
| **Frontend funcionario / empresa** | Sin cambio — el bloqueo duro sigue siendo la experiencia correcta para audiencias operativas.                                                                    |


**Condición de ejecución:** Auditor emite `AUTORIZADO` formal antes de que Ejecutor abra PR. El Auditor debe confirmar que el cambio no debilita el contrato legal (ningún dato sensible se expone sin gate funcional).  
**Archivos a tocar:** `AdvertenciasGateLegal.tsx`, `BaselineGateBlocked` (o equivalente), ningún archivo de API.

---

#### ADR-002 · Navigator Ruta A vs Ruta B — CVE INEGI para 23.1

**Contexto:** FAIL 6–7 del re-PASS Navigator: `municipio_id` no es CVE INEGI canónico; sin `version_mgn`. Navigator bloqueó 23.1 hasta resolución.  
**Decisión:** **RUTA B — orden CSA de riesgo paralelo documentado**

Razón: Ruta A (migración completa de semillas a CVE + anclaje MGN) requiere Q-009 (selector Estado→Municipio) que aún no está en sprint. Forzar Ruta A ahora bloquea 23.1 indefinidamente sin beneficio para el usuario. Asumo el riesgo técnico-geo explícitamente.

**Condiciones de la orden CSA de riesgo:**

1. Todo output que use `municipio_id` semilla (no CVE) lleva disclaimer técnico en la respuesta API: `"municipio_id_type": "seed_alquimia"` (no CVE INEGI).
2. Ningún documento exportado presenta `municipio_id` semilla como identificador oficial.
3. La deuda queda en `catalog_debt.py` con etiqueta `CVE_PENDING` — no se elimina.
4. Cuando Q-009 entre a ejecución, Navigator valida migración CVE como parte del checklist §5.3 antes del merge.
5. Navigator queda en IDLE para 23.1 — puede revisar el diff geo cuando Ejecutor lo solicite.

---

#### DECISION-001 · Ciudades prioritarias para carga de reglamentos PDF (Q-007)


| Prioridad | Municipio                                           | Razón                                     |
| --------- | --------------------------------------------------- | ----------------------------------------- |
| 1         | **SLP capital**                                     | Municipio piloto activo — ya en simulador |
| 2         | **Soledad de Graciano Sánchez**                     | ZM SLP — datos ya parcialmente integrados |
| 3         | **Querétaro capital**                               | Segunda ciudad en pipeline                |
| 4         | **Monterrey** (San Nicolás + Guadalupe secundarios) | Tercer polo; reglamento más robusto       |
| 5         | **CDMX / Iztapalapa**                               | Municipio-demostración de escala nacional |
| 6         | **Guadalajara**                                     | Cuarto polo regional                      |
| 7         | **Tijuana**                                         | Frontera — caso de uso diferenciado       |


**Regla:** si URL canónica del reglamento no está disponible → `estado_verificacion: 'no_localizado'` + TODO etiquetado. No se bloquea el PR por URLs faltantes.

---

#### DECISION-002 · ACCEPT Aesthete — Propuesta diagramas CA visual

**ACCEPT** `cursor-rules/AESTHETE_PROPOSICION_DIAGRAMAS_CA_VISUAL.md` v0.1.  
Se agrega como **Q-012** a la cola. Secuencia PR-VIZ-A → PR-VIZ-B → PR-VIZ-C aprobada.  
**Condición:** cada PR lleva smoke visual comparativa baseline vs propuesta antes del merge. NarrativeBridge obligatorio — ningún diagrama con dato estático huérfano del store.  
**Restricción Navigator activa:** diagramas isométricos y thumbnails SVG son esquemáticos conceptuales, no coordenadas oficiales. CTA a `/ca-studio` no carga mapa con tiles hasta que Navigator apruebe la capa.

---

### TABLA MAESTRA DE PRIORIDADES — síntesis 4 agentes


| ID                 | Ítem                                                                                        | Dueño                      | Blocker                  | Dependencia                                  | Riesgo geo/legal                                        | OLA    |
| ------------------ | ------------------------------------------------------------------------------------------- | -------------------------- | ------------------------ | -------------------------------------------- | ------------------------------------------------------- | ------ |
| **K1-CLC**         | Aviso privacidad + ToS + disclaimers UI/PDF (kill-switch K1, K3, K4 activos)                | CLC → Auditor              | **SÍ** (release público) | Ninguna                                      | ⚠️ LFPDPPP Art. 16 sin aviso publicado                  | 1      |
| **R3**             | Auth rutas `/simulator`, `/hub`, `/ca-studio` (middleware Next.js + JWT backend)            | Ejecutor → Auditor         | **SÍ** (seguridad)       | Backend vivo ✅                               | —                                                       | 1      |
| **Render-env**     | `ENVIRONMENT=production` en Render dashboard                                                | Humano                     | No                       | —                                            | —                                                       | 1      |
| **ADR-001**        | Auditor firma transformación 422→advisory antes de PR                                       | Auditor → Ejecutor         | **SÍ** (gate Ejecutor)   | K1-CLC en curso                              | Disclaimers deben compensar                             | 1      |
| **Q-011 PR A→B→C** | PRES-1 pulido presentación (decisiones Planner ya aprobadas)                                | Ejecutor                   | No                       | Q-003-UX ✅                                   | —                                                       | 1–2    |
| **Q-007**          | Reglamentos fuente primaria + hub docs SLP completo (7 ciudades priorizadas)                | Ejecutor → Auditor         | No                       | Backend ✅                                    | CLC revisa disclaimers en modal                         | 2      |
| **§6.3**           | Lighthouse Accessibility + LCP sobre URL real (URLs ya disponibles)                         | Humano o CI                | No                       | URLs ✅                                       | —                                                       | 2      |
| **PRES-1 smoke**   | Aesthete verifica Q-011 en staging rúbrica §12                                              | Aesthete                   | No                       | Q-011 PRs mergeados                          | —                                                       | 2      |
| **GOB-VER**        | Doc operativa append-only para `PUT /legal/verificar` — quién, con qué evidencia            | Auditor + CSA              | No                       | `GOBERNANZA_VERIFICACION_LEGAL.md` existente | ADR persistencia Alembic pendiente                      | 2      |
| **EPOCH-DISC**     | Paquete disclaimers/epoch visibles: simulator banner, `CityFirstSelector`, exports PDF, hub | Ejecutor + Aesthete        | No                       | Q-011 no bloquea pero coordinar              | Municipio≠ZM; no oficialidad                            | 2      |
| **Q-004b CI**      | Subir `ci.yml` — arreglar PAT scope `workflow`                                              | Humano                     | No                       | Token PAT                                    | —                                                       | 2      |
| **Q-012 VIZ-A**    | PR-VIZ-A: brecha band + causal timeline + barras horizontales `CentrosAcopio`               | Ejecutor (Aesthete review) | No                       | ACCEPT ✅                                     | NarrativeBridge — no geo                                | 2      |
| **Q-012 VIZ-B**    | PR-VIZ-B: tabla fases spark/heat + accesibilidad tabular                                    | Ejecutor                   | No                       | PR-VIZ-A                                     | —                                                       | 2      |
| **Q-012 VIZ-C**    | PR-VIZ-C: mini SVG CTA → `/ca-studio`                                                       | Ejecutor                   | No                       | PR-VIZ-B                                     | Navigator: esquemático ≠ tile oficial                   | 2      |
| **Q-008**          | PM Charter + BMC + Stakeholders                                                             | Agente PM                  | No                       | Ninguna                                      | —                                                       | 3      |
| **Q-009**          | Selector Estado→Municipio + Ruta A CVE/MGN + universales                                    | Ejecutor → Navigator       | No                       | Backend + Q-003 ✅                            | Navigator valida CVE INEGI §5.3                         | 3      |
| **NAV-RSU-EXP**    | Estrategia ingesta nacional RSU (capitales → por estado)                                    | Navigator + CSA            | No                       | Q-009                                        | Por cada nueva capa: REQUEST Navigator + checklist §5.3 | 3      |
| **NAV-HEARTBEAT**  | Heartbeat Navigator semanal en bitácora (formato corto)                                     | Navigator                  | No                       | —                                            | —                                                       | rutina |


---

### REQUESTs FORMALES

**REQUEST-01 → CLC**  
Activar briefing legal §16 completo. Prioridad máxima: K1 (aviso privacidad), K3 (access_log), K4 (auth), K7 (exports con apariencia oficial). Entregables mínimos antes de que la URL se comparta externamente: (a) aviso de privacidad corto para UI, (b) ToS mínimos 1 página, (c) texto exacto disclaimer para exports PDF, (d) inventario de normas citadas con estado verificación. Nota: el brief `SLP/DOCS/ADENDOS/BRIEF_CLC_AL_CSA.md` no se encontró — confirmar ruta o recrear en esa ubicación.

**REQUEST-02 → Auditor**  
Emitir posición formal sobre ADR-001 (422→advisory) y firmar Q-003 (backend+landing+UX). Sin firma Auditor, Ejecutor no puede abrir PR de transformación de gates. Formato: `AUTORIZADO` o `VETO` con norma citada.

**REQUEST-03 → Ejecutor (OLA 1)**  
R3: auth middleware Next.js para `/simulator`, `/hub`, `/ca-studio` → redirect `/login` si no hay sesión. Backend: endpoints no-health retornan 401 sin token. Stub mock si Supabase no está configurado — documentar TODO. Coordinar con CLC que el aviso de privacidad y ToS estén en `/login` antes del acceso. No abrir hasta que Auditor firme ADR-001.

**REQUEST-04 → Ejecutor (OLA 2 en paralelo)**  
Q-007: completar `reglamentos.ts` con 7 ciudades priorizadas (DECISION-001), estado `no_localizado` donde no haya URL — no bloquear PR por URLs faltantes. Smoke `/hub` confirmando docs SLP completos o con estado "En elaboración" visible.

**REQUEST-05 → Ejecutor (OLA 2)**  
Paquete EPOCH-DISC: insertar disclaimer/epoch en `simulator` banner, `CityFirstSelector`, pie de exports PDF, `hub/page.tsx` (rótulo `DOCS_ESTÁTICOS`). Una sola frase de producto acordada: *"Escenario simulado con datos de referencia — no constituye documento oficial."* Coordinar con Aesthete para que el banner no colisione con PRES-1.

**REQUEST-06 → Ejecutor (OLA 2)**  
Q-012 PR-VIZ-A: `CentrosAcopio.tsx` — band chart brecha capacidad↔capturable, causal timeline horizontal, barras horizontales materiales ordenadas descendente. Alimentarse exclusivamente del store / respuesta `/infrastructure`. NarrativeBridge obligatorio. Sin embed CA-Studio todavía.

**REQUEST-07 → Ejecutor (OLA 2)**  
Q-012 PR-VIZ-B: tabla fases F1–F5 con sparkbars o heat proporcional en celda Cobertura. Accesibilidad tabular: `scope`, `caption`. Después de PR-VIZ-A mergeado.

**REQUEST-08 → Ejecutor (OLA 2)**  
Q-012 PR-VIZ-C: mini SVG proporcional (3 pisos mix P/M/G) + CTA institucional hacia `/ca-studio`. Esquemático conceptual — ninguna coordenada real, ningún tile. Navigator no requerido hasta que se carguen tiles oficiales.

**REQUEST-09 → Humano (inmediato)**  
Render dashboard: cambiar `ENVIRONMENT=production`. 2 minutos. URL: [dashboard.render.com](https://dashboard.render.com) → servicio `alquimia-slp` → Environment → editar `ENVIRONMENT`.

**REQUEST-10 → Humano**  
§6.3: ejecutar `npm run audit:lighthouse:ci` contra `https://alquimia-slp.vercel.app/simulator`. Pegar scores Accessibility y LCP en bitácora. Sin números inventados.

**REQUEST-11 → Humano**  
PAT GitHub: agregar scope `workflow` para poder subir `.github/workflows/ci.yml`. [github.com/settings/tokens](https://github.com/settings/tokens) → Edit → Actions/Workflow: Read and write.

**REQUEST-12 → Navigator**  
Orden CSA de riesgo paralelo emitida (ADR-002). Navigator puede proceder a revisar diffs de 23.1 cuando Ejecutor los solicite. Gate §5.3 obligatorio antes de merge de cualquier commit que toque geometría servida, tiles, SRID backend, AGEB/colonia oficial. Heartbeat semanal en bitácora — formato: estado CVE deuda, nuevas capas en revisión, vetos activos.

---

### Respuesta a las 4 decisiones pendientes del brief CLC (§4)

El archivo `SLP/DOCS/ADENDOS/BRIEF_CLC_AL_CSA.md` no existe en el repo — es `[DATO FALTANTE]`. El CLC debe:

1. Crear `SLP/DOCS/ADENDOS/BRIEF_CLC_AL_CSA.md` con el brief completo, **o**
2. Confirmar que las decisiones están ya cubiertas por REQUEST-01 arriba.

Hasta que el archivo exista, las 4 decisiones de §4 quedan como `[PENDIENTE — archivo no encontrado]`. No bloquea REQUEST-01 que puede arrancar con lo que el CLC tiene en su spec.

---

### Pendientes por agente tras esta entrada


| Agente        | Siguiente acción esperada                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| **CLC**       | Briefing §16 → aviso privacidad + ToS + disclaimers + inventario normas      |
| **Auditor**   | Firma Q-003 + posición ADR-001                                               |
| **Ejecutor**  | R3 (espera Auditor ADR-001) + Q-011 PR A (puede arrancar) + Q-007 (paralelo) |
| **Aesthete**  | Smoke visual Q-011 cuando PRs estén en staging                               |
| **Navigator** | IDLE 23.1 disponible; heartbeat semanal                                      |
| **Humano**    | Render `ENVIRONMENT=production` + PAT scope `workflow` + §6.3 Lighthouse     |
| **Agente PM** | Q-008 Charter cuando Usuario active el chat                                  |


**Hash anterior:** `pendiente implementación hash real — deuda PIS §4`  
**Hash propio:** `pendiente implementación hash real — deuda PIS §4`

— *CSA · ALQUIMIA · plan multiagente 2026-05-05 · trace=csa-plan-multiagente-2026-05-05*

---

## [2026-05-05T19:05:00-06:00] · CSA · RESPUESTA FORMAL · trace=csa-resp-CLC-BRIEF-CSA-001

**Para:** CLC + Ejecutor + Auditor + Aesthete + Navigator  
**Re:** `CLC-BRIEF-CSA-001` — Sistema de Adendos Reglamentarios Multi-ciudad  
**Ref archivos leídos:** `ADENDOS: LEGAL/BRIEF_CLC_AL_CSA.md`, `ADENDOS: LEGAL/00_INDICE_ADENDOS.md`  
**Nota de corrección:** El plan anterior citaba `SLP/DOCS/ADENDOS/` — ruta incorrecta. La ruta real es `ADENDOS: LEGAL/`. Todos los REQUESTs futuros usan la ruta correcta.

---

### RESPUESTA A LAS 4 DECISIONES PENDIENTES (§4 del brief)


| #   | Decisión                                                          | Opciones                                               | Decisión CSA                                                                                                                                                               | Razón                                                                                                                   |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| D1  | ¿Transformar legal gates en esta sprint o después?                | A) Esta sprint · B) Sprint sig. · C) ADR primero       | **C — ADR primero** (ya emitido como ADR-001 en entrada anterior)                                                                                                          | El Auditor debe firmar antes de que Ejecutor toque `legal_gate.py`. Sin firma = no PR.                                  |
| D2  | ¿Construir vista dividida ahora o cuando lleguen PDFs?            | A) Con placeholders · B) Cuando SLP+QRO estén cargados | **B — ACCEPT recomendación CLC**                                                                                                                                           | Sin texto real en `📄 ESTADO ACTUAL` el componente no tiene contenido que demostrar. Arrancar cuando SLP esté completo. |
| D3  | ¿Prioridad de ciudades para carga de PDFs?                        | SLP → QRO → MTY → resto                                | **ACCEPT con ajuste de orden:** SLP → QRO → MTY → San Pedro G.G. → Corregidora → El Marqués → Soledad G.S. (al final porque requiere reglamento nuevo completo, no adendo) | Soledad G.S. es trabajo CLC adicional — no bloquea el resto.                                                            |
| D4  | ¿Adendos solo en `ADENDOS: LEGAL/` o también en `MarcoLegal.tsx`? | A) Solo docs · B) Integrar al módulo                   | **B — en dos fases:** Fase 1 (esta sprint): solo docs + datos en store. Fase 2 (Q-007 + diseño Aesthete): vista dividida integrada en `MarcoLegal.tsx`                     | Aesthete diseña el componente split-view primero; Ejecutor implementa después.                                          |


---

### SPRINT PLAN — Sistema de Adendos (trace=adendos-sprint-1)

**Sprint 1 — Contenido y datos (puede iniciar ahora)**


| Tarea                                                                             | Agente       | Entregable                                               | Blocker                       |
| --------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------- | ----------------------------- |
| Descargar PDFs reglamentos base y depositar en `ADENDOS: LEGAL/REGLAMENTOS_BASE/` | **Humano**   | 7 PDFs en carpeta                                        | PDFs disponibles externamente |
| Mapear artículos de cada PDF (5 campos por ciudad) + reportar al CLC              | **Ejecutor** | Tabla en `MULTI_CIUDAD/TABLA_COMPARATIVA.md` actualizada | PDF de al menos SLP cargado   |
| Completar sección `📄 ESTADO ACTUAL` en los 6 adendos SLP                         | **Ejecutor** | Texto real del artículo vigente en cada `.md`            | Mapeo de artículos completo   |
| Verificar que texto `📄 ESTADO ACTUAL` es fiel al PDF fuente sin paráfrasis       | **Auditor**  | `AUTORIZADO` append en bitácora                          | Ejecutor completa sección     |
| Verificar UMAs escalera multas vs. Bando municipal SLP                            | **CLC**      | Nota en `05_ADENDO_SANCIONES_ART37BIS.md`                | PDF reglamento SLP disponible |


**Restricción activa:** el Ejecutor NO puede modificar el texto de la sección `✏️ ADENDO PROPUESTO` — eso es jurisdicción exclusiva del CLC. Solo puede editar `📄 ESTADO ACTUAL`.

---

**Sprint 2 — Componente UI (inicia cuando SLP + QRO tengan `📄 ESTADO ACTUAL` completo)**


| Tarea                                                                                 | Agente            | Entregable                                | Blocker                                           |
| ------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------- | ------------------------------------------------- |
| Diseño del componente split-view (reglamento vigente arriba / adendo propuesto abajo) | **Aesthete**      | Spec visual en `cursor-rules/` o bitácora | Ninguno — puede arrancar                          |
| Implementar componente `AdendoViewer.tsx` con selector ciudad + selector adendo       | **Ejecutor**      | PR con componente                         | Diseño Aesthete + SLP `📄 ESTADO ACTUAL` completo |
| Integrar `AdendoViewer` en `MarcoLegal.tsx` o ruta nueva `/adendos`                   | **Ejecutor**      | PR integración                            | `AdendoViewer.tsx` listo                          |
| Revisión legal de que el contraste vigente/propuesto es fiel                          | **CLC + Auditor** | `AUTORIZADO` en bitácora                  | Integración completa                              |


---

**Sprint 3 — Escalamiento (Fase 2, cuando Sprint 1 + 2 estén completos)**


| Tarea                                                                               | Agente        | Entregable                         |
| ----------------------------------------------------------------------------------- | ------------- | ---------------------------------- |
| Reglamento completo para Soledad G.S. (no adendo, sino nuevo reglamento)            | **CLC**       | Archivo nuevo en `ADENDOS: LEGAL/` |
| Carga PDFs ciudades 4–7 + mapeo artículos                                           | **Ejecutor**  | Tabla comparativa completa         |
| Verificación Navigator: ZM SLP incluye SLP + Soledad G.S. + Villa de Pozos en capas | **Navigator** | PASS/FAIL en bitácora              |
| Expandir `AdendoViewer` a todas las ciudades                                        | **Ejecutor**  | PR                                 |


---

### REQUEST adicionales derivados del brief

**REQUEST-13 → Aesthete**  
Diseñar componente split-view `AdendoViewer`: selector ciudad (dropdown) + selector adendo (tabs o dropdown), panel superior scrollable "Reglamento vigente" con badge ciudad+artículo+año, panel inferior "Adendo propuesto" con badge técnica (Adicionar/Reformar/Nuevo) + efecto operativo. Puede arrancar en paralelo con Q-011. Entregar spec visual antes de Sprint 2.

**REQUEST-14 → Ejecutor**  
Una vez que el Humano cargue PDFs en `ADENDOS: LEGAL/REGLAMENTOS_BASE/`: leer PDF SLP, mapear los 5 campos (definiciones, recolección, obligaciones habitantes, sanciones, artículo condominio), actualizar `MULTI_CIUDAD/TABLA_COMPARATIVA.md`, luego completar sección `📄 ESTADO ACTUAL` en los 6 adendos. **No tocar** sección `✏️ ADENDO PROPUESTO` — jurisdicción CLC exclusiva.

**REQUEST-15 → Navigator**  
Confirmar que la cobertura geográfica del lineamiento técnico (ZM SLP: municipio capital + Soledad de G.S. + Villa de Pozos) está correctamente delimitada en las capas de ALQUIMIA. Formato: PASS/FAIL con referencia a fuente INEGI/MGN. No requiere geometría nueva — solo verificación de cobertura existente.

---

### Confirmación de restricciones CLC (§5 del brief)


| #   | Restricción                                                                                | Estado CSA                                                       |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Todos los archivos de adendos mantienen `[BORRADOR PARA REVISIÓN LEGAL]`                   | ✅ CONFIRMADO — CSA no puede quitarla sin ADR firmado por Usuario |
| 2   | Texto `✏️ ADENDO PROPUESTO` es jurisdicción CLC — Ejecutor no lo toca                      | ✅ CONFIRMADO — incluido en REQUEST-14                            |
| 3   | Escalera multas 4-8-12 UMAs requiere verificación vs. Bando municipal antes de uso oficial | ✅ CONFIRMADO — tarea asignada al CLC en Sprint 1                 |
| 4   | Soledad G.S. requiere reglamento nuevo completo (no adendo) — trabajo adicional CLC        | ✅ CONFIRMADO — movida al Sprint 3                                |


**Estado del brief:** `CLC-BRIEF-CSA-001` → `RESPONDIDO POR CSA · 2026-05-05`

— *CSA · ALQUIMIA · respuesta formal CLC brief · trace=csa-resp-CLC-BRIEF-CSA-001*

---

## [2026-05-06T22:00:00-06:00] · Ejecutor · REPORT

- **Qué implementé hoy (archivos/rutas concretas):** PRES-1 / Q-011 en tres commits: `frontend/src/app/page.tsx` (PR A), `frontend/src/components/simulator/SectionHero.tsx` + `frontend/src/components/layout/Header.tsx` (PR B), `frontend/src/app/aprende/page.tsx` (PR C); append previo de la misma entrega ya descrito en esta bitácora.
- **Verificación: tsc / pytest / lint:** `npm run type-check` (`tsc --noEmit`) en `frontend/` → OK; `npx eslint` sobre los cuatro archivos tocados → OK; `pytest` no ejecutado en esta tanda; `npm run lint` global del frontend → fallos **previos** en otros módulos (no atribuibles a PRES-1).
- **Deuda técnica nueva:** ninguna introducida por PRES-1; persiste la deuda global de ESLint en el resto del árbol frontend.
- **Pendiente para mañana:** verificación Aesthete en staging (`https://alquimia-slp.vercel.app`), revisión Auditor sobre disclaimers tras el copy consolidado; cola CSA (p. ej. Q-007, R3 auth, §6.3 Lighthouse) según priorización.

---

## [2026-05-07T11:15:00-06:00] · Aesthete-1 · REPORT

- Revisiones / propuestas del día: micro‑entrega 22.5 (Tornado + `<details>` “modo capacitación”, CTA reasoning graph, chip hub “paquete”); handoff textual PRES‑1 al Planner (A→B→C, sin tablas); segunda pasada creativa landing/SectionHero/Aprende (recorte redundancia legal, stats país, emojis → Lucide, tono ciudadano vs ticket KPI); prompt ético‑UI header/KPI ciudadano **en cola**, no ejecutado por este rol.
- Vetos estéticos/a11y vigentes: **ninguno formal `VETO`** nuevo; permanecen como riesgo abierto hasta QA de campo: valores hex sueltos fuera de tokens, animaciones sin `prefers-reduced-motion` en global badges, microcopy “demo/payload” donde el Ejecutor aún no aterrice el pulido acordado.
- Pendiente para mañana: validar PRES‑1 en staging con rúbrica §12 (citizen path menos “mesa de opera”, disclaim no duplicado); cerrar o delegar backlog tipográfico OKLCH/semánticos si CSA agenda; si el Equipo aprueba, **INFORM** a Ejecutor sólo discrepancias puntualizadas tras smoke visual.

---

## [2026-05-08T17:45:00-06:00] · Ejecutor · REPORT

- Qué implementé hoy (archivos/rutas concretas):
  - Fuente primaria reglamentos: `frontend/src/data/reglamentos.ts`, `frontend/src/components/reglamento/ReglamentoModal.tsx` (fallback sin ficha municipal), `frontend/src/components/reglamento/FuenteReglamentoIcon.tsx`; provider en `frontend/src/app/layout.tsx`.
  - Integración íconos de fuente en simulador: `frontend/src/components/simulator/MarcoLegal.tsx`, `AdvertenciasGateLegal.tsx`, `DiagnosticoJuridico.tsx`.
  - Hub capítulo documental + ZIP cliente: `frontend/src/data/hubDocumentosCapitulo.ts` (ampliación bloque blueprint 17.1), `frontend/src/app/hub/page.tsx` (catálogo, badges Disponible/En elaboración, botón “Descargar paquete ZIP”), `frontend/src/lib/hubPaqueteZip.ts` (consumo desde hub).
  - Estáticos existentes relacionados ya en árbol: `frontend/public/documentos_slp/fuentes_y_provenance_slp.md`, capturas/reglamentos bajo `frontend/public/reglamentos/`.
- Verificación: tsc / pytest / lint: `frontend/` → `tsc --noEmit` OK; `pytest` no ejecutado en esta tanda (alcance solo frontend); `eslint` global del frontend no ejecutado puntual sobre el paquete.
- Deuda técnica nueva: ninguna puntual marcada como bloqueante; CSA debe completar URLs reglamentos (`sol` pendiente obligatorio en `reglamentos.ts`; revisión `qro`/`mty`). Hub ZIP depende de fetch a `origin` mismo host para blobs en `public/`.
- Pendiente para mañana: smoke `/hub` (filtros ZM, ZIP descargable); validar modal/drawer en mobile; cola CSA según tabla Q‑007/R3 §6.3 cuando Planner priorice.

---

## [2026-05-08T18:30:00-06:00] · Navigator · REPORT

- Checkpoints geo del día: lectura cola bitácora (Aesthete 2026‑05‑07; Ejecutor 2026‑05‑08 hub/reglamentos/ZIP): **sin** cambios en contratos de capa territorial ni SRID backend; mapa RSU piloto (`/national/map/rsu-footprint`) permanece **simulación** (puntos + orden de magnitud, no MGN). Puerta **23.1** sin nueva orden CSA; FAIL **6–7** (CVE INEGI / `version_mgn`) siguen vigentes para uso **oficial** / geo productiva.
- Vetos geo vigentes: **ningún `VETO`** Navigator emitido en esta ventana; bloqueo normativo **implícito**: no tratar datos semilla como límites ni inventarios GEI oficiales.
- Pendiente para mañana: si el bundle hub/simulador **añade mapa, geometría servida o métricas espaciales en API**, exigir **REQUEST** con alcance capa/feature ID y checklist §5.3 + SRID + fuentes antes de merge geo; si solo UI documental/legal (como hoy), sin acción Navigator salvo hallazgo en diff.

---

## CSA · Nuevas ambiciones Q-016 y Q-017 · 2026-05-05

**Origen:** solicitud directa del usuario/fundador.  
**Sesión:** continuación fa455644-c382-4d65-99fd-965e8bf0522d

### Q-016 · Predios sin permiso — Expediente técnico sancionatorio

**Concepto:** ALQUIMIA genera un expediente técnico para que un inspector municipal pueda iniciar el procedimiento sancionatorio contra:
- Predios con basura clandestina ("cagaderos").
- Centros de acopio operando sin permiso municipal.

**ALQUIMIA no sanciona** — emite el expediente técnico que habilita al inspector. La resolución la firma la autoridad municipal.

**Gates críticos antes de ejecutar:**
- **Navigator:** polígonos prediales requieren fuente catastro oficial por ciudad (no INEGI MGN). Cada municipio tiene formato distinto. Sin fuente aprobada, no hay mapa.
- **CLC:** verificar artículos reglamento aplicables + confirmar que el PDF generado tiene disclaimer suficiente para no simular acto de autoridad.
- **Auditor:** firma el módulo antes de cualquier uso en procedimiento real.

**Dependencias:** Q-009 (selector Estado→Municipio), Q-013 (adendos reglamentarios para escalera de multas), datos catastro oficial por ciudad.  
**OLA:** 3+  
**Blueprint:** `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/28_predios_sin_permiso_expediente_sancionatorio.md`

---

### Q-017 · Declaración de Generación Empresarial RSU

**Concepto:** Wizard voluntario para que una empresa declare su generación estimada de RSU por tipo de material, basado en su giro SCIAN. ALQUIMIA calcula el perfil, genera un PDF descargable, y alimenta el módulo de Macrogeneradores.

**DISTINCIÓN LEGAL CRÍTICA:**
- **NO es la COA de SEMARNAT.** La COA es obligatoria y aplica a grandes generadores de residuos de manejo especial/peligrosos.
- Este módulo es **voluntario, estimativo, RSU no peligrosos**.
- **Nombre aprobado:** "Perfil de Generación Estimada RSU" o "Declaración Voluntaria de Generación" — **nunca "COA" ni "Cédula"**.

**CLC debe confirmar** el nombre y el disclaimer antes del merge.

**Dependencias:** `Macrogeneradores.tsx` (ya existe), factores SCIAN SEMARNAT DBGIR 2020.  
**OLA:** 2–3 (puede iniciar antes de Q-009)  
**Blueprint:** `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/29_declaracion_generacion_empresarial_rsu.md`

---

**CSA DECISION:**
- Q-017 puede iniciar cuando Q-011 PRES-1 esté en staging — es módulo independiente de bajo riesgo geo.
- Q-016 **bloqueado** hasta tener fuente catastro al menos de SLP capital + firma CLC del disclaimer.
- Ambos ítems agregados a `COLA_Y_ROLES_AGENTES.md` y a la tabla de cola priorizada.

---

## Humano · Confirmación operativa · 2026-05-05 19:58

**HECHO 1:** `ENVIRONMENT=production` actualizado en Render dashboard.  
**Efecto:** backend corre en modo producción — logs más limpios, comportamientos de prod activos.

**HECHO 2:** 7 PDFs de reglamentos base cargados en `ADENDOS: LEGAL/REGLAMENTOS_BASE/`.  
**Efecto:** Q-013 Sprint 1 **DESBLOQUEADO** — Ejecutor puede arrancar lectura/parsing de adendos sin esperar al humano.

**Próximos pasos desbloqueados:**
- Q-013 Sprint 1 puede arrancar en paralelo con OLA 1 (Q-017 + Q-016-S1 + Q-011-PR-A).
- CLC verifica contenido de PDFs y confirma UMAs escalera multas vs. Bando municipal SLP.

---

## CSA · Síntesis observaciones fundador · 2026-05-06

**Fuente:** `listado de observaciones- hoy 6 de mayo. .pdf` (6 páginas)  
**Sesión:** continuación fa455644-c382-4d65-99fd-965e8bf0522d

### Observaciones procesadas → Q-items

| OBS | Descripción | Acción |
|-----|------------|--------|
| OBS-1 | Texto introductorio narrativo ciudadano personalizado por módulo | Q-018 (nueva) |
| OBS-2 | Datos offline inaceptables — todo debe ser live | Q-015 escala a OLA 2 obligatorio |
| OBS-3 | Gates legales = roadmap implícito, no elección usuario | Refuerza Q-003-UX + ADR-001 |
| OBS-4 | Eliminar "cargar cobertura" — menos fricción UI | Fix en Q-011 PR-B o tarea menor |
| OBS-5 | Resumen ejecutivo: empleos, derrama, pronósticos, unir módulos | Q-019 (nueva) |
| OBS-6 | CAs: 3 configuraciones progresivas predefinidas, no diseño libre | Amplía Q-012 VIZ-CA |
| OBS-7 | Walk-me-through = flujo por fases del programa (legislación→CAs) | Refuerza Q-011 PR-B barra fases |
| OBS-8 | Timeline slider espacio-tiempo: Día 0 a hitos anuales con KPIs | Q-020 (nueva) |

### CSA DECISION
- Q-018 (NarrativaIntro) y Q-020 (Timeline Slider) son las de mayor impacto percibido — prioridad OLA 2.
- Q-015 (INEGI live) se escala de "puede esperar" a **obligatorio antes de release público**.
- OBS-4 (cargar cobertura) es un fix pequeño que puede ir en Q-011 PR-B sin sprint propio.
- OBS-6 amplía el scope de Q-012 VIZ-CA: añadir capa de 3 configs predefinidas a la gráfica.

---

## Ejecutor · Q-016 hardening — selector municipio / PDF UMA / smoke main

- Selector explícito «Municipio del predio (expediente)» en `InspeccionForm.tsx`, default `slp` si está en municipios activos; equivalencia MXN de UMA sólo desde campo `valor_uma_referencia_mxn` del GET catálogo.
- PDF expediente: segunda línea cabecera ASCII (`ATENCIÓN:`) para compatibilidad Helvetica/jsPDF.
- UMA: `CatalogoEscalerasSlpResponse` + test contrato `valor_uma_referencia_mxn == escalera_slp.VALOR_UMA_2026`; smoke `app.main` GET catálogo (`test_q016_predios_catalog_smoke_main.py`).
- Verificación: `pytest` Q-016 + smoke; `tsc --noEmit` OK.

## §6.3 · Lighthouse · PASS · 2026-05-05 20:37

**URL auditada:** `http://127.0.0.1:3000/simulator` (build estático local · `next build` + `npx serve`)  
**Herramienta:** `npm run audit:lighthouse:ci` → `node scripts/run-lighthouse.cjs`  
**Reporte JSON:** `frontend/audit_reports/lighthouse-simulator.report.json`

| Categoría | Score | Umbral | Resultado |
|-----------|-------|--------|-----------|
| **Performance** | **99 / 100** | ≥ 80 | ✅ PASS |
| **Accessibility** | **95 / 100** | ≥ 90 | ✅ PASS |
| **LCP** | **615 ms** | ≤ 2500 ms | ✅ PASS |

**Auditor — §6.3 gate:** AUTORIZADO CONDICIONAL → **PASS COMPLETO**  
El Auditor puede retirar la condición de "pending §6.3" de su firma. Scores reales superan umbrales definidos.

**Nota:** audit corrido sobre build local (`localhost:3000`). Para release con dominio propio, repetir sobre URL Vercel real (`alquimia-slp.vercel.app/simulator`) como confirmación final antes de DNS.

---

## Humano · OLA 1 lanzada · 2026-05-05 20:33

4 chats Ejecutor abiertos simultáneamente:
- **Chat A** → Q-017 Declaración Generación Empresarial RSU (backend empresa/ + wizard + PDF)
- **Chat B** → Q-016 Sprint 1 Predios (InspeccionForm + ExpedientePDF + integración hub)
- **Chat C** → Q-011 PR-A Landing polish (disclaimer colapsado + Lucide + cifras nacionales)
- **Chat D** → Q-013 Sprint 1 Adendos (lectura PDFs + ESTADO ACTUAL + AdendoViewer)

Siguiente acción humano: correr Lighthouse en URL real Vercel y pegar scores en bitácora.

---

## Ejecutor · Q-011 PR A · CTA unificado footer verde
- `frontend/src/app/page.tsx`: franja `bg-[#1F3B06]` (~línea 178) — `Link` a `/simulator` cambiado de «Explorar la plataforma» → **«Ver escenario de referencia»** para coincidir exactamente con el CTA del hero superior (criterio aprobado por Planner).
- Coherencia editorial: array `MODULOS`, tarjeta «Centro educativo» — «demo guiada» → «escenario de referencia» en descripción.
- Verificación: `tsc --noEmit` OK · `eslint src/app/page.tsx` OK · sin errores nuevos.

---

## Navigator · MexicoRsuFootprintMap · PASS CONDICIONAL · 2026-05-06

**Performativa (PIS):** `INFORM` · revisión §5.3 / anti‑patrones (capa visualización, sin geometría municipal servida ALQUIMIA)

### 1 · Fuente de datos

- El componente consume `getRsuFootprintMap()` y construye un **GeoJSON de puntos** (`Point` en EPSG:4326 implícito lon/lat) en cliente; **no** sirve polígonos municipales, AGEB, colonias ni tiles vectoriales propios de límites.
- Basemap **Mapbox** (`mapbox://styles/mapbox/light-v11`): cartografía de referencia de tercero; no es fuente INEGI para decisiones públicas.
- **Resultado:** **PASS con nota** — capa coherente con **simulación**; procedencia semilla documentada en backend (`rsu_demographics_seed` / respuesta API). Si en el futuro se sirvieran geometrías oficiales sin checklist fuente/MGN → **VETO** hasta aprobación Navigator.

### 2 · Colonias / AGEB / SRID

- **Granularidad actual:** solo **municipio** (centroide aproximado); **no** hay nivel colonia.
- **INEGI MGN / AGEB:** es la referencia oficial para marcos geoestadísticos; los datos suelen obtenerse por **descarga o servicios INEGI** con **términos y licencia** propios — verificar edición y restricciones; **no** catalogar como “fuente libre” genérica sin lectura del aviso legal vigente.
- **SRID métricas SLP (área/distancia):** **EPSG:6369** (según NAVIGATOR §3); **no** usar **3857** para métricas de superficie o distancia.
- **Ruta mínima hacia colonias sin N4** (fuente no oficial como documento público definitivo): ingestar **polígonos AGEB/manzana MGN** con metadatos (`version_mgn`, `DataProvenance`, `jurisdiction_scope` Municipal), agregar valores RSU solo como **capa temática simulada** con texto que **no** sustituya acto municipal; **prohibido** inferir límites de colonia desde estos centroides semilla.

### 3 · Autorización merge `MexicoRsuFootprintMap.tsx` tal cual

- **PASS CONDICIONAL:** puede mergearse como **UI piloto municipios ZM** con disclaimers (`payload.disclaimer`, metodología, “no inventario oficial”) si el producto **no** promete colonias ni documentos oficiales derivados del mapa.
- **Condición:** comunicar a fundador/planner que **colonia clara** es **fuera de alcance** de este archivo hasta capa MGN/AGEB + REQUEST Navigator §5.3.

### §5.3 — síntesis rápida

- `jurisdiction_scope`: datos por feature llevan `zm_id` + ámbito municipal vía `nombre`/catálogo; **no** hay mezcla poligonal ZM=municipio.
- CVE INEGI / `version_mgn`: **deuda conocida** (FAIL 6–7 históricos) para uso **oficial**; esta vista sigue siendo **simulación**.

— *Navigator · ALQUIMIA*

---

## CSA · Cola Q-020/Q-021 + REQUEST Ejecutor (prioridad R3→Q-007) · 2026-05-06

- **`COLA_Y_ROLES_AGENTES.md`:** Q-020 redefinido como *Timeline Slider Espacio-Tiempo (catálogo de hitos + PERT)*, rol **Ejecutor**; **Q-021** nuevo (*Sankey flujo residuos + slider 0→5 años*, cadena **Ejecutor → Auditor → Aesthete**). Bloqueante global **R3** (auth `/simulator`, `/hub`, `/ca-studio`) registrado antes de URL pública amplia.
- **REQUEST formales** emitidos a Ejecutor en orden: **R3** → **Q-010** (CLC / aviso privacidad + disclaimers) → **Q-021** → **Q-020** → **Q-007** (URLs faltantes `reglamentos.ts`: sol, qro, mty según criterio CSA).

---

## Ejecutor · Q-021 Sankey flujo residuos · 2026-05-05

- Datos: `frontend/src/data/sankeyData.ts` (nodos 3×3, keyframes 0/1/3/5, `interpolateSankeyLinks`, `computeSankeyKpis`).
- UI: `frontend/src/components/simulator/SankeyFlujoResiduos.tsx` (recharts `<Sankey>`, slider 0→5, KPIs, tooltip enlace, nodos/enlaces personalizados).
- Integración: `simulator/page.tsx` tras `ImpactoFinanciero` (empresario) y tras `FlujosResiduos` (funcionario).
- Corrección auxiliar: `ImplementacionEspacioTiempo.tsx` — `hitoPositionFraction` (cierre TS `hitoPosition` inexistente).

---

## Ejecutor · Q-020 · Timeline slider espacio-tiempo · 2026-05-06

- Catálogo `frontend/src/data/hitosTimeline.ts` (18 hitos PERT/KPI), `frontend/src/lib/pertUtils.ts`, slider + chips + panel lateral en `ImplementacionEspacioTiempo.tsx`; `tsc`/eslint verificados; refetch territorial envuelto en `startTransition` por regla react-hooks/set-state-in-effect.

---

## [2026-05-07T16:05:00-06:00] · Aesthete-1 · REPORT · smoke PRES-1 staging (`375px`/`1280px` · https://alquimia-slp.vercel.app)

- **Blocker:** _(ninguno a11y medido por herramienta en esta sesión)_
- **High:** artefacto desplegado no refleja PRES-1 esperado en repo en `/` (CTA sigue «Explorar / Abrir demo guiada», emojis en tarjetas) y `/aprende` (encabezados «Sección 1»… visibles). · Vista ciudadano `/simulator`: microcopy técnica «CityContext» filtración dev; botón Exportar verde perceptible pero sin export válido ciudadano junto texto descriptivo ⇒ riesgo persuasión/ética hasta estados visuales alineados.
- **Medium:** disclaimers/aux grises hero móvil y nota ciudadano — revisar ratio contraste WCAG técnico tras deploy; KPI `opacity-40` ciudadano no verificados en primera pintura solo carga.
- **¿Aprueba PRES-1 para producción?** **CONDICIONAL** — redeploy al commit verificado de PRES-1, ciudadano sin jerga técnica, tratamiento Export (disabled/oculto) coherente con microcopy antes de declarar DONE.

---

## Jurídico-Legal · Q-010 auditoría pre-release público · 2026-05-05

**Estado: NO PASS** — bloqueantes y altos abiertos; no se emite confirmación de release.

**BLOCKER**

- `backend/app/legal/repository.py` — texto propuesto Art. 2: atribución de separación domiciliaria a NOM-161-SEMARNAT-2011: desajuste sustantivo probable (NOM-161 RME/planes de manejo). Corregir fundamento tras verificación DOF/reglamento aplicable.

**HIGH (extracto)**

- CTA ÁGORA / modal (`ExportarSection.tsx`, `FloatingCTA.tsx`, `GenerarPlanModal.tsx`): promesa operativa (“Drive”, “persistido”, “defendibles”) sin disclaimer de no oficialidad / no asesoría certificada en el mismo bloque.
- `ExportarSection.tsx`: “Datos insuficientes para documento oficial” — inconsistente con marco global “no oficialidad”.
- Privacidad: landing remite a aviso “cuando estén publicados”; release público con auth/logs requiere aviso integral LFPDPPP/LGPDPPSO.
- `DiagnosticoJuridico.tsx`: “validado juridicamente” — riesgo de lectura como acto de autoridad; clarificar sello de flujo de datos.

**MEDIUM**

- `LegislacionRSU.tsx`: título LGPGIR abreviado vs denominación oficial.
- Limitación de responsabilidad: consolidar en Términos además de banners (`simulationDisclaimer.ts`).

**Referencia técnica:** `frontend/src/lib/simulationDisclaimer.ts`, `AdvertenciasGateLegal.tsx`, `MarcoLegal.tsx`, `DiagnosticoJuridico.tsx`, pipeline ÁGORA `backend/app/agora/prompts.py` (7 MD).

— *Agente Jurídico Legal (mandato consultivo; no opinión legal externa certificada).*

---

## Auditor · Q-003 firma pendiente · 2026-05-06

- **Dictamen Q-003:** **AUTORIZADO CONDICIONAL** (sin VETO; no aplica anti-patrón AUDITOR Blocker/N11 en evidencia revisada).
- Landing `https://alquimia-slp.vercel.app` y ruta `/simulator` muestran flujo demo/audiencias · **Ejecutor/ops**.
- `GET /health` en `https://alquimia-slp.onrender.com` → **200** (`status: ok`); muestra tardía inicial atribuible cold start Render — monitorizar SLO awake.
- CORS servidor: `OPTIONS /operations/legal-gated-action` con `Origin: https://alquimia-slp.vercel.app` → 200 y `access-control-allow-origin` acorde Vercel (evidencia análoga a Network/DevTools para preflight) · **CSA/Ejecutor** si cliente reporta bloqueo, adjuntar captura POST real.
- `AdvertenciasGateLegal.tsx`: compuerta vía `evaluateLegalGatedAction`, copy explícito simulación/capacitación, Fuente primaria por municipio · **Ejecutor** mantiene alineación con backend.
- **Condición cerrable:** `/health` devolvió `environment: "development"` en muestra auditada → **Ejecutor/ops (Render)** alinear env/config para que respuesta refleje despliegue productivo antes de comunicado institucional "prod"; **plazo:** siguiente ventana de deploy o **2026-05-13**.

---

## PD&SA · Sincronización estado infraestructura · 2026-05-06

**INFORM — estado real del sistema (no estaba registrado en bitácora):**

- **Backend:** desplegado en **Render** → `https://alquimia-slp.onrender.com` (confirmado por Auditor Q-003 arriba)
- **Frontend:** desplegado en **Vercel** → `https://alquimia-slp.vercel.app`
- **NEXT_PUBLIC_API_URL** en Vercel apunta al backend Render ✓
- **ANTHROPIC_API_KEY:** estaba duplicada en `backend/.env` local (placeholder + clave real); python-dotenv leía el placeholder. **Corregido** — placeholder eliminado, clave real queda como única entrada.
- **Pendiente ops:** agregar `ANTHROPIC_API_KEY` y `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` como variables de entorno en el panel de **Render** (no en Vercel — Claude lo llama el backend, no el frontend).
- **Q-023 ÁGORA:** pipeline implementado (`backend/app/agora/`), registrado en `main.py`, test pasa localmente. Bloqueado en producción hasta que Render tenga la key.
- **Q-024, Q-020, Q-021:** implementados; Auditor emitió BLOQUEADO para merge conjunto — Q-020/Q-021 requieren corrección antes de re-auditoría.
- **Nuevos Q registrados en COLA:** Q-022 (Concesión), Q-023 (ÁGORA), Q-024 (Bug municipio), Q-025 (Mapa calor Mapbox), Q-026 (RCD contenedores).

— *PD&SA · sincronización infraestructura y cola.*

---

## Auditor · ronda Q-024 + Q-023 + Q-020 + Q-021 (pre-merge) · 2026-05-07

- **VEREDICTO:** **BLOQUEADO** para merge conforme al alcance auditado íntegro (no todas las Q en PASS según checklist).
- **Q-024:** evidencia motor + store + `vitest` `zmPopulationScale.test.ts` OK; no se emiten líneas COMMIT PASS por‑Q porque el paquete conjunto no supera umbral merge.
- **Q-023:** `pytest` `test_q023_agora_pipeline.py` OK; API key Anthropic pendiente por humano conforme alcance auditoría — no cuenta como blocker de esta ronda.
- **Q-020 / Q-021:** incumplen criterios de aceptación del brief de esta auditoría (dictamen Usuario); corregir y re‑auditar.
- **TRANSVERSAL:** `tsc --noEmit` OK; `npm run build` OK; evidencia git: `.env` con secretos **no** en índice; `backend/.env` visto sólo como **untracked** en entorno auditado — riesgo de commit accidental debe mitigarse con `.gitignore` local y hábitos de equipo.

---

## Agente Jurídico Legal · Auditoría Q-010 · Pre-release público · 2026-05-06

`[BORRADOR PARA REVISIÓN LEGAL]` — No dictamen oficial. Requiere revisión por abogado con cédula vigente.

**Archivos auditados:**
`frontend/src/components/simulator/AdvertenciasGateLegal.tsx` · `DiagnosticoJuridico.tsx` · `MarcoLegal.tsx` · `frontend/src/lib/simulationDisclaimer.ts` · `backend/app/agora/prompts.py`

---

### 🔴 BLOCKERS — Release público NO puede proceder sin resolución

#### B-01 · Aviso de privacidad inexistente — LFPDPPP Art. 15-16 / LGPDPPSO

- **Hallazgo:** Búsqueda exhaustiva en `/frontend` no localiza ningún archivo de aviso de privacidad. El sistema tiene `access_log` planificado (user_id, email, ip_hash, path — Blueprint 17.1), y el pipeline ÁGORA recibe parámetros de municipio/funcionario que pueden constituir datos personales bajo LFPDPPP Art. 3 fr. II [VERIFICAR VIGENCIA EN DOF].
- **Norma en riesgo:** LFPDPPP (2010 + Reglamento) Art. 15-16; LGPDPPSO Art. [VERIFICAR EN FUENTE OFICIAL] (aplica si municipios reciben o transfieren datos); Lineamientos INAI sobre avisos de privacidad.
- **Consecuencia probable:** Multa INAI; exigibilidad de derechos ARCO sin procedimiento definido; riesgo de denuncia ciudadana o de funcionario ante INAI.
- **Acción requerida:** Elaborar y publicar aviso de privacidad (corto + integral) antes de activar cualquier `access_log` en producción. Texto borrador disponible bajo solicitud al CLC.
- **Estado:** ⛔ BLOCKER — Kill-switch K1 y K3 activos.

#### B-02 · Términos de uso inexistentes

- **Hallazgo:** No existe ningún archivo `/terms`, `/tos`, ni componente de términos de uso en el proyecto. La plataforma es accesible públicamente en `https://alquimia-slp.vercel.app` sin condiciones de uso declaradas.
- **Norma en riesgo:** Código Civil Federal (responsabilidad civil extracontractual); Ley Federal de Protección al Consumidor si aplica relación B2C con municipios; Ley General de Responsabilidades Administrativas si un servidor público toma decisiones con base en la plataforma.
- **Consecuencia probable:** Sin términos, cualquier uso dañino de los resultados (decisión política incorrecta, sanción basada en simulación, reforma mal fundamentada) podría atribuirse a ALQUIMIA sin limitación de responsabilidad contractual.
- **Acción requerida:** Elaborar Términos de Uso mínimo viable (máx. 1 página) cubriendo: titularidad, licencia de uso, naturaleza de simulación, exclusión de responsabilidad, jurisdicción, contacto. Texto borrador disponible bajo solicitud al CLC.
- **Estado:** ⛔ BLOCKER — Kill-switch K1 activo.

---

## CSA · Apertura roadmap independiente · ALQUIMIA EMPRESAS · 2026-05-07

**Mandato del fundador:** crear roadmap separado para `ALQUIMIA EMPRESAS — Portal de consultoria circularidad`, con backlog propio y release independiente del sprint de cierre GOV.

### Decisión de arquitectura operativa

- Se crean **dos streams formales**:
  - `GOV` (cierre institucional y cumplimiento municipal)
  - `EMPRESAS` (portal de consultoria circularidad B2B/B2G)
- **No mezclar releases:** cada stream con su pipeline y checklist.
- `EMPRESAS` tendrá backlog propio `Q-E01..Q-E10`.

### Dominio/release separado (aprobado)

- `GOV`: se mantiene en su release actual.
- `EMPRESAS`: proyecto Vercel separado + dominio/subdominio dedicado.
  - Recomendado: `empresas.alquimia.mx`
  - Alterno: `alquimia-empresas.mx`

### Artefactos actualizados en repo

- Blueprint nuevo: `30_alquimia_empresas_portal_consultoria_circularidad.md`
- COLA actualizada con serie `Q-E`.

### Regla CSA inmediata

Ningun ticket `Q-E` bloquea por defecto el cierre GOV. Solo un riesgo legal transversal, firmado por CLC/Auditor, puede detener ambos streams.

#### B-03 · Documentos ÁGORA sin disclaimer embebido en el output generado

- **Hallazgo:** Los 7 prompts del pipeline ÁGORA (`prompts.py`) instruyen al LLM a producir documentos en "estilo formal institucional mexicano (informe a presidencia municipal / cabildo)". El DOC-2 es una "Iniciativa de reforma reglamentaria", el DOC-7 es un "memorando ejecutivo ciudadano-presidente municipal". Ningún prompt instruía al LLM a incluir disclaimer al inicio del documento generado. Un documento exportado podría presentarse ante un cabildo sin advertencia visible de su naturaleza no oficial.
- **Norma en riesgo:** Código Civil Federal (responsabilidad civil); Ley General de Responsabilidades Administrativas Art. [VERIFICAR] (funcionario que actúa sobre información falsa o no verificada); riesgo de confusión con documento oficial bajo Art. 244 Código Penal Federal (uso de documentos falsos — si tercero lo presenta como oficial).
- **Fix aplicado:** Se modificó `_bloque_contexto` en `prompts.py` para incluir instrucción OBLIGATORIA al LLM de iniciar cada documento con bloque de aviso `⚠️ BORRADOR — SIMULACIÓN ALQUIMIA · NO OFICIAL`. Ver commit en este sprint.
- **Estado:** ⚠️ FIX PARCIAL APLICADO — requiere verificación funcional que el LLM respete la instrucción en producción; validar con test de salida de ÁGORA antes de release.

---

### 🟠 HIGH — Resolver antes o en el sprint de release

#### H-01 · NOM-161-SEMARNAT-2011 citada como NOM principal para RSU — imprecisión técnico-jurídica

- **Hallazgo:** `_bloque_contexto` en `prompts.py` (línea original) citaba `NOM-161-SEMARNAT-2011` como referencia normativa para documentos sobre RSU municipal. NOM-161 aplica a **Residuos de Manejo Especial (RME)**, no a RSU. Para RSU los instrumentos más directos son: NOM-083-SEMARNAT-2003 (disposición final de RSU y RME) y las NOMs de separación en origen aplicables por estado. Citar NOM-161 como marco de RSU en un documento presentado ante cabildo es técnico-jurídicamente impreciso.
- **Fix aplicado:** `_bloque_contexto` actualizado para citar `NOM-083-SEMARNAT-2003 / NOM-161-SEMARNAT-2011` con separación explícita. [VERIFICAR VIGENCIA DE AMBAS EN DOF — posibles reformas 2024-2026].
- **Estado:** ⚠️ FIX PARCIAL — la instrucción fue corregida; verificar que el LLM no alucine números de NOM en los documentos generados.

#### H-02 · Sin modal de confirmación / aceptación explícita antes de "Genera mi plan"

- **Hallazgo:** No existe componente de modal de aceptación de disclaimer antes de lanzar el pipeline ÁGORA. El usuario puede generar los 7 documentos sin declarar que entiende su naturaleza de simulación.
- **Norma en riesgo:** Código Civil Federal (consentimiento informado para limitar responsabilidad); buenas prácticas NIST AI RMF (transparencia y comprensión del usuario).
- **Fix de texto aplicado:** Se agregó `GENERA_PLAN_MODAL_DISCLAIMER` en `simulationDisclaimer.ts`. Pendiente: el Ejecutor debe implementar modal de confirmación que muestre este texto y requiera clic explícito "Entendido" antes de iniciar el pipeline.
- **Estado:** ⛔ PENDIENTE implementación del modal — texto listo, componente no existe.

#### H-03 · `legal_basis_article_id: 'Art. 11'` hardcoded sin referencia al reglamento

- **Hallazgo:** `AdvertenciasGateLegal.tsx` L63 contiene `legal_basis_article_id: 'Art. 11'` como payload de demo, sin indicar a qué reglamento municipal corresponde. Si este valor llega al backend y se usa para mostrar fundamento legal de una sanción propuesta, el artículo aparece descontextualizado.
- **Norma en riesgo:** Principio de legalidad (Art. 16 CPEUM) — todo acto de autoridad debe fundarse en norma expresa; aunque esto es simulación, mostrar "Art. 11" sin reglamento fuente podría inducir a error a un funcionario.
- **Acción requerida (Ejecutor):** Reemplazar el valor hardcoded por referencia compuesta `{reglamento_id}:Art.{n}` o marcarlo visiblemente como "datos de demostración — no artículo verificado". No bloquea release si el componente tiene chip visible de "simulación propuesta".
- **Estado:** 🟡 MEDIUM elevado a HIGH por posible uso en capacitación de funcionarios.

---

### 🟡 MEDIUM — Resolver en sprint siguiente al release

#### M-01 · Cláusula de limitación de responsabilidad insuficiente en documentos exportados

- **Hallazgo:** `EXPORT_SIMULATION_FOOTER_LINE` es una sola línea. Para documentos de 2-10 páginas presentados ante autoridad, una línea de pie no es suficiente cobertura. Necesita cláusula de limitación explícita en portada.
- **Fix de texto aplicado:** Se agregaron `AGORA_EXPORT_COVER_DISCLAIMER` y `EXPORT_LIABILITY_WAIVER` en `simulationDisclaimer.ts`. Pendiente: Ejecutor los integra en la portada y pie de los documentos exportados.
- **Estado:** 🟡 Texto listo — integración pendiente Ejecutor.

#### M-02 · Sin restricción de edad declarada / sin aviso de acceso por menores

- **Hallazgo:** La plataforma no declara restricción de edad ni tiene aviso de que el servicio es para uso profesional/institucional. Improbable pero presente: menor de edad podría acceder.
- **Norma en riesgo:** LFPDPPP Art. [VERIFICAR] sobre datos de menores; estándares internacionales COPPA si hay usuarios de EE.UU. (irrelevante por ahora).
- **Acción requerida:** Incluir en Términos de Uso (B-02) declaración: "Servicio dirigido a funcionarios públicos, técnicos municipales y profesionistas mayores de 18 años."
- **Estado:** 🟡 Se resuelve con B-02.

#### M-03 · Uso de datos INEGI (MGN, Censo) — licencia no verificada

- **Hallazgo:** El simulador referencia datos INEGI (Marco Geoestadístico Nacional, Censo) como marco informativo. No se localizó en el proyecto verificación formal de los términos de uso comercial de INEGI.
- **Norma en riesgo:** Ley Federal del Derecho de Autor Art. [VERIFICAR EN FUENTE OFICIAL] (obras de dominio público del Estado vs. uso comercial); términos INEGI [VERIFICAR EN inegi.org.mx].
- **Acción requerida:** Verificar en `https://www.inegi.org.mx/contenidos/app/indicadores/acuerdo_uso.pdf` (o URL vigente) que el uso comercial de CVE municipales y datos censales está permitido o requiere atribución específica.
- **Estado:** 🟡 PENDIENTE verificación humana.

#### M-04 · DiagnosticoJuridico — disclaimers parcialmente ocultos en detalle expandible

- **Hallazgo:** La nota "ALQUIMIA no emite dictamen ni documento oficial" y el `legal_disclaimer` del diagnóstico aparecen dentro del panel expandible de cada tarjeta municipal. En la vista colapsada, no hay aviso visible.
- **Acción recomendada:** Añadir una línea de disclaimer fija (siempre visible, no colapsable) en el header del componente `DiagnosticoJuridico`, usando `SIMULATION_CONTEXT_TEASER`.
- **Estado:** 🟡 MEJORA — no bloquea release si `SIMULATION_BANNER_BODY` está activo en la página.

---

### ✅ PASS — Elementos que cumplen

- `simulationDisclaimer.ts` — `SIMULATION_BANNER_BODY`: disclaimer de simulación correcto y completo. ✓
- `MarcoLegal.tsx` modo ciudadano — disclaimer "Solo para aprender" con advertencia de no sustitución legal. ✓
- `MarcoLegal.tsx` modo funcionario — distinción explícita simulación / propuesta / dictamen / documento oficial. ✓
- `AdvertenciasGateLegal.tsx` — chips "simulación propuesta · no oficial", "gate bloqueado" y texto "no sustituyen dictamen competente ni expediente real". ✓
- `DiagnosticoJuridico.tsx` — separación arquitectural Municipio ≠ ZM; notas de bloqueo por falta de validación competente. ✓
- `prompts.py` — restricciones anti-alucinación ("NO inventes tasas, encuestas INEGI específicas") presentes en `_bloque_contexto`. ✓ (reforzadas con fix B-03)
- `LGPGIR` y `LGEEPA` — leyes que existen con esos nombres exactos en el ordenamiento mexicano; citas genéricas como marco normativo son aceptables con la advertencia de no-vinculancia. ✓ [VERIFICAR VIGENCIA 2026 EN DOF — posibles reformas recientes]

---

### Fixes aplicados en este sprint (código modificado)

| Archivo | Cambio |
|---|---|
| `backend/app/agora/prompts.py` | Añadido `_DISCLAIMER_BLOQUE` con aviso obligatorio en cabecera de cada documento ÁGORA; corregida cita NOM-083 + NOM-161 |
| `frontend/src/lib/simulationDisclaimer.ts` | Añadidos: `GENERA_PLAN_MODAL_DISCLAIMER`, `AGORA_EXPORT_COVER_DISCLAIMER`, `EXPORT_LIABILITY_WAIVER` |

### Pendientes que requieren acción humana o del Ejecutor (no resueltos en código)

1. **B-01** — Elaborar y publicar Aviso de Privacidad (LFPDPPP/LGPDPPSO). Solicitar texto borrador al CLC.
2. **B-02** — Elaborar y publicar Términos de Uso. Solicitar texto borrador al CLC.
3. **B-03 validación** — Ejecutar test de ÁGORA en staging y verificar que el LLM inserta el disclaimer en la salida.
4. **H-02** — Ejecutor: implementar modal de confirmación usando `GENERA_PLAN_MODAL_DISCLAIMER` antes del botón "Genera mi plan".
5. **M-01** — Ejecutor: integrar `AGORA_EXPORT_COVER_DISCLAIMER` en portada de PDFs exportados y `EXPORT_LIABILITY_WAIVER` en pie.
6. **M-03** — Verificar términos de uso comercial de datos INEGI en fuente oficial.

### Condición de PASS total para release público

> Q-010 queda en estado **BLOCKER** hasta que B-01 (aviso de privacidad publicado) y B-02 (términos de uso publicados) estén en producción y B-03 (disclaimer en documentos ÁGORA) sea verificado en staging. H-02 (modal) es requerido antes de activar ÁGORA para usuarios externos.

— *Agente Jurídico Legal · ALQUIMIA · Q-010 · 2026-05-06 · [BORRADOR PARA REVISIÓN LEGAL]*
*Todo lo anterior es asesoría preventiva consultiva. No dictamen oficial. Requiere revisión por abogado con cédula profesional vigente antes de efectos jurídicos.*

---

### Q-010-EXEC — Ejecutor · correcciones H-02 / M-01 / M-04 · 2026-05-05

**Estado:** implementado en código (B-01 / B-02 siguen siendo acción humana; B-03 validación en staging pendiente).

**H-02** — `GeneraPlanConfirmModal.tsx` + `simulatorStore`: `openAgoraPlanConfirm` / `confirmAgoraPlan` / `dismissAgoraPlanConfirm`. Integrado en `ExportarSection` (plan + ZIP ÁGORA), `FloatingCTA` y montaje en `app/simulator/page.tsx`. Cierre del diálogo (X, overlay, Escape, Cancelar) no ejecuta el pipeline; solo **Entendido — continuar**.

**M-01** — Backend: `app/legal/agora_export_disclaimers.py` + `wrap_agora_markdown` en `agora/pipeline.py` (ZIP), `package_store._render_content`, PDF ejecutivo en `pdf_renderer.py` (portada con `AGORA_EXPORT_COVER_DISCLAIMER`, pie con `EXPORT_LIABILITY_WAIVER`). Frontend: bloque visible en `GenerarPlanModal` (post-plan) y en `/hub` cuando hay `job`. Prueba `pytest tests/test_q023_agora_pipeline.py` con entorno que cumpla `requirements.txt`; en sandbox local la instalación completa falló (psycopg2-binary / Python 3.14); smoke: `PYTHONPATH=. python3 -c` sobre `wrap_agora_markdown` → OK.

**M-04** — `DiagnosticoJuridico.tsx`: `SIMULATION_CONTEXT_TEASER` fijo bajo el rótulo S4.6 en estados loading, error y contenido principal (sin tocar gates).

**Evidencia de aceptación (consola):**
- `frontend/`: `npx tsc --noEmit` → exit 0.
- `frontend/`: `npm run build` → exit 0 (Next.js 16.2.4).
- Backend smoke: `wrap_agora_markdown` con aserciones inline.

— *Ejecutor · ALQUIMIA · Q-010-EXEC*

---

## Auditoría de Cierre — FASE GOV
**Fecha:** 2026-05-06 · **Auditor:** Ejecutor ALQUIMIA (revisión estática de código + build)

### Checklist

| # | Ítem | Veredicto | Evidencia / Nota |
|---|---|---|---|
| 1 | **Landing — SVG flujo visible** | ✅ PASS | `FlujoCicloSVG` en `page.tsx` línea 167, `viewBox="0 0 720 140"`, 4 nodos conectados con flechas SVG marcadas. Componente renderizado en `<div className="w-full overflow-x-auto">`. |
| 2 | **Landing — artículo editorial con datos reales** | ✅ PASS | H1 contiene "1,850 toneladas diarias"; párrafo "$446–494 millones"; KPI cards "168 empleos / 533 mil t CO₂ / $446–494 M". Commit `30623577`. |
| 3 | **Landing — auth module funcional** | ✅ PASS | `AuthModule` con tabs `ingresar`/`solicitar`. `POST /api/acceso` → Route Handler con `ACCESS_CODE` server-side. Cookie `httpOnly`. Middleware Edge protege `/simulator`, `/hub`, `/ca-studio`. Build: `ƒ /api/acceso` (Dynamic), `ƒ Proxy (Middleware)`. |
| 4 | **Simulador — sin texto dev expuesto** | ✅ PASS | `grep CITY_TEAM\|trace:` en `src/app/simulator/page.tsx` → sin coincidencias. `console.log/info/warn` acotados a `NODE_ENV !== 'production'`. Commit `6bd923d3` ("limpiar texto dev interno"). |
| 5 | **Modal reglamento — 2 paneles, texto adendo legible, botón fuente oficial** | ✅ PASS (código) | `MarcoLegal.tsx` importa `useReglamentoFuente` → `openReglamento(munId)` en botón "Ver adendos propuestos". Texto: "ALQUIMIA no emite dictamen legal ni aprueba reformas." Solo un botón de acción (no iconos por ítem). Verificación visual en browser pendiente de deploy. |
| 6 | **Sankey — estático sin slider** | ✅ PASS | `SankeyFlujoResiduos` usa `ANIO_PROPUESTO = 3` fijo; sin `useState`, sin `<Slider>`, sin `progresoAnios`. Disclaimer estático: "Escenario propuesto · año 3 · separación en 5 fracciones activa — proyecciones estimadas, no datos oficiales". |
| 7 | **Marco Legal — sin iconos de click por ítem, botón único** | ✅ PASS | Roadmap items usan `<button>` con círculo de check (gate de flujo interno), no iconos externos de acción. Un solo botón CTA verde "Ver adendos propuestos". |
| 8 | **ÁGORA Q-023 — ZIP con documentos** | ⚠️ PARCIAL | `generarPaqueteZipHub` en `hubPaqueteZip.ts` genera ZIP con docs del catálogo. Catálogo `documentosHub` tiene 30 entradas totales; solo 3 marcadas `disponible_web` (rest `en_elaboracion`). El requisito "7 documentos en el ZIP" depende de cuántos tengan `publicRelPath` disponible al momento del deploy — no verificable en estático sin ejecutar la app real. **Requiere verificación en `alquimiaplatform.com` con sesión activa.** |
| 9 | **CI GitHub Actions — último run verde** | ⚠️ NO VERIFICABLE (estático) | El archivo `.github/workflows/ci.yml` fue excluido del commit por falta de scope `workflow` en el PAT. El estado del último run no es verificable desde código estático. **Requiere acceso a `https://github.com/romerobarcenabraulio-hash/ALQUIMIA-SLP--/actions`.** |
| 10 | **Dominio alquimiaplatform.com — carga < 3s, sin errores críticos** | ⚠️ NO VERIFICABLE (estático) | No accesible desde auditoría de código. **Requiere prueba de carga en browser real.** |

### Hallazgos Técnicos Confirmados ✅

- `tsc --noEmit` → exit 0 (sin errores TypeScript)
- `npm run build` → exit 0; 11 páginas generadas, `/api/acceso` como Dynamic, Middleware presente
- `ACCESS_CODE` solo en `src/app/api/acceso/route.ts` (servidor); no expuesto en bundle cliente
- `output: 'export'` eliminado de `next.config.js` — compatible con middleware Edge y Route Handlers
- `NarrativaIntroBridge` requiere `seleccionMunicipioCatalog` no-null — no muestra bloque vacío
- `narrativaIntro.ts` no calcula CO₂/árboles propios — solo datos del store

### Veredicto Final

```
FASE GOV: PARCIALMENTE CERRADA
```

**PASS en código (8/10):** landing, auth gate, simulador limpio, Sankey estático, Marco Legal, tsc, build.

**PENDIENTES de verificación en producción (2/10):**

1. **ZIP ÁGORA Q-023:** Confirmar que con sesión activa en `alquimiaplatform.com`, el botón "Descargar paquete ZIP" en `/hub` genera un ZIP con al menos 7 documentos listos. Si el catálogo solo tiene 3 `disponible_web`, el criterio de 7 no se cumple → Ejecutor debe ampliar el catálogo o ajustar el criterio a los documentos realmente disponibles.

2. **CI + Dominio:** Verificar en browser:
   - `https://github.com/romerobarcenabraulio-hash/ALQUIMIA-SLP--/actions` → último run verde
   - `https://alquimiaplatform.com` → carga < 3s, DevTools Console sin errores críticos (no 4xx/5xx en recursos principales)

**Condición de cierre definitivo:** los 2 ítems pendientes pasan → actualizar esta bitácora con "FASE GOV CERRADA" y fecha.

— *Auditor · ALQUIMIA · Fase GOV · 2026-05-06*

---

## Ejecutor · cierre hallazgos DIA (landing + S15) · 2026-05-07

**Mandato:** implementar en código los ajustes prioritarios del SCAN DIA (datos alineados al motor; copy sin contradicciones flagrantes).

**Archivos:**
- `frontend/src/lib/landingReferenceKpis.ts` (nuevo) — RSU t/día ZM SLP desde `ZMS` + `ESTACIONALIDAD`; ingreso anual MXN desde `calcular(SIMULATOR_STATE_DEFAULT)`.
- `frontend/src/app/page.tsx` — H1 y KPIs usan esas funciones; rango relleno 15–40% unificado; ingreso brutos con etiqueta de escenario por defecto; nota metodológica; afirmación “minutos” acotada a cómputo vs calendario municipal.
- `frontend/src/components/simulator/ImpactoAmbiental.tsx` — factores PET/aluminio en texto alineados a `FACTORES_EMISION` del motor.

**Verificación:** `npx tsc --noEmit` en `frontend/` → exit 0.

— *Ejecutor (implementación post-DIA SCAN)*

---

## DIA / producto · Madurez municipal heterogénea · 2026-05-07

**Mandato fundador:** cada municipio tiene escenario propio (norma de aseo/limpia, kg/hab·día, población de referencia, madurez en circularidad); los reglamentos en `ADENDOS: LEGAL/pdfs/reglamentos/` son ejemplos por municipio, no un único estándar metropolitano mezclado.

**Implementación en código:**
- `frontend/src/lib/municipioMadurezContexto.ts` — textos de contexto a partir de `ZMS` + `reglamentoFuentePorMunicipio`.
- `frontend/src/components/simulator/MunicipioMadurezBanner.tsx` — aviso bajo “Ciudad primero”.
- `frontend/src/components/simulator/SectionHero.tsx` — cinta breve según ancla(s).
- `frontend/public/reglamentos/README.md` — sección explícita sobre madurez heterogénea.

**Verificación:** `npx tsc --noEmit` en `frontend/`.

— *CSA / Ejecutor · ALQUIMIA*

