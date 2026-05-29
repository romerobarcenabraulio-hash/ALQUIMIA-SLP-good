# BINARY ACCEPTANCE GATES

**Uso:** gates transversales para cerrar fases de implementacion con evidencia observable. Un gate no se cierra por narrativa ni por compilacion aislada.

## Gates transversales

| Area | Gate binario | Evidencia minima | Prueba negativa | Bloquea si |
|---|---|---|---|---|
| Documentacion metodologica | Los limites metodologicos estan documentados y auditados. | Method statement, glossary, claim matrix, challenge protocol, audits PASS. | Buscar claims prohibidos o lenguaje de garantia. | Hay estimaciones como oficiales o benchmarks como estudios locales. |
| Arquitectura de plataformas | Plataforma 0, `/v`, `/p`, `/e` estan separados por stage. | ADR, routing, capability registry, tests por tenant_stage. | Tenant validation intenta entrar a `/p` o `/e`. | Acceso posterior no devuelve bloqueo equivalente. |
| tenant_state | Estado canonico gobierna stage, gates, roles y audit log. | Modelo, endpoint, migracion, tests. | Intento de cerrar gate sin evidencia/responsable. | Gate cambia sin humano o sin log. |
| Backoffice | Plataforma 0 administra tenants, gates, capabilities y evidencia. | Walkthrough admin y pruebas de permisos. | Cliente municipal intenta acceder a admin. | Backoffice se expone a cliente o no registra evidencia. |
| Frontend journeys | Navegacion real coincide con registry y stage. | Screenshots desktop/mobile, registry diff, browser smoke. | Modulo de execution visible en validation. | Sidebar miente o route permite salto. |
| SLP migration | SLP migra sin perdida y queda en validation si aplica. | Backup, compare pre/post, tenant record, rollback doc. | Acceso SLP validation a `/e`. | Diferencia no explicada en datos criticos. |
| Modulos | Modulos consolidados/personalizados preservan cifras, fuentes y exports. | Prueba before/after, exports, fuentes. | Dato faltante no marcado como pendiente. | Cifra, fuente o ruta critica desaparece. |
| Personalizacion | Cambiar tenant cambia contenido real y faltantes se muestran honestos. | Seeds o fixtures SLP/Monterrey/Guanajuato, screenshots. | Tenant A ve dato privado de tenant B. | Datos copiados o mezclados. |
| Field studies | Estudios y KPIs faltantes se declaran como brecha, no verdad local. | Schemas, standards map, gate requirements. | M01 usa benchmark como caracterizacion local. | Falta estudio local y aun se afirma claim local. |
| Automation | Inferencias y recalculos son trazables y no oficiales. | Fuente, fecha, metodo, confianza, discrepancy log. | Fuente falla y pantalla queda oficial/ok. | Inferencia sin provenance o decision automatica. |
| Documentos/export | Borradores bloquean export ok si falta evidencia critica. | Draft state, ClaimLedger/provenance, blocked case. | Export con qa_status ok pese a bloqueo. | Documento parece oficial sin revision humana. |
| NOUS | NOUS observa, registra y sugiere solo bajo gates. | Opt-in, N, bias, founder gate, audit log. | Patron sin opt-in o N suficiente intenta publicarse. | Publicacion/recalibracion automatica. |
| Legal/compliance | Paquete esta listo para abogado, no para uso legal final. | Brief, risk register, questions, disclaimers draft, opt-in draft. | Documento dice que es contrato/politica final. | Se presenta como asesoria legal final. |
| Founder/comercial | Founder puede demo/vender sin claims engañosos. | Promise register, red lines, objection handling. | Frase "ALQUIMIA certifica ahorro". | Promesa no sustentada queda permitida. |
| Piloto | Piloto puede iniciar, pausar y cerrar con humanos y evidencia. | Readiness PASS, scope, rhythm, evidence log, risk matrix, closeout. | Presion para ocultar brecha o usar benchmark local. | P0 en FAIL o sin sponsor/responsable de datos. |
| Release | Producto listo, staging only o bloqueado con evidencia. | Tests, build, smoke access, visual QA, data QA, export QA. | Acceso indebido por stage o datos SLP rotos. | P0/P1 abierto sin decision de staging. |

## Regla de severidad

- **P0:** acceso indebido, perdida de datos, datos privados cruzados, claim oficial falso, gate automatico, export engañoso.
- **P1:** modulo clave roto, falta de evidencia para claim central, legal pendiente para uso externo.
- **P2:** deuda tecnica o visual que no compromete decision ni evidencia.
- **P3:** polish editorial o mejora de ergonomia.

## Cierre permitido

Un gate puede declararse cerrado solo si hay evidencia positiva, prueba negativa, responsable humano y riesgo residual documentado.
