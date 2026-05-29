# EXECUTION HANDOFF INDEX

**Uso:** indice rector para agentes ejecutores. Si un agente no sabe por donde empezar, empieza aqui.

## Estado actual

ALQUIMIA cuenta con paquete metodologico, auditorias, founder ops, legal/compliance, piloto y plan maestro de implementacion. Fase 37 convierte ese material en handoffs concretos por agente.

## Lectura obligatoria inicial

1. `docs/execution/MASTER_IMPLEMENTATION_PLAN.md`
2. `docs/execution/IMPLEMENTATION_DEPENDENCY_GRAPH.md`
3. `docs/execution/AGENT_EXECUTION_SEQUENCE.md`
4. `docs/execution/DO_NOT_BUILD_YET.md`
5. `docs/execution/BINARY_ACCEPTANCE_GATES.md`
6. `docs/execution/PHASE_36_AUDIT.md`
7. `docs/execution/PHASE_37_SOURCE_ALIGNMENT_CHECK.md`

## Handoffs por agente

| Agente | Archivo | Proposito |
|---|---|---|
| Cualquier ejecutor | `handoffs/EXECUTOR_README.md` | Reglas generales, non-negotiables y formato de cierre. |
| Backend | `handoffs/BACKEND_AGENT_HANDOFF.md` | tenant_state, gates, trazabilidad, API y pruebas. |
| Frontend | `handoffs/FRONTEND_AGENT_HANDOFF.md` | `/v`, `/p`, `/e`, Plataforma 0, UI sobria y QA visual. |
| QA/AUDITOR | `handoffs/QA_AUDITOR_AGENT_HANDOFF.md` | Gates binarios, pruebas negativas, producto y documentos. |
| NOUS/automation | `handoffs/NOUS_AUTOMATION_AGENT_HANDOFF.md` | Inferencia, automatizacion trazable, NOUS observacional y opt-in. |
| Legal/compliance | `handoffs/LEGAL_COMPLIANCE_AGENT_HANDOFF.md` | Revision documental, disclaimers, opt-in y escalamiento legal. |
| Founder ops | `handoffs/FOUNDER_OPS_AGENT_HANDOFF.md` | Demo, venta controlada, promesas, contrato preliminar y piloto. |

## Orden recomendado para ejecucion real

1. Auditor documental valida estado del bloque.
2. Backend estabiliza `tenant_state`, gates, roles y trazabilidad.
3. Frontend separa journeys y Plataforma 0.
4. QA prueba acceso, registry, datos, visual y export/provenance.
5. HERMES/NOUS entra solo cuando provenance, opt-in y gates esten listos.
6. Legal/founder ops se actualiza contra producto real.
7. Release hardening decide release, staging o bloqueo.

## Regla de cierre

Todo ejecutor entrega: archivos modificados, comandos ejecutados, evidencia positiva, prueba negativa, datos comparados si aplica, riesgos residuales y estado final: cerrado, parcial o bloqueado.
