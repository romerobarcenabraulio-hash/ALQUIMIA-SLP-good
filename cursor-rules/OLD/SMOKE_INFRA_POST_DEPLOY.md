# Smoke infra — verificación técnica post-deploy (24)

**Rol:** Ejecutor. **Entrada:** `BASE_URL` absoluta entregada por CSA (sin barra final). **Salida:** tabla `endpoint | esperado | observado` archivada en el hilo de release.

## Middleware y ruta estable PR3

- Las rutas bajo **`/data/**`** no entran en el gate de `middleware.ts` (`matcher` excluye `data/`).
- **`GET /data/social-stats/slices-<buildId>.json`** lo sirve además **`src/app/data/social-stats/[filename]/route.ts`** (mismo cuerpo que `SOCIAL_STATS_BUNDLE_EMBEDDED`), por si el archivo en `public/` no llega al despliegue.

Sustituir solo el valor de `BASE_URL` una vez:

```bash
export BASE_URL='https://EJEMPLO.despliegue.example'  # sin /
```

### 1) Simulador — método permitido HEAD (si el host lo rechaza, usar GET -I)

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -I --max-time 25 "$BASE_URL/simulator"
```

**Esperado:** `200`, o `301`/`302`/`307`/`308` hacia la misma ruta con destino `200` (seguir redirects: añadir `-L` solo si el CSA lo pide).

Alternativa explícita GET ligero:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 25 "$BASE_URL/simulator"
```

### 2) robots.txt (opcional — no 5xx)

```bash
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 15 "$BASE_URL/robots.txt"
```

**Esperado:** `200` con body texto, o `404` si el proyecto no publica el archivo; **no** `500`.

### 3) Dataset sociodemográfico estático (alineado a `SOCIAL_STATS_BUILD_ID` en código)

Build id vigente en repo: ver `frontend/src/data/socialStats/embeddedBundle.ts` → `SOCIAL_STATS_BUILD_ID` (ej. `20260507a`).

```bash
export SLICE_JSON="/data/social-stats/slices-${SOCIAL_STATS_BUILD_ID:-20260507a}.json"
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 25 "$BASE_URL$SLICE_JSON"
```

**Esperado:** `200` y cuerpo JSON (`application/json` o `text/plain` según CDN).

Comprobación mínima de cuerpo (opcional):

```bash
curl -sS --max-time 25 "$BASE_URL$SLICE_JSON" | head -c 200
```

Debe mostrar `"buildId"` coherente con el nombre del archivo.

### 4) Coherencia modo `static` versus `remote`

| `NEXT_PUBLIC_SOCIAL_STATS_SOURCE` (build) | Qué validar |
|-------------------------------------------|------------|
| omitido o distinto de `remote` (static por defecto en código) | Paso 3 **obligatorio** `200`. |
| `remote` | El cliente usa `NEXT_PUBLIC_SOCIAL_STATS_REMOTE_URL` si está bien formada; el archivo en `/public` suele **seguir desplegado** como respaldo del SWR — **recomendado** `200` en paso 3; si no hay archivo en el despliegue, documentar excepción aprobada por CSA. |

## Si algo falla (diff mínimo o env)

| Síntoma | Causa probable | Acción mínima |
|---------|----------------|----------------|
| `/simulator` 404/500 | Ruta app o fallo SSR | Revisar build Next y `output`; **un** archivo: `middleware.ts` / `next.config` solo si CSA confirma bug de ruta. |
| JSON 404 | `public/data/social-stats/` no incluido en deploy o `buildId` desalineado | Alinear `SOCIAL_STATS_BUILD_ID` + nombre `slices-*.json` + ruta en bucket (un PR datos) o corregir pipeline de estáticos. |
| JSON 500 | Proxy/gateway | Infra, no frontend. |
| robots 500 | Handler roto | Revisar `app/robots.ts` o `public/robots.txt`; hotfix **un** archivo. |

## Plantilla de tabla para el acta de release

| Endpoint | Esperado | Observado |
|----------|----------|-----------|
| `HEAD /simulator` | 200 o redirect a 200 | |
| `GET /robots.txt` | 200/404, no 5xx | |
| `GET /data/social-stats/slices-<BUILD_ID>.json` | 200, JSON con `buildId` | |
