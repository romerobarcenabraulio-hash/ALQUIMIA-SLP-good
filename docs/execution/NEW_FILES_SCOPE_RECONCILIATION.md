# New Files Scope Reconciliation

Fecha: 2026-05-30

Objetivo: clasificar los mandatos de los documentos 9-11 sin romper el MVP actual ni inflarlo con trabajo post-MVP.

## Matriz de alcance

| Documento | Mandato | Entra MVP | Tipo | Razon | Riesgo si se ignora | Accion requerida | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Institutional Rigor | Cada cifra con cita o fuente verificable. | Si | Obligatorio | El MVP ya exige fuente, fecha, metodo y confianza; falta nombrarlo como rigor minimo. | Cifras flotantes e impugnables. | Mantener metadata por metrica y reflejar en export. | PASS |
| Institutional Rigor | Bibliografia minima al exportar ZIP/PDF preliminar. | Si | Obligatorio | Es compatible con el ZIP minimo y no requiere A12 completo. | Export defendible incompleto ante auditor/cabildo. | Prompt 5 debe exigir bibliografia minima. | PASS |
| Institutional Rigor | Bloquear declaracion de cumplimiento completo si faltan campos obligatorios. | Si | Guardrail obligatorio | No se implementa compliance engine completo, pero si se bloquea lenguaje falso. | Claim de estandar engañoso. | Export debe decir completo, parcial o remover claim. | PASS |
| Institutional Rigor | Marcadores metodologicos sobrios en documentos preliminares. | Si | Guardrail obligatorio | Compatible con watermark y metodologia publica. | Documento parece oficial o marketing sin trazabilidad. | Incluir watermark/marcador metodologico preliminar. | PASS |
| Institutional Rigor | Visual narrative basica, no documento crudo. | Si | Guardrail MVP | Prompt 4B y visual QA ya lo atacan sin construir diagramas completos. | MVP compartible pero visualmente pobre. | Mantener conclusion primero, evidencia despues y QA mobile/desktop. | PASS |
| Institutional Rigor | A12 compliance completo. | No | Post-MVP Sprint 2 | Requiere tabla compliance, reglas por estandar y UI backoffice completa. | Inflar MVP y retrasar demo usable. | Dejar en backlog Sprint 2. | PASS |
| Institutional Rigor | Auditoria trimestral profunda y cron. | No | Post-MVP Sprint 2 | Requiere volumen real de exports. | Simular madurez sin datos. | No implementar en MVP. | PASS |
| Institutional Rigor | Cinco diagramas dinamicos completos. | No | Post-MVP Sprint 2 | Requiere datos estables y tiempo visual; MVP solo necesita narrativa basica. | Distraer de auth, tenant, diagnostico y export. | Dejar como enhancement posterior. | PASS |
| Partner Ecosystem | Activar partners, roles, dashboard, comisiones y contratos. | No | Post-3 contratos | Documento exige activacion solo tras 3 contratos directos firmados. | Canal prematuro, captura de tenants y dano reputacional. | No crear roles partner ni dashboard. | PASS |
| Partner Ecosystem | Partners no pueden ser duenos de tenants. | Si | Guardrail | Afecta diseno de auth/tenant ownership desde MVP. | Terceros podrian capturar clientes. | Mantener tenant ownership institucional/founder-controlled. | PASS |
| Partner Ecosystem | No abrir canal partner antes de 3 contratos directos. | Si | Guardrail | Es restriccion comercial y de arquitectura. | Conflicto de canal antes de validar operacion. | Documentar como red line. | PASS |
| Partner Ecosystem | Insights de partners alimentan aprendizaje. | No | Post-3 contratos | Depende de partners activos y opt-in. | Crear aprendizaje ficticio. | No implementar todavia. | PASS |
| Defensibility | `/metodologia` publica y sobria. | Si | Guardrail MVP | Ya es parte del MVP; fortalece defensibilidad basica. | Founder no puede defender metodo publicamente. | Mantener sin claims promocionales. | PASS |
| Defensibility | Marcadores metodologicos embebidos en export. | Si | Guardrail MVP | Entra como minimo sobrio, no como sistema completo de switching costs. | Export pierde trazabilidad institucional. | Prompt 5 actualizado. | PASS |
| Defensibility | Case-study clause. | No | Founder-only / backlog legal | Es decision contractual, no feature MVP. | Primeros contratos sin derecho de referencia. | Escalar a founder/legal. | PASS |
| Defensibility | Relaciones regulatorias y financieras. | No | Founder-only | Documento declara ejecucion no delegable del founder. | Confundir producto con desarrollo de mercado. | No delegar a agentes. | PASS |
| Defensibility | Defensibility 36 meses. | No | Founder-only | Roadmap estrategico, no feature. | Inflar MVP con promesas de moat. | Mantener como roadmap separado. | PASS |

## Decision de alcance

El MVP absorbe rigor minimo verificable: citas/fuentes, bibliografia minima, marcadores metodologicos, cumplimiento completo/parcial/removido y narrativa visual basica. No absorbe partners, A12 completo, auditoria trimestral, diagramas dinamicos completos ni roadmap de defensibilidad a 36 meses.
