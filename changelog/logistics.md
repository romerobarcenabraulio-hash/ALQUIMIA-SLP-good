# Changelog · HERMES · Logística

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-22 | plan_generator | Scaffold inicial — rutas residenciales por colonia con heurística haversine + hook Google Routes | km_totales |
| 2026-05-22 | weight_receiver | Receptor de tonelaje por fracción con validación y agregación; sintético Fase 0-1 | tonelaje_por_fraccion |
| 2026-05-22 | kpi_calculator | Semáforo VERDE/AMARILLO/ROJO + pipeline daily_summary | semaforo, costo_logistico |
| 2026-05-22 | config | api_limits.json + google_maps.json en /config/ | cuota API |
| 2026-05-22 | data_backbone | Migración 0008: logistics_daily_summaries, logistics_route_plans, logistics_weight_events | persistencia |
| 2026-05-22 | api | POST /api/v1/logistics/daily-summary/run publica primer daily_summary | daily_summary |
| 2026-05-22 | simulator | Acordeón rubros — un rubro abierto por capítulo en ModuleNav | UX navegación |
| 2026-05-22 | cron | POST /api/v1/cron/logistics-daily-summary (19:00 MX) + config/cron.json | automatización |
| 2026-05-22 | kronos | weekly_status usa aurum_hermes_integrado; POST /budget/kronos/sync-hermes | CPI/SPI/AC |
| 2026-05-22 | fix | Rutas data/planning y meta_tonelaje apuntan a repo root | evm_integracion |
