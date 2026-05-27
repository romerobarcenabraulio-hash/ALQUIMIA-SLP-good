# Geo — Centros de acopio y operadores logísticos (México)

Catálogo territorial para ALQUIMIA Fase 0–1. Coordenadas en **EPSG:4326** (WGS84).

## Estructura

| Ruta | Contenido |
|------|-----------|
| `centros_acopio/municipios/{cve}.json` | Establecimientos DENUE (SCIAN reciclaje/acopio) por municipio |
| `centros_acopio/coverage_manifest.json` | Estado de sincronización por CVE INEGI |
| `operadores_logisticos/{cve}.json` | Bodega/patio/transferencia del concesionario vigente |

## Fuentes (jerarquía Navigator)

1. **INEGI DENUE** — establecimientos registrados (oficial)
2. **Perfil municipal ALQUIMIA** — operador concesionado (bodega/patio)
3. **Google Places** — catálogo POI por municipio (`fuente=places_api`, obligatorio para cobertura nacional)

## Sincronizar municipios

```bash
# backend/.env — requerido:
#   DATABASE_URL=postgresql://...
#   GOOGLE_PLACES_API_KEY=...  (o MAPS_PLATFORM_API) — obligatorio para Places
#   INEGI_DENUE_TOKEN=...        (opcional; sin token usa piloto SLP)

# Barrido nacional (32 entidades, reanuda progreso)
cd backend && python3 scripts/sync_nacional_mexico.py --denue-only          # sin Google
cd backend && python3 scripts/sync_nacional_mexico.py --force               # DENUE + Places
cd backend && python3 scripts/sync_nacional_mexico.py --estados 19,24 --force
cd backend && python3 scripts/sync_nacional_mexico.py --google-api-key AIza... --force

# Mapa almacén concesionario por CVE (2 478 municipios)
python3 scripts/sync_nacional_mexico.py --depot-report-only

# Salida: data/geo/nacional_sync_progress.json, data/geo/depot_por_municipio.json

# Barrido SLP (59 municipios)
cd backend && python3 scripts/sync_slp_places_nacional.py --force

# Un estado vía Places
cd backend && python3 scripts/sync_places_estado.py --estado 19 --force
```

## Cron programado (Render)

Ver `config/cron.json` y `config/geo_nacional_estados.json`:

| Job | Hora MX | Función |
|-----|---------|---------|
| `geo-denue-nacional-sync` | 04:00 | ~50 CVE/día DENUE |
| `geo-places-estado-rotation` | 05:00 | 1 entidad/día Places + operador candidato |
| `geo-depot-report` | dom 06:00 | Regenera `depot_por_municipio.json` |
| `logistics-daily-summary` | 13:00 | Rutas HERMES multi-ZM |

## API

```bash
# Places — estado completo (24 = SLP)
curl -X POST .../api/v1/centros-acopio/sync/places-estado \
  -H "Content-Type: application/json" \
  -d '{"estado_id":"24","force":true}'

# Places — un CVE
curl -X POST ".../api/v1/centros-acopio/sync/places-municipio?clave_inegi=24028&force=true"

# DENUE + Places integrado
curl -X POST .../api/v1/centros-acopio/sync/denue -d '{"clave_inegi":"24028","force":true}'
```

## Operador principal

Las instalaciones con `es_operador_principal: true` representan la bodega o patio del concesionario actual. **No son ubicaciones definitivas** hasta validación de campo (`verificado: false`).

Para agregar un municipio nuevo: crear `operadores_logisticos/{cve}.json` desde plantilla y ejecutar sync DENUE.
