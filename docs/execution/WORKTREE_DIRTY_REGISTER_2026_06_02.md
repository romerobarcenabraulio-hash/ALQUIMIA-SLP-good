# Worktree dirty register · 2026-06-02

## Estado

Este registro separa cambios pendientes para evitar mezclar commits y volver a ensuciar GitHub.

## Commit ya empujado a rama segura

- Rama remota: `codex/consulting-module-mvp`.
- Commit: `00145d8e Stabilize ALQUIMIA consulting module MVP`.
- Alcance: frontend consultivo, specs operativos `/v` `/p` `/e`, export ZIP, guardrails y matriz de rescate modular.

## Cambios backend pendientes

- `backend/app/routers/admin.py`
  - Endpoints admin para INEGI states, INEGI municipalities y ERP municipalities.
  - Permite admin, analista y founder en rutas internas.
- `backend/app/routers/auth.py`
  - Crea o recupera tenant consultivo desde onboarding cuando hay municipio, clave INEGI y estado.
  - Inicia inferencia preliminar y devuelve `tenant_id`.
- `backend/tests/test_admin_tenants.py`
  - Pruebas para catálogo INEGI admin y tabla ERP.

## Validación backend ejecutada

- `backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py -q`
  - Resultado: 10 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py -q`
  - Resultado: 7 passed.
- `backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_municipal_context.py backend/tests/test_inegi_routing.py -q`
  - Resultado: 16 passed, 1 skipped.
- `python3 -m py_compile backend/app/routers/admin.py backend/app/routers/auth.py`
  - Resultado: passed.

## Test no concluyente

- `backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py backend/tests/test_inegi_nacional_catalog.py -q`
  - Resultado: `test_fetch_municipios_slp_via_inegi` falla porque INEGI Gaia no tiene red y el fallback local devuelve 4 municipios.
  - No se debe interpretar como regresión del cambio backend sin revisar política de fallback del catálogo.

## Untracked docs pendientes

- `AJUSTES PARA FINIQUITAR/MODULES_OPERATIONAL_SPECS_VALIDATION.md`
  - Nuevo spec operativo agregado por Braulio. Ya fue incorporado conceptualmente al plan y al frontend.
- `docs/execution/ADMIN_ERP_AND_DATA_MODEL_CORRECTION.md`
  - Documento de corrección admin/ERP pendiente de decidir si se versiona.
- `docs/execution/DEAD_CODE_CLEANUP_REVIEW_REGISTER.md`
  - Auditoría de limpieza/dead code, probablemente de otro agente.
- `docs/execution/DEAD_CODE_SCAN_2026_06_01.md`
  - Escaneo de dead code, probablemente de otro agente.

## Limpieza frontend aplicada después del commit backend

- `frontend/src/app/informe/[municipio_id]/page.tsx`
  - Antes: informe heredado de 493 líneas con `useSimulatorStore`, KPIs prospectivos, TIR y fórmulas del simulador.
  - Ahora: redirección a `/v?tenant_id=<municipio_id>` y copy institucional de paquete consultivo.
  - Validación: guardrail cliente y type-check.
- `frontend/src/app/proyecto/[municipio_id]/page.tsx`
  - Antes: montaba `ProyectoVivoPortal` desde `components/simulator`.
  - Ahora: redirección a `/e?tenant_id=<municipio_id|tenant_id>` para monitoreo por etapa.
  - Validación: guardrail cliente y type-check.
- `frontend/src/lib/clientFacingConsultingGuardrails.test.ts`
  - Se agregó protección para que esas rutas no vuelvan a importar `simulatorStore`, `components/simulator` ni `ProyectoVivoPortal`.
- `frontend/src/lib/legacyQuarantineManifest.ts`
  - Se registraron ambas rutas como dependencias legacy cortadas.

## Validación frontend de la limpieza

- `npm run test -- clientFacingConsultingGuardrails stageWorkspaceLegacyGuard platformRouting`
  - Resultado: 22 passed.
- `npm run type-check`
  - Resultado: passed.

## Reglas de depuración

- No usar `git add .`.
- No mezclar backend auth/admin con frontend consultivo en el mismo commit.
- No borrar docs de auditoría sin confirmar si pertenecen al otro agente.
- Si se commitea backend, hacerlo como commit separado y repetir tests relevantes.
