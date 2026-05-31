# Emergency Auth · Env Check

Fecha: 2026-05-31

| Variable | Estado | Evidencia |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | PASS | Presente en `frontend/.env.local`; valor no impreso |
| `CLERK_SECRET_KEY` | PASS | Presente en `frontend/.env.local`; valor no impreso |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` | NOT REQUIRED | El flujo activo sigue usando login custom; Clerk SDK queda instalado para integración posterior |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in` | NOT REQUIRED | El flujo activo sigue usando login custom; Clerk SDK queda instalado para integración posterior |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/v` | CODED | Login custom redirige a `/v` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/v` | CODED | Onboarding activa acceso y redirige a `/v` |

## Resultado

Env local de Clerk verificado sin imprimir secretos. Vercel/Render env externos no se inspeccionaron desde este entorno.
