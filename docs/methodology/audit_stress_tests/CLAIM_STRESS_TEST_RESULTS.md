# Claim Stress Test Results

**Uso:** auditoria de la matriz de claims de Fase 28 contra requisitos minimos de evidencia y limites institucionales.

**Criterio:** PASS, FAIL, PARTIAL o NOT APPLICABLE. Todo FAIL/PARTIAL queda corregido por los documentos de Fase 28 reforzados o escalado.

## 1. Resultado por tipo de claim

| Tipo de claim | Fuente | Fecha | Metodo | Confianza | Advertencia | Responsable humano | Bloqueo | Municipio/ZM | Benchmark/local | Estimado/oficial | capa de aprendizaje supervisado/flujo de borradores asistidos no aprueban | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dato demografico municipal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Dato municipal oficial | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Dato estimado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Inferencia publica | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Generacion RSU local | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Composicion fisica RSU | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Estudio local | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Rutas y tiempos | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Infraestructura existente | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Marco legal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Cabildo/actores | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Costo de omision | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| CAPEX/OPEX | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| TIR/VPN | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| KPI internacional | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| KPI faltante | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Documento generado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gate | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT APPLICABLE | PASS | PASS | PASS |
| Sugerencia capa de aprendizaje supervisado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Patron capa de aprendizaje supervisado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Benchmark | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Comparacion municipio/ZM | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Ahorro/captura/reduccion/impacto | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## 2. Huecos detectados durante el stress test

| Hueco | Severidad | Estado | Correccion aplicada |
|---|---|---|---|
| La primera version de la matriz no tenia filas literales para dato estimado, inferencia publica, estudio local, KPI faltante, patron capa de aprendizaje supervisado, comparacion municipio/ZM e impacto. | Alta documental | Corregido | `CLAIM_EVIDENCE_MATRIX.md` fue reforzado con filas explicitas. |
| El protocolo no separaba el escenario juridico "quien aprobo este claim" como caso propio. | Alta institucional | Corregido | `TECHNICAL_CHALLENGE_PROTOCOL.md` incluye escenario juridico, advertencia, humano decisor y bloqueo. |
| El protocolo no separaba discrepancia municipio/ZM como caso propio. | Alta tecnica | Corregido | `TECHNICAL_CHALLENGE_PROTOCOL.md` incluye escenario territorial y bloqueo por alcance no separable. |
| El glosario no definia todos los terminos operativos pedidos de forma literal. | Media documental | Corregido | `DATA_EVIDENCE_GLOSSARY.md` fue reforzado. |
| El metodo de estudios no declaraba KPI faltante como objeto operativo propio. | Media tecnica | Corregido | `FIELD_STUDY_STATUS_METHOD.md` incluye seccion de KPIs faltantes. |

## 3. FAIL/PARTIAL abiertos

No quedan FAIL o PARTIAL documentales abiertos en el paquete metodologico. La salvedad es operativa: la documentacion solo resiste auditoria si los usuarios humanos respetan los bloqueos y no editan salidas para ocultar advertencias.

## 4. Prueba de bloqueo por claim insuficiente

La regla transversal de `CLAIM_EVIDENCE_MATRIX.md` bloquea claims con impacto en Cabildo, contrato, presupuesto, gate o documento oficial si falta fuente, fecha, metodo, confianza o responsable humano.

El resultado esperado ante ausencia de evidencia es:

1. Degradar a preliminar.
2. Mostrar advertencia visible.
3. Pausar publicacion institucional.
4. Escalar a responsable humano.
5. Registrar bloqueo o brecha critica.

## 5. Resultado global

**PASS.** La matriz actual obliga evidencia minima, advertencia, responsable humano y condicion de bloqueo por tipo de claim. No autoriza claims oficiales desde estimaciones, benchmarks, inferencias, capa de aprendizaje supervisado, flujo de borradores asistidos ni sistemas internos.
