# Fase 14 · Data moat, analytics cross-tenant y privacidad

**Estado:** implementada para validación técnica  
**Fecha:** 2026-05-28  
**Alcance:** analytics agregados anónimos, policy checker, N mínimo, auditoría y separación lógica de almacenes.

## Almacenes separados

1. `tenant_private_store`
   - Datos cargados o derivados de cada tenant.
   - No se devuelven en analytics cross-tenant.
   - `cross_tenant_private_access = false`.

2. `public_knowledge_base`
   - Datos públicos normalizados usados por HERMES.
   - No contiene decisiones privadas del municipio.

3. `aggregated_anonymous_analytics`
   - Patrones agregados sin `tenant_id`, `municipio_id`, nombre de municipio ni funcionarios.
   - Requiere `MIN_ANALYTICS_N = 5` para observación agregada interna.
   - Solo incluye tenants con opt-in contractual explícito (`analytics_consent.aggregated_anonymous_analytics = true`).
   - No publica patrones NOUS a clientes. La publicación queda bloqueada hasta existir storage observacional, bias audit y gate humano del founder.

## Política de anonimización

El pipeline:

- transforma población a rangos (`menor_100k`, `100k_500k`, `500k_1m`, `mayor_1m`);
- transforma municipio a tipo agregado (`capital_grande_o_metropolitano`, `capital_media`, `ciudad_intermedia`, `municipio_pequeno`);
- agrupa por cohortes anónimas;
- elimina identificadores directos;
- bloquea salida si aparecen claves privadas como `tenant_id`, `municipio_id`, `nombre`, `inegi_clave`, regidores, síndicos o decisores humanos;
- bloquea salida si `cohort_n < 5`;
- bloquea salida si una petición intenta bajar el umbral por debajo del mínimo operativo;
- excluye tenants sin consentimiento explícito antes de agregar;
- bloquea grupos anónimos vacíos o subcohortes que no alcancen el mínimo.

## Métricas permitidas

- `generacion_rsu_por_tipo_municipio`
- `tasas_captura_por_fraccion`
- `tiempos_promedio_gates`
- `capex_opex_real_vs_modelo`
- `riesgos_materializados_categoria`
- `exito_cabildo_agregado`
- `desviaciones_operativas_recurrentes`

## Fraseo permitido

Las recomendaciones derivadas de patrones agregados usan fraseo anónimo:

> Según análisis de municipios comparables anonimizados...

Nunca se permite fraseo del tipo:

> SLP tuvo X, por eso Querétaro debe Y.

## Plataforma 0

Endpoints internos:

- `POST /admin/analytics/cross-tenant`
- `POST /admin/analytics/cross-tenant/share`
- `GET /admin/analytics/cross-tenant/audit`

La salida distingue:

- `insight_visibility = internal_only`
- `shareable_after_founder_approval = false`
- `nous_status = observational_only`
- `nous_publication_eligible = false`
- `shared_as_insight = false`

La acción humana de compartir queda bloqueada en Fase 14. NOUS exige una fase posterior con `inference_corrections`, `gate_outcomes`, `projection_deltas`, `nous_patterns`, bias check y founder gate antes de publicar patrones a clientes.

## Auditoría

Cada patrón registra:

- métrica generada;
- número de tenants en cohorte;
- campos usados;
- si fue compartido como insight;
- quién aprobó compartirlo;
- timestamp.

## Prueba mínima

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase14_data_moat.py
```

La prueba cubre N insuficiente, salida agregada sin identificadores, bloqueo a rol cliente, policy checker y bloqueo de publicación por falta de NOUS/bias/founder gate.
