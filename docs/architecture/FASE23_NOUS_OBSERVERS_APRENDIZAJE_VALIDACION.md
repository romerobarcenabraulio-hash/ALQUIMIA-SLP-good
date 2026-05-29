# Fase 23 · NOUS observers y aprendizaje por validación

**Estado:** cerrado técnico como capa 1 observacional interna  
**Fecha:** 2026-05-28  
**Decisión:** NOUS detecta patrones emergentes internos desde validaciones de inferencias; no publica al cliente, no recalibra priors y no predice.

## 1 · Lectura ejecutiva

La capa uno de NOUS quedó conectada al flujo de correcciones de inferencia. Cuando un cliente confirma, ajusta, reemplaza o marca un dato como no aplicable, ALQUIMIA registra la corrección con fuente, rol, delta, perfil municipal anonimizado y decisión de agregado según opt-in.

Si existen tres o más correcciones similares, opt-in y comparables, NOUS crea un patrón emergente interno. Ese patrón queda en queue de Founder/AUDITOR y permanece no publicable para `/v`, `/p` y `/e`.

## 2 · Observers implementados

Endpoint observado:

- `POST /admin/tenants/{tenant_id}/nous/inference-corrections`

Acciones capturadas:

- `confirm`
- `adjust`
- `replace`
- `not_applicable`

Campos registrados:

- `inferred_value`
- `corrected_value`
- `delta_percentage`
- `corrected_by_role`
- `municipality_profile`
- `source_used_for_inference`
- `included_in_aggregate`
- `aggregate_exclusion_reason`
- `audit`

## 3 · Detector capa 1

El detector vive en `backend/app/automation/nous_observational.py`.

Regla:

1. Solo usa correcciones con `included_in_aggregate = true`.
2. Solo usa acciones `adjust` y `replace`.
3. Agrupa por:
   - `field_id`
   - rango poblacional anonimizado
   - región anonimizada
   - fuente original
   - dirección del delta
4. Rechaza `field_id` con variables protegidas o personales como partido político, presidente municipal, regidores, síndicos, titular, teléfono o correo.
5. Si encuentra `3+` correcciones similares, crea un patrón `pattern_layer = 1`.
6. El patrón nace como `draft_observed`.

Nota de reconciliación: `LEARNING_AND_FEEDBACK_LAYER.md` describe ajuste de prior con `3+` correcciones. En Fase 23 se deja bloqueado deliberadamente: `n=3` solo crea patrón emergente interno. No hay recalibración automática por la regla de alcance de esta fase.

Lenguaje generado:

> “Se observaron N correcciones similares…”

Incluye:

- N;
- perfil comparable anonimizado;
- delta promedio;
- fuente original;
- aviso de no publicación al cliente.

## 4 · Estados de patrón

Estados soportados:

- `draft_observed`
- `pending_auditor_review`
- `pending_founder_gate`
- `approved_internal`
- `rejected`
- `retired`

Endpoint de queue interna:

- `GET /admin/nous/patterns/queue`

Endpoint de revisión:

- `PATCH /admin/nous/patterns/{pattern_id}/review`

Acciones de revisión:

- `approve_internal`
- `reject`
- `postpone`
- `retire`

Ninguna acción publica al cliente ni recalibra automáticamente.

## 5 · Privacidad y sesgo

Reglas aplicadas:

- Sin opt-in, una corrección no alimenta patrones agregados.
- Variables protegidas y nombres personales quedan excluidos del `municipality_profile`.
- Campos personales o protegidos quedan excluidos también como `field_id` aprendible.
- No se usa partido político específico como variable aprendible.
- Patrones emergentes no aparecen en `/v`, `/p` ni `/e`.
- Founder gate queda pendiente para cualquier publicación futura.
- AUDITOR puede rechazar por sesgo o muestra no defendible.

## 6 · Ejemplo opt-in false

Corrección:

```json
{
  "validation_action": "adjust",
  "inferred_value": 1.0,
  "corrected_value": 1.3,
  "delta_percentage": 30.0,
  "included_in_aggregate": false,
  "aggregate_exclusion_reason": "tenant_without_aggregate_opt_in"
}
```

Resultado:

- se registra para el propio tenant;
- no entra a patrones;
- queue interna queda vacía.

## 7 · Ejemplo patrón emergente interno

Tres tenants con opt-in ajustan el mismo campo al alza:

```json
{
  "pattern_layer": 1,
  "pattern_status": "draft_observed",
  "observations_count": 3,
  "confidence_level": "emergente_interno",
  "published_to_clients": false,
  "pattern_description_technical": {
    "average_delta_percentage": 30.0,
    "client_visible": false,
    "automatic_prior_recalibration": false
  }
}
```

Resultado:

- patrón interno creado;
- aparece en queue de Founder/AUDITOR;
- no aparece como patrón publicado al cliente;
- no modifica priors.

## 8 · Evidencia de no publicación

`GET /admin/tenants/{tenant_id}/nous/observations` devuelve:

```json
{
  "published_patterns": [],
  "client_visible_patterns": [],
  "automatic_prior_recalibration": false
}
```

## 9 · Archivos modificados

- `backend/app/automation/nous_observational.py`
- `backend/app/routers/admin.py`
- `backend/app/models/admin_tenant.py`
- `backend/alembic/versions/20260528_0014_nous_layer1_pattern_status.py`
- `backend/tests/test_phase23_nous_layer1_observers.py`
- `docs/architecture/FASE23_NOUS_OBSERVERS_APRENDIZAJE_VALIDACION.md`

## 10 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase23_nous_layer1_observers.py
backend/.venv/bin/python -m pytest backend/tests/test_phase18_nous_observational.py backend/tests/test_phase23_nous_layer1_observers.py
```

## 11 · Gate AUDITOR

AUDITOR confirma:

- no hay aprendizaje opaco;
- no hay publicación prematura;
- no hay recalibración automática;
- no hay uso de variables protegidas;
- n=3 produce patrón emergente interno, no estable;
- el founder/AUDITOR revisa internamente antes de cualquier uso futuro.

## 12 · Estado final

**Fase 23: cerrada técnicamente como capa 1 observacional interna.**
