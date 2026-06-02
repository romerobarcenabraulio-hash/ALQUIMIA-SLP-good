# Workspace Risk Control · 2026-06-02

## Objetivo

Reducir riesgo operativo antes de cerrar el MVP: separar cambios por paquete, preservar evidencia del diff actual y evitar commits mezclados que vuelvan a romper produccion.

## Respaldo no destructivo

- Backup local: `/private/tmp/alquimia-risk-backup-20260602-130213`
- Incluye:
  - `status.txt`
  - `tracked.diff`
  - `tracked.stat.txt`
  - `tracked.name-status.txt`
  - `untracked.txt`
  - copia de archivos nuevos no trackeados

## Paquetes de cambio

### Paquete A · Evidence Registry backend

Archivos:

- `backend/app/research/router.py`
- `backend/app/research/bibliography_registry.py`
- `backend/tests/test_research_bibliography_registry.py`
- `docs/execution/TOOLS_AND_CAPABILITY_AUDIT.md`

Riesgo principal:

- Exponer evidencia comparable como si fuera dato local.

Criterio de cierre:

- Endpoints de bibliografia responden con fuente, fecha, metodo, alcance y limite de uso.
- Tests backend de bibliografia pasan.

### Paquete B · Consulting package y frontend evidence

Archivos:

- `frontend/src/components/platform/ConsultingPackagePanel.tsx`
- `frontend/src/components/platform/ConsultingPackagePanel.test.tsx`
- `frontend/src/lib/consultingPackageEngine.ts`
- `frontend/src/lib/consultingPackageEngine.test.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.ts`
- `frontend/src/lib/tenantConsultingPackageResponse.test.ts`

Riesgo principal:

- Volver a mostrar brecha absoluta cuando ya existe bibliografia/caculo trazable suficiente para una aproximacion defendible.

Criterio de cierre:

- La UI muestra matriz de evidencia compatible, limites de uso y no convierte benchmark/comparable en estudio local.
- Tests frontend focalizados pasan.

### Paquete C · Contexto demo, ciudad y documentos

Archivos:

- `frontend/src/components/platform/PlatformPage.tsx`
- `frontend/src/lib/consultingInputRegistry.test.ts`
- `frontend/src/lib/documentArchiveStore.ts`
- `frontend/src/lib/documentArchiveStore.test.ts`
- `frontend/src/lib/tenantDiagnosticData.ts`

Riesgo principal:

- Que `municipio-demo` vuelva a verse como ciudad vacia sin bibliografia ni estructura consultiva.

Criterio de cierre:

- Demo usa bibliografia y calculos trazables cuando existan.
- Faltantes quedan como brechas especificas, no como caos general.

### Paquete D · Documentos de control y especificacion

Archivos:

- `AJUSTES PARA FINIQUITAR/MODULES_OPERATIONAL_SPECS_VALIDATION.md`
- `docs/execution/ADMIN_ERP_AND_DATA_MODEL_CORRECTION.md`
- `docs/execution/DEAD_CODE_CLEANUP_REVIEW_REGISTER.md`
- `docs/execution/DEAD_CODE_SCAN_2026_06_01.md`
- `docs/execution/WORKSPACE_RISK_CONTROL_2026_06_02.md`

Riesgo principal:

- Mezclar especificaciones del usuario con cambios de implementacion y perder trazabilidad.

Criterio de cierre:

- El spec operativo queda preservado.
- Los documentos de limpieza se usan como bitacora, no como prueba de implementacion.

## Deuda legacy detectada

La busqueda conservadora todavia encuentra referencias a `simulatorStore`, `simulador` y nombres internos en zonas legacy de `frontend/src/lib`. Esto no bloquea el paquete actual siempre que no sea cliente-facing en `/v`, `/p`, `/e` o export.

Regla:

- No borrar por intuicion.
- Extraer calculos utiles a motores puros.
- Eliminar solo con evidencia de cero imports activos y type-check verde.

## Validaciones realizadas

- `git diff --check`
- Busqueda de conflict markers en `backend`, `frontend`, `docs` y `AJUSTES PARA FINIQUITAR`
- Busqueda conservadora de deuda legacy para clasificar riesgo
- Correccion de `docs/architecture/capability_registry.json` para alinear el orden M00-M21 con el plan actualizado:
  - `/v`: M00, M00B, M01, M02, M03, M03B, M04, M13, M14, M15
  - `/p`: M05, M06, M07, M08, M09, M10, M11, M12
  - `/e`: M16, M17, M18, M19, M20, M21
- Guardrail agregado en `frontend/src/lib/validationModuleSpecs.test.ts` para detectar duplicidad de orden o regreso de M11/M12 a Validacion.

## Validaciones verdes agregadas

- `npm run test -- validationModuleSpecs platformRouting clientFacingConsultingGuardrails`
- Resultado: 27 tests passed.

## Siguiente cierre recomendado

1. Re-ejecutar tests focalizados backend y frontend.
2. Correr `npm run type-check`.
3. Hacer commit pequeno por paquetes A+B si las validaciones siguen verdes.
4. Dejar paquete D como documentacion de control.
5. No empujar a `main` directo; usar PR de estabilizacion.
