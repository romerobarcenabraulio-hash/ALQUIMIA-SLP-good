# API keys — uso mínimo y ahorro de tokens

Configura en `backend/.env` (copia desde `backend/.env.example`).

## Prioridad (qué activar primero)

| Orden | Variable | Para qué | Tokens / costo |
|-------|----------|----------|----------------|
| 1 | `DATABASE_URL` | Caché research, price_series, proyecto vivo | **Neon** gratis — ver `NEON_DATABASE.md` |
| 2 | `ANTHROPIC_API_KEY` | ÁGORA redacta documentos | **Alto** — solo al exportar paquete |
| 3 | `SERPER_API_KEY` | Investigador (precios, reglamentos) | Bajo — máx 20 queries/run; **se omite si hay caché DB** |
| 4 | `INEGI_API_TOKEN` | DENUE centros, datos geo | Gratis (registro INEGI) |
| 4b | `GOOGLE_PLACES_API_KEY` | Places centros/residencial | Render |
| 4c | `GEOCODING_API` | Geocoding forward/reverse | Render |
| 4d | `OPTIMIZATION_ROUTE_API` | Routes API logística | Render |
| 4e | `MAPS_PLATFORM_API` | Fallback clave maestra | Render |
| 4f | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript (mapas UI) | Vercel |
| 5 | `BANXICO_TOKEN` | INPC / tipo de cambio | Gratis (Banxico SIE) |
| 6 | `PERPLEXITY_API_KEY` | **Diferido** — no configurar aún | Ver `RESEARCH_INTELLIGENCE_ROADMAP.md` |

## Cómo ahorrar tokens en ÁGORA

1. **Corre el simulador** y guarda escenario antes de `POST /generate/plan`.
2. **Primera investigación** con Serper (una vez por municipio) → queda en Postgres 6 h.
3. Revisa caché: `GET /research/cache/summary?municipio_id=san_luis_potosi&zm=ZM_SLV`
4. Segunda corrida ÁGORA **no llama Serper** si `total_items ≥ 3`.
5. Validación numérica KPI (TIR, captura) corre en **Python** (`numeric_guard`) — no gasta Claude.
6. Modelo rápido para borradores: `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`  
   Calidad máxima: `claude-sonnet-4-6` (default).

## Endpoints sin LLM (gratis)

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/research/cache/summary` | ¿Hay research en DB? |
| POST | `/statistical/monte-carlo` | Sensibilidad ingresos |
| POST | `/statistical/pert` | Ruta crítica / holgura |
| GET | `/statistical/derrama?empleos_directos=120` | Multiplicador IO INEGI |
| GET | `/api/v1/google/status` | ¿Keys Google configuradas en Render? |
| POST | `/api/v1/google/geocoding/forward` | Dirección → coordenadas |
| POST | `/api/v1/google/geocoding/reverse` | Coordenadas → colonia |
| POST | `/api/v1/google/places/search` | Centros / residencial |
| POST | `/api/v1/google/routes/segment` | Tramo ruta camión |
| POST | `/api/v1/google/routes/plan` | Ruta depot → paradas |
| GET | `/data/municipio/{cve}/poblacion?anio=2028` | CONAPO offline |
| GET | `/market/buyers` | Catálogo compradores |

## Plantilla `.env` mínima

```bash
DATABASE_URL=postgresql://alquimia:alquimia@localhost:5432/alquimia
SECRET_KEY=genera-un-secreto-largo-aleatorio
ANTHROPIC_API_KEY=sk-ant-...
SERPER_API_KEY=...
# Opcional después:
# INEGI_API_TOKEN=
# BANXICO_TOKEN=
# PERPLEXITY_API_KEY=   # no usar hasta presupuesto
```

## Migración BD (una vez)

```bash
cd backend && alembic upgrade head
```

## Flujo recomendado al agregar keys

1. `DATABASE_URL` + `alembic upgrade head`
2. `SERPER_API_KEY` → abrir simulador o llamar investigador una vez
3. Verificar `GET /research/cache/summary`
4. `ANTHROPIC_API_KEY` → generar paquete ÁGORA (usará caché + menos tokens)
