# MVP Scope After 11 Documents

Fecha: 2026-05-30

Este documento fija el alcance del MVP V2 despues de incorporar los documentos rectores 9-11.

## MVP si incluye

- Auth institucional.
- Tenant/municipio con gate founder/admin cuando aplique.
- Diagnostico inicial por municipio.
- ARCHIVO minimo embebido: gaps documentales, upload minimo, no aplica y estado documental.
- Mismo indice y mismo numero de documentos por ciudad.
- Citas minimas por cifra o brecha critica visible.
- Metadata por metrica: fuente, fecha, metodo, confianza y alcance territorial.
- Bibliografia minima en export preliminar.
- Marca de agua preliminar.
- Marcador metodologico sobrio en export/documentos preliminares.
- Export ZIP minimo.
- Visual QA desktop/mobile.
- No nombres internos de agentes en cliente-facing.
- Bloqueo de claims de cumplimiento completo cuando faltan campos obligatorios.
- Cumplimiento de estandar marcado como completo, parcial o removido.

## MVP no incluye

- Partner ecosystem.
- Partners financieros.
- Roles partner.
- Dashboard partner.
- Comisiones partner.
- Contratos partner.
- A12 compliance completo.
- Tabla `standards_compliance_check`.
- Auditoria trimestral profunda.
- Cron trimestral.
- Cinco diagramas dinamicos completos.
- OCR avanzado completo.
- Postmark digest completo si no esta ya implementado.
- Aprendizaje maduro o publicacion de patrones.
- Defensibility roadmap de 36 meses como feature.
- Relaciones regulatorias ejecutadas por agentes.
- Case studies publicos sin contrato y aprobacion founder/legal.

## Guardrails que entran sin inflar MVP

1. No declarar cumplimiento completo de estandar si falta evidencia minima.
2. No presentar bibliografia vacia cuando existen cifras.
3. No presentar estimacion como oficial.
4. No presentar benchmark como estudio local.
5. No mezclar municipio, ZM, estado o nacional.
6. No crear roles partner prematuros.
7. No permitir que terceros sean duenos de tenants.
8. No usar nombres internos de agentes en superficies cliente-facing.
