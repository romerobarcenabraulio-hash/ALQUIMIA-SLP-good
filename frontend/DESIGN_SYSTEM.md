# DESIGN SYSTEM — ALQUIMIA
**Versión:** 1.0  
**Fecha:** 2026-06-17  
**Mantenedor:** Aesthete-1 (ALQUIMIA agent spec)  
**Fuentes canónicas** (no modificar sin actualizar estas fuentes):

| Fuente | Ruta |
|--------|------|
| Estándar editorial McKinsey/Minto | `docs/architecture/FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md` |
| Constitución estética y a11y | `cursor-rules/OLD/AESTHETE-1.md` |
| Design tokens (anti-drift) | `AJUSTES.ALQUIMIA/archivos_ejecutados/mayo_2026_semana_1_8/25_tokens_y_design_as_code.md` |
| Módulos y mockups | `FRONTEND DEFINITIVO/MODULE_MAP.md` + PNGs en esa carpeta |
| Tokens vivos CSS/Tailwind | `frontend/src/app/globals.css` · `frontend/tailwind.config.ts` |
| Componentes editoriales | `frontend/src/components/editorial/` |

---

## 1. Principio editorial rector

> _"La página debe leerse como reporte ejecutivo interactivo."_  
> — FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md §1

El orden de lectura **es invariable**:

1. **Conclusión ejecutiva** — primero, siempre.
2. **Cifra o hallazgo protagonista** — inmediatamente después.
3. **Evidencia mínima** — visible sin scroll.
4. **Detalle secundario** — en tabla limpia, línea tipográfica o lista.

### Lo que nunca aparece

- Cajas decorativas con fondo de color.
- Cards anidadas dentro de cards.
- Fondos de color como contenedor (no como dato/estado).
- Ribbons y bloques de metodología antes de la tesis.
- Sombras densas (`shadow-md` hacia arriba queda fuera del estándar).
- Bordes en cada cuadro (whitespace reemplaza bordes).
- Labels redundantes (`LISTO`, `Demo`, `Acción:`, `Resultado:`).
- Scrolls infinitos (usar progressive disclosure).
- Tooltips que ocultan información crítica.

El color se usa **únicamente** para: estado de semáforo, cifra protagonista, riesgo.  
Fuente: FASE8 §1; AESTHETE-1 §9.

---

## 2. Estándares anclados (pisos, no aspiraciones)

| Dominio | Estándar | Umbral obligatorio |
|---------|----------|--------------------|
| Accesibilidad | **WCAG 2.2 AA** + **WAI-ARIA 1.2** | Piso mínimo sin excepción |
| Contraste texto normal | WCAG 1.4.3 | 4.5 : 1 |
| Contraste texto grande (≥ 18.66px reg / 14px bold) | WCAG 1.4.3 | 3 : 1 |
| Contraste UI (íconos, bordes con info) | WCAG 1.4.11 | 3 : 1 |
| Foco visible | WCAG 2.4.11 | Siempre; contraste ≥ 3:1 con adyacentes |
| Targets de toque | WCAG 2.5.8 | ≥ 24 × 24 CSS px (preferible 44 × 44) |
| Movimiento | WCAG 2.3.3 | Respetar `prefers-reduced-motion` |
| Color único | WCAG 1.4.1 | Nunca único transmisor — texto/ícono/patrón redundante |
| Diseño centrado en humanos | ISO 9241-210:2019 | — |
| Principios de interacción | ISO 9241-110:2020 | — |
| Presentación de información | ISO 9241-112:2017 | — |
| Heurísticas de usabilidad | Nielsen 10 Heuristics | SUS ≥ 80 |
| Tipografía | Bringhurst — *The Elements of Typographic Style* | — |
| Visualización de datos | Tufte (data-ink ratio) + Cairo | Data-ink ratio ≥ 0.6 |
| Tokens | W3C Design Tokens Community Group draft | — |
| Color perceptual | **OKLCH** | Sustituye HSL en cualquier paleta nueva |
| Carga cognitiva | NASA-TLX; SUPR-Q | — |
| Anti-dark patterns | catálogo deceptive.design | — |

Fuente: AESTHETE-1 §2, §5.

**Cualquier diseño que falle uno de estos umbrales NO se entrega a implementación.**

---

## 3. Las tres leyes de armonía

