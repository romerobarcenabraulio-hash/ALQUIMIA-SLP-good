# Fase 11 - Capa de automatizacion consultiva y personalizacion automatica

Fecha: 2026-05-28  
Documento incorporado: `AJUSTES PARA FINIQUITAR/AUTOMATION_AND_PERSONALIZATION_LAYER.md`.

## Decision ejecutiva

ALQUIMIA ya tiene una capa minima de consultor automatizado: al crear un tenant en Plataforma 0, HERMES precarga un expediente preliminar con trazabilidad, confianza y no-oficialidad; KRONOS recalcula dependencias al actualizar datos; AUDITOR marca discrepancias mayores a 20%; y la UI muestra que los datos son preliminares pendientes de validacion.

Estado Fase 11: **cerrado como automatizacion minima trazable**. No incluye scraping agresivo, envio automatico, firma, cierre automatico de gates ni documentos oficiales automaticos.

## Archivos modificados

- `backend/app/automation/__init__.py`
- `backend/app/automation/inference.py`
- `backend/app/routers/admin.py`
- `backend/tests/test_phase11_automation.py`
- `frontend/src/lib/tenantMunicipalProfile.ts`
- `frontend/src/components/simulator/TenantProfilePanels.tsx`
- `frontend/src/components/simulator/TenantProfilePanels.test.tsx`

## Pipeline creado

`backend/app/automation/inference.py` define:

- `PUBLIC_KNOWLEDGE_BASE`: fuente publica fixtureada por clave INEGI para inferencia inicial controlada.
- `PUBLIC_SOURCE_CATALOG`: INEGI, CONAPO, SEMARNAT, Periodico Oficial, Transparencia, sitio municipal, prensa local, INAFED, DENUE y Banxico/CFE.
- `FIELD_SCHEMAS`: contrato KOSMOS por campo inferido, modulo destino, tipo y rango permitido.
- `run_initial_inference(...)`: crea expediente preliminar al crear tenant.
- `apply_runtime_automation(...)`: recalcula modulos dependientes y marca discrepancias mayores a 20%.
- `validate_inferred_datum(...)`: rechaza inferencias sin modulo destino en `capability_registry.json`, sin trazabilidad, fuera de rango o marcadas como oficiales.
- `automation_summary(...)`: expone separacion Public Knowledge Base / Tenant Private Store.

## Schemas de inferencia

Cada dato inferido se guarda con:

```json
{
  "value": 1049777,
  "source": {
    "id": "inegi",
    "label": "INEGI Censo 2020",
    "kind": "public",
    "extracted_at": "2026-05-28T..."
  },
  "method": "inegi_censo_2020_seed",
  "confidence": "inferred_high_confidence",
  "human_validation_state": "pending_human_validation",
  "display_status": "dato preliminar pendiente de validacion",
  "official": false,
  "module_id": "city_baseline",
  "field_path": "antecedentes.demografia.poblacion",
  "kosmos_status": "accepted"
}
```

Niveles soportados:

- `verified`
- `inferred_high_confidence`
- `inferred_medium_confidence`
- `inferred_low_confidence`

## Eventos y triggers implementados

| Evento | Resultado |
| --- | --- |
| Founder crea tenant en `/admin/tenants` | HERMES ejecuta inferencia inicial y crea municipal profile preliminar |
| Fuente publica no existe en fixture | Se guarda resultado parcial con `pending_source` y razon |
| Cliente/admin actualiza perfil municipal | KRONOS recalcula dependencias segun `capability_registry.json` |
| Dato nuevo difiere mas de 20% de inferencia | AUDITOR marca discrepancia con `requiere_revision_humana` |
| Gate sin evidencia | Permanece bloqueado; no hay cierre automatico |
| Document automation | Solo estructura `draft_ready_structure`; no envia documentos oficiales |

## Validacion KOSMOS

KOSMOS valida antes de aceptar cada dato inferido:

- Existe `field_path` declarado.
- El `module_id` destino existe en `capability_registry.json`.
- El valor respeta tipo y rango del schema local.
- El dato trae fuente, fecha de extraccion, metodo y confianza.
- `official` es siempre `false` para inferencias.
- Si una fuente falla, el dato puede quedar como `accepted_pending_source`, no como oficial.

Pruebas negativas:

- inferencia hacia modulo destino inexistente: rechazada.
- poblacion fuera de rango: rechazada.
- inferencia marcada `official: true`: rechazada.

