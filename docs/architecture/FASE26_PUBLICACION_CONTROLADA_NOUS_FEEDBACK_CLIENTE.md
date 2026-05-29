# Fase 26 · Publicación controlada de sugerencias NOUS y feedback del cliente

**Estado:** cerrado técnicamente  
**Alcance:** publicación cliente solo con gate humano completo  
**No implica:** NOUS maduro, publicación automática, recalibración automática ni autoridad oficial

## 1 · Principio operativo

NOUS sugiere; humano decide.

Una sugerencia puede aparecer en cliente solo si el patrón cumple:

- `pattern_status = approved_internal`
- `founder_gate_status = approved`
- `bias_check_status = passed`
- `marcos_standards_check.status = approved`
- `aggregate_opt_in_verified = true`
- `confidence_level` no emergente ni interno
- N mínimo por capa: capa 1 >= 5, capa 2 >= 15, capa 3 >= 18
- módulo destino permitido: `M01`, `M04`, `M13`, `M14`, `M17`, `M21`
- lenguaje EIDOS no autoritario: bloquea “debes”, “NOUS predice”, “modelo predice”, “obligatorio”

Patrones emergentes o internos siguen visibles solo en A11.

## 2 · Flujo de publicación

1. A11 registra o recibe patrón interno.
2. AUDITOR revisa sesgo.
3. MARCOS revisa estándares.
4. Founder aprueba publicación.
5. KRONOS publica patrón como sugerencia cliente.
6. Cliente acepta, ajusta o rechaza con motivo.
7. Feedback regresa a NOUS como observación, no como decisión automática.

## 3 · Endpoints

- `PATCH /admin/nous/patterns/:id/publication-gates`
- `POST /admin/nous/patterns/:id/publish`
- `POST /admin/nous/patterns/:id/withdraw`
- `GET /admin/tenants/:tenant_id/nous/suggestions?module_id=M17`
- `POST /admin/tenants/:tenant_id/nous/suggestions/:suggestion_id/feedback`

## 4 · UI cliente

Los módulos que consumen `TenantProfileStatus` pueden mostrar sugerencia NOUS aprobada:

- conclusión primero
- evidencia resumida
- N y confianza
- limitación explícita
- acción sugerida
- botones: aceptar, ajustar, rechazar

La redacción evita “NOUS predice” y “debes”.

## 5 · A11

A11 permite ver patrones publicados y retirarlos manualmente.

Retirar desde A11:

- `published_to_clients = false`
- `pattern_status = retired`
- `retired_reason` queda registrado
- la sugerencia desaparece del endpoint cliente

## 6 · Ejemplo bloqueado

Patrón con `founder_gate_status = pending`:

```json
{
  "code": "nous_publication_blocked",
  "blockers": ["founder_gate_not_approved"]
}
```

Patrón con `bias_check_status = failed`:

```json
{
  "code": "nous_publication_blocked",
  "blockers": ["bias_check_not_passed"]
}
```

Patrón con N insuficiente:

```json
{
  "code": "nous_publication_blocked",
  "blockers": ["insufficient_publication_n"]
}
```

Patrón con lenguaje autoritario:

```json
{
  "code": "nous_publication_blocked",
  "blockers": ["eidos_authoritative_language"]
}
```

## 7 · Ejemplo publicado

```json
{
  "module_id": "M17",
  "observations_count": 30,
  "confidence": "robusto",
  "limitation": "Patron agregado anonimo; no sustituye medicion local.",
  "source_traceability": {
    "tenant_origin_identifiers_exposed": false
  }
}
```

## 8 · Feedback

Cada feedback registra:

- `suggestion_id`
- `tenant_id`
- `module_id`
- `action`: `accept`, `adjust`, `reject`
- `rejection_reason` o `adjustment_note`
- `role`
- `timestamp`
- `observation_only = true`
- `automatic_decision = false`

## 9 · Pruebas ejecutadas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase26_nous_suggestion_publication.py
```

Resultado: `4 passed`.

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase23_nous_layer1_observers.py backend/tests/test_phase24_nous_gate_outcomes.py backend/tests/test_phase25_nous_projection_deltas.py backend/tests/test_phase26_nous_suggestion_publication.py
```

Resultado: `34 passed`.

```bash
cd frontend && npm run type-check
```

Resultado: `tsc --noEmit` sin errores.

## 10 · Cierre

Fase 26 queda cerrada como publicación controlada de sugerencias NOUS aprobadas.

No se habilita publicación automática, no se recalibra automáticamente y no se exponen tenants comparables identificables.
