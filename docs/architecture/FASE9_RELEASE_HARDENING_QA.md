# Fase 9 - Release hardening y publicacion controlada

Fecha de auditoria: 2026-05-28  
Alcance: QA final sin nuevas features, sin refactors grandes y sin retiro irreversible de legacy.

## Decision ejecutiva

ALQUIMIA queda apta para **demo interna controlada / staging**, pero **no queda recomendada para publicacion publica** hasta ejecutar la suite completa con PostgreSQL local/CI disponible y dejar en verde los 12 tests que dependen de `localhost:5432`.

Estado Fase 9: **cerrado como gate de release con decision staging; bloqueado para release publico**.

## Checklist QA

| Area | Resultado | Evidencia |
| --- | --- | --- |
| Backend release tests enfocados | Pasa | `62 passed, 33 skipped, 2 warnings` |
| Backend suite completa | Parcial | `891 passed, 44 skipped, 13 failed`; rerun aislado deja 12 fallas por PostgreSQL no disponible |
| Frontend typecheck | Pasa | `./node_modules/.bin/tsc --noEmit` sin errores |
| Frontend tests enfocados | Pasa | `5 files passed`, `20 tests passed` |
| Frontend build | Pasa | `npm run build`, rutas `/admin`, `/v`, `/p`, `/e`, `/simulator` generadas |
| QA visual desktop/mobile | Pasa para modulos corregidos | Capturas en `docs/architecture/phase8_visual_evidence/` |
| Acceso por etapa | Pasa en pruebas enfocadas | `test_admin_tenants.py` y `platformRouting.test.ts` |
| Plataforma 0 | Pasa en pruebas enfocadas | Admin tenants, gates, capabilities cubiertos por `test_admin_tenants.py` |
| SLP pre/post | Pasa | Comparativo Fase 4 con `ok: true` y sin archivos faltantes/cambiados |
| Personalizacion municipal | Pasa | Auditoria tenant profiles con SLP en operacion y Monterrey/Guanajuato en carga inicial |
| Export/provenance | Pasa en pruebas enfocadas | Export profesional, release candidate, provenance y bloqueos cubiertos |
| Consola/layout critico | Sin errores criticos en captura visual | Capturas generadas por navegador headless con rutas principales |

## Comandos ejecutados

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py backend/tests/test_data_provenance.py backend/tests/test_fase25_integracion.py
```

Resultado: `62 passed, 33 skipped, 2 warnings in 9.36s`.

```bash
./node_modules/.bin/tsc --noEmit
```

Resultado: sin errores.

```bash
./node_modules/.bin/vitest run src/components/simulator/TenantProfilePanels.test.tsx src/lib/tenantMunicipalProfile.test.ts src/lib/platformRouting.test.ts src/app/simulator/simulatorSurface.test.ts src/lib/phase5Consolidation.test.ts
```

Resultado: `5 passed (5)`, `20 passed (20)`.

```bash
backend/.venv/bin/python backend/scripts/slp_phase4_compare.py --manifest backups/phase4-slp/slp-phase4-pre-migration-20260528T034925Z.manifest.json
```

Resultado:

```json
{
  "ok": true,
  "report": "docs/migration/phase4/slp-phase4-comparison-report.json",
  "differences": {
    "changed_files": [],
    "missing_files": []
  }
}
```

```bash
backend/.venv/bin/python backend/scripts/audit_tenant_municipal_profiles.py
```

Resultado: `ok: true`; SLP existe en `validation`, modo `operacion`, 15 actores, cabildo con sindicos/regidores/comisiones, organigrama con roles/turnos/horarios, Monterrey y Guanajuato Capital en `carga_inicial`, sin oficialidad sin fuente y sin mezcla municipio/ZM.

```bash
node scripts/phase8_visual_capture.cjs
```

Resultado: capturas generadas en `docs/architecture/phase8_visual_evidence/`.

```bash
npm run build
```

Resultado: compilacion correcta; Next genero 25 rutas estaticas/dinamicas, incluyendo `/admin`, `/v`, `/p`, `/e` y `/simulator`.

```bash
backend/.venv/bin/python -m pytest backend/tests
```

Resultado: `891 passed, 44 skipped, 13 failed, 20 warnings in 18.16s`.

Rerun aislado de fallas:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_centros_acopio_nacional.py backend/tests/test_cron_jobs.py::test_cron_endpoint_with_secret backend/tests/test_fase8_expansion_nacional_legal.py::test_coverage_status_refleja_campos_faltantes backend/tests/test_geo_hermes.py backend/tests/test_inegi_nacional_catalog.py::test_fetch_municipios_slp_via_inegi backend/tests/test_wave1_integration.py::test_centros_acopio_seed backend/tests/test_wave1_integration.py::test_centros_acopio_filter_by_zm backend/tests/test_wave1_integration.py::test_centros_acopio_filter_by_material backend/tests/test_wave1_integration.py::test_centros_acopio_upsert_and_get
```

