# Institutional Audit Scenarios

**Uso:** simulacro adversarial para probar si la metodologia ALQUIMIA resiste auditoria externa, Cabildo, regidores, concesionarios, juridico y operacion municipal.

**Resultado del simulacro:** PASS con controles documentales. Los escenarios obligan a pausar o bloquear claims cuando falta evidencia minima.

## 1. Auditor externo pide trazabilidad completa de un claim

| Campo | Respuesta |
|---|---|
| Riesgo | Que una cifra o documento no pueda reconstruirse desde fuente, metodo, version y responsable. |
| Claim afectado | Cualquier claim en expediente, oficio, dashboard, KPI o documento generado. |
| Evidencia requerida | ClaimLedger/provenance, fuente, fecha, metodo, version, responsable humano y audit log. |
| Respuesta correcta | Entregar trazabilidad completa o degradar el claim a preliminar/bloqueado. |
| Respuesta prohibida | Reconstruir evidencia ex post como si hubiera existido desde origen. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 5; `CLAIM_EVIDENCE_MATRIX.md`, regla transversal. |
| Decision humana requerida | revision metodologica/founder decide si el claim se sostiene, corrige, degrada o bloquea. |
| Condicion de bloqueo | No hay fuente recuperable, version, metodo, responsable o audit log. |

## 2. Regidor cuestiona una fuente

| Campo | Respuesta |
|---|---|
| Riesgo | Que una cifra se use en Cabildo sin claridad territorial o metodologica. |
| Claim afectado | Datos municipales, costo de omision, CAPEX/OPEX, KPI, marco legal o actores. |
| Evidencia requerida | Fuente, fecha, metodo, alcance territorial y advertencia si es inferencia, benchmark o ZM. |
| Respuesta correcta | Mostrar fuente y metodo; distinguir municipio, ZM y benchmark; ofrecer ruta de validacion. |
| Respuesta prohibida | Contestar que "la plataforma lo valida" o ocultar que falta estudio local. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 4; `DATA_EVIDENCE_GLOSSARY.md`, secciones 1 y 5. |
| Decision humana requerida | Regidor/Cabildo decide uso politico; ALQUIMIA solo sostiene o bloquea el claim tecnico. |
| Condicion de bloqueo | La cifra se presento como oficial sin fuente local u oficial competente. |

## 3. Concesionario rechaza una estimacion

| Campo | Respuesta |
|---|---|
| Riesgo | Que rutas, toneladas, costos o capacidades estimadas contradigan operacion real. |
| Claim afectado | Generacion RSU, rutas, tiempos, CAPEX/OPEX, capacidad, ahorro, captura o impacto. |
| Evidencia requerida | Bitacoras, GPS, pesajes, mantenimiento, contrato, reportes operativos y fuente usada por ALQUIMIA. |
| Respuesta correcta | Comparar evidencia; si ALQUIMIA uso benchmark/inferencia, declarar que no era dato oficial; registrar discrepancia. |
| Respuesta prohibida | Defender una estimacion como verdad municipal sin estudio local. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 3; `CLAIM_EVIDENCE_MATRIX.md`, filas de dato estimado, rutas, CAPEX/OPEX e impacto. |
| Decision humana requerida | Operaciones municipales/concesionario/founder validan si se reemplaza el dato. |
| Condicion de bloqueo | No existe estudio local ni evidencia operativa suficiente. |

## 4. Juridico pregunta quien aprobo una recomendacion

| Campo | Respuesta |
|---|---|
| Riesgo | Que una recomendacion flujo de borradores asistidos/capa de aprendizaje supervisado parezca aprobacion juridica o politica. |
| Claim afectado | Recomendaciones, borradores, gates, documentos de Cabildo, reformas, adendas y oficios. |
| Evidencia requerida | Audit log, responsable humano, fecha, evidencia, estado documental y tipo de salida. |
| Respuesta correcta | Separar generacion automatizada de aprobacion humana; marcar `human_review_required` si falta aprobacion. |
| Respuesta prohibida | Decir que flujo de borradores asistidos, capa de aprendizaje supervisado o un sistema interno aprobo, firmo o cerro el gate. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 8; `ALQUIMIA_METHOD_STATEMENT.md`, secciones 3 y 6. |
| Decision humana requerida | Juridico, sindicatura, founder o autoridad competente. |
| Condicion de bloqueo | Se presenta como aprobado sin responsable humano, fecha y evidencia. |

## 5. Direccion municipal quiere presentar benchmark como dato local

| Campo | Respuesta |
|---|---|
| Riesgo | Que una referencia comparativa se convierta en "verdad municipal" para Cabildo, contrato o presupuesto. |
| Claim afectado | Generacion/composicion RSU, tasas de captura, CAPEX/OPEX, SDG/GRI/Wasteaware, ahorro o impacto. |
| Evidencia requerida | Fuente benchmark, criterio de comparabilidad, advertencia y estudio local si el claim sera municipal. |
| Respuesta correcta | Permitir benchmark solo como referencia; exigir estudio local para claim local. |
| Respuesta prohibida | Reetiquetar benchmark como estudio local o medicion municipal. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 6; `FIELD_STUDY_STATUS_METHOD.md`, secciones 1 y 8. |
| Decision humana requerida | Founder/responsable tecnico decide si el claim se degrada o se bloquea. |
| Condicion de bloqueo | Benchmark usado como dato local en Cabildo, contrato, CAPEX/OPEX, KPI o dictamen. |

## 6. Prensa o Cabildo pregunta si ALQUIMIA certifica resultados

