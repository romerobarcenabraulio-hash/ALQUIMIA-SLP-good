# Catálogo de entregables — consultoría ALQUIMIA

**Norma SUPREME · 22 mayo 2026**  
Fuente de verdad para qué documentos entrega la plataforma, a quién van dirigidos y por qué canal se distribuyen.

---

## Principios de entrega

| Principio | Regla |
|-----------|--------|
| Tipografía PDF | **Times New Roman** (Times-Roman en motor ReportLab) |
| Tono | Consultoría municipal de élite — portada, secciones numeradas, tablas KPI, aviso legal |
| Trazabilidad | Cada PDF incluye score de datos, fuentes y advertencias del escenario |
| Cadena de custodia | Documento legal firmado ≠ borrador algorítmico (ver S7) |
| No sustitución | Ningún PDF sustituye acto de autoridad ni dictamen certificado |

---

## Matriz de entregables (servicio sectorial RSU)

| ID | Documento | Formatos | Audiencia | Tier | Canal de generación |
|----|-----------|----------|-----------|------|---------------------|
| 01 | Resumen ejecutivo municipal | PDF, DOCX | Alcalde · Cabildo | Profesional | `POST /export/executive-pdf` · ZIP ÁGORA profesional |
| 02 | Modelo técnico-financiero | XLSX, PDF | Tesorería · Financieros | Profesional | Hub → render profesional → `05_Modelo_Financiero_CFO.xlsx` |
| 03 | Diagnóstico jurídico | DOCX, MD | Jurídico municipal | Profesional | ZIP ÁGORA base/profesional |
| 04 | Coordinación metropolitana | DOCX, MD, PDF borrador | Presidentes ZM | Profesional | ZIP ÁGORA · `document_id=04_coordinacion_metropolitana` |
| 05 | Manual operativo 90 días | DOCX, PDF | Operaciones · Concesionario | Borrador | ZIP ÁGORA |
| 06 | Carta ciudadana | DOCX | Comunicación social | Borrador | ZIP ÁGORA |
| 07 | Matriz de trazabilidad | MD, PDF borrador | Auditor · PMO | Borrador | ZIP ÁGORA · doc 07 vía `executive-pdf` |
| 08–11 | Anexos logísticos (HERMES) | MD/DOCX, PDF borrador | Técnico | Borrador | ZIP ÁGORA |
| 12 | Acta inspección / expediente | PDF | Inspección municipal | Borrador técnico | `POST /export/expediente-pdf` |
| — | Paquete integral | ZIP | Equipo completo | Cabildo | `fetchAgoraPlanZip` + render profesional |

---

## Canales en producto (UI)

### 1. Borrador PDF rápido (simulador)
- **Botón:** «Exportar borrador PDF» (barra de módulo, header, footers M03/M05)
- **API:** `POST /export/executive-pdf`
- **Entrega:** descarga directa `.pdf` Times New Roman
- **Requisito:** línea base calculada (`resultados` en store)

### 2. Paquete S20 — Exportar
- **PDF Ejecutivo** → `executive-pdf`
- **Excel CFO** → redirección `/hub` (render XLSX)
- **Compartir URL** → clipboard del escenario
- **Genera mi plan** → modal ÁGORA + Drive
- **Genera mi plan completo (ÁGORA)** → ZIP Markdown + manifest

### 3. Hub documental (`/hub`)
- ZIP base (Markdown)
- Render profesional → DOCX + XLSX + PDF
- ZIP profesional descargable

### 4. Expediente cabildo (M06)
- Previsualización secciones → `POST /export/report` (JSON)
- **Descargar PDF ejecutivo** → `executive-pdf` con secciones seleccionadas en `module_label`

### 5. Inspección predial
- **Generar PDF** → scroll a expediente generado; descarga acta vía `ExpedientePDF`

---

## Flujo recomendado para cabildo

```mermaid
flowchart LR
  A[Simulador M01–M09] --> B[Validar score datos]
  B --> C{¿Listo?}
  C -->|Sí| D[PDF ejecutivo borrador]
  C -->|No| E[Corregir advertencias]
  D --> F[ÁGORA ZIP profesional]
  F --> G[Hub render DOCX/XLSX/PDF]
  G --> H[Entrega institucional]
```

---

## Referencias cruzadas

- `cursor-rules/AUDITORIA_ENTREGABLES_PDF_2026-05-22.md` — **auditoría texto/gráficas/PDF**
- `cursor-rules/INDICE_MAESTRO_ENTREGABLES.md` — índice maestro + estructura por documento
- `backend/app/export/document_blueprints.py` — blueprints PDF (portada + TOC + §)
- `backend/app/agents/document_specs.py` — especificaciones 01–11
- `backend/app/export/pdf_renderer.py` — layout consultoría Times New Roman
- `frontend/src/lib/consultingDeliverables.ts` — catálogo tipado frontend
- `RESPUESTA_SUPREME_A_EIDOS_2026-05-22.md` — decisiones S1–S11

SUPREME · Wave 2 cierre documental
