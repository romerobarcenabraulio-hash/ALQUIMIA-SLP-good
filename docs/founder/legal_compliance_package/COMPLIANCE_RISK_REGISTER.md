# Compliance Risk Register

**Uso:** registro preliminar de riesgos para abogado/compliance. No sustituye dictamen legal.

| Riesgo | Severidad | Probabilidad | Evidencia relacionada | Control existente | Brecha | Responsable humano | Decision requerida | Condicion de bloqueo |
|---|---|---|---|---|---|---|---|---|
| Datos municipales incorrectos o incompletos. | Alta | Media | Fuentes municipales/tenant. | Claim matrix, data request packets. | Validacion externa no automatica. | Responsable municipal/founder. | Definir responsabilidad por datos. | Claim oficial sin fuente/metodo. |
| Datos empresa/institucion usados para claims reputacionales. | Alta | Media | Datos privados de empresa. | SOW y exclusions. | Terminos de uso pendientes. | Empresa/founder/abogado. | Limitar claims ESG. | Impacto reputacional sin evidencia. |
| Datos tenant usados en analytics sin opt-in. | Alta | Baja/Media | Tenant consent. | capa de aprendizaje supervisado governance, opt-in draft. | Politica final pendiente. | Founder/abogado. | Clausula de consentimiento. | Sin opt-in. |
| Benchmark presentado como estudio local. | Alta | Media | Benchmark/source. | Red flags, disclaimers. | Riesgo de comunicacion comercial. | Founder/revision metodologica. | Bloquear claim. | Benchmark usado en Cabildo como dato local. |
| Inferencia publica presentada como validada. | Alta | Media | pipeline de inferencia publica source metadata. | Glossary/matrix/disclaimers. | Requiere UI/document warning constante. | Founder/operacion. | Mantener advertencias. | Falta fuente, fecha, metodo o confianza. |
| Patron capa de aprendizaje supervisado publicado sin controles. | Alta | Baja | capa de aprendizaje supervisado pattern/audit. | capa de aprendizaje supervisado governance. | Politica legal de publicacion pendiente. | Founder/revision metodologica/abogado. | Aprobar flujo legal. | N bajo, no opt-in, bias fail, sin founder gate. |
| Claim de ahorro/impacto sin baseline. | Alta | Media | Modelo financiero. | Red lines/SOW/disclaimers. | Cliente puede presionar por promesa. | Founder/finanzas. | Definir lenguaje contractual. | Garantia o resultado oficial sin evidencia. |
| Confusion municipio/ZM. | Alta | Media | Fuentes territoriales. | Method statement/challenge protocol. | Requiere disciplina documental. | validacion de arquitectura/founder. | Separar claims. | No se puede separar alcance territorial. |
| Ausencia de estudio local. | Alta | Alta | Field study status. | Field study method. | Estudios dependen de terceros/municipio. | Municipio/founder. | Contratar o bloquear claim. | Claim local depende del estudio faltante. |
| Decisiones humanas vs sistemas internos. | Alta | Media | Audit logs/gates. | Exclusions/SOW. | Riesgo narrativo. | Founder/abogado. | Clausula de no decision automatica. | Se atribuye aprobacion a sistema interno. |
| Revision por Cabildo/contraloria. | Alta | Media | Documentos generados. | Challenge protocol/readiness checklist. | Requiere proceso formal externo. | Juridico/contraloria. | Definir protocolo de entrega. | Documento se presenta como oficial sin revision. |
| Dependencia de concesionario. | Media/Alta | Media | Contratos/reportes. | Data request packets. | Acceso a datos no garantizado. | Municipio/concesionario. | Clausula de colaboracion. | Claim operativo depende de datos bloqueados. |
| Responsabilidad por datos de terceros. | Alta | Media | Datos provistos. | SOW responsibilities. | Clausulas legales pendientes. | Abogado/founder. | Asignar responsabilidad. | Tercero no declara fuente/responsable. |
