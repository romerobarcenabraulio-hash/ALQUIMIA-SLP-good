# Emergency Auth · Founder Account

Fecha: 2026-05-31

| Requisito | Estado | Evidencia | Bloqueo |
| --- | --- | --- | --- |
| Usuario `demo@alquimiaplatform.com` existe en Clerk | DO NOT USE | Founder confirmó que el correo no existe y no puede recibir magic link | Sí |
| Usuario temporal con correo personal | PENDING USER | Requiere correo personal real para recibir verificación | Sí |
| Metadata pública founder configurada | NOT VERIFIED | Requiere acceso a Clerk dashboard | Sí |
| Password no usado en Clerk | NOT VERIFIED | Requiere acceso a Clerk dashboard | Sí |

## Resultado

No se debe depender de `demo@alquimiaplatform.com`. Para la recuperación inmediata se debe crear un usuario con correo personal real usando el flujo custom email/password; Clerk queda pendiente hasta que npm/red y dashboard estén disponibles.
