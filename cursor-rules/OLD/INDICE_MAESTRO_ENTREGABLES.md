# Índice maestro de entregables — ALQUIMIA

**Norma SUPREME · Consultoría estratégica municipal**  
Fuente machine-readable: `backend/app/export/document_blueprints.py`  
Catálogo de canales: `CATALOGO_ENTREGABLES_CONSULTORIA.md`

---

## Estándar documental (McKinsey × BCG × ALQUIMIA)

Innovamos dentro de convenciones que Cabildo, tesorería y firmas tier-1 reconocen:

| Elemento | Convención | Implementación ALQUIMIA |
|----------|------------|-------------------------|
| Portada | Prepared for / Prepared by · Clasificación · Fecha | Tabla institucional + código doc **00–12** |
| Tipografía | Serif institucional | **Times New Roman** (Times-Roman PDF) |
| Índice | Títulos de **acción**, no genéricos | Cada § tiene *action title* en blueprint |
| Marco narrativo | SCQA (McKinsey) o Action (BCG) | Campo `frame` por documento |
| Exhibits | Tablas y figuras numeradas | Columna Exhibits en índice |
| Página de decisión | Qué debe resolver el cliente | Doc 01 §1 — obligatorio |
| Trazabilidad | Anexo auditable | Doc 07 + footer legal en todos los PDF |

---

## Inventario maestro (documento 00)

| Cód. | ID canónico | Título | Marco | Págs. obj. | Audiencia principal |
|------|-------------|--------|-------|------------|---------------------|
| **00** | `00_indice_maestro_paquete` | Índice maestro | Action | 4 | PMO · Auditor |
| **01** | `01_resumen_ejecutivo_municipal` | Resumen ejecutivo | SCQA | 4 | Cabildo · Alcalde |
| **02** | `02_modelo_tecnico_financiero` | Modelo técnico-financiero | Action | 20 | Tesorería · Finanzas |
| **03** | `03_diagnostico_reforma_*` | Diagnóstico jurídico | Legal | 25 | Jurídico · Sindicatura |
| **04** | `04_coordinacion_metropolitana` | Coordinación ZM | SCQA | 30 | Presidentes ZM |
| **05** | `05_manual_operativo_90_dias` | Manual 90 días | Operational | 40 | Operaciones |
| **06** | `06_guia_ciudadana_separacion` | Guía ciudadana | Citizen | 6 | Hogares · Comercio |
| **07** | `07_fuentes_trazabilidad` | Fuentes y trazabilidad | Audit | 15 | Auditor · PMO |
| **08** | `08_plan_rutas_recoleccion` | Plan de rutas | Operational | 8 | Recolección |
| **09** | `09_dimensionamiento_flota` | Dimensionamiento flota | Action | 10 | Adquisiciones |
| **10** | `10_segmentacion_territorial` | Segmentación territorial | Action | 8 | Presidencia |
| **11** | `11_cadena_suministro_comercializacion` | Cadena suministro | Action | 10 | Tesorería · CA |
| **12** | `12_expediente_inspeccion` | Acta inspección predial | Legal | 8 | Inspector · Jurídico |

**API PDF:** `POST /export/executive-pdf` · Índice: `POST /export/index-pdf` · Inspección: `POST /export/expediente-pdf`

---

## Estructura individual — Documento 01 (Resumen ejecutivo)

**Marco SCQA · ≤4 páginas**

### Portada
- ALQUIMIA · Prepared for Cabildo/Tesorería
- Título: Resumen ejecutivo municipal
- Clasificación: Confidencial — Uso institucional
- Código: **01**

### Índice de contenidos
1. Página de decisión — *Qué debe decidir el Cabildo en esta sesión*
2. Situación actual — *Brecha de circularidad medible*
3. Propuesta ALQUIMIA — *Captura progresiva con retorno*
4. Inversión y retorno — *CAPEX, TIR, payback*
5. Impacto y empleos — *CO₂e y empleos directos*
6. Riesgos principales — *Tres riesgos reversibles*
7. Próximos 30 días — *Secuencia post-autorización*
8. Tabla de decisión — *Autorizar · Diferir · Análisis adicional*

### Exhibits obligatorios
- Exhibit 1: Tablero KPI (6 cifras)
- Exhibit 2: Semáforo de viabilidad
- Exhibit 3: Línea de tiempo 30/90/180 días

---

## Estructura individual — Documento 02 (Modelo financiero)

**Marco Action · ≤20 páginas**

| § | Sección | Título de acción |
|---|---------|------------------|
| 1 | Supuestos | Qué gobierna TIR, VPN y payback |
| 2 | CAPEX/OPEX | Inversión por fase |
| 3 | Ingresos | Precios, volúmenes, compradores |
| 4 | Flujo de caja | Serie anual |
| 5 | Sensibilidad | Variables críticas |
| 6 | Stress tests | Escenarios adversos |
| 7 | Riesgos financieros | Residuales |
| 8 | Trazabilidad precios | Fuente y fecha |
| 9 | Anexo fórmulas | Reproducibilidad simulador |

**Formato principal:** XLSX (`05_Modelo_Financiero_CFO.xlsx`) · PDF resumen vía blueprint.

---

## Estructura individual — Documentos 03–11

Cada documento tiene blueprint completo en `document_blueprints.py` con:
- Portada propia (código 03–11)
- Índice con títulos de acción
- Esqueleto de secciones en PDF borrador
- Contenido sustantivo en pipeline ÁGORA (Markdown → DOCX)

Consultar `app/agents/document_specs.py` para criterios de bloqueo y fuentes mínimas por doc.

---

## Orden de lectura recomendado (Cabildo)

```
00 Índice maestro
 ↓
01 Resumen ejecutivo  →  DECISIÓN
 ↓
02 Modelo financiero  →  VALIDACIÓN TESORERÍA
 ↓
03 Diagnóstico jurídico  →  RUTA NORMATIVA
 ↓
07 Fuentes  →  AUDITORÍA
 ↓
05 + 08–11  →  EJECUCIÓN
```

---

## Estado de implementación PDF

| Capacidad | Estado |
|-----------|--------|
| Portada consultoría por documento | ✅ `consulting_pdf_builder.build_cover_page` |
| Índice de contenidos por documento | ✅ `build_toc_page` |
| KPIs productivos doc 01 | ✅ `build_kpi_section` |
| Esqueleto § doc 02–11 | ✅ `build_section_skeleton` |
| Índice maestro doc 00 | ✅ `POST /export/index-pdf` |
| Contenido sustantivo DOCX/MD | ✅ Pipeline ÁGORA |
| Expediente inspección (jsPDF) | ✅ Migrado — `POST /export/expediente-pdf` doc 12 |

SUPREME · Estándar documental v1.0
