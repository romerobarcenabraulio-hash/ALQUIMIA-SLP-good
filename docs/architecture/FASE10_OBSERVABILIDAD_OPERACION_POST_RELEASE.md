# Fase 10 - Observabilidad y operacion post-release

Fecha: 2026-05-28  
Decision heredada de Fase 9: **staging only / demo interna controlada**. Release publico sigue bloqueado hasta que PostgreSQL local/CI deje verde la suite backend completa.

## Decision ejecutiva

ALQUIMIA puede operar en **staging controlado** con smoke recurrente. Produccion publica queda bloqueada ante cualquier P0/P1 abierto, especialmente acceso indebido por etapa, perdida de datos SLP, exports engañosos o suite backend completa sin PostgreSQL validado.

Estado Fase 10: **cerrado para operacion staging; bloqueado para produccion publica por PostgreSQL local/CI pendiente**.

## Checklist post-release

Ejecutar antes de cada demo formal, despues de cada hotfix y al inicio de cada jornada de staging:

| Control | Comando / evidencia | Bloquea produccion |
| --- | --- | --- |
| Backend vivo | `GET /health` y `GET /health/deep` | Si |
| Tenant state y gates | `backend/.venv/bin/python scripts/phase10_operational_smoke.py` | Si |
| Capabilities/registry | `backend/.venv/bin/python scripts/phase10_operational_smoke.py` | Si |
| Plataforma 0 | Crear tenant smoke y leer `/admin/tenants/:id/state` | Si |
| Acceso por etapa | validation -> validation 200; validation -> planning/execution 403 | Si |
| SLP sin perdida visible | `backend/scripts/slp_phase4_compare.py --manifest <manifest>` | Si |
| Personalizacion municipal | `backend/scripts/audit_tenant_municipal_profiles.py` | Si |
| Export/provenance | `pytest backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py` | Si |
| Visual desktop/mobile | `node scripts/phase8_visual_capture.cjs` | P2 salvo bloqueo de navegacion |
| Editorial Minto/McKinsey | Revision contra capturas y modulos corregidos | P2/P3 salvo texto enganoso |
| Suite backend completa | `backend/.venv/bin/python -m pytest backend/tests` | Si para release publico |
| Frontend build/typecheck | `npm run type-check && npm run build` desde `frontend/` | Si |

## Smoke test recurrente

Smoke automatizado:

```bash
backend/.venv/bin/python scripts/phase10_operational_smoke.py
```

Nota operativa: no usar `python scripts/phase10_operational_smoke.py` en esta maquina; `python` no existe en `PATH`. Usar el Python del repo.

Valida:

- `/health` y `/health/deep`.
- Creacion de tenants smoke en Plataforma 0.
- Estado inicial, G1-G5 y capabilities activas.
- Acceso permitido por etapa.
- Acceso indebido a etapa posterior con HTTP 403.
- G1 no cierra sin evidencia.
- `capability_registry.json` parseable.
- Rutas frontend `/v`, `/p`, `/e`, `/admin` presentes.
- Evidencia visual desktop/mobile existente.
- Integridad SLP contra backup Fase 4.

Smoke frontend/visual:

```bash
cd frontend
npm run type-check
npm run test -- src/components/simulator/TenantProfilePanels.test.tsx src/lib/tenantMunicipalProfile.test.ts src/lib/platformRouting.test.ts src/app/simulator/simulatorSurface.test.ts src/lib/phase5Consolidation.test.ts
npm run build
cd ..
node scripts/phase8_visual_capture.cjs
```

