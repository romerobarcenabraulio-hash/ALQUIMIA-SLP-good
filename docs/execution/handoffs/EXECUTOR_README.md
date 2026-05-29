# EXECUTOR README

**Rol:** punto de entrada para cualquier agente ejecutor de ALQUIMIA SLP.

## Estado actual del plan

La planeacion documental esta lista para pasar a implementacion por bloques. No se debe reabrir alcance, inventar features ni convertir vision futura en producto actual. Cada cambio debe anclarse a los documentos base, al plan maestro y a los gates binarios.

## Rutas obligatorias a leer

- `AJUSTES PARA FINIQUITAR/ADR-0010_stage_based_platform_separation.md`
- `AJUSTES PARA FINIQUITAR/PLATAFORMA_0_BACKOFFICE_SPEC.md`
- `AJUSTES PARA FINIQUITAR/MODULE_MATURITY_AND_PERSONALIZATION.md`
- `AJUSTES PARA FINIQUITAR/ROADMAP_MIGRACION_3_PLATAFORMAS.md`
- `AJUSTES PARA FINIQUITAR/AUTOMATION_AND_PERSONALIZATION_LAYER.md`
- `AJUSTES PARA FINIQUITAR/LEARNING_AND_FEEDBACK_LAYER.md`
- `AJUSTES PARA FINIQUITAR/FIELD_STUDIES_AND_MISSING_KPIS.md`
- `docs/execution/MASTER_IMPLEMENTATION_PLAN.md`
- `docs/execution/DO_NOT_BUILD_YET.md`
- `docs/execution/BINARY_ACCEPTANCE_GATES.md`

## Non-negotiables

- Municipio y ZM nunca se mezclan.
- Benchmark no es estudio local.
- Inferencia no es dato validado.
- Estimacion no es verdad oficial.
- Falta de estudio local es brecha critica.
- NOUS observa y sugiere; no decide.
- AGORA asiste; no aprueba.
- Gates y decisiones politicas son humanas.
- Sin opt-in, datos tenant no alimentan analytics agregada.
- No se publican patrones NOUS sin N suficiente, bias check, founder gate y trazabilidad.

## Orden de ejecucion

Sigue `MASTER_IMPLEMENTATION_PLAN.md` por bloques A-K. No saltes a automation, NOUS, legal externo, piloto o release si los bloques anteriores no tienen evidencia.

## Como reportar avances

Reporta archivos modificados, comandos ejecutados, pruebas, evidencia positiva, prueba negativa, datos comparados, riesgos y estado final. Si no corriste una prueba, dilo.

## Como reportar bloqueo

Marca bloqueo como P0/P1/P2/P3. Incluye condicion exacta, archivo/ruta afectada, evidencia faltante, responsable humano y decision requerida.

## Que no hacer

No implementar features fuera del bloque. No borrar legacy sin decision. No ocultar warnings. No cerrar por build verde. No crear claims comerciales. No usar datos sin fuente.

## Criterio general de cierre

Un bloque cierra solo con evidencia observable, prueba negativa, no perdida de datos, respeto a stage/capabilities y riesgos residuales documentados.
