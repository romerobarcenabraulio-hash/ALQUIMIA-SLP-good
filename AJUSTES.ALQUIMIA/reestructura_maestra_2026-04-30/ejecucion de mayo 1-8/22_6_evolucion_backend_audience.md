# 22.6 · Evolución backend del PortalEntry triádico (opcional)

Propósito: documentar la extensión del contrato `PortalEntry` para soportar nativamente las tres audiencias (citizen / functionary / entrepreneur) sin romper compatibilidad con clientes anteriores.

## Estado actual
- `PortalEntry` enum solo expone `city_plan` y `organization` en `backend/app/city/schemas.py`.
- `journey_for(entry)` en `backend/app/city/repository.py` devuelve los DecisionModule por journey.

## Propuesta de extensión
- Añadir alias semánticos: `citizen` y `functionary` mapean a `city_plan` (compat); `entrepreneur` mapea a `organization`.
- Nuevo campo opcional en request: `audience: 'citizen' | 'functionary' | 'entrepreneur'`. Si se envía, el backend filtra módulos visibles antes de responder (server-side de la regla `audienceModules.ts`).
- Mantener `PortalEntry` actual para compatibilidad; agregar `audience` como dimensión ortogonal.

## Tests a crear
- `backend/tests/test_fase22_audience.py`
  - `audience=citizen` → no incluye `infrastructure_operations` ni `scenarios_export` en journey city_plan.
  - `audience=functionary` → incluye `infrastructure_operations` y `scenarios_export` pero no `citizen_inputs`.
  - `audience=entrepreneur` → journey organization completo.
  - Sin `audience` → comportamiento actual sin cambios (regresión).

## Consideraciones
- No romper contratos existentes: `audience` es opcional.
- Documentar en OpenAPI cuando aplique.
- Coordinar con frontend para retirar el filtrado client-side cuando server-side esté listo (queda como deuda controlada).

## Activación
- Esta subfase es **opcional para 22**. Se activa solo si auditoría posterior identifica fugas de información (módulos no autorizados visibles vía `module_id`).
- Mientras tanto, el filtrado client-side (`audienceModules.ts`) es la fuente de verdad.

## Criterios de aceptación
- `pytest backend/tests/test_fase22_audience.py -q` pasa.
- Sin regresiones en `test_fase10_1_portal_city_baseline.py`.
- Documentado el plan de migración para retirar filtrado client-side.
