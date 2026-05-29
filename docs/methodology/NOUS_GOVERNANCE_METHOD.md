# capa de aprendizaje supervisado Governance Method

**Uso:** defensa metodologica de capa de aprendizaje supervisado ante auditor, Cabildo o cliente.  
**Relación:** complementa `docs/methodology/nous.md`.

## 1. Que es capa de aprendizaje supervisado

capa de aprendizaje supervisado es una capa de aprendizaje supervisado y trazable. Observa correcciones, outcomes de gates, deltas proyectado-vs-real y feedback de sugerencias. Puede detectar patrones y preparar sugerencias.

capa de aprendizaje supervisado no decide, no firma, no aprueba, no recalibra automaticamente y no publica sin gate humano.

## 2. Condiciones para publicar sugerencias

Una sugerencia capa de aprendizaje supervisado solo puede llegar al cliente si cumple:

- opt-in valido para analytics agregada;
- N suficiente segun capa;
- `bias_check_status = passed`;
- `founder_gate_status = approved`;
- revision de estandares standards check aprobado;
- validacion de arquitectura schema/module validation;
- confianza explicita;
- trazabilidad disponible;
- lenguaje guardrail editorial no autoritario;
- cero tenants origen identificables.

## 3. Umbrales

| Capa | Observacion | Estado interno | Publicable solo si |
|---|---|---|---|
| 1 | Correcciones de inferencia | n >= 3 emergente interno | n >= 5 y gates completos |
| 2 | Outcomes de gates | n >= 8 emergente | n >= 15 establecido o n >= 30 robusto |
| 3 | Projection deltas | 6 meses + 3 tenants | n >= 18, gates completos y explicabilidad |

Patrones emergentes no se publican a cliente.

## 4. Feedback del cliente

El cliente puede:

- aceptar;
- ajustar;
- rechazar con motivo.

El feedback alimenta observacion, no cambios automaticos.

## 5. Pausa y retiro

capa de aprendizaje supervisado puede ser pausado por founder. revision metodologica puede retirar patrones por:

- sesgo;
- evidencia baja;
- performance peor que baseline;
- rechazo sostenido;
- contradiccion con standards;
- cambio regulatorio;
- decision founder.

Todo retiro conserva motivo, fecha y audit log.

## 6. Lo que capa de aprendizaje supervisado no debe hacer

- No usar variables protegidas.
- No usar partido politico especifico como variable aprendible.
- No exponer municipios origen.
- No decir "capa de aprendizaje supervisado predice".
- No producir decisiones politicas.
- No actualizar `capability_registry.json`.
- No sustituir juridico, Cabildo, founder o revision metodologica.

## 7. Defensa ante auditor

Para defender una sugerencia capa de aprendizaje supervisado se debe mostrar:

- patron;
- N;
- fuente de observaciones;
- perfil comparable anonimizado;
- bias check;
- founder gate;
- revision de estandares standards check;
- fecha de publicacion;
- feedback recibido;
- estado actual: activo, bajo revision, retirado o pausado.