### 3.1 Ley del Silencio Visual

> _"Si un elemento no comunica, estorba."_

- **Data-ink ratio (Tufte) ≥ 0.6** en visualizaciones.
- **Espaciado mínimo entre bloques semánticos:** `spacing.xl` = `--sp-8: 32px`.
- **Densidad por audiencia:**
  - **Citizen:** 1 idea principal por pantalla (progressive disclosure agresivo).
  - **Official:** ≤ 3 ideas con anclaje legal por pantalla.
  - **Entrepreneur:** ≤ 4 KPIs comparados por pantalla.

### 3.2 Ley de la Unión Narrativa — componente `NarrativeBridge`

**Prohibido** entregar una gráfica o cifra sin texto de interpretación.

```typescript
// frontend/src/components/editorial/ (spec formal)
type NarrativeBridge = {
  audience: "citizen" | "official" | "entrepreneur";
  data_source: () => ComputedState;           // OBLIGATORIO: derivado, no estático
  summary: (s: ComputedState) => string;      // ≤ 220 caracteres, variable real
  what_it_means: (s: ComputedState) => string;
  what_to_do: (s: ComputedState) => string;
  confidence: "alta" | "media" | "baja" | "indicativa";
  provenance_ref: string;                     // ref a DataProvenance
  authority_level: "simulation" | "proposal" | "official";
};
```

**Válido:** _"Bajo 2,000 escenarios de estrés, SLP mantiene viabilidad en el 90% de los casos. La incertidumbre es tu margen de maniobra presupuestal."_  
**Inválido (veto automático):** _"Este gráfico muestra los resultados del análisis."_ → copy estático.

Fuente: AESTHETE-1 §3.2.

### 3.3 Ley de Jerarquía de Autoridad (tipografía)

| Rol | Fuente | Uso |
|-----|--------|-----|
| Autoridad / gravitas | **Serif** (Literata / Georgia) | Encabezados editoriales, frases de autoridad, citas legales, nombres de norma |
| Datos / técnica | **Sans-Serif** (Source Sans / Inter) | Datos numéricos, KPIs, métricas, controles UI |
| Identificadores | **Mono** (JetBrains Mono) | Código, IDs, folios, claves INEGI, hashes |

**Parejas activas en el sistema:**
- Serif: `--font-literata` → `Georgia, "Times New Roman", serif` (globals.css)
- Sans: `--font-source-sans` → `system-ui, -apple-system, …, sans-serif`
- Mono: `JetBrains Mono, Consolas, monospace`

**Escala tipográfica** (tailwind.config.ts):

| Token | Tamaño | Leading | Uso |
|-------|--------|---------|-----|
| `hero` | 52px | 1.0 | Cifra protagonista de portada |
| `h1` | 38px | 1.05 | Título de módulo |
| `h2` | 28px | 1.1 | Subtítulo de sección |
| `h3` | 20px | 1.2 | Encabezado de bloque |
| `base` | 14px | 1.6 | Cuerpo de texto |
| `label` | 12px | 1.3 | Etiquetas UI, metadata |
| `micro` | 10px | 1.0 | Provenance, notas al margen |

**Ancho de columna de lectura:** 45–75 caracteres (Bringhurst).  
Fuente: AESTHETE-1 §3.3.

---

## 4. Sistema de design tokens

### 4.1 Jerarquía de tres niveles (W3C draft)

1. **Primitivos** — valores absolutos (`--gray-900`, `--sp-8`).
2. **Semánticos** — intent (`--surface-base`, `--surface-muted`, `--surface-border`).
3. **De componente** — vinculados a un componente (`editorial.conclusion`, `editorial.sectionLabel`).

**Regla inamovible:** ningún valor hex/px crudo en un componente. Todo valor debe venir de un token. Violación → VETO Aesthete-1.

### 4.2 Tokens primitivos activos (globals.css · tailwind.config.ts)

#### Superficies

| Token CSS | Valor | Uso semántico |
|-----------|-------|---------------|
| `--surface-base` | `#FFFFFF` | Fondo de página |
| `--surface-muted` | `#F8FAF8` | Fondo de sección secundaria |
| `--surface-border` | `#ECEAE6` | Separadores, bordes ligeros |

#### Grises cálidos (neutrales)

