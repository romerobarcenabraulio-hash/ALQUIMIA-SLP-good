# Dead Code Scan · 2026-06-01

## Decision

`DEAD CODE SCAN: PARTIAL_WITH_MICRO_CLEANUP`

The requested tools could not run through `npx` because the sandbox could not resolve `registry.npmjs.org`. A conservative micro-cleanup was applied only after a local zero-reference pass and TypeScript verification.

## Commands attempted

| Command | Result | Evidence |
| --- | --- | --- |
| `npx ts-prune` | `FAIL_TOOLING` | Interactive/no output, then `npx --yes ts-prune` failed with `ENOTFOUND registry.npmjs.org` |
| `npx depcheck` | `FAIL_TOOLING` | Interactive/no output, then `npx --yes depcheck` failed with `ENOTFOUND registry.npmjs.org` |
| `npx unimported` | `FAIL_TOOLING` | Interactive/no output, then `npx --yes unimported` failed with `ENOTFOUND registry.npmjs.org` |
| `npx knip` | `FAIL_TOOLING` | Interactive/no output, then `npx --yes knip` failed with `ENOTFOUND registry.npmjs.org` |
| `rg` / local Node scan | `PASS_PARTIAL` | Local static scan completed without installing packages |
| `npm run type-check` after micro-cleanup | `PASS` | `tsc --noEmit` exited 0 |

## Local inventory

| Item | Count |
| --- | ---: |
| TS/TSX/JS/JSX files under `frontend/src` | 483 |
| Export declarations detected | 1260 |
| Candidate unimported source files | 40 |
| Candidate exports without textual external reference | 435 |
| Candidate package dependencies without direct source import | 41 |

## Candidate unimported files

These are static-analysis candidates only. Do not delete without a second pass because some files may be App Router conventions, quarantine references, future-stage manifests, or dynamically referenced assets.

### Stronger review candidates

These files had no textual references outside themselves in the local scan. Six low-risk files were deleted in the follow-up micro-cleanup:

- `frontend/src/components/charts/ContadorOportunidad.tsx` — `DELETED`
- `frontend/src/components/charts/VolumenBarChart.tsx` — `DELETED`
- `frontend/src/components/simulator/AdvertenciasGateLegal.tsx`
- `frontend/src/components/simulator/BenchmarkLATAM.tsx`
- `frontend/src/components/simulator/CircularityBaselineCard.tsx`
- `frontend/src/components/simulator/CitizenPreviewPanel.tsx`
- `frontend/src/components/simulator/ComparadorEscenarios.tsx`
- `frontend/src/components/simulator/ContainersProvider.tsx`
- `frontend/src/components/simulator/DespliegueOperativoCaRecicladoraChart.tsx`
- `frontend/src/components/simulator/EditorTrayectoria.tsx`
- `frontend/src/components/simulator/EducacionFuncionarioIntro.tsx`
- `frontend/src/components/simulator/FlujosSankey.tsx`
- `frontend/src/components/simulator/GuidedPlanControls.tsx`
- `frontend/src/components/simulator/HorizonteCircularidad.tsx`
- `frontend/src/components/simulator/OperacionCampo.tsx`
- `frontend/src/components/simulator/Precolocacion.tsx`
- `frontend/src/components/simulator/PropuestasSimulatorBar.tsx`
- `frontend/src/components/simulator/SelectorZM.tsx`
- `frontend/src/components/simulator/SimulatorModuleErrorBoundary.tsx`
- `frontend/src/components/ui/NoDataState.tsx` — `DELETED`
- `frontend/src/components/ui/SectionHeader.tsx` — `DELETED`
- `frontend/src/data/sankeyData.ts`
- `frontend/src/lib/audienceModeLabel.ts` — `DELETED`
- `frontend/src/lib/ganttExport.ts`
- `frontend/src/lib/landingReferenceKpis.ts` — `DELETED`

Remaining review candidates:

