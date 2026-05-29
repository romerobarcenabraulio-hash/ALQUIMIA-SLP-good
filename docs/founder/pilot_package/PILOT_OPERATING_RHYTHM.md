# PILOT OPERATING RHYTHM

**Uso:** ritmo operativo minimo para ejecutar un piloto controlado sin improvisar decisiones, claims ni evidencia.

## Principios

- Toda decision relevante tiene responsable humano.
- Todo claim queda ligado a fuente, fecha, metodo, confianza y advertencia.
- Municipio y ZM se tratan como unidades distintas.
- capa de aprendizaje supervisado observa y sugiere bajo controles; no decide.
- flujo de borradores asistidos asiste; no aprueba.
- Un piloto puede pausarse por riesgo metodologico, legal o politico.

## Ritos operativos

| Rito | Objetivo | Participantes | Inputs | Outputs | Decisiones humanas | Riesgos a revisar | Evidencia registrada |
|---|---|---|---|---|---|---|---|
| Kick-off | Confirmar alcance, responsables, plataforma y reglas de evidencia. | Founder, sponsor, responsable operativo, responsable de datos, legal si aplica. | Scope, readiness checklist, data request. | Acta de inicio, responsables, calendario. | Aceptar o no iniciar piloto. | Alcance ambiguo, falta de sponsor, mezcla de stages. | Minuta, scope firmado, checklist. |
| Reunion semanal | Revisar avance, bloqueos y compromisos. | Operacion, cliente, founder si aplica. | Evidence log, backlog de datos, riesgos. | Acuerdos reales y no-acuerdos. | Priorizar o pausar actividades. | Promesas nuevas, datos faltantes, presion politica. | Minuta semanal. |
| Revision de datos | Validar fuentes, fechas, unidades, metodo y alcance territorial. | Responsable de datos, pipeline de inferencia publica/founder, operacion. | Datasets, fuentes publicas, datos cliente. | Datos aceptados, pendientes o bloqueados. | Aceptar dato, pedir correccion o bloquear claim. | Dato sin fuente, ZM usado como municipio. | Evidence log actualizado. |
| Revision de claims | Determinar que afirmaciones pueden mostrarse. | revision metodologica, founder, responsable institucional. | Claim list, evidencia, disclaimers. | Claims permitidos, condicionados o bloqueados. | Autorizar lenguaje interno o pausar. | Ahorro/impacto sin baseline; benchmark como dato local. | Claim register. |
| Revision de brechas | Mantener visibles faltantes criticos. | Founder, responsable operativo, cliente. | Brechas, estudios faltantes, KPIs pendientes. | Lista de brechas y plan de accion. | Contratar estudio, diferir claim o ajustar alcance. | Suavizar brecha critica como pendiente menor. | Breach log. |
| Revision de recomendaciones | Revisar sugerencias capa de aprendizaje supervisado/flujo de borradores asistidos si existen. | Founder, revision metodologica, responsable humano del cliente. | Recomendaciones, fuentes, trade-offs, confianza. | Aceptar, ajustar, rechazar o pausar. | Validacion humana explicita. | Sugerencia sin fuente, N insuficiente, tono autoritario. | Decision log. |
| Revision founder | Confirmar que el piloto sigue dentro de limites. | Founder, operacion, legal si aplica. | Estado del piloto, riesgos, claims, brechas. | Continuar, restringir, pausar o escalar. | Decision founder. | Exceso de alcance, riesgo reputacional, legal pendiente. | Founder decision log. |
| Revision legal/compliance | Revisar uso externo, opt-in, claims sensibles y documentos. | Abogado/juridico, founder, responsable institucional. | Disclaimers, SOW preliminar, evidence log. | Aprobaciones, restricciones o bloqueos. | Continuar con restricciones o pausar. | Uso externo sin revision; opt-in ambiguo. | Legal/compliance notes. |
| Cierre de semana | Consolidar evidencia y pendientes. | Operacion/founder. | Minutas, evidence log, claims. | Resumen semanal sobrio. | Mantener o ajustar plan. | Acuerdos informales no registrados. | Weekly closeout. |
| Cierre del piloto | Documentar que se aprendio y que no puede afirmarse. | Founder, cliente, legal si aplica. | Evidence log completo, closeout template. | Reporte de cierre. | Aceptar cierre, extender o bloquear siguiente paso. | Presentar piloto como certificacion o caso de exito sin base. | Pilot closeout report. |

## Evidencia minima por rito

Cada rito debe dejar fecha, asistentes, decisiones, evidencia revisada, riesgos, responsable humano y siguiente accion. Si no queda evidencia, el rito no cuenta para cierre.
