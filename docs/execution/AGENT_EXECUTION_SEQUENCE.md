# AGENT EXECUTION SEQUENCE

**Uso:** secuencia concreta para agentes ejecutores. Cada agente debe leer primero las rutas indicadas y cerrar con evidencia, no con descripcion.

## Secuencia por agente

| Agente | Mision | Rutas a leer primero | Rutas probables a modificar | Limites estrictos | Tests/verificaciones | Criterio de cierre | Handoff esperado |
|---|---|---|---|---|---|---|---|
| Auditor documental | Verificar fase previa, base docs y criterios binarios. | `AJUSTES PARA FINIQUITAR/*`, `docs/methodology/*`, `docs/founder/*`. | `docs/*_AUDIT.md`, `docs/execution/*`. | No crear claims nuevos. | `rg`, lista de archivos, matriz PASS/FAIL/PARTIAL. | FAIL/PARTIAL corregido o escalado. | Auditoria con decision explicita. |
| Backend KRONOS | Implementar tenant_state, gates, roles, provenance y endpoints. | ADR-0010, Plataforma 0 spec, capability registry. | `backend/*`, migrations, tests. | No automatizar gates ni decisiones politicas. | Unit/API tests, smoke 403 por stage. | Acceso por etapa y audit log funcionando. | Endpoints, tests, bloqueos. |
| Frontend POLIS | Separar journeys y crear UI sobria por stage/backoffice. | ADR-0010, module maturity, capability registry. | `frontend/src/*`. | No landing, no cards decorativas, no mezclar Plataforma 0 con cliente. | Build/typecheck, browser desktop/mobile. | `/v`, `/p`, `/e` respetan stage y visual QA. | Screenshots/evidencia visual. |
| QA AUDITOR | Probar acceso, datos, export, registry y regresiones. | Release docs, capability registry, tenant_state docs. | Smoke scripts, QA docs. | No cerrar por build verde. | Backend tests, frontend build, negative tests. | Checklist release PASS o bloqueo claro. | Reporte severidad P0-P3. |
| UX editorial | Pulir jerarquia Minto/McKinsey sin cambiar calculos. | Module maturity, docs visuales, screens. | Componentes UI, CSS. | No rediseño comercial ni texto instructivo. | Browser desktop/mobile, no overlap. | Lectura ejecutiva primero y sin ruido visual. | Antes/despues visual. |
| Legal/compliance documental | Preparar materiales para abogado y control de promesas. | Methodology, audit stress tests, founder packages. | `docs/founder/legal_compliance_package/*`, contracting docs. | No contrato final ni asesoria legal final. | Matriz de riesgos, red flags, disclaimers. | Listo para abogado, no para uso legal final. | Preguntas y riesgos escalados. |
| Founder ops | Preparar demo, seguimiento, contrato preliminar y piloto. | `docs/founder/*`, `docs/methodology/*`. | Founder packages, pilot package. | No hype, no claims no sustentados. | Checklist pre-demo/piloto, promise register. | Founder puede operar sin agente. | Paquete usable y riesgos. |
| HERMES automation | Precargar datos publicos y gestionar inferencias. | Automation layer, field studies, schemas tenant. | Inference services, seeds, provenance. | No inventar datos, no scraping sin trazabilidad. | Smoke fuente falla/parcial, confidence states. | Inferencia trazable y parcial tolerante. | Datos con fuente/fecha/metodo/confianza. |
| NOUS learning | Observar correcciones/outcomes/deltas y gobernar patrones. | Learning layer, NOUS methodology, opt-in policy. | NOUS storage, observers, A11. | No ML opaco, no publicacion automatica. | Opt-in true/false, N insuficiente, bias filter. | Patrones internos auditables, no automaticos. | Queue interna y audit log. |
| Release BIOS | Preparar hardening, rollback y operacion post-release. | Release docs, pilot docs, rollback docs. | `docs/release/*`, smoke scripts. | No nuevas features durante hardening. | Health checks, smoke tests, rollback dry-run si aplica. | Release/staging/bloqueado decidido. | Runbook y decision. |

## Orden sugerido de ejecucion

1. Auditor documental abre la fase y valida fuentes.
2. Backend KRONOS estabiliza estado y gates.
3. Frontend POLIS conecta journeys y visibilidad.
4. QA AUDITOR prueba acceso negativo y datos.
5. HERMES/FORGE trabajan personalizacion y field studies.
6. NOUS entra solo observacional cuando opt-in y storage existan.
7. Founder/legal/pilot se actualizan segun producto real.
8. Release BIOS cierra con evidencia de operacion.

## Regla de handoff

Todo handoff debe incluir archivos modificados, comandos ejecutados, datos comparados, prueba negativa, riesgos residuales y decision: cerrado, parcial o bloqueado.
