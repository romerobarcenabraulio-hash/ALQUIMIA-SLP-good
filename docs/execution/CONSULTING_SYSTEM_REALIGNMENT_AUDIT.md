# Consulting System Realignment Audit

Fecha: 2026-06-01

Estado: PARTIAL. El contrato consultivo, API compartida, export ZIP, guards cliente y smoke operativo local ya pasan; no se declara cierre productivo hasta QA visual/browser real y verificación de integridad contra DB externa.

## Decisión

ALQUIMIA RSU Gobierno debe cerrarse como sistema de consultoría automatizada, no como dashboard, simulador libre ni generador decorativo de expedientes.

El producto cliente debe presentar diagnóstico, brechas, escenarios cerrados, matriz de riesgos, hoja de ruta y evidencia por claim. La experiencia cliente no debe exponer sliders libres, nombres internos de agentes, SLP hardcodeado, benchmarks como estudio local ni cifras sin fuente, fecha, método, alcance y confianza.

## Implementado en este corte

| Área | Evidencia | Estado |
| --- | --- | --- |
| Contrato consultivo | `frontend/src/lib/consultingPackageEngine.ts` define `ConsultingPackage`, `PrivateGeneratorMix`, `MaterialPriceMix`, `ScenarioSet`, `ClaimLedgerEntry`, `EvidenceGap` | PASS inicial |
| Escenarios cerrados | Cinco escenarios fijos: mínimo viable, conservador, base realista, optimizado y estrés | PASS inicial |
| Sin sliders cliente | `ScenarioSet.client_controls_enabled` queda en `false`; calibración solo founder/admin | PASS inicial |
| Captura privada amplia | El mix privado incluye fraccionamientos, vivienda vertical, escuelas, plazas, mercados, hoteles/restaurantes, oficinas, hospitales privados, industria ligera y macrogeneradores | PASS inicial |
| Precio ponderado | `material_price_mix` calcula precio de escenario con canal local/regional/premium, rechazo, logística y castigo por calidad | PASS inicial |
| Claim ledger | Los claims bloqueados o sin metadata no se renderizan como afirmaciones | PASS inicial |
| Integración `/v` | `ConsultingPackagePanel` queda integrado en `PlatformPage` después de brechas documentales | PASS inicial |
| API compartida | `GET /api/tenants/[id]/consulting-package` alimenta UI y export sin contrato paralelo | PASS inicial |
| Export consultivo | ZIP incluye `consulting_manifest.json`, `consulting_package.json`, `claim_ledger.json`, `input_registry.json`, `scenario_set.json` y síntesis MD | PASS inicial |
| Capas existentes | `consultingApiLayerContracts` amarra el paquete a `national`, `data`, `centros_acopio`, `macros`, `market`, `legal`, `operations`, `standards` y `documents` | PASS inicial |
| Adaptadores API | `consultingApiLayerAdapters` normaliza payloads reales con fuente, fecha, método, alcance y confianza antes de habilitar readiness | PASS inicial |
| Fetchers API | `consultingApiLayerFetchers` construye URLs contra routers reales existentes sin namespace paralelo | PASS inicial |
| Contexto API por tenant | `tenantConsultingApiContext` bloquea fetch automático si faltan `municipio_id`, `clave_inegi` o `zm` formales | PASS inicial |
| Onboarding territorial | Perfil de cuenta conserva y devuelve `municipio_id`, `clave_inegi` y `zm`; la UI no usa SLP como fallback cuando no hay selección | PASS inicial |
| Contexto runtime frontend | `/api/tenants/[id]/data` y `/consulting-package` aceptan headers territoriales controlados sin convertir brechas en evidencia | PASS inicial |
| Tenant state real | `/admin/tenants/{tenant_id}/state` devuelve `municipal_context`; `/v` lo persiste y recarga datos consultivos con contexto real | PASS inicial |
| Fetch API con gate | `/api/tenants/[id]/consulting-package` ejecuta fetch de capas existentes solo con header `x-consulting-api-fetch-gate: founder-admin-reviewed` | PASS inicial |
| Export API con gate | `/api/tenants/[id]/export-zip` incluye `api_layer_fetch_status.json` y paquete enriquecido solo con el mismo gate founder/admin | PASS inicial |
| Simulador en cuarentena | `/simulator` redirige usuarios no developer a `/v?tenant_id=...`; queda como laboratorio interno | PASS inicial |
| Clasificación documental de mercado | Catálogos de compradores y cotizaciones de materiales se clasifican como M13, pero permanecen como gap hasta integración humana | PASS inicial |
| Entrada RSU Gobierno | `/gobierno/rsu` redirige al paquete consultivo `/v`, no al simulador heredado | PASS inicial |
| Acceso/onboarding cliente | `/acceso` cae por defecto a `/v`; onboarding usa lenguaje de paquete consultivo y zona de análisis | PASS inicial |
| Hub sin demo tenant | `/hub` enlaza a `/v` sin `municipio-demo` y toma la primera pestaña declarada como referencia, no `SLP` literal | PASS inicial |
| Superficies públicas legacy | Aprende, CA-Studio, Header e informe dejan de invitar al simulador como experiencia cliente | PASS inicial |
| Informe legacy en cuarentena | `/informe/[municipio_id]` redirige no-developers a `/v`; sólo queda como laboratorio interno | PASS inicial |
| Entrada Gobierno RSU neutra | `/gobierno/rsu` cae a `/v` sin `municipio-demo` cuando no hay tenant formal | PASS inicial |
| Copy educativo alineado | FAQ y walkthrough dejan de prometer TIR fija, SLP o simulador; usan brecha crítica, escenarios cerrados y evidencia | PASS inicial |
| Onboarding sin posicionamiento de simulador | Catálogo de servicios usa `Escenarios financieros` con supuestos trazables, no `Simulador económico` | PASS inicial |
| Nombres internos ocultos en plataforma | `/admin`, `/v`, `/p`, `/e` y componentes de plataforma no exponen nombres internos ni `agente/agentes` en búsqueda focalizada | PASS inicial |
| CTA comercial sobrio | Gobierno cambia “demo” por sesión de diagnóstico y evita promesa de producto demo | PASS inicial |
| Login/alta a paquete consultivo | `/login` sanitiza `next`, bloquea `/simulator` y Clerk usa `/v` como fallback sin `forceRedirectUrl` | PASS inicial |
| Redirect auth testeable | `sanitizeAuthRedirectPath` cubre redirects vacíos, externos, `//`, `/simulator` y rutas internas permitidas | PASS inicial |
| Escenarios cliente con oficialidad controlada | Sandbox no renderiza `$` ni `t/día`; datos parciales siguen bloqueados; escenarios calculados se etiquetan “preliminar, no oficial” | PASS inicial |
| ZIP con advertencia institucional | Export ZIP incluye `export_notice.json` y Markdown con oficialidad, revisión humana y controles cliente desactivados | PASS inicial |
| Gates `/p` y `/e` probados | `StageReadinessNotice` cubre planeación/ejecución condicionadas, revisión humana y ocultamiento de calibración interna en vista cliente | PASS inicial |
| Middleware protegido | Guardrail confirma rutas `/v`, `/p`, `/e`, `/hub`, `/ca-studio`, `/gobierno/rsu`, `/admin` y `/simulator`, noindex y bypass legacy sólo por env explícita | PASS inicial |
| Índice homogéneo por ciudad | Prueba exige misma secuencia, mismos IDs, títulos y obligatoriedad del índice documental en sandbox, completo, parcial y brecha | PASS inicial |
| Smoke operativo local | `python3 scripts/phase10_operational_smoke.py --skip-slp --json` valida health, CRUD tenant, gates humanos, rutas por etapa, registry y evidencia visual existente | PASS local |
| Lienzo consultivo sin card contenedora | `ConsultingPackagePanel` usa un canvas editorial sin borde/fondo envolvente y evita cards anidadas en listas de insumos, gates, claims y calibración | PASS inicial |
| Pulido editorial de plataforma | `PlatformPage`, `StageReadinessNotice` y `PillarModulePanel` reducen contenedores tipo card y usan bordes editoriales/franjas laterales para jerarquía | PASS inicial |
| Warnings locales de admin corregidos | `/admin/page.tsx` queda sin helpers muertos ni `eslint-disable` sobrante en validación focalizada | PASS inicial |
| Admin temporal personal | `romero.barcena.braulio@gmail.com` queda como correo admin temporal en backend y frontend; onboarding no degrada su rol y Clerk permite vista interna por email aunque falte metadata | PASS temporal |
| Selector admin de ciudad | `/v`, `/p` y `/e` ya no muestran error técnico cuando falta `tenant_id`; presentan filtro de tenants, etapa, gates, brechas documentales, link a backoffice y entrada manual de `tenant_id` | PASS inicial |
| Reglamento como único bloqueo de emisión | El índice documental permanece homogéneo por ciudad, pero `consultingPackageEngine` y `consultingInputRegistry` sólo tratan `reglamento_limpia` como requisito obligatorio para emitir plan/declaratoria; estudios, precios y compradores condicionan alcance/confianza/cifras | PASS inicial |