| Campo | Respuesta |
|---|---|
| Riesgo | Claim de certificacion inexistente, precision absoluta o garantia de resultados. |
| Claim afectado | KPIs internacionales, impacto, ESG, documentos generados, escenarios financieros. |
| Evidencia requerida | Standards map, evidencia local, estado de validacion humana y advertencia de no certificacion. |
| Respuesta correcta | Explicar que ALQUIMIA estructura evidencia, calcula y documenta; no certifica salvo que exista certificador externo. |
| Respuesta prohibida | Decir "validado oficialmente", "certificado por ALQUIMIA", "garantizado" o equivalente. |
| Documento fuente | `ALQUIMIA_METHOD_STATEMENT.md`, secciones 1 y 3; `CLAIM_EVIDENCE_MATRIX.md`, filas KPI internacional e impacto. |
| Decision humana requerida | Founder y responsable juridico/comunicacion institucional. |
| Condicion de bloqueo | Se afirma certificacion, cumplimiento o resultado sin verificacion externa y fuente suficiente. |

## 7. Proveedor externo entrega datos incompletos

| Campo | Respuesta |
|---|---|
| Riesgo | Llenar huecos con inferencias y publicar un claim operativo o financiero como si fuera completo. |
| Claim afectado | Rutas, costos, infraestructura, contratos, KPIs, proyecciones, documentos y gates. |
| Evidencia requerida | Fuente, periodo, unidad, metodologia, responsable y evidencia primaria. |
| Respuesta correcta | Registrar faltantes, marcar `pending_human_validation` o `missing_source`, bloquear claims criticos. |
| Respuesta prohibida | Rellenar huecos con narrativa o estimaciones para que el documento salga "ok". |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 7; `DATA_EVIDENCE_GLOSSARY.md`, estados de confianza. |
| Decision humana requerida | Responsable tecnico/founder/proveedor corrige o valida. |
| Condicion de bloqueo | Faltan unidades, periodo, metodologia o evidencia primaria. |

## 8. capa de aprendizaje supervisado sugiere un patron sin N suficiente

| Campo | Respuesta |
|---|---|
| Riesgo | Publicar aprendizaje prematuro, sesgado o no trazable al cliente. |
| Claim afectado | Sugerencia capa de aprendizaje supervisado, patron agregado, recomendacion por modulo, recalibracion o benchmark anonimo. |
| Evidencia requerida | Opt-in, N suficiente, bias check, founder gate, revision de estandares check, fecha, trazabilidad y perfiles anonimizados. |
| Respuesta correcta | Mantenerlo interno o bloquearlo; declarar que capa de aprendizaje supervisado observa antes de sugerir. |
| Respuesta prohibida | Mostrarlo al cliente como prediccion, dictamen o decision automatica. |
| Documento fuente | `capa de aprendizaje supervisado_GOVERNANCE_METHOD.md`, secciones 2, 3 y 6; `CLAIM_EVIDENCE_MATRIX.md`, filas capa de aprendizaje supervisado. |
| Decision humana requerida | revision metodologica/founder decide aprobar, rechazar, pausar o retirar. |
| Condicion de bloqueo | N bajo, sin opt-in, bias fail, sin founder gate, variable protegida o tenant identificable. |

## 9. Existe discrepancia entre municipio y ZM

| Campo | Respuesta |
|---|---|
| Riesgo | Copiar conclusiones regionales al municipio o municipales a la ZM. |
| Claim afectado | Poblacion, toneladas, cobertura, costos, rutas, metas, impacto y benchmarks. |
| Evidencia requerida | Fuente municipal y fuente ZM diferenciadas, fecha, metodo y alcance territorial. |
| Respuesta correcta | Mostrar cada unidad territorial separada; usar ZM solo como contexto o benchmark. |
| Respuesta prohibida | Presentar la ZM como cifra municipal o mezclar conclusiones sin advertencia. |
| Documento fuente | `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 10; `ALQUIMIA_METHOD_STATEMENT.md`, seccion 4. |
| Decision humana requerida | Responsable de datos/founder; validacion de arquitectura si hay conflicto de alcance. |
| Condicion de bloqueo | No se puede separar fuente, fecha, metodo o alcance territorial. |

## 10. Falta estudio local pero el usuario quiere publicar una conclusion

| Campo | Respuesta |
|---|---|
| Riesgo | Publicar como verdad municipal una inferencia, benchmark o supuesto. |
| Claim afectado | Generacion/composicion RSU, rutas, infraestructura, PSP, CAPEX/OPEX, KPI, impacto o dictamen juridico. |
| Evidencia requerida | Estudio local requerido por gate o evidencia primaria suficiente. |
| Respuesta correcta | Marcar brecha critica, listar estudio requerido y pausar claim institucional. |
| Respuesta prohibida | Suavizar la brecha como oportunidad comercial o usar narrativa para cubrir ausencia de estudio. |
| Documento fuente | `FIELD_STUDY_STATUS_METHOD.md`, secciones 1, 5, 7 y 8; `TECHNICAL_CHALLENGE_PROTOCOL.md`, seccion 9. |
| Decision humana requerida | Founder/responsable tecnico/juridico decide si se contrata estudio o se retira claim. |
| Condicion de bloqueo | El modulo depende de estudio local y no hay evidencia suficiente. |

## Resultado global

Los diez escenarios tienen respuesta correcta, respuesta prohibida, documento fuente, decision humana y condicion de bloqueo. La metodologia resiste el simulacro siempre que la operacion respete el bloqueo documental y no convierta advertencias en texto opcional.
