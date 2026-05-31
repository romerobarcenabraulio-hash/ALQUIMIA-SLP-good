# MVP V2 Final Smoke Test

Fecha: 2026-05-31

Servidor verificado:

- Frontend: `http://127.0.0.1:3000` con `next start`.
- Backend: `http://127.0.0.1:8000` con `uvicorn app.main:app`.

| Ruta / flujo | Acción probada | Resultado esperado | Resultado real | Estado |
| --- | --- | --- | --- | --- |
| `/` | Cargar landing | Landing institucional sin demo público ni nombres internos | Carga, CTAs visibles, sin nombres internos | PASS |
| `/metodologia` | Cargar metodología | Fuente/fecha/método/confianza; brecha crítica | Carga y explica límites | PASS |
| `/comenzar` institucional | Registro `@slp.gob.mx` | Cuenta creada y redirección a `/preparando` | PASS; redirige a `/preparando` | PASS |
| `/comenzar` genérico | Registro Gmail | Cuenta creada pendiente de validación | PASS; redirige a `/pendiente-validacion` | PASS |
| Límite municipio | Sexto registro mismo municipio | Bloqueo por límite inicial | Mensaje de límite visible | PASS |
| Auth API completo | Register, verify email, profile, SMS dev, TOTP, login | 200 en cada paso y login con TOTP | Todos 200; login requiere TOTP y TOTP pasa | PASS |
| `/sign-in` | Cargar login | Sin demo público | Sin "demo" ni "demostración" visible | PASS |
| `/v?tenant=partial-city` | Cargar diagnóstico | Municipio correcto, confidence, brechas, ZIP CTA | Carga con datos parciales y sin `SLP` heredado | PASS |
| `/p?tenant=partial-city` | Cargar journey planeación | Ruta funcional | Carga contenido plataforma | PASS |
| `/e?tenant=gap-city` | Cargar journey ejecución | Ruta funcional con brechas | Carga contenido plataforma | PASS |
| `/simulator` | Usuario no autenticado | No demo público; redirección segura | Redirige a login con next | PASS |
| ARCHIVO upload | PDF válido | Documento recibido y pendiente validación | HTTP 200; status `received` | PASS |
| ARCHIVO MIME | TXT inválido | Rechazo explícito | HTTP 400 | PASS |
| ARCHIVO no aplica | Gap crítico | Marcar no aplicable sin borrar trazabilidad | HTTP 200; status `not_applicable` | PASS |
| ARCHIVO cross-tenant | Header tenant distinto | Bloqueo | HTTP 403 | PASS |
| ZIP | Tres perfiles | 9 archivos por ciudad, índice común | `complete-city`, `partial-city`, `gap-city`: 9 archivos | PASS |
| Límite ZIP | Cuarta exportación preliminar | HTTP 429 | 1-3: 200, 4: 429 | PASS |

## Evidencia visual

- `docs/execution/mvp-v2-rc-landing-desktop.png`
- `docs/execution/mvp-v2-rc-v-desktop.png`
- `docs/execution/mvp-v2-rc-v-mobile.png`

## Decisión

Smoke final: PASS
