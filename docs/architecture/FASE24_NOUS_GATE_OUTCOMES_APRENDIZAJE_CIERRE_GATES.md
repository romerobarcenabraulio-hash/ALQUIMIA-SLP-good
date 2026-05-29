# Fase 24 · NOUS gate outcomes y aprendizaje por cierre de gates

**Estado:** cerrado técnico como capa 2 observacional interna  
**Fecha:** 2026-05-28  
**Decisión:** NOUS observa outcomes de gates y detecta patrones internos con N suficiente; no publica recomendaciones al cliente, no cambia gates y no usa variables protegidas.

## 1 · Lectura ejecutiva

La capa dos de NOUS quedó conectada al registro de outcomes de gates. ALQUIMIA ahora puede capturar snapshots de cierre, falla, diferimiento o cierre con modificaciones de G1-G5, respetando opt-in y privacidad.

Con `8+` outcomes comparables, NOUS crea un patrón interno de capa 2. El patrón queda en queue Founder/AUDITOR y permanece bloqueado para clientes hasta bias check y founder gate futuro.

## 2 · Observer de gate outcomes

Endpoint observado:

- `POST /admin/tenants/{tenant_id}/nous/gate-outcomes`

Flujo conectado:

- `POST /admin/tenants/{tenant_id}/gates/{gate_id}/close` registra automáticamente un `GateOutcomeSnapshot.v1` con outcome `cerrado_exitoso`, sin cambiar etapa y sin publicar patrones.

Outcomes soportados:

- `cerrado_exitoso`
- `fallido`
- `diferido`
- `cerrado_con_modificaciones`

Campos capturados:

- `tenant_id`
- `gate`
- `outcome`
- `closed_at`
- `days_to_close`
- `module_state_at_close`
- `municipality_profile`
- `political_context`
- `payer_configuration`
- `included_in_aggregate`
- `aggregate_exclusion_reason`

## 3 · GateOutcomeSnapshot

`module_state_at_close` se normaliza como `GateOutcomeSnapshot.v1`.

Campos esperados:

- `data_completeness_pct`
- `validation_pct`
- `key_metrics`
- `recommendations_accepted`
- `recommendations_rejected`
- `rejected_reasons`

Si falta algún campo, no se inventa. El snapshot queda con:

```json
{
  "snapshot_complete": false,
  "missing_snapshot_fields": ["validation_pct"]
}
```

## 4 · Detector interno capa 2

Reglas:

1. Solo procesa outcomes con `included_in_aggregate = true`.
2. Sin opt-in, el outcome sirve al tenant pero no alimenta patrón agregado.
3. Agrupa por:
   - gate;
   - rango poblacional anonimizado;
   - región anonimizada;
   - configuración de pago;
   - banda estructural de oposición.
4. No usa nombres de funcionarios ni partido político específico.
5. N mínimo:
   - `8` outcomes: `emergente`;
   - `15` outcomes: `establecido`;
   - `30` outcomes: `robusto`.
6. N < 8 no genera patrón de gate.

## 5 · Estadística permitida

Cada patrón incluye:

- conteos de outcome;
- proporción de éxito, donde éxito = `cerrado_exitoso` o `cerrado_con_modificaciones`;
- intervalo Wilson 95%;
- `fisher_exact = not_applied_single_cohort` cuando no hay comparación 2x2 defendible;
- explicación natural replicable.

No se usa lenguaje de predicción.

## 6 · Patrón interno capa 2

Ejemplo:

```json
{
  "pattern_layer": 2,
  "pattern_status": "draft_observed",
  "observations_count": 8,
  "confidence_level": "emergente",
  "published_to_clients": false,
  "founder_gate_status": "pending",
  "pattern_description_technical": {
    "gate": "G1",
    "success_proportion": 1.0,
    "confidence_interval_95": {
      "low": 0.6756,
      "high": 1.0
    },
    "client_visible": false,
    "automatic_gate_change": false
  }
}
```

## 7 · Bias/privacy gate

Permitido:

- `cabildo_composition`
- `opposition_pct`
- `elections_proximity_months`
- `media_coverage_sentiment`
- tamaño municipal anonimizado
- región anonimizada

Bloqueado o excluido:

- partido político específico;
- nombres de funcionarios;
- teléfonos;
- correos;
- regidores/síndicos como personas identificables;
- recomendaciones políticas sobre con quién negociar.

AUDITOR conserva veto. Founder gate sigue obligatorio antes de cualquier publicación futura.

## 8 · Queue interna

Endpoints:

- `GET /admin/nous/patterns/queue`
- `PATCH /admin/nous/patterns/{pattern_id}/review`

Acciones:

- `approve_internal`
- `reject`
- `postpone`
- `retire`

Ninguna acción publica al cliente ni cambia gates.

## 9 · Evidencia de no publicación

`GET /admin/tenants/{tenant_id}/nous/observations` mantiene:

```json
{
  "published_patterns": [],
  "client_visible_patterns": [],
  "automatic_prior_recalibration": false
}
```

Los patrones de capa 2 tampoco modifican `TenantGate`, `tenant_state` ni `capability_registry.json`.

El cierre manual de gate conserva:

```json
{
  "automatic_stage_transition": false,
  "stage_after_close": "validation"
}
```

## 10 · Archivos modificados

- `backend/app/automation/nous_observational.py`
- `backend/app/routers/admin.py`
- `backend/tests/test_admin_tenants.py`
- `backend/tests/test_phase24_nous_gate_outcomes.py`
- `docs/architecture/FASE24_NOUS_GATE_OUTCOMES_APRENDIZAJE_CIERRE_GATES.md`

## 11 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase24_nous_gate_outcomes.py
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase24_nous_gate_outcomes.py
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase23_nous_layer1_observers.py backend/tests/test_phase24_nous_gate_outcomes.py
```

## 12 · Gate AUDITOR

AUDITOR confirma:

- sin opt-in no hay patrón agregado;
- N < 8 no genera patrón de gate;
- N = 8 genera solo patrón interno emergente;
- variables protegidas se excluyen;
- no hay publicación cliente;
- no hay cierre automático de gates;
- no hay lenguaje de “predice”.

## 13 · Estado final

**Fase 24: cerrada técnicamente como NOUS capa 2 observacional interna.**
