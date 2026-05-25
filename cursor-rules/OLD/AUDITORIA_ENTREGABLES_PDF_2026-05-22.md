# Auditoría entregables PDF y alineación agentes

**Fecha:** 22 mayo 2026 · **Rol:** SUPREME  
**Alcance:** Índice maestro (00–12), `document_specs` ↔ blueprints ↔ PDF renderizado, gráficas, reglas de agentes, catálogo frontend.

---

## Veredicto ejecutivo

| Dimensión | Estado | Nota |
|-----------|--------|------|
| Índice maestro (docs) | ⚠️ Parcial | 00–12 definidos en blueprints; PDF índice omitía doc **12** (corregido en código) |
| Texto en PDFs | ❌ Incompleto | Solo doc **01** (parcial) y **12** (completo tabular) tienen contenido real; **02–11** = placeholder ÁGORA |
| Gráficas en PDFs | ❌ No implementadas | **0 de 15** figuras obligatorias renderizadas como gráfico en ReportLab |
| Agentes ↔ specs | ⚠️ Parcial | `document_specs` 01–11 alineado con ÁGORA; **doc 12** sin spec (corregido) |
| Catálogo / cursor-rules | ⚠️ Desactualizado | Doc 04 mal etiquetado como PPTX; jsPDF obsoleto (corregido en docs) |
| Frontend `consultingDeliverables.ts` | ⚠️ Incompleto | Listaba 6 ítems vs 13 códigos (corregido) |

**Conclusión:** La **estructura consultoría** (portada + índice + marco SCQA/Action) está bien diseñada, pero el pipeline PDF **no sustituye** aún el paquete ÁGORA/DOCX en contenido ni en gráficas. No mentir al usuario: los PDFs descargables hoy son **borradores estructurados**, no el paquete McKinsey/BCG final ilustrado.

---

## 1. Inventario canónico (00–12)

Fuente de verdad machine-readable: `backend/app/export/document_blueprints.py`  
Fuente agentes ÁGORA: `backend/app/agents/document_specs.py` (+ doc 12 añadido)

| Cód. | ID | En índice PDF | En `document_specs` | PDF con texto real | PDF con gráficas |
|------|-----|---------------|---------------------|-------------------|------------------|
| 00 | `00_indice_maestro_paquete` | Es el propio doc | N/A (meta) | Tabla 01–12 | No |
| 01 | `01_resumen_ejecutivo_municipal` | Sí | Sí | **Parcial** (§1,4,7) | No |
| 02 | `02_modelo_tecnico_financiero` | Sí | Sí | Placeholder | No (XLSX sí) |
| 03 | `03_diagnostico_reforma_*` | Sí | Sí (por municipio) | Placeholder | No |
| 04 | `04_coordinacion_metropolitana` | Sí | Sí | Placeholder | No |
| 05 | `05_manual_operativo_90_dias` | Sí | Sí | Placeholder | Gantt solo XLSX |
| 06 | `06_guia_ciudadana_separacion` | Sí | Sí | Placeholder | No |
| 07 | `07_fuentes_trazabilidad` | Sí | Sí | Placeholder | No |
| 08 | `08_plan_rutas_recoleccion` | Sí | Sí | Placeholder | No |
| 09 | `09_dimensionamiento_flota` | Sí | Sí | Placeholder | No |
| 10 | `10_segmentacion_territorial` | Sí | Sí | Placeholder | No |
| 11 | `11_cadena_suministro_comercializacion` | Sí | Sí | Placeholder | No |
| 12 | `12_expediente_inspeccion` | Sí (post-fix) | Sí (post-fix) | **Completo** tabular | No |

**Conteo producto:** PDSA habla de «12 documentos» del sector; el paquete real son **13 códigos** (00 meta + 01–11 núcleo + 12 inspección). Usar siempre **«paquete 00–12»** o **«13 entregables codificados»** para evitar ambigüedad.

---

## 2. Auditoría de texto — doc 01 (Resumen ejecutivo)

### Blueprint TOC (8 secciones) vs PDF renderizado

| § Blueprint | Título | ¿En PDF? | Contenido |
|-------------|--------|----------|-----------|
| 1 | Página de decisión | ✅ | Párrafo + score datos |
| 2 | Situación actual | ❌ | Omitido |
| 3 | Propuesta ALQUIMIA | ❌ | Omitido |
| 4 | Inversión y retorno | ✅ | Tabla KPI |
| 5 | Impacto y empleos | ❌ | Solo filas KPI si existen |
| 6 | Riesgos principales | ❌ | Omitido (riesgos genéricos estaban en versión anterior, no en KPI path) |
| 7 | Próximos 30 días | ❌ | Omitido |
| 8 | Tabla de decisión | ❌ | Omitido |

### `document_specs` § adicionales no en PDF

- Problema en 5 líneas, propuesta resumida, impacto ambiental narrativo, recomendación, **tabla de decisión requerida**
- Tablas obligatorias: Tablero KPI ✅ parcial · Tabla de decisión ❌

---

## 3. Auditoría de gráficas (`figuras_obligatorias`)

Ningún renderer en `backend/app/export/` usa `Image`, matplotlib ni SVG. Solo tablas ReportLab y `HRFlowable`.

