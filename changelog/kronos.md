# Changelog · KRONOS · Planeación y control

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-22 | evm_engine | Set completo EVM (PV, EV, AC, CPI, SPI, TCPI, 3×EAC, VAC, semáforo) | CPI, SPI, EAC |
| 2026-05-22 | budget/router | POST /evm + persistencia evm_snapshots + GET snapshots | evm_snapshots |
| 2026-05-22 | gate_tracker | G1–G5 con alertas 30/15/7 días | gate_status_log |
| 2026-05-22 | risk_register | R01–R09 base con merge automático en load | risk_register.json |
| 2026-05-22 | material_prices | Monitor ±10% + API /api/planning/prices/* | precio_ancla |
| 2026-05-25 | deploy | render.yaml rootDir + guard monorepo en start.sh | render |
| 2026-05-25 | evm_integration | AC AURUM + feeds HERMES → CPI/SPI semanal (operativo Fase 0-1) | weekly_status |
| 2026-05-25 | budget/router | POST weekly-status/generate encadena run_aurum | aurum_hermes |
| 2026-05-22 | narrative | GET /narrative — fases G1–G5 + T01–T15 | roadmap M05D |
| 2026-05-22 | alert_engine | Consolida gates + riesgos + precios materiales | alertas KRONOS |
