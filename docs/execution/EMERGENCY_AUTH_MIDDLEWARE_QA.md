# Emergency Auth · Middleware QA

Fecha: 2026-05-31

| Caso | Estado | Evidencia |
| --- | --- | --- |
| `/v` sin sesión redirige a `/sign-in` | PASS por código | `frontend/middleware.ts` protege `/v` |
| `/p` sin sesión redirige a `/sign-in` | PASS por código | `frontend/middleware.ts` protege `/p` |
| `/e` sin sesión redirige a `/sign-in` | PASS por código | `frontend/middleware.ts` protege `/e` |
| `/admin` sin sesión redirige a `/sign-in` | PASS por código | `frontend/middleware.ts` protege `/admin` |
| `/sign-in` no entra en loop | PASS por código | No está en `PROTECTED` |
| Usuario autenticado llega a `/v` | PARTIAL | Requiere E2E con sesión real | Bloqueado por Clerk/account |

## Resultado

MIDDLEWARE MINIMUM: PASS para protección por código; E2E autenticado queda bloqueado por Clerk/account.
