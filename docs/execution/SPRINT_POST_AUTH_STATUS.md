# SPRINT POST AUTH STATUS · 2026-05-31

**Fuente:** `SPRINT_POST_AUTH.md`
**Decision actual:** `SPRINT_POST_AUTH: BLOCKED AT BLOCK 0`

---

## Bloque 0 · Verificacion P0 de acceso founder

| Criterio | Estado | Evidencia |
|---|---|---|
| `/sign-in` existe y renderiza auth | PASS por codigo | `frontend/src/app/sign-in/page.tsx` usa `SignIn` de Clerk con redirect a `/v`. |
| `/login` no mantiene flujo custom paralelo | PASS por codigo | `frontend/src/app/login/page.tsx` redirige a `/sign-in`, preservando `next` como `redirect_url`. |
| Middleware protege `/v`, `/p`, `/e`, `/admin` | PASS por codigo | `frontend/middleware.ts` protege rutas con `auth.protect()`. Cookies legacy solo pueden bypass si `ALLOW_LEGACY_AUTH_BYPASS=1`. |
| Twilio/SMS no forma parte activa del login/register | PASS/PARTIAL | Endpoints `/sms/send` y `/sms/verify` devuelven 410; frontend `authSmsSend`/`authSmsVerify` lanzan error local. Persisten modelos/servicios legacy SMS no ejecutados en flujo principal. |
| Founder entra a entorno real | BLOCKED | No verificable desde este entorno; requiere prueba founder en browser con cuenta real y Clerk dashboard. |
| Founder llega a `/v` | BLOCKED | No verificable sin sesion real. |
| Founder navega al menos M00/M00B | BLOCKED | No verificable sin sesion real. |
| No depende de `demo@alquimiaplatform.com` inexistente | PARTIAL | El codigo soporta Clerk SignIn, pero `EMERGENCY_AUTH_RECOVERY_STATUS.md` declara que `demo@alquimiaplatform.com` no existe y requiere correo personal real temporal. |
| Env local presente | PASS por presencia | `.env.local` y `frontend/.env.local` existen; secretos no inspeccionados ni impresos. |

## Evidencia de comandos

| Comando | Resultado | Nota |
|---|---|---|
| `npm run type-check` en `frontend` | PASS | `tsc --noEmit` termino sin errores. |
| `npm run build` en `frontend` | PASS | Build productivo paso despues de limpiar artefacto generado `.next`. |
| `PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests/test_auth_accounts.py -q` | PASS | 6 pruebas pasaron. |
| `rg "twilio|TWILIO|sms|SMS|phoneNumber|phone_number|verifyPhone|sendOtp" backend frontend/src frontend/middleware.ts` | PASS/PARTIAL | Residuo legacy existe; flujo activo de login/register esta desactivado para SMS. |
| `rg "alquimia_session|alquimia_access"` | PASS/PARTIAL | Las cookies legacy existen en rutas auxiliares, pero el middleware ya no las acepta por default. Solo bypass explicito con `ALLOW_LEGACY_AUTH_BYPASS=1`. |

## Hallazgos importantes

1. `/sign-in` ya usa Clerk `SignIn`, no el formulario Twilio.
2. El middleware es Clerk-only por default; las cookies legacy solo abren rutas si `ALLOW_LEGACY_AUTH_BYPASS=1`.
3. Los servicios/modelos SMS siguen en backend como legacy, aunque endpoints activos devuelven 410.
4. El bloqueo real es externo: probar cuenta founder real, Clerk dashboard y acceso a `/v`.
5. Bloque 1 quedo preparado por codigo, pero no se cierra como PASS porque depende de que el founder entre a `/v`.

## Decision Bloque 0

`POST_AUTH_BLOCK_0: FAIL`

Motivo: no hay evidencia end-to-end de founder entrando a entorno real y navegando `/v`. El codigo pasa verificaciones acotadas, pero el criterio del bloque exige acceso real.

---

## Estado de bloques restantes

| Bloque | Estado | Motivo |
|---|---|---|
| Bloque 1 · Switcher admin/cliente | PREPARED/PARTIAL | `FounderViewModeSwitcher` existe en plataforma. Solo se muestra con metadata Clerk founder/admin. Cambia `admin/client`, persiste en localStorage y oculta export ZIP/bloque interno en vista cliente. Falta verificacion founder real en navegador. |
| Bloque 2 · Municipio Demo vacio | PREPARED/PARTIAL | `municipio-demo` existe como sandbox vacio con mismo indice documental, cero cifras y banner. Falta verificacion founder real en navegador. |
| Bloque 3 · M03B justificacion tecnica | PREPARED/PARTIAL | M03B muestra justificacion tecnica preliminar en plataforma y diferencia reglamento vigente, documento pendiente, propuesta y revision humana. Falta verificacion founder real en navegador. |
| Bloque 4 · Revision visual modulos pilar | NOT STARTED | Bloque 0 no cerrado. |
| Bloque 5 · Inventario diagramas | NOT STARTED | Bloque 0 no cerrado. |
| Bloque 6 · Smoke test final | NOT STARTED | Depende de bloques 0-5. |

## Proxima accion unica

Founder debe probar acceso real:

1. Abrir `/sign-in` en navegador incognito.
2. Entrar con correo real configurado en Clerk.
3. Confirmar magic link/code.
4. Llegar a `/v`.
5. Navegar M00/M00B o equivalente.
6. Confirmar si `ALLOW_LEGACY_AUTH_BYPASS=1` debe permanecer ausente, como default recomendado, o activarse temporalmente con fecha de retiro.