| Token CSS | Valor | Tailwind alias |
|-----------|-------|----------------|
| `--gray-200` | `#E2DED6` | `gray-200c` |
| `--gray-400` | `#A8A49C` | `gray-400c` |
| `--gray-600` | `#6B6760` | `gray-600c` |
| `--gray-900` | `#1C1B18` | `gray-900c` — texto principal |

#### Verde Alquimia (marca / éxito)

| Token CSS | Valor | Tailwind alias |
|-----------|-------|----------------|
| `--green-50` | `#EAF3DE` | `green-50a` |
| `--green-500` | `#3B6D11` | `green-500a` — color de marca |
| `--green-600` | `#2D5409` | `green-600a` |
| `--green-700` | `#1F3B06` | `green-700a` |

#### Ámbar (advertencia)

| Token | Valor | Uso |
|-------|-------|-----|
| `--amber-50` | `#FEF7E7` | Fondo de alerta leve |
| `--amber-300` | `#F6C84B` | Acento visual |
| `--amber-500` | `#D4881E` | Advertencia texto |
| `--amber-700` | `#8A4F08` | Advertencia oscura |

#### Azul datos (información / oficial)

| Token | Valor | Uso |
|-------|-------|-----|
| `--blue-50` | `#EBF3FB` | Fondo informativo |
| `--blue-600` | `#1A5FA8` | Dato, enlace |
| `--blue-900` | `#051D45` | Autoridad alta |

#### Rojo (riesgo / error)

| Token | Valor | Uso |
|-------|-------|-----|
| `--red-50` | `#FBEAEA` | Fondo de error |
| `--red-500` | `#C0392B` | Error, riesgo crítico |

#### Materiales RSU (vocabulario visual de dominio)

| Token | Valor | Fracción |
|-------|-------|----------|
| `--mat-organico` | `#639922` | Orgánico |
| `--mat-papel` | `#D4881E` | Papel/Cartón |
| `--mat-plastico` | `#1A5FA8` | Plástico |
| `--mat-vidrio` | `#1D9E75` | Vidrio |
| `--mat-aluminio` | `#8B6B4A` | Aluminio/Metal |
| `--mat-otros` | `#A8A49C` | Otros |

#### Espaciado (8-point grid)

| Token | Valor | Semántico |
|-------|-------|-----------|
| `--sp-1` | 4px | micro |
| `--sp-2` | 8px | xs |
| `--sp-3` | 12px | sm |
| `--sp-4` | 16px | md |
| `--sp-6` | 24px | lg |
| `--sp-8` | 32px | **xl — mínimo entre bloques semánticos** |
| `--sp-12` | 48px | 2xl |
| `--sp-16` | 64px | 3xl |

#### Radios y sombras

| Token | Valor |
|-------|-------|
| `--r-sm` | 6px |
| `--r-md` | 10px |
| `--r-lg` | 14px |
| `--r-xl` | 20px |
| `--shadow-sm` | `0 1px 3px rgba(28,27,24,.07)` — única sombra permitida en componentes |
| `--shadow-md` | `0 4px 12px rgba(28,27,24,.08)` — solo en modales/overlays |
| `--shadow-lg` | `0 8px 24px rgba(28,27,24,.10)` — prohibida en módulos de datos |

### 4.3 Nota sobre OKLCH

Los tokens actuales están en HEX (heredados). **Toda paleta nueva** debe definirse en OKLCH para uniformidad perceptual (AESTHETE-1 §4, §2). Migración incremental: al agregar escala nueva, usar `oklch(L% C H)` en CSS.

Fuente: 25_tokens_y_design_as_code.md; AESTHETE-1 §4.

---

## 5. Componentes editoriales (librería activa)

Ruta: `frontend/src/components/editorial/`

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `Conclusion` | `Conclusion.tsx` | Frase de apertura/cierre — serif 22-23px, sin caja ni borde. Única entrada al módulo. |
| `AnchorFigure` | `AnchorFigure.tsx` | Cifra protagonista a 28px + contexto a 14px |
| `KpiAnchorGrid` | `KpiAnchorGrid.tsx` | Grid 2/3/4 columnas de `AnchorFigure` — reemplaza cards de KPI |
| `SectionLabel` | `SectionLabel.tsx` | Etiqueta de sección — sans 11px, uppercase, tracking 0.14em, gris |
| `Recommendation` | `Recommendation.tsx` | Cuerpo serif 16px para recomendaciones de autoridad |
| `MarginalNote` | `MarginalNote.tsx` | Nota al margen — sans 12px, gris — para provenance y disclaimers |
| `EditorialClose` | `EditorialClose.tsx` | Cierre de módulo con NarrativeBridge |
| `EditorialMetric` | `EditorialMetric.tsx` | Métrica con delta y semáforo |
| `EditorialCallout` | `EditorialCallout.tsx` | Callout sin caja decorativa — solo borde izquierdo o tipografía |
| `EditorialStatusLabel` | `EditorialStatusLabel.tsx` | Badge de estado con tone (`success/warning/error/neutral`) |

