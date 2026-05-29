# PILOT READINESS CHECKLIST

**Uso:** checklist binaria para decidir si un piloto controlado de ALQUIMIA puede iniciar. Ningun piloto debe iniciar con un bloqueo P0 abierto.

**Estados permitidos:** PASS, FAIL, PARTIAL.

## Regla de decision

- **Iniciar piloto:** todos los criterios P0 en PASS y los P1 en PASS o PARTIAL con responsable y fecha.
- **Iniciar con restricciones:** ningun P0 en FAIL, P1 documentados como PARTIAL, alcance reducido por escrito.
- **No iniciar:** cualquier P0 en FAIL, falta de sponsor humano, falta de responsable de datos, mezcla municipio/ZM no resuelta, claim critico sin evidencia, o presion para ocultar brechas.

## Checklist

| Criterio | Prioridad | Estado | Evidencia requerida | Responsable humano | Condicion de bloqueo |
|---|---:|---:|---|---|---|
| Sponsor humano identificado. | P0 | PASS / FAIL / PARTIAL | Nombre, cargo, institucion, correo y autoridad para coordinar. | Founder/cliente. | No hay persona que responda por el piloto. |
| Responsable operativo identificado. | P0 | PASS / FAIL / PARTIAL | Nombre, cargo y agenda de reuniones. | Cliente/founder. | No hay responsable de ejecucion diaria. |
| Responsable de datos identificado. | P0 | PASS / FAIL / PARTIAL | Area fuente, custodio y canal de entrega. | Cliente. | Nadie puede validar fuentes o corregir datos. |
| Fuente de datos definida. | P0 | PASS / FAIL / PARTIAL | Lista de fuentes, fecha de corte y metodo de obtencion. | Responsable de datos. | Datos sin fuente o sin fecha. |
| Alcance del piloto definido. | P0 | PASS / FAIL / PARTIAL | `PILOT_SCOPE_TEMPLATE.md` completo. | Founder/cliente. | Alcance ambiguo o expectativa de resultados no pactada. |
| Plataforma aplicable definida. | P0 | PASS / FAIL / PARTIAL | Plataforma 0 interna, `/v`, `/p`, `/e` o empresa/institucion segun caso. | Founder. | Se mezclan journeys o stages. |
| Municipio y ZM separados. | P0 | PASS / FAIL / PARTIAL | Campo territorial por dato/claim. | Responsable de datos/validacion de arquitectura. | No puede distinguirse dato municipal de ZM. |
| Estudio local existente o brecha critica declarada. | P0 | PASS / FAIL / PARTIAL | Estudio local con alcance/fecha/metodo/responsable o registro de brecha. | Cliente/founder. | Se quiere afirmar verdad local sin estudio. |
| Benchmarks claramente marcados. | P0 | PASS / FAIL / PARTIAL | Fuente comparativa y advertencia visible. | Founder/revision metodologica. | Benchmark se presenta como estudio local. |
| Inferencias con fuente, fecha, metodo y confianza. | P0 | PASS / FAIL / PARTIAL | Registro pipeline de inferencia publica o fuente documental equivalente. | pipeline de inferencia publica/founder. | Inferencia sin trazabilidad. |
| Opt-in de datos tenant si aplica. | P0 | PASS / FAIL / PARTIAL | Consentimiento explicito, alcance, fecha y responsable. | Founder/legal/cliente. | Datos tenant alimentarian analytics agregada sin opt-in. |
| Revision legal pendiente o completada declarada. | P1 | PASS / FAIL / PARTIAL | Estado de revision legal y restricciones. | Founder/abogado. | Se requiere uso externo y no hay revision legal. |
| Gates humanos definidos. | P0 | PASS / FAIL / PARTIAL | Lista de decisiones humanas, responsables y evidencia por gate. | Founder/cliente. | Se pretende cerrar gate por sistema interno o sistema. |
| Criterios de pausa definidos. | P0 | PASS / FAIL / PARTIAL | Condiciones de pausa en alcance y riesgo. | Founder/cliente. | No existe forma de detener por riesgo metodologico. |
| Criterios de cierre definidos. | P1 | PASS / FAIL / PARTIAL | Plantilla de closeout y aceptacion humana. | Founder/cliente. | No hay criterio claro para terminar el piloto. |
| Registro de evidencia habilitado. | P0 | PASS / FAIL / PARTIAL | `PILOT_EVIDENCE_LOG.md` abierto para el piloto. | Operacion/founder. | Claims no quedarian trazables. |
| Claims permitidos y bloqueados definidos. | P0 | PASS / FAIL / PARTIAL | Lista inicial de claims y condiciones de bloqueo. | revision metodologica/founder. | Se usaran claims no sustentados. |

## Nota metodologica

Un piloto no convierte inferencia en dato validado, benchmark en estudio local, estimacion en verdad oficial ni recomendacion capa de aprendizaje supervisado/flujo de borradores asistidos en aprobacion humana.
