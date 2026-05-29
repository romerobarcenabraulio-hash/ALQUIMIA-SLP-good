# PILOT EVIDENCE LOG

**Uso:** formato operativo para registrar evidencia durante un piloto. El registro protege contra claims no sustentados y permite responder a auditor, cabildo, juridico, concesionario o cliente.

## Que debe registrarse

- Fuentes publicas, privadas o provistas por terceros.
- Fechas de corte, periodos, unidades y responsables.
- Metodos de captura, inferencia, calculo o validacion.
- Datasets recibidos y cambios de version.
- Claims generados, condicionados o bloqueados.
- Inferencias, benchmarks, datos validados y estudios locales.
- Brechas criticas.
- Decisiones humanas.
- Recomendaciones capa de aprendizaje supervisado y su estado.
- Asistencia flujo de borradores asistidos y advertencia de no aprobacion.
- Cambios de alcance.
- Impugnaciones, dudas tecnicas o solicitudes juridicas.

## Tabla operativa

| ID | Fecha | Tipo | Modulo/stage | Claim o dato | Alcance territorial | Fuente | Fecha/periodo fuente | Metodo | Confianza/estado | Responsable humano | Advertencia visible | Decision | Estado de bloqueo | Evidencia/link | Siguiente accion |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PILOT-EV-001 |  | fuente / dato / claim / inferencia / benchmark / estudio / brecha / decision / recomendacion / flujo de borradores asistidos / capa de aprendizaje supervisado / impugnacion |  |  | municipio / ZM / estatal / nacional / empresa |  |  |  | verificado / inferido / benchmark / pendiente / brecha critica |  |  | aceptar / ajustar / rechazar / pausar | permitido / condicionado / bloqueado |  |  |

## Reglas de registro

1. Un dato sin fuente, fecha o metodo queda como pendiente o bloqueado.
2. Un benchmark siempre debe marcarse como referencia comparativa, no estudio local.
3. Una inferencia siempre debe tener fuente, fecha, metodo y confianza.
4. Un estudio local debe tener alcance, fecha, metodologia, responsable y evidencia.
5. Una estimacion no puede quedar como oficial.
6. Municipio y ZM deben registrarse como alcances distintos.
7. Una recomendacion capa de aprendizaje supervisado no puede registrarse como aprobacion.
8. Una asistencia flujo de borradores asistidos no puede registrarse como firma o decision.
9. Todo claim bloqueado debe conservar razon y responsable.
10. Todo cambio de alcance debe remitir a `CHANGE_CONTROL_AND_ESCALATION.md`.

## Ejemplos de estados

| Estado | Uso correcto |
|---|---|
| permitido | El claim tiene evidencia minima y responsable humano. |
| condicionado | Puede usarse solo con advertencia visible o alcance reducido. |
| bloqueado | Falta evidencia critica, estudio local, validacion humana o separacion territorial. |
| pendiente | Hay evidencia parcial pero falta validacion o fuente complementaria. |
| brecha critica | Falta estudio, KPI, dato territorial o evidencia que impide afirmar verdad local. |
