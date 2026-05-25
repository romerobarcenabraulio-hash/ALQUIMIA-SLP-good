# Propuesta 02 · Serper price fetch stub en simulate.py

**Estado:** EJECUTADA 2026-05-25 por OCCAM (post Wave 2)

**Aprobación requerida:** ~~Ejecutor~~ — redundancia clara; Serper activo permanece en `ResearchService` (ÁGORA)

## Qué eliminar

| Archivo | Sección |
|---------|---------|
| `backend/app/routers/simulate.py` | `fetch_live_prices()` — bloque HTTP que no altera precios |

## Qué se pierde

- Placeholder de "precios en vivo" que hoy no funciona (devuelve siempre entrada sin cambio).
- Log engañoso `"Serper fetch OK — parsing pendiente"`.

## Qué se gana

- Menos código muerto y expectativa falsa en respuesta API.
- Opción A: eliminar función y llamada; precios 100% del usuario/store.
- Opción B: implementar parser P9 (regex/LLM sobre snippet) — fuera de scope OCCAM.

## Acción concreta

```python
# En simulate(): quitar líneas 39-41 y función fetch_live_prices completa.
# Documentar en docstring que precios vienen de ScenarioInput / registry.
```

**Prioridad:** ALTA
