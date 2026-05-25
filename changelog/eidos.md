# Changelog EIDOS

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
