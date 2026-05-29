# PILOT SCOPE TEMPLATE

**Uso:** plantilla editable para definir el alcance de un piloto controlado. No es contrato legal final.

## 1. Institucion / cliente

- Nombre:
- Tipo: municipio / institucion publica / empresa / concesionario / otro:
- Sponsor humano:
- Responsable operativo:
- Responsable de datos:
- Responsable legal/compliance:

## 2. Plataforma aplicable

- Plataforma 0 interna:
- `/v` Validacion:
- `/p` Planeacion:
- `/e` Ejecucion:
- Empresa/institucion:
- Justificacion de la plataforma seleccionada:

No deben mezclarse stages ni journeys. Si el piloto requiere mas de una plataforma, cada superficie debe tener alcance, responsable y criterio de acceso separados.

## 3. Objetivo del piloto

Describir en una frase institucional y medible que se busca aprender, validar u ordenar. Evitar prometer ahorro, impacto, certificacion o resultado oficial.

## 4. Alcance incluido

| Elemento | Incluido | Evidencia minima | Responsable |
|---|---:|---|---|
| Diagnostico preliminar | Si / No | Fuentes, fecha, metodo, confianza. | |
| Datos provistos por cliente | Si / No | Fuente, periodo, unidad, responsable. | |
| Benchmarks | Si / No | Fuente comparativa y advertencia visible. | |
| Inferencias publicas | Si / No | Fuente, fecha, metodo, confianza. | |
| Estudios locales | Si / No | Alcance, fecha, metodologia, responsable. | |
| Recomendaciones condicionadas | Si / No | Justificacion, fuente, trade-off, validacion humana. | |
| Documentos borrador | Si / No | Provenance, revision humana requerida, bloqueo si falta evidencia. | |

## 5. Fuera de alcance

- Certificacion oficial de resultados.
- Auditoria externa formal.
- Firma, aprobacion o cierre automatico por sistemas internos.
- Garantia de ahorro, captura, reduccion o impacto.
- Uso de benchmark como estudio local.
- Uso de estimacion como verdad oficial.
- Publicacion externa sin revision founder/legal.
- Patrones capa de aprendizaje supervisado publicados sin opt-in, N suficiente, bias check, founder gate y trazabilidad.

## 6. Datos requeridos

| Dato | Fuente requerida | Fecha/periodo | Metodo | Responsable | Estado |
|---|---|---|---|---|---|
|  |  |  |  |  | disponible / pendiente / bloqueante |

## 7. Datos no disponibles

| Dato faltante | Claim afectado | Advertencia visible | Accion requerida | Condicion de bloqueo |
|---|---|---|---|---|
|  |  | Brecha critica / pendiente de validacion / no aplicable |  |  |

## 8. Brechas criticas

Registrar toda ausencia de estudio local, KPI, fuente territorial o validacion humana que impida afirmar un claim.

## 9. Supuestos

Todo supuesto debe tener fuente, metodo y condicion de revision. Un supuesto no es dato oficial.

## 10. Modulos incluidos

| Modulo | Stage/plataforma | Proposito en piloto | Estado de madurez | Condicion de uso |
|---|---|---|---|---|
|  |  |  | completo / parcial / carga inicial / en construccion |  |

## 11. Modulos excluidos

| Modulo | Motivo de exclusion | Riesgo si se muestra | Decision humana requerida |
|---|---|---|---|
|  |  |  |  |

## 12. Rol de capa de aprendizaje supervisado

capa de aprendizaje supervisado puede observar correcciones, outcomes o feedback solo bajo reglas de opt-in y trazabilidad. capa de aprendizaje supervisado no decide, no aprueba, no cierra gates, no recalibra automaticamente y no publica patrones sin N suficiente, bias check, founder gate y trazabilidad.

## 13. Rol de flujo de borradores asistidos

flujo de borradores asistidos puede asistir en razonamiento, estructuracion o borradores. flujo de borradores asistidos no firma, no aprueba, no valida oficialmente, no cierra gates y no sustituye revision humana.

## 14. Validaciones humanas

| Decision | Responsable humano | Evidencia requerida | Fecha objetivo | Condicion de bloqueo |
|---|---|---|---|---|
|  |  |  |  |  |

## 15. Entregables

| Entregable | Estado esperado | Advertencias obligatorias | Responsable |
|---|---|---|---|
|  | borrador / preliminar / validado por humano |  |  |

## 16. Calendario

- Kick-off:
- Reuniones semanales:
- Corte de datos:
- Revision founder:
- Revision legal/compliance si aplica:
- Cierre:

## 17. Criterios de exito

Los criterios deben medir aprendizaje operativo, trazabilidad y claridad institucional. No deben prometer resultados no validados.

## 18. Criterios de pausa

Pausar si aparece claim no sustentado, mezcla municipio/ZM, presion para ocultar brechas, falta de responsable humano, falta de opt-in cuando se usa analytics agregada, o uso indebido de capa de aprendizaje supervisado/flujo de borradores asistidos como decisores.

## 19. Criterios de cierre

El piloto cierra con reporte de cierre, registro de claims permitidos/bloqueados, brechas criticas, decisiones humanas y limites de lo que no puede afirmarse.

## 20. Riesgos

Usar `PILOT_RISK_AND_ESCALATION.md` como anexo obligatorio.
