# HANDOFF COVERAGE MATRIX

**Uso:** matriz para comprobar que el paquete de handoff cubre todos los roles de ejecucion necesarios.

| Area | Handoff | Existe | Cubre mision | Cubre rutas | Cubre limites | Cubre verificaciones | Cubre cierre binario | Estado |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| General | `handoffs/EXECUTOR_README.md` | Si | Si | Si | Si | Si | Si | PASS |
| Backend | `handoffs/BACKEND_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| Frontend | `handoffs/FRONTEND_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| QA/Auditoria | `handoffs/QA_AUDITOR_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| NOUS/automation interna | `handoffs/NOUS_AUTOMATION_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| Legal/compliance | `handoffs/LEGAL_COMPLIANCE_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| Founder ops | `handoffs/FOUNDER_OPS_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |
| Release | `handoffs/RELEASE_AGENT_HANDOFF.md` | Si | Si | Si | Si | Si | Si | PASS |

## Cobertura de non-negotiables

| Non-negotiable | Cubierto en | Estado |
|---|---|---:|
| Municipio/ZM nunca se mezclan. | General, frontend, QA, legal, founder. | PASS |
| Benchmark no es estudio local. | General, frontend, QA, legal, founder. | PASS |
| Inferencia no es dato validado. | General, backend, frontend, QA, legal. | PASS |
| Estimacion no es verdad oficial. | General, frontend, QA, founder, release. | PASS |
| Gates y decisiones politicas son humanas. | Backend, QA, automation, founder. | PASS |
| Sistemas internos no aprueban ni firman. | General, backend, QA, automation, legal, founder. | PASS |
| Sin opt-in no hay agregado tenant. | Backend, QA, automation, legal. | PASS |
| Patrones internos no se publican sin N suficiente, bias check, founder gate y trazabilidad. | Automation, QA, release. | PASS |