**Exportados desde:** `frontend/src/components/editorial/index.ts`

**Tokens compartidos internos:** `editorialStyles.ts` — los strings de clase Tailwind son los únicos "tokens de componente" del sistema editorial.

### Regla de los 8 estados obligatorios

Todo componente que salga a producción debe tener especificados:

`loading · empty · error · blocked · warning · success/result · disabled · skeleton`

Componente sin los 8 estados no se entrega a implementación. Fuente: AESTHETE-1 §6.

---

## 6. Visualizaciones permitidas y prohibidas

### Permitidas (vocabulario canónico del proyecto)

| Visualización | Uso |
|---------------|-----|
| **Sankey** | Flujos de dinero/basura entre etapas |
| **Timeline horizontal** | Leyes, fases, decisiones |
| **Mapa de calor (Mapbox)** | Logística y densidad espacial |
| **Tornado chart** | Sensibilidad financiera — solo audiencia Entrepreneur |
| **Small multiples** (Tufte) | Comparación entre Municipios o ZMs |
| **Distribuciones P5/P25/P50/P75/P95** | Monte Carlo — nunca solo la media |

### Prohibidas (veto automático Aesthete-1)

| Visualización | Razón |
|---------------|-------|
| Pie chart con > 5 segmentos | Usar barras horizontales |
| Gráficas 3D | Sin excepción |
| Doble eje Y heterogéneo | Salvo ADR que lo justifique |
| Word clouds | Siempre |
| Gradientes decorativos en datos | Data-ink ratio |
| Animaciones en loop | Carga cognitiva + reduced-motion |

Fuente: AESTHETE-1 §7.

---

## 7. Segmentación de audiencias

| Vector | Citizen | Official | Entrepreneur |
|--------|---------|----------|--------------|
| Tipografía dominante | Sans + Serif solo en headlines | Serif autoridad + Sans datos | Sans dominante; Mono para IDs |
| Densidad | Baja — 1 idea/pantalla | Alta con anclas legales | Media — foco en deltas |
| Visual primario | Iconografía + analogías | Tablas referenciadas + citas | KPIs + flujos de caja + sensibilidad |
| Color | Cálidos institucionales | Sobrios, alta autoridad | Sobrios, contraste para señales |
| Llamada a acción | Aprender / participar | Firmar / autorizar | Invertir / cotizar |
| Visualización ejemplo | Infografía isotipo | Tabla comparativa con artículos | Tornado chart |

**Mezcla = veto.** Tornado chart a Citizen sin puente narrativo es violación de segmentación.

Módulos por audiencia: `frontend/src/lib/audienceModules.ts`  
Fuente: AESTHETE-1 §8.

---

## 8. Mapa de módulos (MODULE_MAP.md)

| Row ID | Módulo backend | Audiencia | Componentes principales |
|--------|---------------|-----------|------------------------|
| **M01** | `city_baseline` | Citizen + Functionary | `SectionHero`, `ImpactoAmbiental`, `MultiplicadoresEco` |
| **M02** | `municipal_context` | Citizen + Functionary | `SocialDemographicContextPanel`, `MarcoLegal`, `CoberturaNacional` |
| **M04** | `infrastructure_operations` | Functionary | `CentrosAcopio`, `Logistica`, `OperacionPERBitacora`, `PortalEmpresarial`, `FlujosResiduos`, `SankeyFlujoResiduos`, `HojaRuta` |
| **M06** | `scenarios_export` | Functionary | `ImpactoFinanciero`, `ExportarSection`, `DashboardKPIs`, `AlertasPanel`, `GovernancePanel`, `LaunchChecklist` |
| **M07** | `market_traceability` | Functionary | `ReasoningGraphPanel` |
| **M08** | `risk_trends` | Functionary | `RiskTrendsPanel` |
| **INS** | `inspeccion_predios` | Functionary | `InspeccionForm` |
| **META** | `future_goals` | Functionary | `FutureGoalsModule` |
| **CIT1** | `citizen_inputs` | Citizen | `EducacionCiudadana` |
| **CIT2** | `impact_finance` | Citizen | `ImpactoAmbiental`, `MultiplicadoresEco` (vista lite) |
| **ORG** | `organization_profile` + `market_traceability` | Entrepreneur | `DeclaracionWizard`, `PortalEmpresarial`, `ExportarSection` |
| **TRACE** | `source_traceability` | Functionary | `ReferenciasCalculos` |