Smoke backend/export:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py backend/tests/test_data_provenance.py backend/tests/test_fase25_integracion.py
```

## Health checks minimos

| Health check | Senal esperada | Severidad si falla |
| --- | --- | --- |
| Backend `/health` | `status=ok` | P0 |
| Backend `/health/deep` | `status=ok` | P1 |
| Frontend rutas | `/v`, `/p`, `/e`, `/admin` existen y compilan | P0 |
| Tenant state | current_stage coincide y transiciones son manuales | P0 |
| Gates | G1-G5 visibles; gate no cierra sin evidencia | P0 |
| Capability registry | JSON parseable; modulos tienen `module_id` y `platforms` | P0 |
| Plataforma 0 | CRUD tenant smoke y state endpoint responden | P0 |
| Export/documentos | No marca `ok` si hay bloqueos; provenance visible | P0 |
| SLP integridad | Hashes pre/post sin diferencias criticas | P0 |
| Visual/editorial | Sin encimados criticos; conclusion primero | P2 |

## Control visual/editorial minimo

Ejecutar `node scripts/phase8_visual_capture.cjs` y revisar:

- Desktop ancho: `/v`, `/p`, `/e`, `/simulator`.
- Mobile: `/v`, `/p`, `/e`, `/simulator`.
- Tablas: no cortadas ni encimadas.
- Cifras protagonistas: jerarquia clara.
- Narrativa ejecutiva: conclusion primero.
- Sin cards dentro de cards en modulos corregidos.
- Color principalmente tipografico; no fondos decorativos.
- Contenido ejecutivo no arrinconado si la seccion pide composicion editorial.

Clasificacion:

- Pagina rota, inaccesible o impide flujo: P0/P1.
- Pagina fea pero funcional, sin dano de datos ni acceso: P2.
- Ajuste editorial fino: P3.

## Matriz de severidad

| Severidad | Definicion | Ejemplos | Decision |
| --- | --- | --- | --- |
| P0 Critico | Riesgo de datos, acceso indebido, documento enganoso o caida total | Tenant validation accede a `/e`; SLP pierde datos; export sale `ok` con bloqueos | Bloquear produccion, rollback/hotfix inmediato |
| P1 Alto | Degradacion fuerte sin fuga confirmada | `/health/deep` falla; Plataforma 0 no permite cerrar gate manual; suite critica backend roja | Bloquear release publico, staging solo con advertencia |
| P2 Medio | Regresion visual/UX funcionalmente tolerable | Texto encimado menor, composicion arrinconada, tabla con scroll incomodo | Operar si no afecta decision, hotfix programado |
| P3 Bajo | Pulido editorial o deuda menor | Color tipografico inconsistente, copy mejorable | Operar, registrar backlog |

## Senales que bloquean produccion

- Cualquier ruta posterior accesible sin etapa habilitada.
- Cualquier tenant con `current_stage` cambiado automaticamente.
- Gate cerrado sin evidencia.
- SLP con diferencias pre/post no explicadas.
- Municipio y ZM mezclados.
- Dato oficial sin fuente o sin estado pendiente.
- Export/documento marcado `ok` con bloqueos o provenance ausente.
- `/health` caido.
- Suite backend completa roja por causa no ambiental.
- PostgreSQL local/CI ausente para release publico.

## Senales que permiten seguir operando

- P2/P3 visual sin impacto en acceso, datos, export ni decision publica.
- Warning documentado con workaround y sin bloqueo de tenant.
- Capturas visuales actualizadas y sin ruptura critica.
- Smoke operacional verde.
- SLP compare verde.
- Export/provenance tests verdes.

## Rollback

Rollback base documentado en `docs/migration/phase4/ROLLBACK.md`.

Procedimiento operativo:

1. Congelar cambios y registrar incidente en `docs/operations/INCIDENT_LOG.md`.
2. Identificar severidad y tenant afectado.
3. Si P0 de datos SLP, ejecutar restauracion desde backup Fase 4 y repetir comparador:

```bash
backend/.venv/bin/python backend/scripts/slp_phase4_compare.py --manifest backups/phase4-slp/slp-phase4-pre-migration-20260528T034925Z.manifest.json
```

4. Si P0 de acceso, deshabilitar exposicion publica y conservar solo Plataforma 0 para auditoria.
5. Si P0 de export, bloquear descarga/entrega del documento afectado hasta que tests de export/provenance pasen.
6. Cerrar rollback solo cuando el smoke operacional vuelva a verde y el incidente tenga evidencia.

## Protocolo de hotfix minimo

1. Reproducir el incidente con ruta/comando.
2. Clasificar P0/P1/P2/P3.
3. Tocar el menor numero de archivos posible.
4. Agregar o ejecutar prueba focal que cubra la falla.
5. Ejecutar:

```bash
backend/.venv/bin/python scripts/phase10_operational_smoke.py
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py
cd frontend && npm run type-check && npm run build
```

6. Actualizar `docs/operations/INCIDENT_LOG.md`.
7. Mantener legacy sin retiro irreversible salvo decision humana explicita.

## Evidencia de cierre Fase 10

Comandos ejecutados el 2026-05-28:

```bash
backend/.venv/bin/python scripts/phase10_operational_smoke.py
```

Resultado: `ok: true`; decision `operate`; sin blockers. Valido `/health`, `/health/deep`, Plataforma 0, tenant_state, gates, capabilities, accesos 200/403 por etapa, rutas `/v` `/p` `/e` `/admin`, evidencia visual existente e integridad SLP.

```bash
python scripts/phase10_operational_smoke.py
```

Resultado: no ejecutable en esta maquina porque `python` no existe en `PATH`.

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py backend/tests/test_data_provenance.py backend/tests/test_fase25_integracion.py
```

