# Auditoría Supreme · Integridad de simulación
**Fecha:** 2026-05-23  
**Alcance:** Monte Carlo, tornado, gráficas hardcodeadas, UX de cómputo en vivo  
**Roles:** Supreme (veredicto) · PD&SA (arquitectura modular)

---

## Veredicto

| Área | Antes | Después |
|------|-------|---------|
| M13 Monte Carlo VPN | Histograma fake (±55% VPN, ~500 iter) | `monteCarloTriangularSamples` + `useLiveMonteCarlo` · 2 000 iter · `calcular()` |
| M13 Tornado | `TORNADO_VARS` fracciones fijas × VPN | `tornadoAnalysis(state)` OAT ±20% |
| M06 Monte Carlo TIR | `monteCarlo()` devolvía solo 3 percentiles | Arreglo completo + hook en vivo |
| UX estudio en vivo | Solo números finales | `SimulationComputeTrace` — barra de progreso, variables, iteraciones |

**Estado:** APROBADO con reservas documentadas (ver §Deuda residual).

---

## Conexiones al motor

```
simulatorStore (state)
       │
       ├─► calcular() ─────────────► KPIs base (TIR, VPN, payback…)
       │
       ├─► perturbStateMonteCarlo() ─► calcular() × N  ─► useLiveMonteCarlo
       │                                              └─► MonteCarloVpnChart / MonteCarloCChart
       │
       └─► tornadoAnalysis() ────► applyVar ±20% ──► calcular().vpn delta
                                              └─► TornadoChart
```

Archivos canónicos:
- `frontend/src/lib/calculator.ts` — motor, `MONTE_CARLO_SPEC`, `perturbStateMonteCarlo`
- `frontend/src/hooks/useLiveMonteCarlo.ts` — lotes RAF (~48/frame)
- `frontend/src/components/simulator/SimulationComputeTrace.tsx` — trazabilidad visible
- `frontend/src/components/charts/MonteCarloVpnChart.tsx` — VPN en M13
- `frontend/src/components/charts/MonteCarloChart.tsx` — TIR en M06
- `frontend/src/components/charts/TornadoChart.tsx` — tornado compartido

---

## Hardcodes que permanecen (aceptados / fuera de alcance)

| Ubicación | Tipo | Justificación |
|-----------|------|---------------|
| `ScenariosExportStack` waterfall | Fracciones 0.22/0.18/… del VPN | Desglose ilustrativo M06; no sustituye `calcular()` |
| `ScenariosExportStack` `SCENARIO_DEF` | Multiplicadores escenario | Sensibilidad de consultoría, no MC |
| `CapturaAreaChart` | Benchmarks Bogotá/B. Aires/Curitiba | Comparación internacional documentada |
| `MarketTraceabilityStack` | `SENSITIVITY_VARS` demo mercado | M10 trazabilidad comercial, no VPN proyecto |

---

## CI

Test de regresión: `frontend/src/lib/simulationIntegrity.test.ts`

Prohíbe en M13: `TORNADO_VARS`, “distribución triangular aprox”, “~500 iteraciones”.  
Verifica: muestras MC completas, tornado OAT, hook en vivo en charts.

---

## Recomendaciones PD&SA (futuro)

1. Waterfall VPN desde desglose real de flujos (`calcular().serieAnual`) en lugar de fracciones fijas.
2. Unificar MC VPN/TIR en un contexto compartido para no duplicar 2×2000 iter al abrir M06+M13.
3. Web Worker para MC en municipios con store pesado (ZM multi-municipio).
