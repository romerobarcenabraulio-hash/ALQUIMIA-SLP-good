# Correccion admin ERP y filosofia de datos

Fecha: 2026-06-01

## Cambios aplicados

- Se agregaron endpoints admin para estados INEGI, municipios INEGI y tabla ERP de municipios.
- Se agregaron rutas locales Next de respaldo para `/api/admin/inegi/*` y `/api/admin/erp/municipalities`, protegidas por usuario admin/analista.
- La tabla ERP vincula tenants y usuarios por `clave_inegi` primero y `municipio_id` como respaldo.
- `/admin` ahora inicia como gestor municipal con filtros por busqueda, estado, etapa, tier y estado de vinculacion.
- El alta de tenant puede prepararse desde una fila INEGI/ERP en vez de depender solo de captura manual.
- El motor de precios dejo de usar un promedio fijo y ahora modela distribucion por calidades para PET, HDPE, carton, vidrio, aluminio, organico y otros.
- El modelo `DataPoint` formaliza la filosofia: investigado, calculado o provisto por cliente. Sin linaje, no entra.
- Backend permite operar la consola interna a roles `admin`, `analista` y `founder`.
- `/v`, `/p` y `/e` vuelven a usar `PlatformPage` con `DecisionModuleShell`, `ModuleNav`, capítulos y módulos reconocibles. `StageWorkspace` queda como contrato/estructura de evidencia, no como superficie principal cliente.
- `PlatformPage` ahora usa fallback local de `/api/admin/tenants` si el backend admin no responde.

## Filosofia fijada

Cero invencion. El sistema puede investigar, calcular, modelar y comparar, pero ninguna cifra puede mostrarse sin fuente, formula, metodo, alcance y limite de uso.

Una fuente comparable o benchmark puede alimentar contexto, hipotesis o escenarios. Nunca sustituye estudio local ni verdad municipal.

## Verificacion

- `npm run type-check`: PASS.
- `npm run test -- consultingPackageEngine clientFacingConsultingGuardrails stageWorkspaceLegacyGuard PlatformPage`: PASS, 29 tests.
- `npm run build`: PASS.
- `npm run lint`: PASS sin errores; mantiene 160 warnings heredados de simulator/legacy. No se ejecuto `--fix` global para evitar churn fuera del alcance.
- `python3 -m py_compile backend/app/routers/admin.py`: PASS.
- `python3 -m pytest backend/tests/test_admin_tenants.py -q`: PASS, 10 tests.

## Limitacion de esta sesion

No se pudo levantar servidor local para browser QA porque el sandbox bloqueo `listen` en `0.0.0.0` y `127.0.0.1`.

El test `backend/tests/test_inegi_nacional_catalog.py::test_fetch_municipios_slp_via_inegi` falla en este entorno porque la red hacia INEGI Gaia esta bloqueada y el fallback local contiene solo semillas. No es una regresion de los cambios de admin.