## Ejemplo de tenant nuevo precargado

Prueba: `test_create_tenant_triggers_initial_inference_with_traceability`.

Tenant Queretaro con clave INEGI `22014` queda con:

- `provenance_status`: `preliminar_pendiente_validacion`
- poblacion: `1049777`
- fuente: `inegi`
- metodo: `inegi_censo_2020_seed`
- confianza: `inferred_high_confidence`
- validacion humana: `pending_human_validation`
- `official`: `false`
- `module_id`: `city_baseline`
- `kosmos_status`: `accepted`
- audit log: `hermes_initial_inference_completed`

## Ejemplo de dato pendiente

Prueba: `test_pipeline_saves_partial_pending_results_for_unknown_source`.

Tenant con clave INEGI `99999` queda en:

- inference status: `partial`
- poblacion: `value = null`
- `human_validation_state`: `pending_source`
- `kosmos_status`: `accepted_pending_source`
- razon: `Clave INEGI sin fixture de poblacion`
- modo cliente: `carga_inicial`

El cliente puede entrar con datos parciales; no ve pantalla vacia ni dato inventado como oficial.

## Ejemplo de discrepancia mayor a 20%

Prueba: `test_runtime_update_recalculates_dependencies_and_marks_20_percent_discrepancy`.

Si la poblacion inferida de Queretaro cambia de `1049777` a `1400000`, el runtime registra:

- campo: `antecedentes.demografia.poblacion`
- delta mayor a 20%
- status: `requiere_revision_humana`
- modulos recalculados: incluye `city_baseline`
- `automatic_stage_transition`: `false`

## Separacion publico / privado

Prueba: `test_public_private_store_separation_and_no_cross_tenant_private_access`.

La inferencia guarda dos scopes logicos:

- `public_knowledge_base`: datos publicos reutilizables por municipio/clave INEGI.
- `tenant_private_store`: datos privados por `tenant_id`.

La prueba crea dos tenants y confirma:

- ambos pueden usar la Public Knowledge Base.
- cada Tenant Private Store tiene tenant_id distinto.
- `cross_tenant_private_access` es `false`.

## UI y carga cognitiva

`TenantProfilePanels.tsx` muestra:

- `preliminar_pendiente_validacion`
- `dato preliminar pendiente de validacion`
- fuente + confianza en texto, sin contenedores nuevos ni bloques anidados.
- `Nada estimado se presenta como oficial.`

Esto preserva el criterio POLIS/Minto: la advertencia vive en texto controlado, no en fondos decorativos.

## Pruebas ejecutadas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase11_automation.py backend/tests/test_admin_tenants.py
```

Resultado: `14 passed`.

```bash
cd frontend && npm run test -- src/components/simulator/TenantProfilePanels.test.tsx src/lib/tenantMunicipalProfile.test.ts src/lib/platformRouting.test.ts
```

Resultado: `3 files passed`, `11 tests passed`.

```bash
cd frontend && npm run type-check
```

Resultado: sin errores.

```bash
backend/.venv/bin/python scripts/phase10_operational_smoke.py
```

Resultado: `ok: true`, sin blockers; tenant_state, gates, capabilities, 403, SLP y rutas presentes siguen vivos.

```bash
cd frontend && npm run build
```

Resultado: build correcto. Primer intento fallo por artefacto stale `.next/server`; se limpio `frontend/.next` y el rerun paso.

Rerun posterior tras endurecer KOSMOS: build correcto tras limpiar nuevamente `.next` por artefacto stale `pages-manifest.json`.

## AUDITOR

Confirmado:

- La maquina analiza; no decide.
- No hay firma, aprobacion, comunicacion oficial ni cierre automatico de gates.
- Toda inferencia creada por el pipeline trae fuente, fecha, metodo, confianza y estado de validacion humana.
- Los datos inferidos se muestran como preliminares, no oficiales.
- Datos privados quedan separados por tenant.
- Benchmarks/public knowledge no exponen datos privados cross-tenant.
- El tenant puede operar con resultados parciales.

## Pendientes fuera de alcance

- Scraping real con retries/observabilidad externa.
- Inngest/background worker real de 15 minutos.
- Alertas WhatsApp reales.
- Generacion/envio automatico de documentos oficiales.
- Firma o cierre automatico de decisiones.
- Persistencia fisica separada en tablas dedicadas para Public Knowledge Base y Tenant Private Store; por ahora la separacion es logica y testeada.
