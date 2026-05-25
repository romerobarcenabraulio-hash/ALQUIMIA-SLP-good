# Changelog · AURUM · Gestión de costos

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-25 | cost_structure | CAPEX/OPEX/no-calidad con decimal.Decimal — nunca float | capex_total, opex_mensual |
| 2026-05-25 | hermes_consumer | Consumidor feed daily_summary en data/logistics/ | costo_logistico_acumulado |
| 2026-05-25 | efficiency | Indicadores: costo/ton, costo/vivienda, payback, % no-calidad + semáforo | unit_economics |
| 2026-05-25 | kronos_publisher | Evento ac_update → data/financial/costs/ac_latest.json | AC EVM |
| 2026-05-25 | report_templates | Plantillas y reportes PMO / inversionista (JSON + MD) | reportes SUPREME |
| 2026-05-25 | pipeline | run_aurum_pipeline — ciclo quincenal completo | ac_update, reportes |
| 2026-05-25 | budget/router | POST /aurum/run, GET structure/ac/hermes-status | API AURUM |
| 2026-05-25 | municipal_context | Parámetros desde perfil POLIS (ca_mix 7/7/4, viviendas, ingreso) | coherencia POLIS |
| 2026-05-25 | municipal_context | Alertas RUL BIOS → warnings pipeline AURUM | mantenimiento OPEX |
