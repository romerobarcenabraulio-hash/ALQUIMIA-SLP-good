# Operaciones de release — ALQUIMIA (demo institucional, mayo 2026)

Este documento concentra despliegue, variables de entorno, verificación (`/health`, `/health/deep`), rollback y troubleshooting para:

- Backend FastAPI (`api.alquimiaplatform.com` u hospedaje actual equivalente).
- Frontend Next.js en Vercel (`alquimiaplatform.com`).

Referencias de alcance funcionales según backlog: `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/24_release_gate_e2e_observabilidad.md`.

---

## 1. Variables de entorno (R1)

### Backend

| Variable | Alcance esperado |
|----------|------------------|
| `APP_ENV` | Producción legible en `/health`: `production` (`prod` también se normaliza a `production`). |
| `ENVIRONMENT` | Alternativa si no existe `APP_ENV`. |
| `APP_VERSION` | Opcional; si falta el API usa la versión embebida del servicio FastAPI (`1.0.0`). |
| `NEXT_PUBLIC_*` | No aplican al backend (omitir). |
| `ANTHROPIC_API_KEY` | Obligatorio para **`agora_pipeline` = ok** en `/health/deep` cuando `APP_ENV=production`. |
| `HEALTH_DEEP_RELAX_AGORA=1` | Solo staging / laboratorio sin clave Claude: marca `agora_pipeline` como ok sin validar llave (**no usar en demo productiva honesta**). |
| `ALQUIMIA_HIDE_GDL=1` | Si Guadalajara está oculta en la UI; el check legal de **GDL** en `/health/deep` devuelve `skip`. |
| `SENTRY_DSN` | Opcional (R4). Si está definido, se carga `sentry-sdk`; `traces_sample_rate` por defecto `0.1` vía `SENTRY_TRACES_SAMPLE_RATE`. Release: `SENTRY_RELEASE` o `RENDER_GIT_COMMIT` o `GIT_COMMIT`. |

### Vercel (Production)

| Variable | Notas |
|----------|-------|
| `NEXT_PUBLIC_APP_ENV` | `production` en ambiente Production. |
| `NEXT_PUBLIC_API_URL` | Debe resolver al API público, p. ej. `https://api.alquimiaplatform.com` (sin barra final). **No** `localhost` ni URL de preview salvo propósito explícito de esa preview. |

Verificación rápida en el navegador o en build: el cliente usa `getApiUrl()` en `frontend/src/lib/api.ts`.

---

## 2. Comprobaciones de aceptación (curl)

Sustituye el host si el despliegue usa otro FQDN.

```bash
curl -sS https://api.alquimiaplatform.com/health | jq .
# Esperado: status ok, environment production, version acorde a APP_VERSION o default.

curl -sS -o /dev/null -w "%{http_code}\n" https://api.alquimiaplatform.com/health/deep
# Esperado: 200 si todos los checks pasan; 503 si alguno falla.

curl -sS https://api.alquimiaplatform.com/health/deep | jq .
# Revisar checks.legal_paquete_zms: GDL puede ser "skip" si ALQUIMIA_HIDE_GDL=1.
```

Cabecera de correlación (debe volver igual en la respuesta y aparecer en logs JSON del backend):

```bash
curl -sS -D - -o /dev/null -H "X-Request-ID: demo-smoke-1" \
  https://api.alquimiaplatform.com/city/options | head
```

Frontend + SEO de privacidad:

```bash
curl -sS https://alquimiaplatform.com/robots.txt
# Esperado: User-agent: * y Disallow: /

curl -sS -I https://alquimiaplatform.com/ | grep -i x-robots-tag
# Esperado: noindex, nofollow durante fase demo.
```

---

## 3. Observabilidad (R2, R3, R4)

### `/health/deep`

- **`city_repository`**: opciones ZM cargadas desde el repositorio de ciudades.
- **`legal_paquete_zms`**: `build_paquete_metropolitano` por cada ZM (SLP, MTY, QRO, GDL) con número de municipios coincide con datos sembrados.
- **`agora_pipeline`**: configuración de `ANTHROPIC_API_KEY` (sin invocar el modelo).

Código de estado: **200** si todas las ramas vigentes están `ok` o `skip` (solo skip permitido donde aplique); **503** en caso contrario.

### Middleware de solicitud

- Todas las respuestas llevan **`X-Request-ID`** (reutiliza cabecera entrante si el cliente ya la envía; si no, genera UUID).
- Log **`alquimia.access`** en JSON por línea: `ts`, `request_id`, `method`, `path`, `status`, `duration_ms`, `user_agent_hash` (SHA-256 truncado; **sin IP ni emails**).
- Rutas triviales **`GET /health`** y **`GET /health/deep`** se omiten en el access log para no ensuciar series temporales.

### Sentry backend

Opcional si existe presupuesto. Tras crear proyecto y DSN:

