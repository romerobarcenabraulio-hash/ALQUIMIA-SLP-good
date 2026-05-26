# Changelog · POLIS · Personalización municipal

| fecha | módulo | cambio | métrica impactada |
|-------|--------|--------|-------------------|
| 2026-05-25 | profile | Perfil municipal SLP completo en `/data/municipalities/SLP/profile.json` | viviendas, RSU, concesionario |
| 2026-05-25 | legal_framework | Marco legal SLP vinculado en `legal_framework.json` | adendos, jerarquía normativa |
| 2026-05-25 | templates | 6 plantillas base en `/data/municipalities/templates/` | replicabilidad multi-municipio |
| 2026-05-25 | cross_contamination | Detector activo en `modules/personalization/cross_contamination.py` | VETO contaminación cruzada |
| 2026-05-25 | coherence_validator | Validador coherencia en `modules/personalization/coherence_validator.py` | cifras canónicas |
| 2026-05-25 | cli | CLI `python -m modules.personalization.cli validate` | verificación operativa |
| 2026-05-25 | tests | Suite `test_polis_personalization.py` | cobertura POLIS |
| 2026-05-25 | editorial | Sistema `consulting-editorial` — 6 componentes + `editorial_system.md` | legibilidad Cabildo |
| 2026-05-25 | M13 | `ImpactoFinanciero.tsx` — KPIs, cierres y metodología sin cards editoriales | M13 referencia UI |
| 2026-05-25 | NarrativeBridge | Refactor global a layout consulting-editorial (sin cajas de color) | todos los módulos con bridge |
| 2026-05-25 | ContextoModulo | Default `layout=editorial` | metodología sin fondos info/legal |
| 2026-05-25 | ChartPanel | KPI strip → `AnchorFigure` | gráficas del simulador |
| 2026-05-25 | M01B/M04/M05 | Impacto ambiental, empleos, multiplicadores, benchmark, composición RSU | KPI sin cards |
| 2026-05-25 | editorial-rollout | ~60 archivos simulador + stacks: `KpiAnchorGrid`, `EditorialCallout`, rails `border-t` | copy sin cajas KPI |
| 2026-05-25 | OfficialStatCard | Cifra principal → `AnchorFigure`; mismatch amber conservado | social layer |
| 2026-05-25 | GanttMaestroView | `KpiCard` local eliminado → `KpiAnchorGrid` | cronograma |
| 2026-05-26 | EditorialStatusLabel | Chips Inspección/Logística/Infra sin cajas de color | estados operativos |
