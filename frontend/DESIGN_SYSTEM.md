# ALQUIMIA · Design System v1.0

**Estado:** Canónico · Fuente única de verdad visual y editorial  
**Mantenedor:** Aesthete-1 (veto estético/a11y) · Ejecutor (implementación)  
**Última consolidación:** 2026-06-18  
**Fuentes:** AESTHETE-1.md · FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md · 25_tokens_y_design_as_code.md · FRONTEND DEFINITIVO/MODULE_MAP.md  

---

## 1. Principio rector

> **Consultoría editorial de élite, no dashboard SaaS.**

El orden invariable de toda pantalla:

1. Conclusión ejecutiva primero
2. Cifra o hallazgo protagonista
3. Evidencia mínima inmediatamente visible
4. Detalle secundario en tabla/lista limpia

Color = estado, cifra o riesgo. Nunca contenedor decorativo.  
Dato cuantitativo sin `NarrativeBridge` dinámico → veto.

---

## 2. Tokens de color (CSS custom properties en `globals.css`)

### 2.1 Primitivos

```css
/* Brand */
--green-50:  #EAF3DE   /* superficies éxito leve */
--green-500: #3B6D11   /* acción primaria, verificado */
--green-600: #2D5409
--green-700: #1F3B06

/* Señales */
--amber-50:  #FEF7E7
--amber-300: #F6C84B
--amber-500: #D4881E   /* estimado, advertencia */
--amber-700: #8A4F08
--blue-50:   #EBF3FB
--blue-600:  #1A5FA8   /* enlace, plástico */
--blue-900:  #051D45
--red-50:    #FBEAEA
--red-500:   #C0392B   /* bloqueado, crítico */

/* Neutros */
--gray-200:  #E2DED6
--gray-400:  #A8A49C
--gray-600:  #6B6760
--gray-900:  #1C1B18   /* texto primario */

/* Superficies */
--surface-base:   #FFFFFF
--ivory-border:   #ECEAE6
--ivory-hover:    #F8FAF8
```

### 2.2 Semánticos de estado

| Estado Linear | Token de texto | Token de fondo | Dot |
|---|---|---|---|
| `verificado` | `#23470A` | `--green-50` | `--green-500` |
| `localizado` | `#6B4800` | `--amber-50` | `--amber-500` |
| `estimado` | `#6B4800` | `--amber-50` | `--amber-500` |
| `no_disponible` | `#B91C1C` | `#FEF2F2` | `--red-500` |
| `bloqueado` | `#B91C1C` | `#FEF2F2` | `--red-500` |

**Regla:** color + texto + ícono/punto siempre. Nunca solo color (WCAG 1.4.1).

### 2.3 Tokens de materiales RSU

```css
--mat-organico:  #639922
--mat-papel:     #D4881E
--mat-plastico:  #1A5FA8
--mat-vidrio:    #1D9E75
--mat-aluminio:  #8B6B4A
--mat-otros:     #A8A49C
```

---

## 3. Tipografía

### 3.1 Stack

| Rol | Fuente | Uso |
|---|---|---|
| **Serif** (autoridad) | Georgia / `font-display` class | Encabezados editoriales, citas legales, nombres de norma |
| **Sans** (técnica) | System UI / `font-source-sans` | Datos numéricos, KPIs, UI controls, cuerpo |
| **Mono** (datos) | `ui-monospace` / `font-mono-data` class | IDs, claves municipales, folios, tablas numéricas |

### 3.2 Escala (usada en componentes)

| Uso | Tamaño |
|---|---|
| Eyebrow / etiqueta | `10px` uppercase `tracking-[0.05em]` |
| Texto secundario / metadato | `11px` |
| Cuerpo / dato primario | `12–13px` |
| KPI protagonista | `18px` bold tabular-nums |
| Heading editorial | `20–26px` serif |

**Ancho de columna:** 45–75 caracteres para texto largo.  
**Altura de línea:** 1.5–1.7 texto corrido · 1.1–1.3 displays.

