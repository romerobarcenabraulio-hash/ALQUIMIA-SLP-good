# 22.3 · Perfil Empresario — "¿Cuál es mi retorno?"

Propósito: presentar a inversionistas y operadores empresariales una hoja de viabilidad con ROI, sensibilidad y trazabilidad de mercado, con tono pragmático de Big Four.

## Módulos visibles
- `organization_profile`: `FuentesDatos`, `Macrogeneradores`.
- `containers_provider`: nuevo componente `ContainersProvider` (ver 22.5) o panel "Próximamente" con NarrativeBridge informativo.
- `market_traceability`: `Precolocacion`, `Recicladoaras` (con Sankey real), `BenchmarkLATAM`, `ReasoningGraphPanel` (con grafo real).
- `organization_report`: `ExportarSection`, `ExportadorReporte`, `DashboardKPIs`.
- Cálculos financieros: `ImpactoFinanciero` con Monte Carlo, Tornado, Waterfall, Cashflow y Stress, todos con NarrativeBridge.
- Ocultos para esta audiencia: `citizen_inputs`, `EducacionCiudadana`.

## Tono y léxico
- Pragmático, financiero, de consultoría de élite.
- Frases de referencia: "Bajo 2,000 simulaciones Monte Carlo, el peor escenario aún arroja un payback de X meses".
- Evitar: tono educativo o emocional; etiquetas de "demo" visibles.

## NarrativeBridge requerido
- `ImpactoFinanciero`: 3 puentes (Monte Carlo, Tornado, Waterfall) con datos reales.
- `Precolocacion`: explicar la ventana de oportunidad detectada.
- `ReasoningGraphPanel`: leer el grafo en una frase ("X tipos de residuos confluyen en Y centros…").
- `BenchmarkLATAM`: comparar SLP contra promedio y mejor caso.

## Criterios de aceptación
- Vista exclusiva con módulos listados.
- Cada chart financiero tiene NarrativeBridge con datos calculados.
- `containers_provider` resuelto (componente real o pliegue claro).
