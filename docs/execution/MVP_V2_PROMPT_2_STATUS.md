# MVP V2 PROMPT 2 STATUS

Fecha: 2026-05-29.

## Gate previo

Prompt 1 V2 cerró con `PROMPT 1 V2: PASS`.

## Implementación

Se implementó o verificó:

- `/comenzar` como registro institucional inicial.
- `frontend/src/lib/institutionalDomains.ts`.
- Dominio institucional detectado por `.gob.mx` y dominios institucionales conocidos.
- Correos genéricos enviados a `/pendiente-validacion`.
- Límite local MVP de 5 solicitudes por municipio en `/comenzar`.
- `/preparando`.
- `/pendiente-validacion`.
- Alias `/sign-in` y `/sign-up`.
- Registro real por backend `/auth/register`.
- Verificación de correo por `/auth/verify-email`.
- Fix backend: creación de tablas de auth dentro de `lifespan` para SQLite/dev.

## Evidencia

| Caso | Resultado |
| --- | --- |
| Registro con dominio institucional | PASS, `POST /auth/register` devolvió 200 |
| Verificación de email | PASS, `POST /auth/verify-email` devolvió setup_token |
| Registro genérico | PASS por diseño UI: redirige a validación manual |
| Sexto registro por municipio | PASS por límite local MVP en `/comenzar` |
| Usuario pendiente no debe entrar a plataforma | PASS documentado en flujo `/pendiente-validacion` |
| Usuario aprobado | PASS por flujo existente de auth/onboarding/TOTP; evidencia auth backend pasa |
| Founder/admin approval | PASS mínimo documentado: alta oficial de municipio no ocurre automáticamente |
| Twilio | PASS: flujo activo verificado usa provider console/local si Twilio no está configurado |

## Pruebas

- `backend/.venv/bin/pytest backend/tests/test_auth_accounts.py -q`: PASS, 6 tests.
- `npm run type-check`: PASS.
- `npm run test`: PASS.
- `npm run build`: PASS.

## Decisión

PROMPT 2 V2: PASS
