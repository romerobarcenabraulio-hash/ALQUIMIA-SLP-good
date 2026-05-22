# Base de datos — Neon (reemplaza Render Postgres)

## Por qué Neon

- Plan **gratis** generoso para desarrollo
- **SQL Editor** en el navegador (sin Alembic, sin Brew, sin DBeaver)
- Compatible con el mismo `DATABASE_URL` que usa el backend

## 1. Crear proyecto en Neon

1. [console.neon.tech](https://console.neon.tech) → Sign up (GitHub vale).
2. **New Project** → región cercana (ej. `aws-us-east-1`).
3. Copia la connection string **sin pooler** (Direct / Unpooled) para migraciones:
   - En Neon: **Connect** → pestaña que diga **Direct connection** o desactiva pooler.
   - Debe verse como:  
     `postgresql://usuario:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

Para la app en Render puedes usar la misma URL directa al inicio, o la **pooled** si Neon la ofrece (mejor para muchas conexiones).

## 2. Crear tablas (SQL Editor — recomendado)

1. Neon → tu proyecto → **SQL Editor**.
2. Abre en el repo: `backend/scripts/apply_migrations_manual.sql`
3. Pega todo el contenido → **Run**.
4. Verifica:

```sql
SELECT * FROM alembic_version;
-- debe mostrar: 0002_research

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
-- debe incluir research_items, price_series, clientes, ...
```

## 3. Conectar Render (API gratis)

1. Render → servicio **ALQUIMIA-SLP** (web) → **Environment**.
2. Cambia **`DATABASE_URL`** por la connection string de Neon (nueva, no la de Render Postgres).
3. **Save** → redeploy automático.

Opcional: borra o deja de usar la Postgres de Render para no pagar/confundir (el servicio Postgres de Render se puede suspender/eliminar).

Variables que **no cambian**:

- `ANTHROPIC_API_KEY`, `SERPER_API_KEY`, `SECRET_KEY`, `ALLOWED_ORIGINS`, etc.

## 4. Local (opcional)

En `backend/.env`:

```env
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
```

## 5. Comprobar

```bash
curl https://alquimia-slp.onrender.com/health
curl "https://alquimia-slp.onrender.com/research/cache/summary"
```

El segundo debe devolver JSON (aunque `total_items` sea 0 hasta que corra Serper).

**Proyecto Vivo (simulador):** si en Neon solo corriste la sección `0002_research`, el portal puede fallar con *Proyecto no disponible: 500* porque falta `proyectos_municipales`. Verifica:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'proyectos_municipales';
```

Si no hay fila, ejecuta **todo** `backend/scripts/apply_migrations_manual.sql` (no solo la parte research), guarda en Render y redeploy.

```bash
curl -s "https://alquimia-slp.onrender.com/api/v1/proyecto/sim-slp/estado" | head -c 200
```

Debe devolver JSON con `"semaforo"` (no un `detail` con `UndefinedTable`).

## Notas

- **Migraciones:** usar conexión **direct** en Neon; el pooler a veces falla con DDL.
- **Render Postgres:** ya no es necesario si todo apunta a Neon.
- **Perplexity:** sigue diferido; research usa Serper + tablas en Neon.
