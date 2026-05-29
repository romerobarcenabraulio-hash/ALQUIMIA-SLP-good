# Fase 18 · NOUS storage observacional y opt-in framework

**Estado:** cerrado como base observacional  
**Fecha:** 2026-05-28  
**Decisión:** NOUS puede observar y registrar; no puede detectar, publicar, recalibrar ni sugerir patrones.

## 1 · Alcance implementado

Se creó la base mínima para que ALQUIMIA pueda aprender en el futuro sin afirmar aprendizaje activo hoy:

- Storage para `inference_corrections`.
- Storage para `gate_outcomes`.
- Storage para `projection_deltas`.
- Storage para `nous_patterns` en estado pendiente/no publicable.
- Opt-in/opt-out de analytics agregada por tenant, default `false`.
- Servicios de captura observacional.
- Endpoints internos de Plataforma 0 para registrar observaciones.
- Auditoría mínima por observación.

## 2 · Storage creado

Migración:

- `backend/alembic/versions/20260528_0013_nous_observational_storage.py`

Modelos:

- `NousInferenceCorrection`
- `NousGateOutcome`
- `NousProjectionDelta`
- `NousPattern`

Además, `AdminTenant` incluye:

- `analytics_aggregate_opt_in`
- `analytics_aggregate_opt_in_at`
- `analytics_aggregate_opt_in_by`
- `analytics_aggregate_opt_in_source`

## 3 · Endpoints creados

| Endpoint | Uso | Publica patrones |
| --- | --- | --- |
| `PATCH /admin/tenants/{tenant_id}/analytics-consent` | Activa/desactiva opt-in agregado. | No |
| `POST /admin/tenants/{tenant_id}/nous/inference-corrections` | Registra corrección de inferencia. | No |
| `POST /admin/tenants/{tenant_id}/nous/gate-outcomes` | Registra outcome de gate. | No |
| `POST /admin/tenants/{tenant_id}/nous/projection-deltas` | Registra delta proyectado vs real. | No |
| `POST /admin/nous/patterns` | Crea patrón pendiente/no publicable. | No |
| `GET /admin/tenants/{tenant_id}/nous/observations` | Lista observaciones del tenant en memoria de test. | No |

## 4 · Reglas de privacidad

- `included_in_aggregate` depende de `analytics_aggregate_opt_in`.
- Default por tenant: `false`.
- Sin opt-in, la observación queda útil para el propio tenant, pero no entra a aggregate.
- Variables protegidas y nombres personales se excluyen del perfil aprendible.
- `political_context` solo conserva variables estructurales permitidas:
  - `cabildo_composition`
  - `opposition_pct`
  - `elections_proximity_months`
  - `media_coverage_sentiment`
- No se guarda partido político específico como variable aprendible.
- No se publican patrones a clientes.

## 5 · Auditoría mínima

Cada observación registra:

- `registered_by`
- `registered_at`
- `source_module`
- `included_in_aggregate`
- `aggregate_exclusion_reason`
- `observational_only = true`
- `published_to_clients = false`
- `automatic_pattern_detection = false`

## 6 · Ejemplo opt-in false

Tenant nuevo:

```json
{
  "analytics_aggregate_opt_in": false
}
```

Corrección registrada:

```json
{
  "module_id": "M01",
  "field_id": "antecedentes.demografia.generacion_kg_hab_dia",
  "validation_action": "adjust",
  "delta_percentage": 30.0,
  "included_in_aggregate": false,
  "aggregate_exclusion_reason": "tenant_without_aggregate_opt_in"
}
```

## 7 · Ejemplo opt-in true

Opt-in:

```json
{
  "aggregated_anonymous_analytics": true,
  "consent_source": "contrato://clausula-analytics",
  "consented_by": "Founder"
}
```

Outcome registrado:

```json
{
  "gate": "G1",
  "outcome": "cerrado_exitoso",
  "included_in_aggregate": true,
  "political_context": {
    "cabildo_composition": {
      "opposition_pct": 45
    },
    "media_coverage_sentiment": "neutral"
  }
}
```

Campos como `partido`, `presidente_municipal`, regidores, síndicos o nombres personales quedan fuera del contexto aprendible.

## 8 · Lo que queda explícitamente diferido

- Pattern detectors.
- Sugerencias NOUS al cliente.
- A11 completo.
- Recalibración de priors.
- Publicación de patrones.
- Jobs diarios/trimestrales productivos.
- Claims de aprendizaje activo.
- ML o caja negra.

## 9 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase18_nous_observational.py
backend/.venv/bin/python -m pytest backend/tests/test_phase14_data_moat.py backend/tests/test_admin_tenants.py
```

Resultado registrado:

- `3 passed` en Fase 18.
- `15 passed` en regresión Fase 14 + admin tenants.

## 10 · Estado final

**Fase 18: cerrada.**

AUDITOR confirma: esto es storage observacional y opt-in framework. No hay aprendizaje activo, publicación de patrones, recalibración ni sugerencias NOUS a clientes.