## Contradicciones detectadas

| Hallazgo | Ruta | Riesgo | Acción |
| --- | --- | --- | --- |
| Store legacy inicia con `zmActiva: 'SLP'` y contiene benchmarks/estimaciones históricas | `frontend/src/store/simulatorStore.ts` | SLP puede seguir contaminando experiencias heredadas si se reutilizan componentes sin filtro | Mantener `/simulator` en cuarentena interna; no reusar salidas cliente sin ledger |
| Componentes legacy del simulador muestran SLP, benchmarks o tarifas locales | `frontend/src/components/simulator/**` | El cliente podría leer una estimación como verdad municipal | No renderizar estos componentes como paquete cliente; migrar solo visualizaciones útiles con evidencia |
| Semillas demo de centros/compradores usan SLP/QRO/MTY | `backend/app/centros_acopio/repository.py` | Datos demo pueden parecer cobertura real si llegan a UI cliente | Etiquetar como seed/demo o bloquear en tenant real hasta fuente trazable |
| Standards conserva datos demo cuando no hay BD activa | `backend/app/standards/router.py` | Readiness puede parecer validación real | Bloquear como brecha o marcar explícitamente como demo no cliente |
| Hay documentación previa que declara PASS condicionado del MVP | `docs/execution/*` | Puede confundirse MVP local/founder con producción institucional | Este audit reemplaza cierre optimista: producto consultivo queda PARTIAL hasta QA institucional |
| Simulador sigue siendo superficie amplia | `frontend/src/app/simulator`, `frontend/src/components/simulator`, `frontend/src/store/simulatorStore.ts` | Sliders y narrativa antigua pueden vender el producto equivocado | Dejar como laboratorio founder/admin; cliente entra por paquete consultivo |
| QA visual browser no ejecutado | Entorno local de sandbox | No hay evidencia visual de layout real en navegador para el paquete nuevo | Ejecutar browser QA fuera de restricción de puertos o con servidor disponible |
| QA visual browser bloqueado | Entorno local de sandbox | `next dev --hostname 127.0.0.1 --port 3017` falla con `listen EPERM`; no hay evidencia visual real de `/v`, `/p`, `/e` por viewport | Reintentar browser QA cuando el entorno permita abrir puerto local |
| Integridad SLP pre/post bloqueada por red | `scripts/phase10_operational_smoke.py` sin `--skip-slp` | El script intenta conectar a Neon remoto y falla DNS/red; no es evidencia de regresión funcional, pero sí impide cierre productivo de integridad externa | Repetir con red/credenciales disponibles o DB accesible; adjuntar reporte JSON |

