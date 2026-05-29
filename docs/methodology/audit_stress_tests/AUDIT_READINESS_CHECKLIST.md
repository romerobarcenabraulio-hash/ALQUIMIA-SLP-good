# Audit Readiness Checklist

**Uso:** checklist binaria para decidir si ALQUIMIA esta lista para revision institucional, auditoria externa, Cabildo o impugnacion tecnica.

**Resultado de esta fase:** READY FOR INSTITUTIONAL REVIEW, con riesgos operativos residuales documentados.

| Criterio | Estado esperado | Evidencia requerida | Archivo donde se comprueba | Condicion de bloqueo |
|---|---|---|---|---|
| Trazabilidad de claims | Todo claim tiene fuente, fecha, metodo, confianza y responsable. | ClaimLedger/provenance o matriz documental. | `CLAIM_EVIDENCE_MATRIX.md`, `TECHNICAL_CHALLENGE_PROTOCOL.md` | Falta cualquiera de los cinco elementos. |
| Distincion municipio/ZM | Municipio y ZM aparecen separados. | Alcance territorial por fuente. | `ALQUIMIA_METHOD_STATEMENT.md`, `TECHNICAL_CHALLENGE_PROTOCOL.md` | Se copia conclusion de ZM al municipio o viceversa. |
| Benchmark vs estudio local | Benchmark se muestra como referencia, no prueba local. | Advertencia y estudio local si el claim es municipal. | `FIELD_STUDY_STATUS_METHOD.md`, `CLAIM_EVIDENCE_MATRIX.md` | Benchmark usado como verdad local. |
| Inferencia vs dato validado | Inferencia se marca preliminar. | Fuente, fecha, metodo, confianza y estado pendiente. | `DATA_EVIDENCE_GLOSSARY.md`, `CLAIM_EVIDENCE_MATRIX.md` | Inferencia publicada como dato validado. |
| Advertencias sobre estimaciones | Toda estimacion declara que no es oficial. | Advertencia visible y supuestos. | `DATA_EVIDENCE_GLOSSARY.md`, `CLAIM_EVIDENCE_MATRIX.md` | Estimacion presentada como cifra oficial o garantia. |
| Gates humanos | Gates no cierran por sistema interno. | Audit log, responsable, fecha y evidencia. | `ALQUIMIA_METHOD_STATEMENT.md`, `CLAIM_EVIDENCE_MATRIX.md` | Cierre automatico o sin evidencia. |
| Limites de capa de aprendizaje supervisado | capa de aprendizaje supervisado observa, sugiere bajo gate y no decide. | Opt-in, N, bias, founder gate, trazabilidad. | `capa de aprendizaje supervisado_GOVERNANCE_METHOD.md` | capa de aprendizaje supervisado presentado como autoridad, dictamen o prediccion. |
| Limites de flujo de borradores asistidos | flujo de borradores asistidos no aprueba decisiones politicas. | Estado de borrador/recomendacion y responsable humano. | `ALQUIMIA_METHOD_STATEMENT.md`, `TECHNICAL_CHALLENGE_PROTOCOL.md` | Recomendacion atribuida como aprobacion por sistema interno. |
| Opt-in de datos tenant | Datos privados solo entran a agregado con consentimiento. | Registro de opt-in. | `capa de aprendizaje supervisado_GOVERNANCE_METHOD.md` | Tenant sin opt-in alimenta analytics agregada. |
| Publicacion de patrones capa de aprendizaje supervisado | Solo patrones aprobados se publican. | N suficiente, bias check, founder gate, revision de estandares, trazabilidad. | `capa de aprendizaje supervisado_GOVERNANCE_METHOD.md`, `CLAIM_EVIDENCE_MATRIX.md` | N bajo, bias fail, sin founder gate o tenant identificable. |
| Field studies faltantes | Falta de estudio se muestra como brecha critica. | Estado `field_study_required` o `critical_gap`. | `FIELD_STUDY_STATUS_METHOD.md` | Se sustituye estudio local con benchmark o inferencia. |
| KPIs faltantes | KPI faltante se declara faltante. | Estandar, fuente requerida y dato faltante. | `FIELD_STUDY_STATUS_METHOD.md`, `CLAIM_EVIDENCE_MATRIX.md` | KPI rellenado con narrativa o claim sin fuente. |
| Claims de impacto | Ahorro/captura/reduccion/impacto requieren baseline, formula y sensibilidad. | Modelo, supuestos, fuentes, fecha y responsable. | `CLAIM_EVIDENCE_MATRIX.md` | Se promete resultado, ahorro garantizado o impacto oficial sin evidencia. |
| Protocolo de impugnacion | Existe respuesta correcta/prohibida y salida de bloqueo. | Escenario adverso documentado. | `INSTITUTIONAL_AUDIT_SCENARIOS.md`, `TECHNICAL_CHALLENGE_PLAYBOOK.md` | No hay ruta para sostener, corregir, degradar, bloquear o escalar. |
| Certificaciones y oficialidad | ALQUIMIA no afirma certificacion inexistente. | Advertencia de no certificacion y fuente externa si aplica. | `ALQUIMIA_METHOD_STATEMENT.md`, `CLAIM_EVIDENCE_MATRIX.md` | Uso de lenguaje garantia, certificado, validado oficialmente sin autoridad externa. |
| Documentos generados | Borradores no salen como "ok" con blockers. | Estado documental, ClaimLedger, version y revision humana. | `CLAIM_EVIDENCE_MATRIX.md`, `TECHNICAL_CHALLENGE_PROTOCOL.md` | Falta evidencia critica o se oculta bloqueo. |

## Decision binaria

ALQUIMIA esta lista para revision institucional si todos los criterios anteriores estan en PASS operativo antes de presentar un claim.

No esta lista si cualquiera de estos P0 ocurre:

- claim sin fuente, fecha, metodo o responsable;
- estimacion presentada como oficial;
- benchmark presentado como estudio local;
- mezcla municipio/ZM;
- capa de aprendizaje supervisado/flujo de borradores asistidos/sistema interno presentado como aprobador;
- gate cerrado sin evidencia humana;
- patron capa de aprendizaje supervisado publicado sin opt-in, N suficiente, bias check, founder gate y trazabilidad.

## Evidencia minima previa a revision

Antes de entregar a auditor, Cabildo o juridico, el operador debe preparar:

1. Matriz de claims aplicable.
2. Fuentes y fechas.
3. Metodos y formulas.
4. Advertencias visibles.
5. Responsables humanos.
6. Estudios locales o brechas criticas.
7. Decision humana documentada para gates o documentos.
8. Registro de opt-in si hay analytics agregada.
