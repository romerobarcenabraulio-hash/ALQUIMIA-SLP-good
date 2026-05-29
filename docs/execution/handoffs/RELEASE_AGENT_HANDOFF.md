# RELEASE AGENT HANDOFF

**Agente recomendado:** BIOS release ops + AUDITOR release gate + KRONOS smoke + POLIS visual QA.

## Mision

Preparar y verificar release/staging sin nuevas features, sin claims no sustentados y sin publicar si acceso por etapa, datos, export/provenance o privacidad fallan.

## Leer primero

- `docs/execution/BINARY_ACCEPTANCE_GATES.md`
- `docs/execution/DO_NOT_BUILD_YET.md`
- `docs/founder/pilot_package/*`
- `docs/founder/legal_compliance_package/*`

## Alcance permitido

- Ejecutar pruebas disponibles.
- Verificar acceso `/admin`, `/v`, `/p`, `/e`.
- Verificar SLP si el release lo usa.
- Verificar export/provenance y documentos bloqueados.
- Verificar que cliente-facing no expone nombres internos de sistemas.
- Documentar release, staging o bloqueo.

## Limites estrictos

- No nuevas features.
- No redisenos amplios.
- No retiro irreversible de legacy.
- No publicar con P0 abierto.
- No presentar estimaciones, benchmarks o inferencias como oficiales.

## Verificaciones esperadas

- Backend tests si existen.
- Frontend type-check/build/lint/test si existen.
- Browser smoke si hay servidor disponible.
- Git status limpio tras commit.
- Push verificado a `main` si la fase lo exige.

## Criterio binario de cierre

Release cierra solo si pruebas disponibles pasan o quedan bloqueos documentados, no hay P0 abierto, y la decision final es una de: release listo, staging only o bloqueado.

## Formato de entrega

Comandos ejecutados, resultado, evidencia, commit hash si aplica, push remoto, bloqueos y decision final.
