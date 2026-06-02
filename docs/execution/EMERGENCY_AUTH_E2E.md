# Emergency Auth · E2E

Fecha: 2026-05-31

| Paso | Estado | Observación |
| --- | --- | --- |
| Abrir `/sign-in` | BLOCKED LOCAL | Dev server no puede bindear puerto en sandbox: `listen EPERM`; build confirma ruta estática |
| Ingresar `demo@alquimiaplatform.com` | NOT APPLICABLE | El correo no existe; no debe usarse para magic link |
| Crear usuario con correo personal | READY TO TEST | Requiere correo real y backend/env de correo activo en Render |
| Recibir verificación por correo | BLOCKED LOCAL | Depende de correo real y env Render; no se imprimieron secretos |
| Completar login custom | READY TO TEST | TOTP/SMS ya no bloquean el flujo |
| Redirigir a `/v` | READY TO TEST | Login custom redirige a `/v` |
| Ver plataforma | BLOCKED LOCAL | Dev server local bloqueado por `listen EPERM`; probar contra deploy o entorno local fuera del sandbox |

## Resultado

E2E local queda bloqueado por restricción de puerto del sandbox, no por build. El camino funcional preparado es usuario personal por email/password, verificación por correo y acceso sin SMS/TOTP.
