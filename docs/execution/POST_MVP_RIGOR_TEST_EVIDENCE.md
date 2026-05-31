# Post-MVP Sprint 1 · Evidencia de pruebas

Fecha: 2026-05-31

| Comando | Resultado | Salida relevante | Riesgo |
| --- | --- | --- | --- |
| `npm run type-check` | PASS | `tsc --noEmit` sin errores | Ninguno |
| `npm run test -- standardsCompliance.test.ts` | PASS | 1 archivo, 3 pruebas | Ninguno |
| `npm run test` | PASS | 46 archivos, 177 pruebas | Ninguno |
| `npm run lint` | PASS | 0 errores, 162 warnings legacy | Warnings no introducidos por este sprint |
| `npm run build` | PASS | Next build completado; 31 páginas estáticas | Ninguno |
| `backend/.venv/bin/pytest backend/tests/test_auth_accounts.py -q` | PASS | 6 pruebas | Ninguno |
| Browser smoke `/v`, `/e` | PASS | Diagramas/brechas visibles, sin errores de consola | Capturas en `/private/tmp/alquimia-sprint1-*.png` |

## Observaciones

- `curl` local no se usó como fuente de verdad por restricciones de sandbox vistas en fases previas; la verificación visual se hizo con Browser integrado.
- El lint conserva warnings históricos del repo. No hay errores.
