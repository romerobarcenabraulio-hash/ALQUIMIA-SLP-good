# Fase 25 · NOUS projection deltas, recalibración supervisada y A11 Insights Panel

**Estado:** cerrado técnico como capa 3 observacional con propuesta supervisada  
**Fecha:** 2026-05-28  
**Decisión:** NOUS puede detectar sesgos sistemáticos proyectado vs real y preparar una propuesta interna de recalibración; nada se aplica ni se publica sin revisión humana, MARCOS/AUDITOR y founder gate.

## 1 · Lectura ejecutiva

La capa tres de NOUS quedó conectada a `projection_deltas`. ALQUIMIA registra divergencias proyectado vs real para módulos permitidos y, con volumen suficiente, crea patrones internos de recalibración explicables.

Esto no convierte a NOUS en modelo autónomo. La recalibración queda como propuesta no aplicada, con fórmula visible, prior, observaciones, likelihood, posterior y bloqueo de publicación.

## 2 · ProjectionDelta observer

Endpoint observado:

- `POST /admin/tenants/{tenant_id}/nous/projection-deltas`

Campos registrados:

- `tenant_id`
- `module_id`
- `metric_id`
- `projected_value`
- `actual_value`
- `measurement_period`
- `delta_absolute`
- `delta_percentage`
- `delta_direction`
- `measurement_quality`
- `municipality_profile`
- `included_in_aggregate`
- `aggregate_exclusion_reason`

Módulos permitidos en Fase 25:

- M01 / `city_baseline`
- M09 / `costos_programa`
- M13 / `escenarios_financieros`
- M17 / `monitoreo_operativo`

## 3 · Detector capa 3

Reglas:

1. Solo procesa deltas con `included_in_aggregate = true`.
2. Solo usa `measurement_quality` alta o media.
3. Exige mínimo 6 meses de mediciones.
4. Exige mínimo 3 tenants con perfil comparable.
5. Agrupa por módulo, métrica, rango poblacional, región y dirección del delta.
6. Distingue `subestimacion`, `sobreestimacion` y `exacto`.
7. Calcula media, desviación estándar y consistencia.
8. No aplica recalibración automáticamente.

## 4 · Recalibración supervisada

Cada patrón capa 3 incluye:

```json
{
  "recalibration_proposal": {
    "formula": "posterior = ((prior * prior_weight) + sum(observations)) / (prior_weight + n)",
    "prior": 0.0,
    "prior_weight": 3,
    "observations": [12.0],
    "likelihood_mean": 12.0,
    "posterior": 10.2857,
    "replicable": true,
    "applied": false,
    "requires_founder_approval": true
  },
  "automatic_apply": false,
  "retroactive_to_validated_inferences": false,
  "changelog_required_before_apply": true
}
```

Notas:

- La fórmula es transparente.
- El cálculo es replicable.
- El patrón queda interno.
- Founder gate y AUDITOR son obligatorios.
- MARCOS valida cada propuesta contra `docs/architecture/standards_map.json`.
- Si el módulo tiene estándares aplicables, queda `requires_human_review`; si no los tiene, queda `blocked_missing_standard`.
- La validación MARCOS nunca publica ni aplica recalibraciones por sí sola.

## 5 · A11 Insights Panel

Backend:

- `GET /admin/nous/a11`

Frontend:

- `/admin` muestra sección **A11 NOUS Insights Panel** con cinco bloques.

Tabs:

- `A11.1` patrones pendientes de revisión.
- `A11.2` patrones publicados o aprobados internos.
- `A11.3` auditoría de sesgo.
- `A11.4` performance de NOUS.
- `A11.5` self-report trimestral.

Estado:

- `feature_gated = true`
- `client_publication_enabled = false`
- `automatic_recalibration_enabled = false`

## 6 · UI cliente

No se habilitan sugerencias cliente en esta fase.

Condición futura mínima:

- patrón aprobado internamente;
- bias check passed;
- MARCOS standards check;
- founder gate;
- componente cliente feature-gated.

La UI cliente no ve patrón estadístico crudo.

## 7 · Jobs

Jobs quedan definidos como operación feature-gated:

- diario: detectar patrones pendientes desde observaciones nuevas;
- trimestral: bias audit y self-report.

No se activan como jobs productivos automáticos en Fase 25.

## 8 · Ejemplo N insuficiente

Tres tenants con menos de seis meses:

```json
{
  "patterns": [],
  "reason": "insufficient_projection_deltas"
}
```

## 9 · Ejemplo patrón suficiente

Tres tenants, seis meses, mismo módulo/métrica/perfil:

```json
{
  "pattern_layer": 3,
  "pattern_status": "draft_observed",
  "confidence_level": "recalibracion_emergente_interna",
  "published_to_clients": false,
  "pattern_description_technical": {
    "delta_mean_percentage": 12.0,
    "delta_standard_deviation": 0.0,
    "consistency": 1.0,
    "automatic_apply": false,
    "client_visible": false,
    "marcos_standards_check_required": true,
    "marcos_standards_check": {
      "status": "requires_human_review",
      "automatic_publication": false
    }
  }
}
```

## 10 · Archivos modificados

- `backend/app/automation/nous_observational.py`
- `backend/app/routers/admin.py`
- `backend/tests/test_phase25_nous_projection_deltas.py`
- `frontend/src/app/admin/page.tsx`
- `docs/architecture/FASE25_NOUS_PROJECTION_DELTAS_A11_INSIGHTS.md`

## 11 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase25_nous_projection_deltas.py
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase23_nous_layer1_observers.py backend/tests/test_phase24_nous_gate_outcomes.py backend/tests/test_phase25_nous_projection_deltas.py
```

Frontend:

```bash
cd frontend && npm run type-check
```

## 12 · Gate AUDITOR

AUDITOR confirma:

- sin opt-in no entra a aggregate;
- meses/tenants insuficientes bloquean patrón;
- fórmula, prior, observaciones, likelihood y posterior quedan visibles;
- no hay auto-apply;
- no hay publicación cliente;
- A11 existe como panel interno;
- no hay caja negra ni frase “la IA decidió”.

## 13 · Estado final

**Fase 25: cerrada técnicamente como NOUS capa 3 observacional con A11 interno feature-gated.**
