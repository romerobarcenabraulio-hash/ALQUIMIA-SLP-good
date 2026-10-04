# PLAN REDUCCION WARNINGS + CONSOLIDACION A MAIN - 04 jul 2026

## Veredicto actual

El PR #44 de ALQ-13 esta listo a nivel focal, pero no puede considerarse mergeable por gate estricto porque el CI global esta baseline-red.

Evidencia reciente:
- `main` remoto `a1327fd` ya falla en CI backend: 17 failed / 992 passed.
- PR #44 re-run falla igual en backend: 17 failed / 998 passed.
- Los tests nuevos de ALQ-13 no aparecen en la lista roja.
- Vercel esta verde en PR #44.
- Linear no se pudo actualizar: conector `token_expired`.

Conclusion operativa: no abrir mas features grandes hasta bajar el ruido de CI y cerrar cola.

## Orden recomendado de trabajo

### 1. Crear PR atomico de baseline CI

Objetivo: convertir el CI backend de rojo estructural a verde o, minimo, reducirlo de 17 fallas a un numero pequeno y explicable.

Tomar como referencia PR #32, pero no mergearlo a ciegas porque mezcla CI backend con cambios frontend/producto.

Extraer primero solo el nucleo seguro:
- `.github/workflows/ci.yml`: servicio Postgres 16, `DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT=test`, `alembic upgrade head` antes de pytest.
- Fix idempotente de migracion si Alembic rompe en Postgres.
- Fix de paths relativos de tests que dependen de `docs/architecture/*`.
- Mock/fallback para tests que dependen de INEGI vivo.

No incluir en este PR:
- cambios de paginas frontend,
- redirects de auth,
- cambios de copy,
- ajustes de producto no necesarios para CI.

Gate esperado:
- CI `checks` verde, o lista residual menor y documentada.
- Sin cambio funcional de producto salvo estabilizacion de test/CI.

### 2. Reducir warnings por oleadas pequenas

No perseguir todos los warnings en una sola rama. Hacer PRs pequenos con tests focales.

Oleada W1 - Pydantic v2:
- Reemplazar `class Config: orm_mode = True` por `model_config = ConfigDict(from_attributes=True)`.
- Empezar por routers/schemas que aparecen en pytest.
- Confirmar con tests focales.

Oleada W2 - datetime UTC:
- Reemplazar usos de `datetime.utcnow()` por `datetime.now(timezone.utc)` donde el dato sea runtime o timestamp serializado.
- Para SQLAlchemy `DateTime` naive existente, evaluar compatibilidad antes de cambiar defaults; no romper migraciones ni comparaciones naive.
- Priorizar archivos que salen en warnings: `modules/lifecycle/*`, `modules/logistics/*`, `backend/app/scheduler.py`, `backend/app/web_scraper/scheduler.py`.

Oleada W3 - duplicados ` 2.py`:
- Hay archivos duplicados tipo `backend/app/scheduler 2.py`, `backend/app/data_integrity 2.py`, etc.
- No borrarlos sin auditoria: primero listar, confirmar si estan importados, luego PR de limpieza.

### 3. Consolidar PRs hacia main por cola corta

Regla: primero infraestructura/gates, luego features.

Orden propuesto:
1. PR baseline CI atomico derivado de #32.
2. PR #43 solo si se corrige su narrativa a estado real y no afirma CI verde falso.
3. PRs doc-only o test-only de bajo riesgo.
4. PR #44 ALQ-13 reemplaza al viejo PR #34; no mergear #34.
5. PRs frontend de Claude solo despues de confirmar que no pisan backend ni dependen de endpoints faltantes.

PRs a tratar con cuidado:
- #34: superseded por #44; no mergear.
- #35: viejo ALQ-111 con bloqueos; preferir #40 o nueva rama limpia.
- #42: conflictivo; requiere rebase/actualizacion por su dueno.
- #41: puede aportar fixes, pero esta viejo; revisar contra baseline CI atomico.
- #43: util como contrato, pero su reporte de readiness es optimista y debe ajustarse a la realidad.

### 4. Politica de cierre

Cada PR que llegue a main debe tener:
- diff atomico,
- salida real de tests,
- comentario en PR con veredicto,
- Linear actualizado cuando el conector vuelva,
- merge solo por founder/controlador.

Mientras CI global este rojo:
- se puede dejar PR en draft con evidencia focal,
- no declarar "listo para main",
- no mover issue a Done.

## Siguiente accion sugerida para Codex

Crear rama nueva desde `origin/main` para `codex/ci-baseline-green`, copiar solo el nucleo CI/backend seguro de PR #32, correr:

```bash
backend/.venv/bin/pytest backend/tests/test_centros_acopio_nacional.py backend/tests/test_geo_hermes.py backend/tests/test_cron_jobs.py backend/tests/test_wave1_integration.py -q
backend/.venv/bin/pytest backend/tests/test_phase19_field_studies_kpis.py backend/tests/test_inegi_nacional_catalog.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase8_expansion_nacional_legal.py backend/tests/test_evm_integration.py backend/tests/test_weekly_status.py -q
```

Si baja la lista roja sin tocar producto, abrir PR draft y documentar delta exacto.
