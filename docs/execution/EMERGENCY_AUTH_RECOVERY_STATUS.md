# EMERGENCY AUTH RECOVERY STATUS

Fecha: 2026-05-31

Fuente primaria:
- `AJUSTES PARA FINIQUITAR/EMERGENCY_AUTH_RECOVERY.md`
- `AJUSTES PARA FINIQUITAR/FULL_AUDIT.md`
- `AJUSTES PARA FINIQUITAR/NAVIGATION_AND_PHILOSOPHY.md`

Decision actual: FAIL/PARTIAL

Motivo:
El flujo ya esta mas cerca de Clerk-only, pero no existe evidencia end-to-end de founder entrando a `/v` con una sesion real de Clerk. Esta fase no puede cerrarse como PASS hasta que Braulio pruebe el acceso real en navegador/incognito con una cuenta existente en Clerk.

## Auditoria de fase anterior

| Criterio auditado | Estado | Evidencia |
|---|---:|---|
| `/sign-in` usa Clerk nativo | PASS por codigo | `frontend/src/app/sign-in/page.tsx` renderiza `SignIn` de `@clerk/nextjs` y redirige a `/v`. |
| `/v`, `/p`, `/e`, `/admin` estan protegidas | PASS por codigo | `frontend/middleware.ts` aplica `auth.protect()` sobre rutas protegidas. |
| Cookies legacy abren rutas protegidas por default | PASS corregido | `alquimia_session` y `alquimia_access` solo funcionan si `ALLOW_LEGACY_AUTH_BYPASS=1`. La env no esta presente en `.env.local` ni `frontend/.env.local`. |
| Twilio/SMS activo en login/register | PASS/PARTIAL | Endpoints SMS devuelven 410 y frontend lanza error local. Persisten servicios/modelos/migraciones legacy fuera del flujo activo. |
| Variables Clerk locales | PASS local | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` y URLs publicas Clerk existen en `.env.local` y `frontend/.env.local`. Secretos no impresos. |
| Founder user existe en Clerk | BLOCKED | No verificable desde este entorno; requiere dashboard Clerk. |
| Founder entra a `/v` | BLOCKED | No verificable sin sesion real founder. |

## Cambio aplicado

Archivo:
- `frontend/middleware.ts`
- `frontend/src/app/login/page.tsx`
- `.env.local`
- `frontend/.env.local`

Cambio:
- Se agrego `ALLOW_LEGACY_AUTH_BYPASS`.
- Por default, cookies `alquimia_session` y `alquimia_access` ya no desbloquean rutas protegidas.
- Si se requiere una salida temporal, debe configurarse explicitamente `ALLOW_LEGACY_AUTH_BYPASS=1`.
- Cuando el bypass se usa, el middleware agrega header `X-Alquimia-Auth-Mode: legacy-cookie-bypass` para trazabilidad.
- `/login` deja de renderizar el flujo custom email/password y redirige a `/sign-in`.
- Se agregaron URLs publicas locales de Clerk para sign-in/sign-up y redirects post-auth.

Impacto:
- Alinea el acceso con Clerk como fuente de verdad.
- Puede romper flujos custom legacy de `/login` o `/acceso` si dependian solo de cookies. Eso es esperado: no deben sustituir a Clerk en el MVP actual salvo decision explicita.

## Variables revisadas

| Variable | `.env.local` | `frontend/.env.local` |
|---|---:|---:|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | PRESENT | PRESENT |
| `CLERK_SECRET_KEY` | PRESENT | PRESENT |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | PRESENT | PRESENT |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | PRESENT | PRESENT |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | PRESENT | PRESENT |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | PRESENT | PRESENT |
| `ALLOW_LEGACY_AUTH_BYPASS` | MISSING | MISSING |

## Pendiente externo obligatorio

Braulio debe verificar en Clerk dashboard:

1. Email como identifier habilitado.
2. Phone/SMS deshabilitado.
3. Magic link o email code habilitado.
4. TOTP habilitado.
5. Backup codes habilitados.
6. Founder user real creado.
7. Metadata founder/admin aplicada si el producto la requiere.

## E2E requerido para cerrar PASS

1. Abrir `/v` sin sesion en incognito.
2. Confirmar redireccion a `/sign-in`.
3. Entrar con correo founder real via Clerk.
4. Confirmar magic link/email code.
5. Llegar a `/v`.
6. Refrescar `/v` y mantener sesion.
7. Cerrar sesion.
8. Confirmar que `/v` vuelve a redirigir a `/sign-in`.

## Criterio binario

Esta fase sigue abierta hasta que:

- Type-check pase despues del cambio. PASS: `npm run type-check` en `frontend`.
- Build pase despues del cambio. PASS: `npm run build` en `frontend`.
- Suite corta backend auth pase despues del cambio. PASS: `PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py -q` con `6 passed`.
- Founder complete E2E real.
- Se documenten resultados con fecha y entorno.

## Evidencia de comandos

| Comando | Resultado | Fecha |
|---|---:|---|
| `npm run type-check` en `frontend` | PASS | 2026-05-31 |
| `npm run build` en `frontend` | PASS | 2026-05-31 |
| `PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py -q` | PASS, `6 passed` | 2026-05-31 |
| `git diff --check -- frontend/middleware.ts frontend/src/app/login/page.tsx docs/execution/EMERGENCY_AUTH_RECOVERY_STATUS.md docs/execution/SPRINT_POST_AUTH_STATUS.md` | PASS | 2026-05-31 |

Nota operativa:
Un primer `npm run build` fallo por artefacto generado en `.next/static/chunks 2` con `ENOTEMPTY`. Se limpio el contenido generado de `.next` y el build posterior paso. No fue un error de TypeScript ni de rutas.

## Siguiente accion unica

Ejecutar prueba founder real en navegador/incognito contra el entorno que se vaya a usar para UAT. Sin esa prueba, el cierre permanece `FAIL/PARTIAL`.
