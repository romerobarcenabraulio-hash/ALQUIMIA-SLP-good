# Fase 27 · NOUS self-monitoring, auditoria trimestral y gobernanza

**Estado:** cerrado tecnicamente  
**Alcance:** gobierno continuo de NOUS, self-report, pausa, retiro y auditoria  
**No implica:** aprendizaje autonomo, recalibracion automatica ni decision por sistema

## 1 · Workflow trimestral

1. NOUS genera self-report.
2. AUDITOR revisa patrones activos y sesgos.
3. MARCOS revisa standards.
4. KOSMOS revisa schema y modulo destino.
5. SUPREME revisa en ritual semanal/trimestral.
6. Founder decide continuidad, retiro o pausa.

Endpoint:

- `POST /admin/nous/governance/quarterly-audit`

## 2 · Self-report

Endpoint:

- `GET /admin/nous/self-report`

Incluye:

- patrones detectados;
- aprobados;
- rechazados;
- retirados;
- motivos de retiro;
- sugerencias aceptadas, ajustadas y rechazadas;
- motivos de rechazo;
- correlacion con outcomes posteriores;
- riesgos de sesgo detectados.
- recomendacion SUPREME: continuar, pausar o ajustar;
- validacion KOSMOS: sin cambios automaticos al registry;
- archivo BIOS: audit log retenido y sin eliminacion silenciosa.

Si falta evidencia posterior, se reporta como `insufficient_followup_outcomes`.

## 3 · Estados de patron

- `active`
- `under_review`
- `retired_bias`
- `retired_low_performance`
- `retired_stale`
- `paused_by_founder`
- `superseded`

Endpoint:

- `POST /admin/nous/patterns/:id/governance`

## 4 · Pausa founder

Endpoint:

- `POST /admin/nous/governance/pause`

Efecto:

- patrones publicados dejan de mostrarse al cliente;
- una nueva publicacion queda bloqueada con `nous_paused_by_founder`;
- la decision queda auditada.

## 5 · Retiro

Criterios:

- bias check fallido;
- performance peor que baseline;
- N insuficiente tras revision;
- contradiccion con estandar;
- rechazo sostenido;
- cambio regulatorio;
- decision founder.

Todo retiro conserva `retired_reason`, `retired_at` y `governance_history`.

## 6 · Metodologia

Archivo creado:

- `docs/methodology/nous.md`

La metodologia declara capas, umbrales, opt-in, bias filter, founder gate, lenguaje EIDOS y limites de NOUS.

## 7 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase27_nous_governance.py
```

Resultado esperado: self-report, retiro por bias, revision por baja performance y pausa founder.

## 8 · Cierre

Fase 27 queda cerrada como gobernanza de aprendizaje supervisado.

NOUS puede equivocarse, ser retirado y pausado. No opera como caja negra ni como autoridad automatica.
