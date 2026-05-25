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
3. **Google Places** — complemento opcional (`POST /api/v1/centros-acopio/sync/places`)

## Sincronizar municipios

```bash
# Un municipio (requiere INEGI_DENUE_TOKEN en .env)
python backend/scripts/sync_centros_acopio_nacional.py --cve 24028

# Toda una entidad (p.ej. San Luis Potosí = 24)
python backend/scripts/sync_centros_acopio_nacional.py --estado 24

# API en caliente
curl -X POST .../api/v1/centros-acopio/sync/denue -d '{"clave_inegi":"24028"}'
```

## Operador principal

Las instalaciones con `es_operador_principal: true` representan la bodega o patio del concesionario actual. **No son ubicaciones definitivas** hasta validación de campo (`verificado: false`).

Para agregar un municipio nuevo: crear `operadores_logisticos/{cve}.json` desde plantilla y ejecutar sync DENUE.
