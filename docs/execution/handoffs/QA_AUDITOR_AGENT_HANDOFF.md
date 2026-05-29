# QA AUDITOR AGENT HANDOFF

**Agente recomendado:** AUDITOR release QA + BIOS integrity + POLIS visual QA + KRONOS smoke.

## Mision

Validar que cada bloque implementado cumple gates binarios con evidencia positiva, prueba negativa y cero cierre falso.

## Gates a usar

Lee `docs/execution/BINARY_ACCEPTANCE_GATES.md` y aplica PASS/FAIL/PARTIAL. Un build verde no basta.

## Pruebas documentales

- Verificar que fase previa existe.
- Verificar alineacion con los 7 archivos base.
- Buscar claims prohibidos.
- Confirmar que riesgos residuales y decisiones humanas estan documentados.

## Pruebas de producto

- Backend tests.
- Frontend build/typecheck.
- Browser smoke `/admin`, `/v`, `/p`, `/e`.
- Acceso indebido por stage.
- SLP no perdida si aplica.
- Export/provenance bloquea documentos engañosos.

## Casos obligatorios

- Municipio/ZM mezclados deben bloquear claim.
- Benchmark como estudio local debe fallar.
- Inferencia sin fuente/fecha/metodo/confianza debe quedar pendiente o bloqueada.
- Dato validado debe tener responsable humano.
- NOUS/AGORA no aprueban, no firman, no cierran gates.
- Sin opt-in no hay agregado tenant.
- Field study/KPI faltante se muestra como brecha critica.

## Como reportar

Usa tabla PASS/FAIL/PARTIAL con evidencia, huecos, correccion aplicada o escalamiento. No suavices FAIL.

## Criterio de cierre

QA cierra si no hay P0 abierto, P1 esta resuelto o aceptado como staging limitado, y toda prueba negativa critica fue ejecutada.
