# Despliegue del backend ALQUIMIA (Railway / Render)

## Requisitos

- Imagen: `Dockerfile` en la raíz de `backend/` (Python 3.12, uvicorn en `0.0.0.0`).
- El contenedor respeta la variable **`PORT`** (Railway y Render la definen); si falta, usa `8000`.

## Railway

1. Nuevo proyecto → **Deploy from GitHub** (o CLI) con **Root Directory** = `backend`.
2. Variables de entorno mínimas recomendadas: ver `backend/.env.example`.
3. Tras el deploy, la URL pública será del estilo:  
   `https://<nombre-servicio>.up.railway.app`  
   (o dominio personalizado en **Settings → Networking**).

## Render

1. **New → Web Service**, conectar repo GitHub.
2. **Root Directory:** dejar **vacío** (raíz del repo, no `backend/`).
3. **Dockerfile Path:** `Dockerfile` (raíz del repo; incluye `modules/`, `config/`, `data/`).
4. Variables: ver `.env.example` + `CRON_SECRET` para el Cron Job.
5. Tras deploy, verificar:

```bash
curl -sS https://alquimia-slp.onrender.com/api/v1/logistics/health
curl -sS https://alquimia-slp.onrender.com/api/v1/cron/manifest
```

Si responde `{"detail":"Not Found"}`, el servicio sigue en un commit anterior o el **Root Directory** está mal (`backend/` rompe el build de HERMES).

## Verificar qué commit está vivo

```bash
curl -sS https://alquimia-slp.onrender.com/health
```

Cuando el deploy es correcto verás:

```json
{
  "status": "ok",
  "hermes": true,
  "cron": true,
  "git_commit": "081986a9..."
}
```

Si `"hermes": false` → el deploy falló o no llegó el código nuevo. Revisa **Logs** del último deploy en Render (busca `ModuleNotFoundError: modules`).

## Si usas Root Directory = `backend` (sin Docker)

`scripts/start.sh` ya exporta `PYTHONPATH` al monorepo. Start command:

```text
./scripts/start.sh
```

## `GET /health`

- Público, sin autenticación.
- Comprobar: `curl -sS https://<TU_API>/health`

## CORS

- Orígenes por defecto incluyen **`https://alquimia-slp.vercel.app`**.
- Añade más con `ALLOWED_ORIGINS` (comma-separated), por ejemplo tu dominio Vercel de preview.

## Frontend Vercel (`NEXT_PUBLIC_API_URL`)

Configurar en Vercel → **Settings → Environment Variables**:

```text
NEXT_PUBLIC_API_URL=https://<TU_API_PUBLICA>
```

**Sin barra final.** Ejemplo: `https://alquimia-api-production.up.railway.app`

Tras redeploy del frontend, las peticiones del simulador apuntan al API remoto y desaparecen errores tipo **"Failed to fetch"** si el API responde y CORS coincide.

## Verificación rápida post-deploy

```bash
curl -sS -o /dev/null -w "%{http_code}" "https://<TU_API>/health"
# Esperado: 200
```

Opcional (origen Vercel):

```bash
curl -sS -D - "https://<TU_API>/health" -H "Origin: https://alquimia-slp.vercel.app" | rg -i access-control
```
