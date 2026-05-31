# Emergency Auth · Twilio Cleanup

Fecha: 2026-05-31

## Matches revisados

| Área | Acción aplicada | Estado |
| --- | --- | --- |
| `backend/app/routers/auth.py` | SMS send/verify devuelven `410`; TOTP queda fuera del flujo activo; login con cuentas antiguas desactiva segundo factor heredado | PASS |
| `frontend/src/lib/authApi.ts` | `authSmsSend` y `authSmsVerify` ya no llaman backend; devuelven error local controlado | PASS |
| `frontend/src/app/onboarding/perfil/page.tsx` | Después de perfil entra a `/v` si no requiere PDF; si requiere PDF, sigue a reglamento | PASS |
| `frontend/src/app/onboarding/sms/page.tsx` | Ruta legacy informa que teléfono fue desactivado y redirige a activación temporal | PASS |
| `frontend/src/app/onboarding/reglamento/page.tsx` | Link de retorno ya no apunta a SMS | PASS |
| `frontend/middleware.ts` | Protege `/v`, `/p`, `/e`, `/admin` y redirige a `/sign-in` | PASS |

## Residuo permitido

- `backend/app/auth/sms_service.py`, migración y modelos SMS quedan como legacy inactivo, no flujo activo.
- Endpoints `/auth/sms/*` quedan vivos solo para responder `410`, sin enviar mensajes.
- Endpoints `/auth/totp/*` quedan vivos como legacy controlado; no participan en el alta actual.

## Resultado

TWILIO CLEANUP: PASS
