# Research Intelligence — Roadmap ALQUIMIA

> Estado: **Serper activo** · **Perplexity diferido** (sin presupuesto API) · **Postgres research_items** en implementación

## Por qué investigar (no es opcional a mediano plazo)

El simulador presenta cifras a funcionarios públicos. Sin research trazable:

- Los precios de mercado parecen certificados cuando son benchmarks editoriales.
- El reglamento citado puede estar desactualizado sin que el usuario lo sepa.
- Los agentes Claude (ÁGORA) reciben KPIs pero no validan si los supuestos están en rango RSU real.

**Principio Auditor:** lo no demostrable con evidencia trazable no existe en comunicación pública.

## Motor actual (ya en producción)

| Herramienta | Costo | Rol | Estado |
|---|---|---|---|
| **Serper** | API key de pago (bajo volumen, máx 20 queries/run) | Descubrimiento de URLs + snippets + extracción numérica | Activo en `ResearchService` |
| **Claude Sonnet** | `ANTHROPIC_API_KEY` | Redacción de documentos ÁGORA (no calcula) | Activo |
| **Perplexity Sonar** | Pay-as-you-go | Síntesis con cita: precios validados, reglamentos, benchmarks LATAM | **DIFERIDO** |

## Qué debe investigarse (y para qué módulo)

### 1. Precios de materiales (`precios_materiales`)

- **Por qué:** PET/aluminio mueven >60% del ingreso; volatilidad trimestral invalida escenarios si no se actualiza.
- **Queries Serper (ya):** precio PET, aluminio, papel, cartón MXN/kg.
- **Perplexity (futuro):** validar precio con contexto regional y comprador activo; reducir falsos positivos del regex en snippets.
- **Destino:** `price_series` + sliders M01/M10 + Monte Carlo.

### 2. Costos de construcción y terreno (`costos_construccion`, `costos_terreno`)

- **Por qué:** CAPEX de centros de acopio depende de m² industrial local, no del benchmark nacional.
- **Destino:** M09 Costos programa, cotización ÁGORA.

### 3. Tarifa de disposición (`costos_disposicion`)

- **Por qué:** Costo de omisión y ahorro público usan tarifa relleno; la media nacional engaña si el municipio tiene contrato distinto.
- **Destino:** M04 costo_omision, slider disposición M01.

### 4. Reglamento municipal (`reglamentos`)

- **Por qué:** M03 marco legal y M03D dictamen requieren vigencia y artículos reales.
- **Perplexity (futuro):** resumen de artículos de separación + sanción cuando no hay PDF cargado.
- **Destino:** `regulatory_sources` + DiagnosticoJuridico.

### 5. Composición RSU local (`papers_academicos` / caracterización)

- **Por qué:** El donut SEMARNAT nacional puede desviarse ±8% del municipio; impacta ingresos por material.
- **Destino:** M01 línea base, composición RSU.

### 6. Benchmarks LATAM (`benchmarks_latam`)

- **Por qué:** Cabildo pide "¿quién más lo hizo?"; sin fuente es opinión.
- **Perplexity (futuro):** ciudades comparables por población con tasa de recuperación documentada.
- **Destino:** M10 mercado, expediente cabildo.

### 7. Noticias y riesgo político (`noticias_locales`)

- **Por qué:** Riesgo político (40% del score) necesita señales locales, no solo heurística.
- **Destino:** M14 riesgos_modelo, mapa de actores.

## Perplexity — cuándo activar (checklist)

Activar cuando exista presupuesto y se cumplan:

1. `PERPLEXITY_API_KEY` en entorno staging/producción.
2. Tablas `research_items` y `price_series` con datos Serper ya persistidos (baseline).
3. Stub en `backend/app/research/perplexity_service.py` reemplazado por implementación real.
4. Tests de integración con mock (no gastar créditos en CI).

**Modelos recomendados:**

- `sonar-pro` — precios, reglamentos, benchmarks (rápido, con citas).
- `sonar-deep-research` — solo para reglamento nuevo o municipio sin PDF (más caro).

**No usar Perplexity para:** TIR, VPN, CO₂e — eso es `calculator.ts` + scipy, nunca LLM.

## Base de datos de research (implementado / en curso)

- `research_items` — una fila por hallazgo URL+municipio (dedup por hash).
- `price_series` — serie temporal de precios por material.
- `regulatory_sources` — reglamentos y vigencia.
- `model_calibrations` — parámetros calibrados (gen per cápita, captura, etc.) con fuente y vigencia.

## Modelos estadísticos (roadmap sin Perplexity)

| Modelo | Hoy | Objetivo |
|---|---|---|
| Monte Carlo financiero | Triangular 2k iter (TS) | Log-normal precios, beta captura (scipy backend) |
| PERT | Valor esperado sin σ² | IC-90 por tarea |
| Población | Censo 2020 fijo | CONAPO adapter (datos.gob.mx, gratis) |
| Multiplicadores derrama | 1.8× / 1.3× ad-hoc | IO INEGI SCIAN 2018 |

## Variables de entorno

Ver guía operativa completa: **`cursor-rules/AGENT_API_KEYS.md`** (orden de activación y ahorro de tokens).

```bash
DATABASE_URL=             # primero — caché research 6h
SERPER_API_KEY=           # investigación (omitido si hay caché)
ANTHROPIC_API_KEY=        # ÁGORA documentos
PERPLEXITY_API_KEY=         # diferido — no configurar hasta presupuesto
```