Hasta que eso pase, no ejecutar Bloque 1.

## Bloque 1 · Evidencia preparada por codigo

| Criterio | Estado | Evidencia |
|---|---:|---|
| Founder ve switcher | PARTIAL | `frontend/src/components/platform/FounderViewModeSwitcher.tsx` renderiza solo si Clerk `publicMetadata.role` es `founder`/`admin` o `has_admin_access=true`. Falta browser founder. |
| Usuario no-founder no ve switcher | PASS por codigo | El componente retorna `null` si metadata no autoriza. |
| Founder puede cambiar a vista cliente | PARTIAL | El control alterna `admin/client`, guarda `alquimia.viewMode` y dispara evento local. Falta browser founder. |
| No se exponen acciones admin en vista cliente | PARTIAL | `frontend/src/components/platform/PlatformPage.tsx` oculta `Exportar ZIP preliminar` y el bloque de siguiente paso humano cuando `viewMode === 'client'`. Falta revision visual. |
| No se rompe `/v` | PASS por build | `npm run type-check` y `npm run build` pasaron despues del cambio. |

Decision Bloque 1:
`POST_AUTH_BLOCK_1: PREPARED/PARTIAL`

Motivo:
El codigo esta preparado, pero el criterio binario del sprint exige founder real en navegador. No declarar PASS hasta ejecutar E2E.

## Bloque 2 · Evidencia preparada por codigo

| Criterio | Estado | Evidencia |
|---|---:|---|
| Founder puede seleccionar Municipio Demo | PARTIAL | `FounderViewModeSwitcher` agrega link `Municipio Demo` a `?tenant_id=municipio-demo`, visible solo para founder/admin por metadata Clerk. Falta browser founder. |
| Municipio Demo no contiene datos ficticios | PASS por test | `getTenantArchiveData('municipio-demo')` devuelve metrics con `value === null` y `status === 'brecha_critica'`. |
| Modulos muestran estructura vacia con documentos requeridos | PASS por codigo/test | `municipio-demo` usa el mismo `STANDARD_CITY_DOCUMENT_INDEX` y genera brechas documentales para los documentos base. |
| No hay SLP hardcodeado en esa experiencia | PASS por codigo | El tenant muestra `Municipio Demo` y `Estado Demo · INEGI DEMO-001`. |
| Banner sandbox visible | PASS por codigo | `PlatformPage` muestra: `Sandbox founder · estructura vacia para demostrar navegacion. No contiene datos reales ni estimados.` cuando `tenant_id=municipio-demo`. |
| No se rompe `/v` | PASS por build | `npm run type-check`, `npm run build` y tests focalizados pasaron despues del cambio. |

Evidencia de comandos:

| Comando | Resultado | Nota |
|---|---:|---|
| `npm run test -- --run src/lib/documentArchiveStore.test.ts src/lib/citations.test.ts` | PASS | 2 archivos, 8 tests. |
| `npm run type-check` en `frontend` | PASS | `tsc --noEmit` sin errores. |
| `npm run build` en `frontend` | PASS | Build productivo completo. |

Decision Bloque 2:
`POST_AUTH_BLOCK_2: PREPARED/PARTIAL`

Motivo:
El tenant sandbox existe y no inventa cifras, pero el cierre binario del sprint exige navegacion founder real. No declarar PASS hasta ejecutar E2E en `/v?tenant_id=municipio-demo`.

## Bloque 3 · Evidencia preparada por codigo

| Criterio | Estado | Evidencia |
|---|---:|---|
| M03B contiene justificacion tecnica | PASS por test | `PillarModulePanel` renderiza `Justificación técnica preliminar` para `marco_legal`. |
| Si falta reglamento, se muestra brecha | PASS por codigo/test | `municipio-demo` y tenants con `reglamento_limpia` pendiente muestran brecha documental; el panel indica documento pendiente. |
| La propuesta es preliminar | PASS por codigo/test | Copy visible: cualquier texto reglamentario es borrador; no acto de autoridad, dictamen ni aprobacion. |
| No hay nombres internos de agentes cliente-facing | PASS por codigo focalizado | El panel usa "la plataforma" y "revision humana", no nombres internos. |
| Municipio Demo no renderiza contenido legal estatico | PASS por codigo | `PlatformPage` usa `SandboxModulePlaceholder` cuando `tenant_id=municipio-demo`; no renderiza graficas, diagnosticos ni textos normativos precargados. |
| No se rompe `/v` | PASS por build | Tests focalizados, type-check y build pasaron despues del cambio. |

Evidencia de comandos:

| Comando | Resultado | Nota |
|---|---:|---|
| `npm run test -- --run src/components/platform/PillarModulePanel.test.tsx src/lib/documentArchiveStore.test.ts` | PASS | 2 archivos, 10 tests. |
| `npm run type-check` en `frontend` | PASS | `tsc --noEmit` sin errores. |
| `npm run build` en `frontend` | PASS | Build productivo completo. |

Decision Bloque 3:
`POST_AUTH_BLOCK_3: PREPARED/PARTIAL`

Motivo:
La restitucion funcional esta preparada por codigo, pero no se declara PASS hasta revisar M03B en navegador con sesion founder real y confirmar que la vista cliente no expone acciones internas.
