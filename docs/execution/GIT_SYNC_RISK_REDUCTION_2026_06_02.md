# Git Sync Risk Reduction · 2026-06-02

## Estado detectado

- Rama local actual: `main`
- Estado local contra `origin/main`: `ahead 8, behind 20`
- Worktree: sucio, con cambios tracked y untracked.
- Riesgo: empujar, mergear o rebasear local `main` en este estado puede reintroducir codigo viejo, duplicar fixes o perder avances remotos.

## Regla operativa

No usar `main` local como base de cierre mientras siga divergido.

La ruta segura es:

1. Tomar `origin/main` como base.
2. Crear ramas pequenas `codex/*`.
3. Subir cambios acotados y verificados.
4. Abrir PR contra `main`.
5. Nunca empujar directo a `main`.

## Commits locales ahead

### Rescatar selectivamente

- `94f75259 Stabilize consulting module navigation`
  - Riesgo: toca navegacion/modulos.
  - Decision: rescatar solo si no existe equivalente en remoto.
- `2abe53ab Quarantine legacy report and project routes`
  - Riesgo: util para apagar legacy, pero puede tocar rutas antiguas.
  - Decision: revisar por archivo antes de integrar.
- `b61d3c42 Add admin ERP tenant onboarding backend`
  - Riesgo: backend admin/auth.
  - Decision: comparar contra remoto; no duplicar si ya fue recuperado.
- `00145d8e Stabilize ALQUIMIA consulting module MVP`
  - Riesgo: cambio amplio de frontend y API.
  - Decision: no mergear entero; rescatar por frentes.
- `bd4481a4 Mirror platform module visibility cleanup`
  - Riesgo: probablemente sustituido por `a8d8a715 Restore platform module visibility`.
  - Decision: no rescatar sin diff especifico.
- `21fda6a3 Fix admin tenant selection in production`
  - Riesgo: remoto ya tiene `8e07de8c Fix admin tenant selection in production`.
  - Decision: tratar como duplicado potencial.

### No prioritarios

- `dada7eac Ignore local Codex backup bundles`
  - Solo `.gitignore`.
- `c3c7f705 Preserve dirty MVP work before repo cleanup`
  - Riesgo muy alto: snapshot masivo de trabajo sucio.
  - Decision: nunca integrar entero.

## Ya materializado en rama remota

Rama:

- `codex/fix-module-order-risk-control`

Commits:

- `fb1790c9` · corrige `docs/architecture/capability_registry.json`.
- `fb730d2` · agrega guardrail de orden modular.
- `844a4a6` · documenta control de riesgo.

Alcance:

- M11/M12 salen de Validacion.
- M13/M14/M15 cierran Validacion.
- M05-M12 quedan en Planeacion.
- M16-M21 quedan en Ejecucion.

## Siguiente depuracion recomendada

### Iteracion 1 · PR pequeno de orden modular

Objetivo:

- Abrir PR de `codex/fix-module-order-risk-control` contra `main`.

Bloqueo actual:

- `gh pr create` no conecta a `api.github.com` desde esta sesion.

Accion manual si hace falta:

- Abrir compare en GitHub:
  - `main...codex/fix-module-order-risk-control`

### Iteracion 2 · Evidence Registry

Objetivo:

- Promover `backend/app/research/bibliography_registry.py`, endpoints y tests como PR separado.

Riesgo:

- Exponer comparable como local.

Cierre:

- Tests backend de bibliografia verdes.

### Iteracion 3 · Frontend evidence y demo

Objetivo:

- Promover engine/frontend que usa bibliografia y calculo trazable antes de caer a brecha absoluta.

Riesgo:

- Reintroducir UI tipo demo o claims sin fuente.

Cierre:

- Tests de `ConsultingPackagePanel`, `consultingPackageEngine`, `tenantConsultingPackageResponse`.

### Iteracion 4 · Legacy cleanup

Objetivo:

- Cortar imports cliente de legacy y eliminar solo con cero imports activos.

Riesgo:

- Borrar visualizaciones o calculos utiles.

Cierre:

- `type-check` verde y guardrails cliente-facing verdes.

## Clasificacion adicional · 2026-06-02 tarde

### Ya no rescatar como commit completo

El commit local `21fda6a3 Fix admin tenant selection in production` no debe integrarse completo. Contra `origin/main`, la mayoria de sus archivos ya no difieren. Solo quedan diferencias en:

