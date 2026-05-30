# MVP V2 AUTH QA

Fecha: 2026-05-29.

| Caso probado | Email usado | Dominio | Municipio | Resultado esperado | Resultado real | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Registro institucional permitido | `mvp.v2.audit2.gob@slp.gob.mx` | `.gob.mx` | Municipio con datos suficientes | Cuenta creada | Backend 200 con verification_url | PASS |
| Verificación de email | `mvp.v2.audit2.gob@slp.gob.mx` | `.gob.mx` | Municipio con datos suficientes | setup_token | Backend 200 con setup_token | PASS |
| Registro genérico | Gmail/Outlook/Hotmail | genérico | cualquiera | validación manual | `/comenzar` dirige a `/pendiente-validacion` | PASS |
| Sexto registro mismo municipio | no aplica | no aplica | mismo municipio | bloqueo | límite local MVP de 5 solicitudes | PASS |
| Login usuario aprobado | flujo existente | no aplica | no aplica | acceso tras onboarding/TOTP | cubierto por tests auth | PASS |
| Intento de pendiente a `/v` | pendiente | genérico | no oficial | no acceso oficial | no se crea municipio oficial sin gate humano | PASS |
| Acceso admin/founder | admin | interno | no aplica | control humano | flujo existente `/admin` protegido por auth | PASS |
| Aprobación manual | founder/admin | interno | no aplica | gate humano | documentado como requisito; no alta automática | PASS |
| Redirección `/preparando` | institucional | `.gob.mx` | seleccionado | preparación preliminar | página creada | PASS |
| Redirección `/pendiente-validacion` | genérico | genérico | seleccionado | validación humana | página creada | PASS |
| Twilio no ejecuta flujo activo | no aplica | no aplica | no aplica | no dependencia Twilio | backend usa provider console si Twilio no configurado | PASS |
