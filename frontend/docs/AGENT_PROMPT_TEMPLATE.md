# Plantilla de prompt — rediseño módulo ALQUIMIA (frontend)

Copia y completa cada bloque. Cita un **Row ID** de [`FRONTEND DEFINITIVO/MODULE_MAP.md`](../../FRONTEND%20DEFINITIVO/MODULE_MAP.md).

## Contexto

- **Row ID matriz:** (ej. M04)
- **Mockup(s):** ruta `FRONTEND DEFINITIVO/...png`
- **`module_id`:** (ej. `infrastructure_operations`)
- **Audiencia objetivo:** citizen | functionary | entrepreneur

## Alcance (solo esto)

- Archivos/rutas que el agente **puede** editar (lista cerrada):

## Fuera de alcance

- Otros `module_id`, backend, contratos API, reglas Navigator salvo indicación explícita.

## Layout

- Orden de secciones (desktop / mobile)
- Patrones: tabs | acordeón | drawer | progressive disclosure

## Datos y copy

- Qué lee de `useSimulatorStore` / API vs texto estático
- Qué cifras llevan disclaimer o `DataProvenance`

## Accesibilidad

- Landmarks, foco, `aria-*` en controles nuevos

## Verificación

- Tests: (archivos `*.test.ts` / `*.tsx` a ejecutar)
- Manual: checklist breve
- Opcional: `node frontend/scripts/run-lighthouse-social.cjs` si aplica la pantalla social

## Criterio de aceptación

- Una frase medible (ej. “M04: todas las secciones del mockup tienen ancla en DOM y no se pierde disclaimer de simulación”).