- `.gitignore`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/api/admin/tenants/route.ts`

Decision:

- Revisar esos tres archivos por separado.
- No reintroducir middleware/auth config vieja.

### Paquete frontend evidence/demo listo pero grande

Archivos:

- `frontend/src/components/platform/ConsultingPackagePanel.tsx`
- `frontend/src/components/platform/ConsultingPackagePanel.test.tsx`
- `frontend/src/lib/consultingPackageEngine.ts`
- `frontend/src/lib/consultingPackageEngine.test.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.test.ts`
- `frontend/src/lib/tenantDiagnosticData.ts`

Estado:

- Tests focalizados verdes: `npm run test -- ConsultingPackagePanel consultingPackageEngine tenantConsultingPackageResponse`
- Resultado: 24 tests passed.
- Guardrail manual: sin `simulatorStore`, nombres internos o copy de simulador en los archivos tocados.
- Diff-check focalizado: limpio.

Decision:

- Promover como PR separado.
- No mezclar con `PlatformPage`, documentos ni legacy.
- Subir con mecanismo multiarchivo seguro; evitar transcripcion manual de 2,478 lineas por API.

### Paquete PlatformPage/documentos

Archivos:

- `frontend/src/components/platform/PlatformPage.tsx`
- `frontend/src/lib/consultingInputRegistry.test.ts`
- `frontend/src/lib/documentArchiveStore.ts`
- `frontend/src/lib/documentArchiveStore.test.ts`

Riesgo:

- Alto, porque `PlatformPage.tsx` concentra navegacion, selector admin, vista cliente/admin y estado de reglamento.

Decision:

- No promover hasta tener QA visual o browser smoke.
- Mantener separado de Evidence Registry.

### Paquete legacy quarantine

Archivos con diferencia contra `origin/main`:

- `frontend/src/app/informe/[municipio_id]/page.tsx`
- `frontend/src/app/proyecto/[municipio_id]/page.tsx`
- `frontend/src/lib/clientFacingConsultingGuardrails.test.ts`
- `frontend/src/lib/legacyQuarantineManifest.ts`

Decision:

- Revisar con guardrails cliente-facing.
- No borrar rutas hasta confirmar redireccion, no import activo y `type-check` verde.

### Ramas remotas existentes

- `codex/fix-module-order-risk-control`: contiene orden modular corregido, pero esta behind del `main` remoto actual.
- `codex/backend-bibliography-registry`: contiene backend bibliography, pero esta behind del `main` remoto actual.
- `codex/frontend-evidence-demo`: creada sin commits; usar solo cuando exista mecanismo de commit multiarchivo seguro.

## Depuracion concreta · 2026-06-02 cierre operativo

### Rama limpia creada desde main actual

- `codex/git-sync-risk-register-v2`
- Base: `e0972e702c013ae0fb61eeacf7800ed4245f3bdf`
- Estado compare: `ahead_by=1`, `behind_by=0`
- Uso: bitacora limpia de cierre y reglas para no volver a mezclar `main` local divergido.

### Bloque funcional listo para recrear desde main actual

#### Orden modular

Archivos minimos:

- `docs/architecture/capability_registry.json`
- `frontend/src/lib/validationModuleSpecs.test.ts`

Estado:

- Cambio ya probado localmente.
- Debe recrearse desde `e0972e7` para quitar `behind`.

Bloqueo tecnico actual:

- El conector permite `contents API`, pero para modificar `capability_registry.json` exige reemplazar archivo completo.
- Sin `gh` ni `git fetch`, no hay ruta local segura para rebase.

Decision:

- No forzar update manual si implica transcribir un archivo grande con alto riesgo de error.

#### Backend bibliography

Archivos minimos:

- `backend/app/research/router.py`
- `backend/app/research/bibliography_registry.py`
- `backend/tests/test_research_bibliography_registry.py`

Estado:

- Tests locales verdes: `python3 -m pytest backend/tests/test_bibliography_intelligence.py backend/tests/test_research_bibliography_registry.py -q`
- Resultado: 7 passed.

Decision:

- Recrear desde `e0972e7` cuando exista mecanismo de commit multiarchivo seguro o GitHub CLI vuelva a conectar.

#### Frontend evidence/demo

Archivos minimos:

- `frontend/src/components/platform/ConsultingPackagePanel.tsx`
- `frontend/src/components/platform/ConsultingPackagePanel.test.tsx`
- `frontend/src/lib/consultingPackageEngine.ts`
- `frontend/src/lib/consultingPackageEngine.test.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.test.ts`
- `frontend/src/lib/tenantDiagnosticData.ts`

Estado:

- Tests locales verdes: `npm run test -- ConsultingPackagePanel consultingPackageEngine tenantConsultingPackageResponse`
- Resultado: 24 passed.

Decision:

- Mantener como paquete separado; no subir sin mecanismo multiarchivo seguro.

### Riesgo cerrado

- Ya no se recomienda empujar local `main`.
- Ya no se recomienda integrar `c3c7f705` entero.
- Ya no se recomienda mezclar orden modular, backend bibliography y frontend evidence en un solo PR.

### Riesgo abierto

- Git local no puede resolver `github.com`.
- El conector no expone `tree_sha` base suficiente para commits multiarchivo limpios sin reemplazar archivos completos por contenido manual.
- `main` local sigue divergido y debe tratarse como zona de rescate, no como fuente de verdad.
