# Emergency Auth · Sign-In QA

Fecha: 2026-05-31

| Criterio | Estado | Evidencia | Bloqueo |
| --- | --- | --- | --- |
| `/sign-in` existe | PASS | `frontend/src/app/sign-in/page.tsx` exporta login actual | No |
| Clerk SDK disponible | PASS | `@clerk/nextjs@7.4.2` instalado; el flujo activo sigue siendo custom para evitar bloqueo por correo inexistente | No |
| No hay referencia visual a Twilio/TOTP | PASS | Login visible usa correo y contraseña; alta usa activación por correo | No |
| Redirección post-login segura | PASS | Login custom redirige a `/v` | No |
| Usuario temporal con correo personal | READY TO TEST | El flujo custom acepta email/password; requiere correo real para recibir verificación si Resend está activo | Sí, correo real |

## Resultado

Sign-in custom queda operativo a nivel de código y Clerk SDK queda instalado para integración posterior. No usar `demo@alquimiaplatform.com` porque no recibe correo.
