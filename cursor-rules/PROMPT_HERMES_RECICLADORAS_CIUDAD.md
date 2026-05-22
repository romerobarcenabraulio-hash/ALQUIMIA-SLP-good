# Prompt — HERMES · Recicladoras por ciudad

Copiar y pegar en un chat nuevo con `@hermes.md` + `@BRIEFING_PLATAFORMA_2026-05.md` + `@HANDOFF_HERMES_KRONOS_MAY2026.txt` (Parte C).

---

```
@hermes.md @BRIEFING_PLATAFORMA_2026-05.md @HANDOFF_HERMES_KRONOS_MAY2026.txt

Eres HERMES. Ejecuta tu Regla Cero sobre el repo en commit 70e5bd78 o posterior.

MANDATO PRODUCTO (prioridad ALTA):
Agregar las recicladoras/compradores de CADA ciudad al simulador. Hoy M08, el mapa y M10
asumen las 5 plantas del piloto SLP — eso invalida cualquier municipio que no sea SLP.

Lee la spec completa en:
- cursor-rules/hermes.md § MANDATO PRODUCTO — RECICLADORAS POR CIUDAD
- cursor-rules/HANDOFF_HERMES_KRONOS_MAY2026.txt § PARTE C

ENTREGABLES (en este orden):
1. Catálogo `recicladoras_by_municipio` (JSON en frontend/src/data/ o endpoint backend)
   Campos: municipio_id, zm, giro, nombre, lat, lng (EPSG:4326), capacidad_ton_dia,
   precio_kg_mxn, fuente, estado (verificado | estimado_denue | pendiente_campo)
2. Seed mínimo: SLP, MTY, QRO, GDL (al menos 1 comprador por giro donde exista dato real)
3. CentrosAcopioMap.tsx — layer recicladoras filtrada por municipiosActivos del store
4. LogisticaOperativaStack — distancia CA → recicladora (Routes Matrix o haversine + disclaimer)
5. MarketTraceabilityStack (M10) — compradores locales del catálogo, no lista genérica
6. Publicar window.__ALQUIMIA_RECYCLERS_KPI__ o extender LogisticsKpiContract:
   - recicladoras_activas, cobertura_giros_pct, distancia_promedio_km_ca_recicladora
7. Test: cambiar municipio en store → catálogo y mapa muestran recicladoras de ESA ciudad

FUENTES (orden de preferencia):
- INEGI DENUE (backend/app/routing/inegi_client.py)
- Google Places (backend/app/google/places_client.py — "recicladora {ctx}")
- Seed curada por ZM (referencia: frontend/src/lib/capexOpexData.ts Recicladoras_por_Giro)

RESTRICCIONES:
- NAVIGATOR: EPSG:4326 almacenamiento, 3857 visualización, 6369 métricas SLP/NL/QRO
- No hardcodear las 5 plantas SLP como default global
- No inventar coordenadas sin marcar estado estimado_denue o pendiente_campo
- No tocar GPS/IoT/básculas en tiempo real (Fase 4-5)

FORMATO DE SALIDA:
## HERMES — Recicladoras por ciudad
### Regla Cero
### Diseño del catálogo (schema + ejemplo JSON)
### Archivos a crear/modificar
### Plan de implementación (pasos concretos)
### Contrato KPI hacia KRONOS
### Tests propuestos
```