## Reglas de realineación

1. Ninguna cifra calculada se presenta como oficial.
2. Benchmark no sustituye estudio local.
3. Municipio y zona metropolitana no se mezclan.
4. Todo claim fuerte requiere fuente, fecha, método, alcance territorial, tipo, confianza y estado humano.
5. Si falta evidencia, se muestra brecha crítica.
6. Cliente no ve nombres internos de agentes ni sliders libres.
7. Founder/admin puede calibrar supuestos, pero la salida cliente debe ser escenario cerrado y trazable.
8. `/simulator` queda como laboratorio interno hasta que sus piezas útiles sean migradas con ledger.
9. Todas las ciudades conservan el mismo índice documental, pero el único documento obligatorio para emitir un plan/declaratoria razonable es el reglamento municipal vigente; los demás faltantes se modelan como brecha, supuesto o condicionante.

## Criterio binario pendiente

No cerrar este realineamiento como completo hasta que se cumpla todo:

- `/v?tenant_id=municipio-demo` muestra paquete consultivo sin cifras cuantitativas.
- `/v?tenant_id=partial-city` muestra escenarios solo cuando existan datos mínimos y los marca como escenario, no oficialidad.
- No aparecen nombres internos de agentes en UI cliente.
- No aparece SLP como fallback visual cliente.
- No aparece benchmark como estudio local.
- Cliente no ve sliders.
- Founder/admin sí ve panel técnico interno.
- `npm run type-check`, `npm run build` y tests focalizados pasan.
- Con reglamento integrado, el plan puede emitirse aunque falten estudios, compradores o precios; esas ausencias no se ocultan ni se convierten en verdad municipal.

