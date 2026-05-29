# Fase 13 · Runtime automation y recomendaciones por módulo

**Estado:** implementada para validación técnica  
**Fecha:** 2026-05-28  
**Alcance:** eventos runtime, recalculo por dependencias, discrepancias, recomendaciones trazables y decisiones humanas.

## Regla rectora

La máquina recomienda; el humano decide. Esta fase no cierra gates, no cambia `current_stage`, no firma documentos y no envía comunicaciones externas.

## Eventos soportados

- `dato_actualizado_por_cliente`
- `dato_inferido_actualizado`
- `discrepancia_detectada`
- `gate_proximo`
- `kpi_desviado`
- `cierre_mensual_operativo`
- `sesion_cabildo_proxima`

Cada evento se guarda en `tenant.municipal_profile.antecedentes._automation.runtime.events[]` con prioridad, timestamp y banderas explícitas:

- `external_dispatch = false`
- `automatic_gate_change = false`
- `automatic_stage_transition = false`

## Recalculo por dependencias

El motor lee `produces_data_for` desde `docs/architecture/capability_registry.json`. Si el registry no declara salidas para un módulo fuente, usa fallback auditable por `depends_on` reverso y lo registra como `dependency_mode = depends_on_reverse_fallback`.

Cada recalculo queda en `runtime.recalculation_log[]` con:

- campo cambiado
- módulo fuente
- módulos recalculados
- modo de dependencia
- causa
- evento que lo disparó

## Discrepancias

Si un dato cargado por cliente difiere más de 20% del dato inferido, se crea `runtime.discrepancies[]`.

Cada discrepancia conserva:

- valor inferido
- valor cliente
- delta porcentual
- fuente del dato inferido
- fuente del dato cliente
- `not_definitive_error = true`
- estado inicial `requiere_revision_humana`

Decisiones humanas disponibles:

- `aceptar_dato_cliente`
- `conservar_inferido`
- `marcar_revision_pendiente`

## Recomendaciones por módulo

El motor genera recomendaciones accionables para:

- M01 `city_baseline`
- M02C `social_diagnostico`
- M03B `marco_legal`
- M04 `costo_omision`
- M05 `roadmap_implementacion`
- M06 `infraestructura`
- M08 `logistica`
- M13 `escenarios_financieros`
- M14 `riesgos_modelo`
- M17 `monitoreo_operativo`
- M18 `doble_materialidad`
- M21 `risk_dashboard`

Cada recomendación incluye:

- recomendación específica
- justificación
- fuente o campo fuente
- trade-offs
- nivel de confianza
- opciones humanas: aceptar, rechazar o ajustar
- estado inicial `pending_human_decision`

## Endpoints Plataforma 0

- `POST /admin/tenants/{tenant_id}/runtime-events`
- `POST /admin/tenants/{tenant_id}/runtime/recommendations/{recommendation_id}/decision`
- `POST /admin/tenants/{tenant_id}/runtime/discrepancies/{discrepancy_id}/decision`

## Prueba mínima

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase13_runtime_automation.py
```

La prueba cubre evento, recalculo, discrepancia mayor a 20%, recomendaciones trazables, decisión humana y ausencia de cambios automáticos de gate/etapa.
