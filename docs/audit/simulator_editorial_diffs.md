# Diffs aplicados — Auditoría EIDOS Modo Validar

**Fecha:** 2026-05-22  
**Alcance:** Solo strings editoriales y cierres QHC; sin cambios a fórmulas ni cifras calculadas.

---

## Stacks y componentes

### `ImpactoAmbientalStack.tsx`
- **P2:** `NarrativeBridge` después del grid de 8 KPIs con CO₂e, PM2.5, contrafactual RSU/día y enlace operativo a M04.

### `ImpactoFinanciero.tsx`
- **P2:** `NarrativeBridge` después del grid de 4 KPIs (TIR, VPN, payback, WACC) con condicional Monte Carlo / M15.

### `MarketTraceabilityStack.tsx` (M14)
- **P2:** `NarrativeBridge` después de `RiskKpiRow` (6 chips).
- **P4:** subs «material» → «fracción»; «centros» → «centros de acopio».
- Aviso M02B/M02C y supuesto preliminar visible para score social.

### `SocialDemographicContextPanel.tsx`
- **P1:** kicker M06 genérico → M02 / M02B según `moduleAnchor`.
- **PASO 3:** `MunicipioDataAwaitingBanner` con IPC benchmark, fuente, alcance; CTA a `/hub`.

### `MapeoActoresBridge` (`renderDecisionModule.tsx`)
- **PASO 3:** banner con supuesto IPC para M14 + CTA levantamiento + Proyecto Vivo debajo.

### `MunicipioDataAwaitingBanner.tsx` *(nuevo)*
- Banner reutilizable PASO 3a–c: aviso, supuestos, enlace hub.

### `CostoOmisionStack.tsx`
- **P4:** «Ingresos por valorización» → «Ingresos por valorización de fracciones».

### `DecisionModuleShell.tsx` + `page.tsx` + `types/index.ts`
- **PASO 3d:** campo `nav_subtitle` + tag «Esperando datos del municipio» en M02/M02B/M02C cuando `dato` ≠ disponible/manual.

---

## Briefs (`moduleEditorialBriefs.ts`)

| Módulo | Cambio |
|--------|--------|
| antecedentes_municipales | hito → evento documentado |
| social_encuesta | trazabilidad → cadena de custodia de supuestos |
| organigrama_diagnostico | nodos → eslabones |
| marco_legal | criterio_decision desvinculado de sociodemografía |
| impacto_ambiental | material → fracción valorizable |
| escenarios_financieros | matriz de trazabilidad → matriz de fuentes |
| expediente_cabildo | copy modo validar (Cap. 1+3); cadena de custodia de evidencia |

---

## Documentación nueva

- `docs/audit/simulator_editorial_inventory.md`
- `docs/style/editorial_pattern_canonico.md`
- `docs/audit/simulator_editorial_diffs.md` (este archivo)
- `changelog/eidos.md` — entrada ola validar

---

## No modificado (fuera de alcance o ya conforme)

- Cálculos en `calculator.ts`, sliders numéricos, fórmulas Recharts.
- Módulos implementar-only (Cap. 2 y 4) salvo terminología compartida en briefs globales.
- Frases prohibidas P3: ninguna detectada en grep del frontend.