## Evidencia automatizada del corte

- `npm run test -- --run src/lib/consultingApiLayerContracts.test.ts src/lib/archivoFull.test.ts 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/lib/documentArchiveStore.test.ts src/lib/consultingInputRegistry.test.ts` PASS.
- `npm run test -- --run src/lib/consultingApiLayerFetchers.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingPackageEngine.test.ts` PASS.
- `npm run test -- --run src/lib/tenantConsultingApiContext.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingPackageResponse.test.ts 'src/app/api/tenants/[id]/consulting-package/route.test.ts'` PASS.
- `npm run test -- --run src/lib/tenantConsultingApiContext.test.ts src/lib/tenantConsultingPackageResponse.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/documentArchiveStore.test.ts` PASS.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts` PASS.
- `python3 -m py_compile backend/app/routers/auth.py backend/app/auth/user_service.py` PASS.
- `npm run type-check` PASS.
- `npm run build` PASS.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 71 tests.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' 'src/app/api/tenants/[id]/consulting-package/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/consultingApiLayerAdapters.test.ts` PASS.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 8 tests tras bloquear regresiones de acceso/onboarding/hub hacia simulador legacy.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 73 tests.
- `npm run dev -- --hostname 127.0.0.1 --port 3017` BLOQUEADO por sandbox: `listen EPERM`.
- `python3 -m py_compile backend/app/routers/admin.py backend/app/routers/auth.py backend/app/auth/user_service.py` PASS.
- `npm run type-check` PASS tras acceso/onboarding/hub.
- `npm run build` PASS tras acceso/onboarding/hub.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 8 tests tras cuarentena de informe, aprende, CA-Studio y entrada RSU Gobierno.
- `npm run type-check` PASS tras cuarentena de superficies públicas legacy.
- `npm run build` PASS tras cuarentena de superficies públicas legacy.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 74 tests.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 9 tests tras alinear FAQ/walkthrough.
- `npm run type-check` PASS tras alinear copy educativo.
- `npm run build` PASS tras alinear copy educativo.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 75 tests.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 11 tests tras endurecer CTA comercial y login/alta.
- `npm run type-check` PASS tras endurecer login/alta.
- `npm run build` PASS tras endurecer login/alta.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 77 tests.
- `npm run test -- --run src/lib/authRedirects.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 14 tests.
- `npm run type-check` PASS tras extraer redirects auth testeables.
- `npm run build` PASS tras extraer redirects auth testeables.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 80 tests.
- `python3 -m py_compile backend/app/routers/admin.py backend/app/routers/auth.py backend/app/auth/user_service.py backend/app/auth/email_service.py` PASS.
- `npm run test -- --run src/components/platform/ConsultingPackagePanel.test.tsx` PASS, 7 tests con sandbox sin cifras, partial bloqueado y escenarios calculados preliminares/no oficiales.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 82 tests.
- `npm run type-check` PASS tras etiquetas de oficialidad en escenarios.
- `npm run build` PASS tras etiquetas de oficialidad en escenarios.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts'` PASS con `export_notice.json`, `officiality`, `human_review_required` y `client_controls_enabled`.
- `npm run test -- --run src/lib/consultingPackageEngine.test.ts src/lib/consultingInputRegistry.test.ts src/components/platform/ConsultingPackagePanel.test.tsx src/lib/archivoFull.test.ts 'src/app/api/tenants/[id]/export-zip/route.test.ts'` PASS, 32 tests tras separar reglamento obligatorio de brechas condicionantes.
- `npx eslint src/lib/consultingPackageEngine.ts src/lib/consultingInputRegistry.ts src/lib/tenantDiagnosticData.ts src/components/platform/ConsultingPackagePanel.tsx src/lib/consultingPackageEngine.test.ts src/components/platform/ConsultingPackagePanel.test.tsx` PASS.
- `npm run type-check` PASS tras reglamento como único bloqueo de emisión.
- `npm run build` PASS tras reglamento como único bloqueo de emisión.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras reglamento como único bloqueo de emisión.
- `npm run test` PASS, 66 archivos y 276 pruebas frontend tras reglamento como único bloqueo de emisión.
- `npm run type-check` PASS tras advertencia institucional en ZIP.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 82 tests.
- `npm run build` PASS tras advertencia institucional en ZIP.
- `npm run test -- --run src/components/platform/PlatformPage.stageReadiness.test.tsx src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 14 tests.
- `npm run type-check` PASS tras exportar y probar `StageReadinessNotice`.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 85 tests.
- `npm run build` PASS tras prueba de gates `/p` y `/e`.
- `npm run test -- --run src/lib/middlewareGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 17 tests.
- `npm run type-check` PASS tras guardrails de middleware.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/middlewareGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 88 tests.
- `npm run build` PASS tras guardrails de middleware.
- `npm run test -- --run src/lib/documentArchiveStore.test.ts` PASS con contrato estricto de índice homogéneo.
- `npm run type-check` PASS tras contrato estricto de índice homogéneo.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' 'src/app/api/tenants/[id]/data/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/authRedirects.test.ts src/lib/middlewareGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts src/lib/documentArchiveStore.test.ts src/lib/consultingApiLayerContracts.test.ts src/lib/consultingApiLayerAdapters.test.ts src/lib/consultingApiLayerFetchers.test.ts src/lib/tenantConsultingApiContext.test.ts src/lib/tenantMunicipalContextHeaders.test.ts src/lib/platformRouting.test.ts` PASS, 88 tests.
- `npm run build` PASS tras contrato estricto de índice homogéneo.
- `npm run test` PASS, 65 archivos y 267 pruebas frontend.
- `npm run type-check` PASS tras suite completa.
- `npm run build` PASS tras suite completa.
- `python3 -m py_compile backend/app/routers/admin.py backend/app/routers/auth.py backend/app/auth/user_service.py backend/app/auth/email_service.py` PASS tras suite completa.
- `npm run lint` PASS sin errores; mantiene deuda legacy de 162 warnings tras corregir warnings triviales en `middleware.ts` y `GaugeCO2.tsx`.
- `npm run test -- --run src/lib/middlewareGuardrails.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS tras limpieza de warnings tocados.
- `npm run type-check` PASS tras limpieza de warnings tocados.
- `npm run build` PASS tras limpieza de warnings tocados.
- `npm run test -- --run 'src/app/api/tenants/[id]/export-zip/route.test.ts' src/components/platform/ConsultingPackagePanel.test.tsx 'src/app/api/tenants/[id]/consulting-package/route.test.ts' src/lib/tenantConsultingPackageResponse.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/lib/archivoFull.test.ts src/lib/consultingInputRegistry.test.ts src/lib/consultingPackageEngine.test.ts` PASS en corte previo.
- `npm run type-check` PASS en corte previo.
- `npm run build` PASS en corte previo.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS: health backend, deep health, tenant CRUD, gates por etapa, cierre de gate sin evidencia bloqueado, registry parseable, rutas `/v`, `/p`, `/e`, `/admin` presentes y 6/6 screenshots existentes.
- `python3 scripts/phase10_operational_smoke.py` BLOQUEADO sólo en `slp_pre_post_integrity`: DNS/red a host Neon remoto no resuelve; los checks locales previos del mismo smoke pasaron.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 12 tests tras bloquear regreso de `Simulador económico` en onboarding.
- `npm run type-check` PASS tras limpieza de onboarding.
- `npm run build` PASS tras limpieza de onboarding y smoke local.
- `npm run test -- --run src/components/platform/ConsultingPackagePanel.test.tsx src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 20 tests tras pulido de lienzo consultivo.
- `npm run type-check` PASS tras pulido de lienzo consultivo.
- `npm run build` PASS tras pulido de lienzo consultivo.
- `npm run test` PASS, 65 archivos y 269 pruebas frontend tras pulido de lienzo consultivo.
- `rg -n "NOUS|MARCOS|HERMES|AGORA|KRONOS|ARCHIVO|agente|agentes" frontend/src/app/admin/page.tsx frontend/src/components/platform frontend/src/app/v frontend/src/app/p frontend/src/app/e --glob '!**/*.test.ts' --glob '!**/*.test.tsx'` sin hallazgos tras ocultar nombres internos en UI de plataforma.
- `npm run test -- --run src/lib/clientFacingConsultingGuardrails.test.ts src/components/platform/ConsultingPackagePanel.test.tsx src/components/platform/PlatformPage.stageReadiness.test.tsx` PASS, 23 tests tras ocultar nombres internos en admin/plataforma.
- `npm run type-check` PASS tras ocultar nombres internos en admin/plataforma.
- `npm run build` PASS tras ocultar nombres internos en admin/plataforma.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras ocultar nombres internos: health, deep health, tenant CRUD, gates, rutas, registry y evidencia visual existente sin blockers.
- `npm run test -- --run src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/PillarModulePanel.test.tsx src/components/platform/ConsultingPackagePanel.test.tsx src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 27 tests tras pulido editorial de plataforma.
- `npx eslint src/app/admin/page.tsx src/components/platform/PlatformPage.tsx src/components/platform/PillarModulePanel.tsx src/components/platform/ConsultingPackagePanel.tsx` PASS sin warnings en superficies tocadas.
- `npm run lint` PASS con 0 errores y 157 warnings legacy; bajó desde 162 tras limpiar `/admin/page.tsx`.
- `npm run build` PASS tras pulido editorial de plataforma.
- `npm run type-check` PASS en ejecución aislada; una ejecución paralela con `next build` falló por `.next/types/validator.ts` sin `routes.js`, atribuible a interferencia de generación concurrente.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras pulido editorial: health, deep health, tenant CRUD, gates, rutas, registry y evidencia visual existente sin blockers.
- `python3 -m pytest backend/tests/test_auth_accounts.py` PASS, 7 tests; incluye preservación de rol `admin` para `romero.barcena.braulio@gmail.com` durante onboarding.
- `npm run test -- --run src/components/platform/FounderViewModeSwitcher.test.ts src/lib/clientFacingConsultingGuardrails.test.ts src/components/platform/PlatformPage.stageReadiness.test.tsx` PASS, 18 tests; incluye acceso interno temporal por correo personal sin metadata Clerk.
- `npm run type-check` PASS tras admin temporal.
- `npx eslint src/components/platform/FounderViewModeSwitcher.tsx src/components/platform/FounderViewModeSwitcher.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS sin warnings.
- `python3 -m py_compile backend/app/auth/user_service.py backend/app/routers/auth.py backend/app/routers/admin.py` PASS tras admin temporal.
- `npm run build` PASS tras admin temporal.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras admin temporal: health, deep health, tenant CRUD, gates, rutas, registry y evidencia visual existente sin blockers.
- `npm run test` PASS, 66 archivos y 272 pruebas frontend tras admin temporal.
- `npm run dev -- --hostname 127.0.0.1 --port 3017` BLOQUEADO nuevamente por sandbox: `listen EPERM`; impide QA visual/browser real desde este entorno.
- `npm run test -- --run src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/FounderViewModeSwitcher.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 20 tests tras selector admin de ciudad.
- `npm run type-check` PASS tras selector admin de ciudad.
- `npx eslint src/components/platform/PlatformPage.tsx src/components/platform/PlatformPage.stageReadiness.test.tsx` PASS sin warnings tras selector admin de ciudad.
- `npm run build` PASS tras selector admin de ciudad.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras selector admin de ciudad: health, deep health, tenant CRUD, gates, rutas, registry y evidencia visual existente sin blockers.
- `npm run test -- --run src/components/platform/PlatformPage.stageReadiness.test.tsx src/components/platform/FounderViewModeSwitcher.test.ts src/lib/clientFacingConsultingGuardrails.test.ts` PASS, 20 tests tras añadir estado/gates/brechas documentales al selector admin.
- `npm run type-check` PASS tras añadir estado/gates/brechas documentales al selector admin.
- `npx eslint src/components/platform/PlatformPage.tsx src/components/platform/PlatformPage.stageReadiness.test.tsx` PASS sin warnings tras añadir estado/gates/brechas documentales al selector admin.
- `npm run build` PASS tras añadir estado/gates/brechas documentales al selector admin.
- `python3 scripts/phase10_operational_smoke.py --skip-slp --json` PASS tras añadir estado/gates/brechas documentales al selector admin.