Resultado: `62 passed, 33 skipped, 2 warnings`.

```bash
cd frontend && npm run type-check
```

Resultado: sin errores.

```bash
cd frontend && npm run test -- src/components/simulator/TenantProfilePanels.test.tsx src/lib/tenantMunicipalProfile.test.ts src/lib/platformRouting.test.ts src/app/simulator/simulatorSurface.test.ts src/lib/phase5Consolidation.test.ts
```

Resultado: `5 files passed`, `20 tests passed`.

```bash
cd frontend && npm run build
```

Resultado Fase 10 final: build correcto; rutas `/admin`, `/v`, `/p`, `/e`, `/simulator` generadas. Durante el primer intento no escalado fallo `next/font` por red restringida; el rerun con permisos de build paso.

```bash
node scripts/phase8_visual_capture.cjs
```

Resultado Fase 10 final: capturas desktop/mobile actualizadas en `docs/architecture/phase8_visual_evidence/`. Se corrio contra `ALQUIMIA_BASE_URL=http://127.0.0.1:3001`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/v
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/p
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/e
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
```

Resultado Fase 10 final: `/v`, `/p`, `/e` y `/admin` respondieron `200` en `http://127.0.0.1:3001`. El intento no escalado habia fallado por `listen EPERM`; el servidor escalado permitio verificar rutas vivas y despues fue detenido.

```bash
backend/.venv/bin/python backend/scripts/audit_tenant_municipal_profiles.py
```

Resultado: `ok: true`; SLP en modo `operacion`, Monterrey/Guanajuato en `carga_inicial`, sin mezcla municipio/ZM.

```bash
backend/.venv/bin/python backend/scripts/slp_phase4_compare.py --manifest backups/phase4-slp/slp-phase4-pre-migration-20260528T034925Z.manifest.json
```

Resultado: `ok: true`; sin `changed_files` ni `missing_files`.

```bash
backend/.venv/bin/python -m pytest backend/tests
```

Resultado: `891 passed, 44 skipped, 13 failed`; fallas concentradas en tests dependientes de PostgreSQL local.

Rerun aislado:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_centros_acopio_nacional.py backend/tests/test_cron_jobs.py::test_cron_endpoint_with_secret backend/tests/test_fase8_expansion_nacional_legal.py::test_coverage_status_refleja_campos_faltantes backend/tests/test_geo_hermes.py backend/tests/test_inegi_nacional_catalog.py::test_fetch_municipios_slp_via_inegi backend/tests/test_wave1_integration.py::test_centros_acopio_seed backend/tests/test_wave1_integration.py::test_centros_acopio_filter_by_zm backend/tests/test_wave1_integration.py::test_centros_acopio_filter_by_material backend/tests/test_wave1_integration.py::test_centros_acopio_upsert_and_get
```

Resultado: `13 passed, 12 failed`; fallas restantes por `Connection refused` a `localhost:5432`.

## Pendientes operativos

- Provisionar PostgreSQL local/CI con base `alquimia` para cerrar release publico.
- Repetir suite backend completa hasta verde.
- Ejecutar smoke contra backend real desplegado, no solo TestClient local.
- Definir destino externo de alertas si staging se vuelve operacion diaria.