Mockups de referencia visual: `FRONTEND DEFINITIVO/*.png`  
Fuente completa: `FRONTEND DEFINITIVO/MODULE_MAP.md`

---

## 9. Prohibiciones absolutas (purga visual)

Las siguientes son **infracciones graves** visibles en pantallas de producción:

- `Evidencia:` huérfano (sin contenido debajo).
- Texto `LISTO`, `Demo`, `placeholder` en UI real.
- Grises/indigo planos donde el contexto pide tipografía serif de autoridad.
- Bordes en cada contenedor (reemplazar con whitespace y jerarquía tipográfica).
- Sombras `shadow-2xl` o `drop-shadow` excesivos.
- Etiquetas redundantes cuando el componente ya comunica su contenido.
- NarrativeBridge con copy estático (string literal, no derivado de `ComputedState`).
- Token hex crudo en componente.

Fuente: AESTHETE-1 §9, §15.

---

## 10. Checklist de auto-auditoría (antes de PR)

Antes de cualquier entrega de componente o módulo nuevo:

- [ ] Los 8 estados están documentados (`loading`, `empty`, `error`, `blocked`, `warning`, `success/result`, `disabled`, `skeleton`).
- [ ] Cada par texto/fondo pasa WCAG 2.2 AA (4.5:1 texto normal, 3:1 texto grande).
- [ ] Ningún valor hex/px crudo en el componente — todo via token.
- [ ] `NarrativeBridge` presente en cada dato cuantitativo, derivado de `ComputedState`, no estático.
- [ ] Tipografía coherente con jerarquía §3.3 (Serif autoridad, Sans datos, Mono IDs).
- [ ] Visualización dentro del catálogo §6 (o ADR firmado que la justifique).
- [ ] Audiencia correcta — sin contaminación de lenguaje de otra audiencia.
- [ ] Espaciado mínimo `--sp-8` (32px) entre bloques semánticos.
- [ ] Cero elementos prohibidos §9 visibles a audiencias no-demo.
- [ ] `prefers-reduced-motion` respetado en toda animación.
- [ ] Targets de toque ≥ 24×24 CSS px.
- [ ] Foco visible en todos los interactivos.

Fuente: AESTHETE-1 §12.

---

## 11. Anti-drift: cómo agregar tokens nuevos

1. Definir en `frontend/src/app/globals.css` (primitivo CSS var).
2. Extender en `frontend/tailwind.config.ts` bajo `theme.extend`.
3. Si es paleta nueva, usar **OKLCH** desde el inicio.
4. Documentar en la tabla §4.2 de este archivo.
5. Notificar a Aesthete-1 (`PROPOSE` con análisis de impacto si toca primitivos).
6. Meta de deuda técnica: reducir `grep '#[0-9a-fA-F]\{6\}'` sueltos en `frontend/src/components/simulator/` sprint a sprint.

Fuente: 25_tokens_y_design_as_code.md §3.

---

## 12. Versión y versionado

| Campo | Valor |
|-------|-------|
| Versión del sistema | `design-system@1.0.0` |
| Fecha de cierre Fase 8 | 2026-05-28 |
| Próxima versión requerida | Al agregar paleta OKLCH o nuevo token semántico |
| Versionado semver | `MAJOR` = ruptura de token semántico; `MINOR` = nuevo token; `PATCH` = corrección documental |

---

*Este documento consolida fielmente las fuentes canónicas listadas al inicio. Ninguna especificación fue inventada: toda regla tiene cita de fuente. Modificaciones deben actualizarse en la fuente canónica correspondiente y reflejarse aquí.*
