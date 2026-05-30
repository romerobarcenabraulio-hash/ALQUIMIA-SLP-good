# MVP V2 AUTH TEST EVIDENCE

Fecha: 2026-05-29.

| Comando / acción | Resultado | Salida relevante |
| --- | --- | --- |
| `backend/.venv/bin/pytest backend/tests/test_auth_accounts.py -q` | PASS | 6 passed |
| `POST /auth/register` con `.gob.mx` | PASS | HTTP 200, `verification_url` dev |
| `POST /auth/verify-email` | PASS | HTTP 200, `setup_token` |
| `npm run type-check` | PASS | `tsc --noEmit` sin errores |
| `npm run test` | PASS | 40 files, 160 tests |
| `npm run build` | PASS | Next build completo |

## Corrección aplicada

`backend/app/main.py` ahora crea tablas de desarrollo dentro de `lifespan`, porque con lifespan activo el handler `@on_event("startup")` no garantizaba tablas SQLite para el MVP local.
