# MVP FUNCTIONAL AUDIT

Fecha: 2026-05-29.

Decisión funcional: PARTIAL. El flujo de cuenta real funciona contra backend local de auditoría, demo/login funcionan y las rutas principales renderizan. La experiencia `/v`, `/p`, `/e` queda protegida sin tenant activo, lo cual es correcto para acceso por etapa pero no demuestra todavía un tenant cliente completo desde navegador.

## Auditoría

| Ruta / flujo | Acción probada | Resultado esperado | Resultado real | Estado | Evidencia | Corrección aplicada | Bloqueo residual |
|---|---|---|---|---|---|---|---|
| `/` | Cargar home pública | Landing sobria, sin claims absolutos ni nombres internos de agentes | Renderiza correctamente; se corrigió “Datos reales del municipio” a “Datos validados o inferidos con fuente” | PASS | `docs/execution/mvp_screenshots/desktop1440-home.png` | `frontend/src/app/page.tsx` | Ninguno crítico detectado |
| `/sign-in` | Cargar alias de login | Debe existir ruta esperada por usuario | Antes no existía; ahora renderiza login | PASS | `docs/execution/mvp_screenshots/desktop1440-sign-in.png` | `frontend/src/app/sign-in/page.tsx` | Ninguno |
| `/sign-up` | Cargar alias de registro | Debe existir ruta esperada por usuario | Antes no existía; ahora renderiza registro | PASS | `docs/execution/mvp_screenshots/desktop1440-sign-up.png` | `frontend/src/app/sign-up/page.tsx` | Ninguno |
| Crear cuenta real | Registro + correo + perfil + SMS + TOTP + login TOTP | Cuenta real debe poder crearse e iniciar sesión | Smoke local completo: `registerStatus=200`, `verifyStatus=200`, `smsVerifyStatus=200`, `totpActivateStatus=200`, `loginTotpStatus=200`, sesión emitida | PASS | Comando smoke Python contra `http://127.0.0.1:8001` | SQLite auth fix, link local de email, SMS dev code local | La prueba fue por API local; la automatización de llenado en navegador falló por limitación de clipboard del harness, no por endpoint |
| Crear tenant/municipio oficial | Registro de usuario nuevo | No debe crear municipio oficial sin founder/admin gate | El smoke no creó tenant oficial; onboarding empresarial queda sin municipio | PASS | Respuesta smoke: `tenantCreation=founder/admin-controlled` | Texto explícito en registro | Falta demo completa de alta admin de tenant real |
| Login demo | Login `demo@alquimia.mx` | Debe entrar a experiencia demo | Navegó a `/simulator` | PASS | `docs/execution/mvp_screenshots/desktop1440-simulator.png` | Ninguna | Ninguno |
| `/v` | Abrir ruta validación | Debe cargar o bloquear según tenant/stage | Renderiza shell y bloquea sin tenant/admin | PARTIAL | `docs/execution/mvp_screenshots/desktop1440-v.png` | Ninguna | No hay evidencia de tenant cliente validación completo |
| `/p` | Abrir ruta planeación | Debe cargar o bloquear según tenant/stage | Renderiza shell y bloquea sin tenant/admin | PARTIAL | `docs/execution/mvp_screenshots/desktop1440-p.png` | Ninguna | No hay evidencia de tenant cliente planeación completo |
| `/e` | Abrir ruta ejecución | Debe cargar o bloquear según tenant/stage | Renderiza shell y bloquea sin tenant/admin | PARTIAL | `docs/execution/mvp_screenshots/desktop1440-e.png` | Ninguna | No hay evidencia de tenant cliente ejecución completo |
| `/admin` | Abrir backoffice | Puede exponer nombres internos solo como superficie interna | Renderiza backoffice interno | PASS | `docs/execution/mvp_screenshots/desktop1440-admin.png` | Ninguna | Debe seguir fuera de cliente-facing |

## Evidencia de cuenta real

Comando ejecutado contra backend local `8001`:

- Registro, verificación email, perfil, SMS console, TOTP setup, TOTP activation, login, login TOTP.
- Resultado relevante: `loginTotpStatus=200` y `sessionIssuedAfterTotp=true`.

## Decisión

El flujo de cuenta real queda funcional. El MVP funcional completo queda PARTIAL porque falta probar un tenant cliente real navegando `/v`, `/p`, `/e` con datos y stage válidos.