1. Backend: establecer `SENTRY_DSN`, `SENTRY_RELEASE=<commit SHA>`.
2. Ajustar tasas si hace falta: `SENTRY_TRACES_SAMPLE_RATE` (documentación interna coincide con ejemplo 0.1).

### Sentry frontend (opcional)

No está cableado de forma obligatoria en este repositorio. Si se adopta `@sentry/nextjs`, usar `tracesSampleRate` bajo en producción (p. ej. 0.05), `environment` desde `NEXT_PUBLIC_APP_ENV`, y `release` con el SHA de build (`VERCEL_GIT_COMMIT_SHA`).

---

## 4. Frontend: correlación X-Request-ID

Las llamadas autogeneradas desde `backendFetch` en `frontend/src/lib/api.ts` adjuntan `X-Request-ID`. Componentes punta que llaman al API directamente deben usar `backendFetch` o `withRequestId` (`frontend/src/lib/requestId.ts`).

Las conexiones **EventSource** (streaming de generación de plan) no permiten cabeceras personalizadas en todos los navegadores; ese flujo puede carecer del id en logs del stream (mitigación: correlacionar por `job_id`).

---

## 5. Backups y rollback (R5)

### Inventario antes del demo

1. **Legal / manifests**: snapshots en repo o carpeta conocida (`backend/data/`, `frontend/src/data/reglamentos.ts`, manifests de paquetes si existen fuera del repo documentar rutas en tabla de infra).
2. **Base de datos**: si Postgres está activo (`DATABASE_URL` en `.env`/host), dump lógico:

```bash
# Ejemplo genérico (ajustar host, usuario, base).
pg_dump "$DATABASE_URL" -Fc -f backup_pre_demo_$(date +%Y%m%d).dump
```

3. Registrar **SHA de git** del backend y del frontend desplegados en checklist del demo.

### Rollback Backend (orden sugerido)

En el mismo host donde corre el proceso gunicorn/uvicorn/Render/etc.:

```bash
# 1. Detener el servicio según supervisor (systemd / Render dashboard / proceso manual).

# 2. Cambiar código al commits seguro conocido:
git fetch origin && git checkout <sha_o_tag_stable>

# 3. Reiniciar dependencias si el lock cambió entre versiones:
pip install -r requirements.txt   # dentro del virtualenv correspondiente

# 4. Levantar de nuevo uvicorn equivalente.

# 5. Smoke test:
curl -sS localhost:PORT/health | jq .
curl -sS -o /dev/null -w "%{http_code}\n" localhost:PORT/health/deep
```

Si el problema es migración incompatible de BD, restaurar archivo `pg_restore` antes de restart (procedimiento de contingencia debe acordarse con quien opera la BD).

### Rollback Frontend (Vercel)

1. Proyecto Vercel → **Deployments**.
2. Seleccionar el deployment estable previo → **Promote to Production**.
3. Verificar `/robots.txt` y cabecera `X-Robots-Tag` igual que esperado tras el promote.

### Prueba en staging antes del demo

Repetir el bloque curl de `/health/deep`, flujo corto del simulador (login → baseline), un `POST` crítico y **ejecutar un rollback puntual en staging anotando tiempos reales**.

---

## 6. Troubleshooting

| Síntoma | Qué revisar |
|---------|--------------|
| `/health/environment` ≠ `production` | `APP_ENV` / `ENVIRONMENT` en el host backend. |
| `/health/deep` → 503, `agora_pipeline` falla | `ANTHROPIC_API_KEY`; en QA sin clave sólo usar `HEALTH_DEEP_RELAX_AGORA` de forma temporal. |
| `/health/deep` → 503, legal ZM | Semilla legal o `ZM_MUNICIPIOS`; revisar traceback en logs aplicación (`uvicorn` stderr). |
| Frontend llama `localhost` en producción | `NEXT_PUBLIC_API_URL` ausente en el build Production de Vercel (re-deploy tras fijar). |
| Logs sin `request_id` | Cliente debe enviar/recibir `X-Request-ID`; comprobar que no hay proxy eliminando cabeceras personalizadas. |
| Doble problema CORS tras cambio dominio | `ALLOWED_ORIGINS` + lista base en `main.py`. |

---

## 7. Checklist previo al demo institucional

- [ ] `APP_ENV=production` en backend; `curl /health` coherente.
- [ ] `NEXT_PUBLIC_APP_ENV=production`, `NEXT_PUBLIC_API_URL=https://api.alquimiaplatform.com` (o URL final) en Vercel Production.
- [ ] `/health/deep` **200**.
- [ ] Backup BD + punto de código documentado (`git rev-parse HEAD` en cada repo).
- [ ] Rollback simulado en staging con tiempos anotados.
- [ ] `robots.txt` y **X-Robots-Tag** verificados.
- [ ] (Opcional) Sentry DSN y release etiquetadas con SHA.

---

*Última actualización: mayo 2026 · Release Engineer / observabilidad mínima para demo institucional.*
