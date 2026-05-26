# Sistema editorial · consulting-editorial

**Patrón:** `consulting-editorial`  
**Referencia de implementación:** M13 · `ImpactoFinanciero.tsx`  
**Componentes:** `frontend/src/components/editorial/`  
**Fuentes:** Literata (serif) + Source Sans 3 (sans) — equivalente operativo a Tiempos / Source Serif Pro / GT Sectra en el brief.

---

## Objetivo de lectura (Cabildo)

| Tiempo | Qué debe lograr el lector |
|--------|-------------------------|
| 5 s | Respuesta en la primera oración (`<Conclusion />`) |
| 30 s | Justificación en el mismo bloque + cifras ancla |
| 2 min | Defensa en pleno con fuente e incertidumbre (`<MarginalNote />`) |

---

## Componentes

### `<Conclusion />`

Apertura o cierre en **serif 22–23px**, regular, `line-height: 1.35`, `max-width: ~580px`.  
**Prohibido:** border, background, padding lateral tipo card.

```tsx
<Conclusion>
  Con TIR 18.2% y VPN $756M a WACC 20%, el escenario base aguanta ante Cabildo si el P10 de Monte Carlo no cae bajo el costo de capital.
</Conclusion>
```

`tone="caution"` solo cambia color de texto (sin caja ámbar).

### `<AnchorFigure />`

Grid `auto 1fr`: cifra serif 28px + contexto sans 14px. Sustituye tiles KPI en cajas grises.

```tsx
<AnchorFigure figure="18.2%" context="TIR del proyecto" />
```

### `<SectionLabel />`

Rótulo sans 11px, uppercase, tracking 1.5px, color terciario. No usar pills para cifras.

### `<Recommendation />`

`SectionLabel` + línea `0.5px` + texto serif 16px. Para dictamen explícito a Cabildo.

### `<MarginalNote />`

Fuente, unidad, incertidumbre — sans 12px, sin fondo info/warning.

### `<EditorialClose />`

Sustituto de `NarrativeBridge` bajo gráficas: `Conclusion` + hasta 4 `AnchorFigure` + `MarginalNote` + enlace siguiente paso.

---

## Qué eliminar en módulos de decisión

| Eliminar | Sustituir por |
|----------|----------------|
| Cards con solo texto explicativo | `Conclusion` + `MarginalNote` |
| Pills/badges en cifras o fechas | `AnchorFigure` |
| `NarrativeBridge` con fondo verde/ámbar | `EditorialClose` |
| KPI grid en cajas `border + bg-[#FDFCFA]` | Fila de `AnchorFigure` |
| Cajas azules tipo `TirMultipleExplainer` legacy | `SectionLabel` + `Conclusion` |

## Qué mantener con caja

- Inputs, sliders, selects
- Botones y tabs
- Tooltips / popovers
- Tablas de datos (`border` 0.5px sutil)
- Contenedores de gráfica (`ChartPanel` — marco del chart, no el copy)

---

## Orden recomendado en M13

1. `SectionLabel` — sección
2. `Conclusion` — veredicto en una oración
3. Grid `AnchorFigure` — 4 anclas numéricas
4. `MarginalNote` — advertencia modelo / fuente
5. Controles (sliders) en card permitida
6. `ChartPanel` + gráfica
7. `EditorialClose` bajo cada gráfica
8. `Recommendation` al cierre del módulo (opcional)

---

## Rollout global (mayo 2026)

| Capa | Cambio |
|------|--------|
| `NarrativeBridge` | Sin cajas verde/ámbar/gris — `Conclusion` + `AnchorFigure` + `MarginalNote` |
| `ContextoModulo` | Default `layout="editorial"`; `layout="card"` solo legacy |
| `ChartPanel` / `Card.KpiCard` | `AnchorFigure` / `EditorialMetric` |
| `ui/Card.tsx` | `KpiCard` → `EditorialMetric` |
| `SectionHero.tsx` | `EditorialMetric` + `EditorialCallout` |
| M13 | `ImpactoFinanciero` + `Recommendation` |
| M01B | `ImpactoAmbientalStack`, `ImpactoAmbiental` |
| Módulos S1–S9 | `SelectorZM`, `HorizonteCircularidad`, `EditorTrayectoria`, `TipoVivienda`, `ScoreViabilidad`, `CircularityBaselineCard`, `FutureGoalsModule`, … |
| Stacks decisión | `CostoOmision`, `CityBaseline`, `ScenariosExport`, `MarketTraceability`, `Organigrama`, `Inspeccion`, `ArbolFinanciamiento`, `LogisticaOperativa`, `InfrastructureOperations`, `GuiaCircularidad`, `MonitoreoReal`, `DictamenTecnico`, `ExpedienteCabildo`, `MunicipalContext`, … |
| Social / legal | `DiagnosticoJuridico`, `MarcoLegal`, `SocialDemographicContextPanel`, `OfficialStatCard`, `MunicipioDataAwaitingBanner`, … |
| Plan / export | `GanttMaestroView`, `ProgresionPlan*`, `ReferenciasCalculos`, `PortalEmpresarial`, `PropuestasSimulatorBar`, … |

**Quedan con `bg-[#FDFCFA]` a propósito:** inputs, tabs, modales, `ChapterIndex`, filas de tabla, botones de escenario, `ExportarSection` (cards clicables), placeholders de mapa/chart, estados vacíos mínimos.

## Extender módulos nuevos

1. `KpiAnchorGrid` o `AnchorFigure` desde `@/components/editorial`
2. Copy bajo gráficas: `EditorialClose` o `NarrativeBridge` (ya editorial)
3. Sin `Badge` decorativo en cifras — usar `SectionLabel`
4. Registrar en `changelog/polis.md`

---

## Relación con patrones previos

- `docs/style/editorial_pattern_canonico.md` — reglas de copy (cifra + condicional + conclusión)
- Este documento — reglas de **layout** y componentes React
