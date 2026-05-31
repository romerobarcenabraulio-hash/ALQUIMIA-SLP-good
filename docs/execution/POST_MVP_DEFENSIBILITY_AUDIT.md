# Post-MVP Sprint 5 · Defensibility founder-only audit

Fecha: 2026-05-31

## Gate previo

`docs/execution/POST_MVP_PARTNER_GUARDRAILS_STATUS.md` termina en `PARTNER GUARDRAILS: PASS`.

## Fuente revisada

- `AJUSTES PARA FINIQUITAR/DEFENSIBILITY_ROADMAP.md`
- `docs/execution/MVP_V2_POST_MVP_BACKLOG.md`
- Guardrails de partners recién implementados.

## Decisión de alcance

El roadmap de defensibilidad no se convierte en UI, claim comercial ni promesa cliente-facing. Queda como capacidad interna founder-only con gates verificables, métricas trimestrales y bloqueo explícito si el founder no firma el compromiso de 18 meses.

## Auditoría

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| Founder debe firmar compromiso 18 meses | `evaluateDefensibilityReadiness` bloquea si `founderSignedCommitment=false` | PASS |
| Cláusula case study requerida | Gate `directContractsWithCaseStudyClause >= 1` | PASS |
| Bloque regulatorio mensual requerido | Gate `founderMonthlyRegulatoryBlock` | PASS |
| Marcadores metodológicos en exports | `buildEmbeddedMethodologyMarkers` produce footer, bibliografía y nota de trazabilidad | PASS |
| Lista BANOBRAS/NAFIN/BID Invest/CAF requerida | Gate de 4 instituciones priorizadas | PASS |
| Métricas trimestrales trackeadas | Gate `platform0QuarterlyTrackingReady` | PASS |
| Escalamiento por estancamiento sostenido | `shouldEscalateDefensibilityReview` exige 3 señales y 2 trimestres | PASS |
| No claim cliente-facing | `defensibilityClientFacingClaimsAllowed` devuelve `allowed=false` | PASS |
| No se activó producto nuevo | No hay rutas, roles, dashboard ni copy público nuevo | PASS |

## Correcciones aplicadas

- Se creó `frontend/src/lib/defensibilityRoadmap.ts` como contrato interno de gates.
- Se creó `frontend/src/lib/defensibilityRoadmap.test.ts`.
- Se documentó que defensibilidad no puede venderse como garantía, certificación ni ventaja ya obtenida.

## Riesgos residuales

- La cláusula case study requiere revisión legal antes de usarse en contrato.
- Los marcadores metodológicos deben conectarse a export PDF/ZIP productivo cuando el flujo formal deje de ser MVP.
- Plataforma 0/A12 todavía debe persistir métricas trimestrales en backend productivo.
- Relaciones regulatorias y financieras son ejecución founder-only; no son delegables a la plataforma.

## Decisión

Sprint 5 queda apto como guardrail founder-only si las pruebas focalizadas pasan.
