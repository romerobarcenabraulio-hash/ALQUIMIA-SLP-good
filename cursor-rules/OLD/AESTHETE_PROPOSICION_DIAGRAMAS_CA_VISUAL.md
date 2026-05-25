# AESTHETE‑1 · Propuesta creativa técnica — Diagramas Centro de Acopio y ritmo visual

**Versión:** 0.1 · Borrador para Planner / CSA · No es ADR ejecutable hasta ACCEPT.

**Ámbito normativo:** Alineado conceptualmente con `cursor-rules/AESTHETE-1.md` (Tufte/Cairo para datos, NarrativeBridge dinámico, WCAG 2.2 AA, catálogo de visualizaciones permitidas). Coordenadas geográficas “reales” de sitios siguen NAVIGATOR: ilustraciones esquemáticas ≠ decisión territorial oficial.

---

## 1. Inquietud (por qué se siente “aburrido” hoy)

El simulador **ya es fuerte cognitivamente** pero **flojo coreográficamente**: muchas rejillas monospace, pills con flechas, tablas densas (`CentrosAcopio.tsx`: cadena causal en chips, tabla de fases, tabla KPIs × F1–F5, barras volumen tras el resultado). Para el funcionario/el empresario el dato llega **sin momento de tensión visual** antes del número: falta **andamio gráfico** que explique **orden de decisión**, no solo **orden de pantalla**.

Eso contradice nuestra Ley del Silencio Visual **solo en apariencia** — el problema no es “menos contenido”, es **misión clara antes de tabla**: el ojo debe leer primero una **forma** (capa/brecha, franja temporal, ancho comparativo por material).

---

## 2. Principios de diseño (no negociables en implementación futura)

1. **Todo gráfico nuevo debe alimentarse de estado ya calculado** (store o respuesta `/infrastructure`/plan existente): nada decorativo huérfano de dato (“chatarra visual”).
2. **Catálogo AESTHETE §7.1**: preferir líneas/franjas proporcionales, **small multiples**, **diagramas tipo Sankey muy acotados** si el modelo lo soporta con honestidad causal; veto a pie charts &gt;5 segmentos y 3D.
3. Cada nueva figura lleva **`NarrativeBridge`** o continuación textual **derivada del mismo `plan`** (no copy estático paralelo).
4. **Contrastes WCAG AA** sobre fondos ivory/card; colores materiales sólo redundantes si el texto lleva etiqueta textual (no sólo hueco).
5. **Animación**: sólo entrada `opacity`/layout suave una vez por cambio relevante + **respetar `prefers-reduced-motion`**.

---

## 3. Objetivos por vista (prioridad Alta → Media)

### 3.1 Alta — `frontend/src/components/simulator/CentrosAcopio.tsx`

**Brecha capacidad ↔ capturable (hero del módulo)**  
Implementar una **band or bullet bar** proporcional sobre el ancho disponible:

- Franja inferior: volumen RSU capturable (escala única declarada).
- Franja superior: capacidad instalada del mix actual.
- Sobrepaso/sombra del delta (brecha) en color semántico con leyenda mono **una línea**.

Reemplaza parte de la sensación vacía entre tiles y primera tabla.

**Cadena causal `CAUSAL_INFRA`**  
Sustituir chips `→` planos por **componente tipo timeline horizontal editorial** (reutilizar patrones ya vistos en `EditorialTimeline` / hitos cortos):

- Estado `active`/`complete`/`pending` según si ya hay **`plan`** y mix &gt;0.
- Una sola línea `font-serif` de “pregunta institucional” encima (“¿Cuánta capacidad real cubre mi capturable propuesto?”).

**Fases F1–F5 (tabla larga)**  
Transformar primera columna textual + segunda columna ya numérica en **small multiples**: una hilera **mini-sparkbars** por fase (capacidad t/d como altura proporcional dentro de cada celda ó fila tipo matriz térmica al estilo Cairo “functional heat” usando escala perceptual institucional, no arcoíris caprichoso).

Opción menos costosa MVP: mantener tabla pero sustituir columna Cobertura por **barrita proporcional dentro de celda**.

**Volumen por material** (`VolumenBarChart`)  
Barras verticales actuales: migrar vista por defecto a **barras horizontales ordenadas descendente**, `label` serif corto izquierda, valor mono derecha (mejor densidad tipo McKinsey print). Materiales usando **tokens semánticos** (`mat-organico`, etc.), no sólo `#hex` sueltos.

**Puente CA‑Studio**

- Debajo del mix P/M/G o en esquina de la card: botón institucional “**Esquema isométrico (conceptual)** → CA‑Studio”.
- Embed **_thumbnail** SVG estático derivado del mix (tres pisos proporcionados) antes de cargar página completa `/ca-studio` — **diagrama técnico, no foto real**, para no pisar NAVIGATOR con coordenadas inventadas sobre mapas.

---

### 3.2 Media — `frontend/src/app/ca-studio/page.tsx` y `CAIsometrico.tsx`

1. Overlay explicativo con **pasos lectura** (“m² · flujo · acceso camión”) usando tipografía institucional, no texto largo técnico.
2. Opción modo “**diagrama sólo líneas**” (wireframe monocromático) para impresión / PDF próximo futuro — duplica estética reporte papel.

---

### 3.3 Media landing / hub — imágenes (sin API obligatoria v1)

v1 debe priorizar:

- Screenshots sanitizadas del propio UI (motor propio como “ilusión” seria).
- Mapas sólo donde contrato oficial exista (`NAVIGATOR`).

Las APIs foto stock (**Unsplash / Pexels**) quedan **fase Posterior CSA** sólo tras **whitelist curada IDs** si Planner lo aprueba; no bloqueante para diagramas infra.

---

## 4. Estructura de entrega sugerida (para Ejecutor en PR secuencial)

**PR‑VIZ‑A** Infra dentro del módulo Centros: sólo vistas brecha band + causal timeline + mejoras bar chart material horizontal. Sin CA embed todavía.  
**PR‑VIZ‑B** tabla fases degradada spark/heat + accesibilidad tabular (`scope`, `caption` sintético).  
**PR‑VIZ‑C** mini embed / CTA sincronizada CA‑Studio + snapshot SVG proporcional placeholder.

Antes del merge de cada PR: smoke visual comparativa **baseline vs propuesta**.

---

## 5. KPIs cualitativos de aprobación Planner

1. Moderador muestra vista a funciónario modelo ciego: ¿identifica brecha antes de llegar tabla? (>80 % rápido).  
2. Cero duplicaciones explicativas largas paralelas NarrativeBridge.  
3. No incremento perceptible tiempo de primera pintura grave (diagramas sólo después de tener `plan`).

---

## 6. Vetos conocidos desde AESTHETE si Ejecutor se desvía

- Gradiente ornamental sin función de datos.  
- Fotografías cliché landfill sin contexto ciudad.  
- Mapas decisión ubicación física usando tiles no aprobados oficialmente contra NAVIGATOR.  
- NarrativeBridge con copy inventado fuera del `InfrastructurePlanResponse`.

---

## 7. Pendientes explícitos (no van en primera iteración código)

Tokens OKLCH semánticos versionados sistema diseño semver. NarrativeBridge TypeScript canónico (`what_it_means`, confidence). Export vector PDF alta fidelidad isométrico.

---

*Autor conceptual: sesión agente rol AESTHETE‑1 · ALQUIMIA · fecha documento viviente.*
