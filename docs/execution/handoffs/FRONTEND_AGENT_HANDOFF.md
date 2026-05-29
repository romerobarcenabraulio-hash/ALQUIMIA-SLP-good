# FRONTEND AGENT HANDOFF

**Agente recomendado:** POLIS frontend/platform UX + AESTHETE editorial + AUDITOR visual QA.

## Mision

Implementar superficies sobrias y funcionales para Plataforma 0 y journeys `/v`, `/p`, `/e`, respetando stage, capability registry, datos tenant, evidencia y limites metodologicos.

## Leer primero

- ADR-0010.
- Plataforma 0 spec.
- Module maturity.
- `docs/execution/BINARY_ACCEPTANCE_GATES.md`
- `docs/execution/DO_NOT_BUILD_YET.md`

## Separacion `/v`, `/p`, `/e`

- `/v` Validacion: solo capacidades de validation.
- `/p` Planeacion: planning y lectura de previos segun registry.
- `/e` Ejecucion: execution y lectura de previos segun registry.
- Acceso a etapa posterior debe bloquearse.

## Experiencia por plataforma

Plataforma 0 es backoffice operativo, no landing. Cliente municipal no debe verla. Cada journey debe responder a la pregunta de su etapa, no mostrar todos los modulos por ansiedad de cobertura.

## Estilo editorial

- Conclusion primero, soporte despues, detalle al final.
- Sobriedad Harvard/McKinsey/Minto.
- No cards dentro de cards.
- No SaaS generico.
- No fondos decorativos ni gradientes.
- Cifras con jerarquia tipografica, no cajas ruidosas.

## Datos y advertencias

- Municipio/ZM visible y separado.
- Estimaciones marcadas como no oficiales.
- Benchmarks marcados como referencia, no estudio local.
- Inferencias con fuente, fecha, metodo y confianza.
- Brechas criticas visibles, no suavizadas.

## Pruebas visuales esperadas

- Desktop ancho, laptop y mobile.
- No texto encimado.
- No contenido arrinconado cuando corresponde composicion editorial.
- No modulos execution visibles en validation.
- Browser screenshots o evidencia equivalente.

## Criterio binario de cierre

Frontend cierra si rutas, visibilidad, composicion editorial, advertencias y pruebas desktop/mobile pasan sin regresion critica.

## Formato de entrega

Archivos modificados, rutas verificadas, screenshots/evidencia visual, build/typecheck, pruebas negativas y estado final.