| Doc | Figura exigida en spec | Dónde existe hoy | En PDF |
|-----|------------------------|------------------|--------|
| 01 | Semáforo de viabilidad | — | ❌ (solo color en texto score) |
| 01 | Línea de tiempo 30/90/180 | — | ❌ |
| 01 | Mapa simple de actores | — | ❌ |
| 02 | Waterfall de valor | — | ❌ |
| 02 | Tornado de sensibilidad | — | ❌ |
| 02 | Payback / flujo acumulado | — | ❌ (número en tabla) |
| 03 | Matriz brechas, ruta normativa, semáforo gate | — | ❌ |
| 04 | Mapa oleadas, gobernanza metropolitana | — | ❌ |
| 05 | Gantt 90 días | `06_Plan_De_Implementacion_Gantt.xlsx` | ❌ PDF · ✅ XLSX |
| 05 | Flujo de incidencias | — | ❌ |
| 06 | Pictogramas, mini flujo | — | ❌ |
| 07–11 | (vacío o N/A) | — | — |

**Total figuras nombradas en specs:** 15 · **Renderizadas en PDF:** 0 · **En XLSX:** 1 (Gantt)

---

## 4. Pipeline de exportación — qué produce cada canal

| Canal | PDFs generados | Contenido |
|-------|----------------|-----------|
| `POST /export/executive-pdf` | 1 por `document_id` | 01 parcial · 02–11 skeleton · 12 vía otro endpoint |
| `POST /export/index-pdf` | Doc 00 | Inventario + orden lectura |
| `POST /export/expediente-pdf` | Doc 12 | Acta completa |
| Hub `package_renderer` | **Solo** `08_Reporte_Ejecutivo.pdf` (= doc 01) | + DOCX MD vía ÁGORA · + XLSX financiero · + XLSX Gantt |
| ÁGORA ZIP base | Markdown 01–11 | Texto completo agentes · sin gráficas embebidas automáticas |

---

## 5. Alineación agentes

| Agente | Referencia entregables | ¿Correcta? |
|--------|------------------------|------------|
| **SUPREME** | `supreme.md` → protocolo documentos, multi-ciudad | ✅ Genérico OK |
| **EIDOS** | Glosario, copy, no cuenta hardcodeada | ✅ |
| **HERMES** | Logística → docs 08–11, reporte Markdown | ✅ No contradice índice |
| **KRONOS** | Finanzas → doc 02, EVM | ✅ |
| **PDSA** | Tabla 00–12 en §X | ✅ Alineada con blueprints |
| **ÁGORA `document_specs`** | 11 specs en `build_document_plan` | ⚠️ Doc 12 fuera del bundle escenario (correcto: es por inspección) |
| **CATALOGO** (pre-fix) | Doc 04 = «Presentación cabildo PPTX» | ❌ Debe ser coordinación metropolitana |
| **CATALOGO** (pre-fix) | Expediente jsPDF | ❌ Era ReportLab backend |

---

## 6. Discrepancias blueprint ↔ `document_specs` (profundidad TOC)

Los blueprints son **spine ejecutivo** (McKinsey/BCG); los specs son **checklist editorial ÁGORA**. No deben ser idénticos, pero el PDF debe **enumerar** todas las secciones del spec o enlazar al DOCX.

| Doc | § spec | § blueprint | Riesgo |
|-----|--------|-------------|--------|
| 05 | 10 | 6 | Manual operativo — 4 secciones spec sin § en PDF |
| 07 | 9 | 5 | Trazabilidad — fórmulas y fechas de consulta omitidas en TOC PDF |
| 08–11 | 6–7 | 3–4 | Logística HERMES — detalle operativo solo en MD |

**Recomendación:** Ampliar TOC PDF para **reflejar 100% de `secciones_obligatorias`** aunque el cuerpo siga siendo placeholder hasta merge ÁGORA→PDF.

---

## 7. Plan de remediación priorizado

### P0 — Integridad de producto (no omitir promesas)

1. **Gráficas doc 01:** Semáforo (DrawingReportLab), línea 30/90/180 (tabla timeline), mapa actores (simplificado)
2. **Completar texto doc 01:** §2–3, 5–6, 8 desde `resultados` + `snapshot_datos` + plantillas SCQA
3. **Merge ÁGORA→PDF:** Inyectar Markdown/DOCX renderizado en `build_section_skeleton` para 02–11

### P1 — Consistencia índice y agentes

4. ✅ Índice PDF incluye doc 12 (aplicado)
5. ✅ `document_specs` doc 12 + catálogo frontend 00–12 (aplicado)
6. Ampliar TOC blueprints = `secciones_obligatorias` literales
7. Etiquetar en UI S20: «Borrador estructural — contenido completo en ZIP ÁGORA»

### P2 — Gráficas restantes

8. Doc 02 charts → matplotlib/reportlab en PDF o referencia embebida «Ver Exhibit N en XLSX»
9. Doc 05 Gantt → rasterizar hoja Gantt XLSX a imagen en PDF
10. Doc 06 pictogramas → assets estáticos por fracción RSU

---

## 8. Checklist de verificación (smoke)

```bash
# Backend
pytest backend/tests/test_executive_pdf_export.py -q

# Manual
# 1. S20 → Índice maestro → PDF debe listar filas 01–12
# 2. S20 → PDF Ejecutivo → portada + TOC 8 § + KPI table
# 3. Inspección → expediente → PDF 12 con 6 § tabulares
# 4. Hub → ZIP profesional → 08_Reporte_Ejecutivo.pdf + XLSX (Gantt ≠ PDF)
```

---

## Referencias

- `backend/app/export/document_blueprints.py`
- `backend/app/agents/document_specs.py`
- `cursor-rules/INDICE_MAESTRO_ENTREGABLES.md`
- `cursor-rules/CATALOGO_ENTREGABLES_CONSULTORIA.md`
- `cursor-rules/PDSA_ARQUITECTURA_MODULAR.md` §X

SUPREME · Auditoría Wave 2 documental