- `frontend/src/components/simulator/AdvertenciasGateLegal.tsx`
- `frontend/src/components/simulator/BenchmarkLATAM.tsx`
- `frontend/src/components/simulator/CircularityBaselineCard.tsx`
- `frontend/src/components/simulator/CitizenPreviewPanel.tsx`
- `frontend/src/components/simulator/ComparadorEscenarios.tsx`
- `frontend/src/components/simulator/ContainersProvider.tsx`
- `frontend/src/components/simulator/DespliegueOperativoCaRecicladoraChart.tsx`
- `frontend/src/components/simulator/EditorTrayectoria.tsx`
- `frontend/src/components/simulator/EducacionFuncionarioIntro.tsx`
- `frontend/src/components/simulator/FlujosSankey.tsx`
- `frontend/src/components/simulator/GuidedPlanControls.tsx`
- `frontend/src/components/simulator/HorizonteCircularidad.tsx`
- `frontend/src/components/simulator/OperacionCampo.tsx`
- `frontend/src/components/simulator/Precolocacion.tsx`
- `frontend/src/components/simulator/PropuestasSimulatorBar.tsx`
- `frontend/src/components/simulator/SelectorZM.tsx`
- `frontend/src/components/simulator/SimulatorModuleErrorBoundary.tsx`
- `frontend/src/data/sankeyData.ts` — `DELETED`
- `frontend/src/lib/ganttExport.ts` — `DELETED`

### Likely false positives or quarantine/review candidates

- `frontend/src/app/global-error.tsx`: App Router convention; do not delete based only on import graph.
- `frontend/src/components/platform/StageWorkspace.tsx`: referenced by legacy quarantine and tests.
- `frontend/src/components/landing/WalkthroughArticle.tsx`: referenced by client-facing guardrail tests.
- `frontend/src/components/ui/Card.tsx`: imported/referenced across UI; scanner import normalization flagged it incorrectly.
- `frontend/src/data/socialStats/index.ts`: referenced by routes/scripts/middleware and should not be deleted.
- `frontend/src/components/simulator/CityFirstSelector.tsx`: referenced by `PlanGlobalControlsBar.tsx`.
- `frontend/src/components/simulator/ImpactoAmbiental.tsx`: referenced by stack components.
- `frontend/src/components/simulator/Macrogeneradores.tsx`: referenced by export/package/engine files.
- `frontend/src/components/simulator/ScoreViabilidad.tsx`: referenced by recommendation components.

## Candidate dependencies needing real `depcheck`/`knip`

The local scan can only find textual package references. Tooling packages and peer dependencies may be valid even with no direct import.

Dependencies with no direct textual reference outside `package.json` / lockfile:

- `@radix-ui/react-checkbox`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-progress`
- `@radix-ui/react-select`
- `@radix-ui/react-slider`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
- `@radix-ui/react-tooltip`
- `axios`
- `class-variance-authority`
- `date-fns`
- `framer-motion`
- `jose`
- `jspdf`
- `mapbox-gl`
- `numeral`
- `react-intersection-observer`
- `usehooks-ts`

Dev/tooling/type packages with no direct textual source reference:

- `@types/d3`
- `@types/mapbox-gl`
- `@types/node`
- `@types/numeral`
- `@types/react`
- `@types/react-dom`
- `@types/geojson`
- `@types/google.maps`
- `@testing-library/dom`
- `postcss`
- `react-dom`

## Required next safe step

When network is available, install or run the real scanners and compare with this conservative report:

```bash
cd /Users/braulioromerobarcena/Documents/alquimia-slp/frontend
npx --yes ts-prune
npx --yes depcheck
npx --yes unimported
npx --yes knip
```

Only delete a file or dependency when all of these are true:

1. The scanner flags it.
2. `rg` finds no runtime, route, test, manifest, or quarantine reference.
3. `npm run type-check` passes after removal.
4. Relevant tests pass after removal.
5. The removal does not touch client-facing copy, auth, landing, ZIP/export, or diagnostic pipeline unless the owning task explicitly allows it.

## Residual risk

- `npx` scanners were not available because of network/DNS failure.
- The local scan is intentionally conservative and may over-report unused exports and dependencies.
- No deletion was applied.
