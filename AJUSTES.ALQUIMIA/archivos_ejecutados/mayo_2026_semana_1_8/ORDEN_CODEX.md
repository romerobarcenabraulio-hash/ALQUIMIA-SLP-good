# ORDEN CODEX

## Subfase asignada

Fase 10.1 - Entrada del portal y baseline de circularidad.

## Contexto de continuidad

Ya habia un agente trabajando 10.1. Continua exactamente esa estafeta. No reinicies desde cero, no abras trabajo paralelo, no avances a 10.2. Tu tarea es cerrar 10.1 con evidencia observable y dejarla lista para auditoria.

Nota de roadmap: se agrego Fase 11.0 como subfase futura para ingesta de fuentes legales oficiales por municipio. No la implementes dentro de 10.1. En 10.1 basta con no romper contratos de fuente/proveniencia y no presentar datos estimados como oficiales.

## Mision

Cerrar de forma verificable la subfase 10.1. Ya existen piezas en `backend/app/city`, `PortalEntrySelector`, `CityFirstSelector`, `CircularityBaselineCard`, store, tipos y API frontend. No asumas que esta cerrada: audita, corrige faltantes y entrega prueba de solucion.

## Continuidad tras auditoria

El regreso anterior queda rechazado con avance. Las pruebas unitarias y type-check pasaron, pero faltan dos correcciones obligatorias:

- Si `CircularityBaseline` esta loading, error o empty, `frontend/src/app/simulator/page.tsx` no debe renderizar metas futuras ni secciones dependientes del plan. Debe verse un bloqueo claro y accion siguiente.
- `PortalEntrySelector` debe mostrar `status`, `blocker` y `next_action` de cada `DecisionModule`; si un modulo viene `blocked`, la UI debe mostrarlo como bloqueado, no como tarjeta normal.

No conviertas esto en Fase 10.2. Es cierre de gate minimo de 10.1.

## Archivos permitidos

- `backend/app/city/**`
- `backend/tests/test_fase10_1_portal_city_baseline.py`
- `frontend/src/components/simulator/PortalEntrySelector.tsx`
- `frontend/src/components/simulator/CityFirstSelector.tsx`
- `frontend/src/components/simulator/CircularityBaselineCard.tsx`
- `frontend/src/app/simulator/page.tsx`
- `frontend/src/store/simulatorStore.ts`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api.ts`

## Archivos prohibidos

- `backend/app/services/package_store.py`
- `backend/app/routers/generate_plan.py`
- `backend/app/export/**`
- `backend/app/legal/**`, salvo lectura
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/00_*.md` a `17_*.md`
- `AJUSTES.ALQUIMIA/archivos_ejecutados/reestructura_blueprints/README_REESTRUCTURA.md`
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/CONTROL_REESTRUCTURA.csv`

Los blueprints 00-17 son constitucion del proyecto. No moverlos, no archivarlos, no marcarlos como desechables.

## Definition of Done

- Existen contratos claros para `PortalEntry`, `CityContext`, `CircularityBaseline`, `UserAudienceMode` y `DecisionModule`.
- `/city/options`, `/city/{city_id}/context`, `/city/{city_id}/baseline` y `/city/journey/steps` son observables.
- La UI tiene dos puertas reales: ciudadania/equipo publico y empresa/institucion.
- La seleccion de puerta cambia journey real, no solo copy.
- La seleccion de ciudad hidrata `CityContext`, invalida baseline anterior y no mezcla municipios.
- La baseline RSU actual aparece antes de metas futuras.
- La baseline tiene fuente, organismo, tipo, confianza, incertidumbre y warnings.
- La baseline estimada nunca se muestra como oficial.
- Hay estados loading, empty, error y bloqueado donde aplique.
- El gate de baseline impide que metas futuras se rendericen si no hay baseline valida.
- `DecisionModule.status`, `blocker` y `next_action` son visibles en UI.
- No iniciar Fase 10.2.

## Tests minimos

- Backend: entradas ciudadana y organizacional devuelven journeys distintos.
- Backend: baseline sin fuente/confianza/warnings falla por contrato.
- Backend: cambiar ciudad produce baseline especifica y no reutiliza la anterior.
- Backend: ciudad desconocida bloquea contexto/baseline con error explicito.
- Frontend/type-check: `./node_modules/.bin/tsc --noEmit` desde `frontend`.
- Agregar evidencia o test ligero de UI/estado que demuestre que sin baseline no se renderizan metas futuras.
- Agregar evidencia o test ligero de UI/estado para modulo `blocked` con `blocker` y `next_action`.
- Si el entorno tiene pytest: ejecutar `python3 -m pytest backend/tests/test_fase10_1_portal_city_baseline.py`.

## Evidencia requerida al entregar

- Lista de archivos modificados.
- Resultado de pruebas/comandos, incluyendo si alguna herramienta no esta disponible.
- Explicacion breve de como se ve la prueba de solucion: API, UI, estados y trazabilidad.
- Bloqueos residuales, si existen, con archivo/linea y accion propuesta.

## Si encuentras dependencia bloqueante

Detente y reporta. No sustituyas datos oficiales con narrativa, no uses documentos historicos SLP como verdad primaria y no avances a 10.2.