Resultado: `13 passed, 12 failed, 2 warnings`. La prueba INEGI paso en rerun; las 12 restantes fallan por `Connection refused` contra PostgreSQL local `localhost:5432`.

## Evidencia visual revisada

Capturas disponibles:

- `docs/architecture/phase8_visual_evidence/desktop-simulator-m00b.png`
- `docs/architecture/phase8_visual_evidence/mobile-simulator-m00b.png`
- `docs/architecture/phase8_visual_evidence/desktop-v-shell.png`
- `docs/architecture/phase8_visual_evidence/desktop-p-shell.png`
- `docs/architecture/phase8_visual_evidence/desktop-e-shell.png`
- `docs/architecture/phase8_visual_evidence/mobile-v-shell.png`
- `docs/architecture/phase8_visual_evidence/mobile-p-shell.png`
- `docs/architecture/phase8_visual_evidence/mobile-e-shell.png`

Revision:

- Desktop ancho: shell `/v`, `/p`, `/e` renderiza sin ruptura critica.
- Mobile: shell `/v`, `/p`, `/e` conserva header/sidebar/ChapterIndex sin encimados criticos.
- Modulo M00B: lectura ejecutiva centrada, conclusion primero, cifras y pendientes sin contenedores anidados.
- Nota de alcance: las capturas visuales usan mocks de `tenant_state`, capabilities y perfil municipal para aislar QA visual de disponibilidad backend. La prueba funcional de acceso queda cubierta por backend/frontend tests enfocados.

## QA de acceso

Cubierto por pruebas enfocadas:

- Tenant `validation` accede a plataforma de validacion.
- Tenant `validation` recibe bloqueo/403 para etapa posterior.
- Tenant `planning` no accede a execution si no corresponde.
- Transiciones siguen siendo manuales y auditables.
- Gates no se cierran sin evidencia.

## QA de datos

SLP:

- `tenant_id`: `slp-capital`.
- `current_stage`: `validation`.
- Modo municipal: `operacion`.
- Mapa social: 15 actores.
- Cabildo: sindicos, regidores y comisiones presentes con fuente o pendiente.
- Organigrama: roles, turnos y horarios presentes.
- Comparativo pre/post: sin archivos faltantes ni cambiados en el reporte de Fase 4.

Monterrey y Guanajuato Capital:

- Existen como tenants basicos.
- Permanecen en `carga_inicial` cuando faltan datos.
- No copian conclusiones SLP.
- No mezclan municipio/ZM.
- No presentan datos oficiales sin fuente.

## QA export/provenance

Pruebas enfocadas pasan para:

- Documentos profesionales.
- Release candidate.
- Data provenance.
- Bloqueos que impiden marcar como `ok` cuando hay activos/documentos bloqueados.
- Advertencias y provenance visibles cuando aplica.

## Bugs y severidad

### P1 - Bloquea release publico: PostgreSQL local/CI no disponible para suite completa

Impacto: 12 tests de repositorios/geodata/centros de acopio/cron quedan rojos porque intentan conectar a `postgresql://alquimia:***@localhost:5432/alquimia` y no existe servidor local disponible en el entorno de auditoria.

Evidencia:

- Full suite: `891 passed, 44 skipped, 13 failed`.
- Rerun aislado con permisos: `13 passed, 12 failed`; error principal `Connection refused` a `localhost:5432`.

Fix minimo recomendado:

1. Levantar PostgreSQL local/CI con la base `alquimia` y usuario esperado.
2. Ejecutar migraciones/seeds requeridos por centros de acopio, geo HERMES y cron.
3. Repetir `backend/.venv/bin/python -m pytest backend/tests`.

No se aplico fix de codigo porque el fallo observado es de infraestructura de prueba, no una regresion funcional introducida en Fase 9.

## Decision de publicacion

Recomendacion: **publicar solo internamente / staging controlado**.

No recomendar publicacion publica hasta que:

- PostgreSQL local/CI este provisionado.
- La suite backend completa pase sin fallas.
- Se repita smoke de `/admin`, `/v`, `/p`, `/e` contra backend real, no solo mocks visuales.

## Estado final

Fase 9 queda **cerrada como auditoria de release con decision controlada**:

- Staging/demo interna: **aprobado**.
- Release publico: **bloqueado por infraestructura de tests DB-dependent**.
- Cambios funcionales nuevos: **ninguno**.
- Cambios irreversibles a legacy: **ninguno**.
