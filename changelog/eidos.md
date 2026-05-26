# Changelog EIDOS

## 2026-05-22 (b) — Auditoría Modo Validar

### Publicado
- `docs/audit/simulator_editorial_inventory.md` — inventario de 19 módulos (Cap. 1 + Cap. 3)
- `docs/audit/simulator_editorial_diffs.md` — registro de cambios aplicados
- `docs/style/editorial_pattern_canonico.md` — patrón M13/rejilla (cifra + condicional + conclusión)

### Correcciones ejecutadas (copy + QHC)
- `ImpactoAmbientalStack.tsx` — NarrativeBridge post 8 KPIs (M01B)
- `ImpactoFinanciero.tsx` — NarrativeBridge post 4 KPIs financieros (M13)
- `MarketTraceabilityStack.tsx` — NarrativeBridge post 6 chips riesgo (M14); terminología fracción/CA
- `SocialDemographicContextPanel.tsx` — headers M02/M02B; banner datos municipales
- `MunicipioDataAwaitingBanner.tsx` — aviso PASO 3 + supuestos + CTA hub
- `renderDecisionModule.tsx` — M02C bridge con banner
- `moduleEditorialBriefs.ts` — P1/P4 en M03B, M15, antecedentes, social, organigrama, M13
- `CostoOmisionStack.tsx` — etiqueta valorización de fracciones
- `page.tsx` + `DecisionModuleShell` — tag nav «Esperando datos del municipio»
- `types/index.ts` — campo opcional `nav_subtitle`

## 2026-05-22

### Publicado
- `docs/style/glosario_canonico.md` — 24 entradas canónicas con variantes prohibidas
- `docs/style/guia_estilo.md` — registros ejecutivo/técnico y tono por audiencia
- `scripts/eidos_check_docs.py` — checker CI para Markdown en docs/, cursor-rules/, copy simulador

### Correcciones ejecutadas (copy)
- `frontend/src/components/simulator/GenerarPlanModal.tsx` — stakeholder → actores clave
- `frontend/src/data/moduleEditorialBriefs.ts` — stakeholders → actores en mesa correcta
- `cursor-rules/supreme.md` — stakeholders → partes interesadas (alertas gate)
- `cursor-rules/kronos.md` — stakeholders → partes interesadas
- `cursor-rules/prompt_maestro_ejecucion.md` — Alquimia SLP → ALQUIMIA
- `frontend/.../GuiaCircularidadStack.tsx` — M00 solo orientación; portadas en capítulos
- `frontend/.../ChapterIndex.tsx` — portada breve (`CHAPTER_PORTADA_INTRO`) sin duplicar M00

### CI
- Paso `EIDOS terminology check` en `.github/workflows/ci.yml`

### Ola PD&SA (2026-05-22)
- `cursor-rules/PD&SA.md` — stakeholder(s) → parte(s) interesada(s); estándares PMI traducidos al español
- `scripts/eidos_check_docs.py` — `PD&SA.md` en reglas activas; exclusiones explícitas `OLD/` y `ARCHIVOS VIEJOS/`