---

## 4. Espaciado y radios

```css
--sp-1: 4px   --sp-2: 8px   --sp-3: 12px  --sp-4: 16px
--sp-6: 24px  --sp-8: 32px  --sp-12: 48px --sp-16: 64px

--r-sm: 6px   --r-md: 10px  --r-lg: 14px  --r-xl: 20px
```

**Mínimo entre bloques semánticos:** `--sp-8` (32px).  
Sombras: `--shadow-sm` para cards; prohibido `shadow-xl` o mayor.

---

## 5. Accesibilidad (piso WCAG 2.2 AA, no aspiración)

| Criterio | Umbral |
|---|---|
| Contraste texto normal | ≥ 4.5:1 |
| Contraste texto grande (≥ 18.66px / 14px bold) | ≥ 3:1 |
| Contraste UI (íconos, bordes informativos) | ≥ 3:1 |
| Touch target | `min-h-[44px]` en elementos interactivos |
| Foco visible | `focus-visible:outline-2 focus-visible:outline-offset-1/2` en todos los interactivos |
| Movimiento | `prefers-reduced-motion: reduce` desactiva todas las animaciones/transiciones |
| Color-only | Prohibido como único transmisor; siempre acompañar con texto/ícono |

Implementación `prefers-reduced-motion` en `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Componente NarrativeBridge

Todo dato cuantitativo complejo requiere `NarrativeBridge`. Estructura obligatoria:

```typescript
type NarrativeBridgeSpec = {
  audience: 'citizen' | 'functionary' | 'entrepreneur'
  summary: (state: ComputedState) => string  // ≤ 220 chars, variable real
  evidence?: { label: string; value: string; traceKey?: string }[]
  nextStep?: { label: string; href?: string; onClick?: () => void }
  source?: { fuente: string; unidad?: string; incertidumbre?: string }
}
```

- `summary` siempre derivado de estado calculado, nunca string estático.
- Componente en `frontend/src/components/simulator/NarrativeBridge.tsx`.
- `nextStep` links/buttons: `min-h-[44px]` + `focus-visible` outline.

---

## 7. Componentes editoriales canónicos

| Componente | Archivo | Uso |
|---|---|---|
| `Conclusion` | `editorial/Conclusion.tsx` | Párrafo de conclusión (tone: default/caution) |
| `AnchorFigure` | `editorial/AnchorFigure.tsx` | KPI protagonista con contexto |
| `SectionLabel` | `editorial/SectionLabel.tsx` | Eyebrow/kicker de sección |
| `MarginalNote` | `editorial/MarginalNote.tsx` | Procedencia, fuente, nota al margen |
| `EditorialStatusLabel` | `editorial/EditorialStatusLabel.tsx` | Badge de estado (success/caution/critical/neutral) |

---

## 8. Semáforo de estados (SCR)

Componente `SemaforoCoberturaHonesto` — siempre color + texto + punto:

```
verde    = todos verificados
amarillo = ≥1 estimado o localizado
rojo     = ≥1 bloqueado o no_disponible
```

Filas de tabla interactivas: `role="button"`, `tabIndex={0}`, `min-h-[44px]`, `aria-selected`.

---

## 9. Visualizaciones — catálogo permitido

| Permitida | Uso |
|---|---|
| Sankey | Flujos de dinero/basura entre etapas |
| Timeline horizontal | Leyes, fases, decisiones |
| Mapa de calor (Mapbox) | Logística y densidad espacial |
| Tornado chart | Sensibilidad financiera (entrepreneur) |
| Small multiples (Tufte) | Comparación entre municipios/ZMs |
| Distribuciones P5/P25/P50/P75/P95 | Monte Carlo |

**Prohibidas:**
- Pie chart con > 5 segmentos
- Charts 3D
- Doble eje Y heterogéneo (sin ADR)
- Word clouds
- Gradientes decorativos sobre datos
- Animaciones en loop

---

## 10. Segmentación de audiencia

| Dimensión | Citizen | Functionary | Entrepreneur |
|---|---|---|---|
| Densidad info | Baja — 1 idea/pantalla | Alta + anclas legales | Media — foco en deltas |
| Tipografía dominante | Sans + Serif headlines | Serif autoridad + Sans datos | Sans dominante |
| Visual primario | Iconografía + analogías | Tablas referenciadas + citas | KPIs + sensibilidad |
| CTA | Aprender / participar | Firmar / autorizar | Invertir / cotizar |

Mezcla sin justificación = veto.

---

## 11. Mapa de módulos (FRONTEND DEFINITIVO)

| Row | module_id | Audiencia | Componentes principales |
|---|---|---|---|
| M01 | `city_baseline` | citizen + functionary | `SectionHero`, `ImpactoAmbiental`, `MultiplicadoresEco` |
| M02 | `municipal_context` | citizen + functionary | `SocialDemographicContextPanel`, `MarcoLegal`, `CoberturaNacional` |
| M04 | `infrastructure_operations` | functionary | `CentrosAcopio`, `Logistica`, `SankeyFlujoResiduos`, `HojaRuta` |
| M06 | `scenarios_export` | functionary | `ImpactoFinanciero`, `ExportarSection`, `DashboardKPIs` |
| M07 | `market_traceability` | functionary | `ReasoningGraphPanel` |
| M08 | `risk_trends` | functionary | `RiskTrendsPanel` |
| GOV | `gobierno/scr` | functionary | `SemaforoCoberturaHonesto`, `FichaMunicipal`, `MexicoRsuFootprintMap` |

---

## 12. Prohibiciones absolutas

- Cajas decorativas con fondo de color (usar whitespace + jerarquía tipográfica)
- Sombras `shadow-xl` o mayores
- Labels huérfanos: `Evidencia:`, `LISTO`, `Demo`, `placeholder`
- Bordes en cada tarjeta (preferir separación por espacio)
- Tooltips que ocultan información crítica
- Color como único transmisor de estado
- Tokens hex crudos en componentes (usar CSS vars o clases Tailwind del sistema)
- `shadow-2xl`, `drop-shadow` excesivo
- Scroll infinito (usar progressive disclosure)

---

## 13. Checklist de auto-auditoría (pre-commit)

Antes de cualquier PR con cambios de UI:

- [ ] Color de estado acompañado de texto/ícono
- [ ] Touch targets `min-h-[44px]` en todos los interactivos
- [ ] `focus-visible` outline en todos los interactivos
- [ ] `prefers-reduced-motion` respetado
- [ ] Contraste ≥ 4.5:1 texto normal · ≥ 3:1 texto grande/UI
- [ ] Sin cajas decorativas de fondo de color
- [ ] Sin tokens hex crudos no registrados aquí
- [ ] `NarrativeBridge` presente para cada cálculo complejo
- [ ] Componente tiene estados: loading · empty · error · blocked · success
- [ ] Audiencia respetada — sin mezcla de lenguaje

---

## 14. Anti-patterns (Aesthete-1 §15)

| ID | Anti-patrón | Consecuencia |
|---|---|---|
| A1 | Componente sin estados loading/empty/error | No sale a producción |
| A2 | Token hex crudo en componente | Veto |
| A3 | NarrativeBridge con copy estático | Veto |
| A4 | Diseño sin verificación WCAG AA | Veto |
| A5 | Color como único transmisor | Veto |
| A6 | Animación sin `prefers-reduced-motion` | Veto |
| A7 | Tornado chart a Citizen sin puente narrativo | Veto |
| A8 | Pie chart > 5 segmentos | Veto |
| A9 | Mezcla Serif/Sans sin intención | Veto |
| A10 | Dark pattern (catálogo deceptive.design) | Escalado a CSA |

---

*ALQUIMIA · Design System v1.0 · 2026-06-18*
