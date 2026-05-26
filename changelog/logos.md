# Changelog · LOGOS · Pedagogía

## 2026-05-25

### Publicado
- `cursor-rules/logos.md` — identidad, permisos y criterio QHC del agente
- `docs/style/bloques_qhc.md` — definición canónica Qué · Cómo · Cuidado
- `docs/style/estructura_reportes_por_audiencia.md` — marcos Cabildo / inversionista / PMO / operador

### Estructura por audiencia aplicada
- `data/municipalities/templates/informe_ejecutivo.template.md` — SCQA Cabildo: pregunta de decisión, próximo paso, audiencia explícita
- `docs/municipalities/SLP/informe_ejecutivo.md` — instancia SLP con misma estructura

### Bloques QHC agregados
- Informe ejecutivo (plantilla + SLP): síntesis, cifras canónicas, precios de materiales (3 bloques)
- `modules/planning/budget/report_templates.py` — generador emite QHC en resumen, AC, eficiencia, CAPEX, unit economics
- `data/financial/reports/pmo/reporte_2026-05-22.md` — regenerado con QHC
- `data/financial/reports/pmo/reporte_2026-05-25.md` — regenerado con QHC
- `data/financial/reports/inversionista/reporte_2026-05-22.md` — regenerado con QHC + pregunta de decisión
- `data/financial/reports/inversionista/reporte_2026-05-25.md` — regenerado con QHC + pregunta de decisión

### Tecnicismos aterrizados (audiencia Cabildo)
- RSU → residuos sólidos urbanos (RSU) en informe ejecutivo
- Centros de acopio → puntos municipales donde se reciben fracciones ya separadas
- Recicladoras → plantas de valorización por giro (con aclaración en QHC Cuidado)
- Gate G1/G2 → punto de control del plan con nombre explícito
- AC → costo real acumulado (AC) en reportes PMO

### Eliminación «obviamente»
- Barrido en `.md`, `.py`, `.ts`, `.tsx` del repo: **0 ocurrencias** en copy de producto (solo mención normativa en `prompt_maestro_ejecucion.md`)

### Plantillas AURUM actualizadas
- `data/financial/reports/templates/plantilla_pmo.json` — `qhc_obligatorio`, `estructura_ref`
- `data/financial/reports/templates/plantilla_inversionista.json` — idem

### Referencia cruzada
- `docs/style/guia_estilo.md` — enlace a `bloques_qhc.md`

## 2026-05-25 · Revisión post Wave 1 (huecos detectados)

### Cubierto tras revisión de compañeros
- `data/municipalities/templates/adendo_reforma.template.md` — estructura jurídico-Cabildo + 2 QHC (POLIS entregó plantilla sin pedagogía)
- `modules/lifecycle/report_templates.py` — informe MD BIOS con QHC (CO₂e, sensibilidad VPN)
- `data/environmental/reports/informe_2026-05-25.md` — instancia desde JSON BIOS/AURUM
- `modules/lifecycle/pipeline.py` — persiste informe MD en cada corrida
- `data/README.md` — rubro `environmental/reports/` documentado
- `system/state/architecture_map.md` — rutas LOGOS precisadas

### Pendiente fuera de alcance LOGOS inmediato
- `backend/app/README.md` — propuesta KOSMOS 05
- Plantilla operador/bitácora — KRONOS manual 90 días
- `gate_tracker.py` stakeholders — EIDOS

### Catálogo QHC simulador (cierre)
- `frontend/src/data/chartBriefCatalog.ts` — 52 gráficas con metodología QHC
- `getChartBrief()` + `ExpandableChart.tsx` — guía auto por chartId
- `CityBaselineStack.tsx` — data-chart-id en 4 bloques M01
- `editorialInventory.test.ts` — CI exige cobertura catálogo = chartIds JSX

## 2026-05-25 · Pulido editorial QHC simulador (LOGOS)

### Documentación
- `docs/audit/charts_inventory.md` — inventario 65 gráficas (módulo, tipo, QHC, cifras)
- `docs/style/cinco_angulos_aplicados.md` — un ejemplo por ángulo de entrada
- `docs/style/editorial_pattern_canonico.md` — patrón canónico (rejilla M13 + contrastes tornado/Monte Carlo)

### Catálogo y generación
- `frontend/src/data/chartBriefCatalog.ts` — reescritura editorial completa (tono financiero, no documentación)
- `frontend/scripts/logos-chart-briefs.mjs` — generador con rotación de 5 ángulos sin repetición adyacente
- Nuevas entradas M13: `m13-waterfall-valor`, `m13-monte-carlo-tir`, `m13-tornado-vpn`, `m13-cashflow`, `m13-rejilla-stress`, `m13-monte-carlo-vpn`

### UI M13
- `ImpactoFinanciero.tsx` — `ChartPanel` + `chartId` en waterfall, Monte Carlo TIR, tornado VPN, cashflow, rejilla stress; bloque maestro TIR múltiples (base vs C/D)
- `ScenariosExportStack.tsx` — bloque maestro TIR antes de `escenarios-tir`; Monte Carlo VPN y tornado con `ChartPanel`

### Ejemplos comparativos aplicados
- Tornado M13: jerarquía WACC / captura año 1 (sustituye párrafo genérico)
- Monte Carlo TIR: entrada por método (Los Álamos → 2 000 corridas → percentiles)
- Rejilla: patrón canónico EIDOS preservado y reforzado en catálogo
