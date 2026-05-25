# Changelog · BIOS · Ciclo de vida y LCA

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-25 | lca_factors | Catálogo ISO 14040 con fuentes Ecoinvent/IPCC/INECC en data/environmental/ | CO2e/GRI 305 |
| 2026-05-25 | co2e_engine | Cálculo por fracción con HERMES o fallback Modelo_BASED | co2e_total_ton |
| 2026-05-25 | asset_registry | Inventario con RUL y alertas AMARILLO/ROJO → AURUM | replacement_alerts |
| 2026-05-25 | financial_model | VPN, TIR, payback, valor terminal horizonte 10 años | vpn_mxn, tir_pct |
| 2026-05-25 | sensitivity | Tornado 4 variables: precios ±30%, captura ±20%, combustible ±50%, WACC ±20% | delta_vpn_pct |
| 2026-05-25 | router | API /api/v1/lifecycle/* + POST /pipeline/run | artefactos persistidos |
