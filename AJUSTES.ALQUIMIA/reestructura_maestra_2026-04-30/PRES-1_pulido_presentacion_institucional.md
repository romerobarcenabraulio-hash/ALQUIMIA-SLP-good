# Fase PRES-1 · Pulido de presentación institucional

**Origen:** Solicitud Aesthete · 2026-05-05  
**Performativa CSA:** `PROPOSE` — aprobado para cola como Q-011  
**Riesgo:** Bajo · solo copy condicional, clases Tailwind y React; sin tocar API, motor de cálculo, contenido normativo ni geografía  
**Rollback:** revertir PR · sin migración de datos  
**Dependencia:** iniciar PR B y PR C solo después de que Q-003-UX haya eliminado banners "Gate obligatorio" para no sobrescribir trabajo en vuelo

---

## Propósito

Reducir ruido cognitivo en la primera lectura y alinear la voz editorial — consultoría / propuesta institucional — con lo que ya ofrecen landing y simulador, sin duplicar el mismo aviso legal ni mezclar familias de iconos.

---

## Fuera de alcance

- Contratos backend o permisos de publicación  
- Contenido normativo nuevo o cambios al motor de cálculo  
- Rediseño total del design system o migración a tokens OKLCH (eso es Q-006 / Fase 25)  
- Trabajo geoespacial de ningún tipo

---

## PR A · Landing (`frontend/src/app/page.tsx`)

### Cambios

1. **Mensaje "no dictamen":** hoy aparece varias veces con diferente redacción en la misma pantalla. Dejar una sola formulación de alta jerarquía antes del primer scroll; el resto como bullets muy cortos o dentro de un bloque colapsado "Límites del análisis".

2. **Franja de cifras nacionales:** las cuatro cifras grandes compiten visualmente con el hero. Dos opciones (Planner elige antes del PR):
   - **Opción A:** mantener cuatro cifras pero bajar jerarquía tipográfica + una línea serif encima "Órdenes de magnitud ilustrativos".
   - **Opción B:** mostrar dos indicadores; los otros dos bajo expansión "Referencias ilustrativas".

3. **Emojis en tarjetas "Una sola plataforma":** sustituir por iconos Lucide (`Recycle`, `BarChart2`, `FileText`, `Globe`) — misma familia que el simulador.

4. **Botones "demo guiada" repetidos:** unificar lenguaje. Opciones: "simulador con datos ilustrativos" o "escenario de referencia" (Planner aprueba voz). Eliminar tres llamadas idénticas en la misma página.

5. **Footer CTA verde:** fusionar mensaje con el del hero para evitar duplicidad de urgencia. Mismo tono institucional, menos repetición "demo".

### Criterios de aceptación PR A

- [ ] Mensaje "no dictamen" aparece **una sola vez** de forma prominente antes del fold.
- [ ] Ningún emoji visible en el bloque de módulos/tarjetas de la landing.
- [ ] Botones CTA usan la misma frase en toda la página.
- [ ] `npm run lint` y `tsc --noEmit` pasan sin errores nuevos.

---

## PR B · Simulador · vista ciudadano (`SectionHero.tsx` y `Header.tsx`)

### Cambios

1. **Hero interno:** revisar frases tipo "plan completo con un clic" si el producto real no garantiza esa promesa tras todas las puertas. Sustituir por "paquete de trabajo por módulos" o equivalente hasta que Ejecutor valide comportamiento exacto.

2. **Kicker de audiencia:** usar `audience` del store. Para `citizen`: mostrar kicker breve antes del título — *"Vista ciudadana · análisis orientativo"*. No mostrar ese texto para `official` ni `entrepreneur`.

3. **Header sticky KPIs (RSU / ingreso / CO₂ / empleos):** mientras no exista baseline válida (mismo criterio que el componente padre usa hoy):
   - **Opción A:** ocultar la tira KPI completamente para audiencia `citizen`.
   - **Opción B:** mostrar KPIs atenuados (`opacity-40`, cursor no interactivo) con tooltip "Disponibles tras captura de baseline".
   - **Planner debe elegir** antes de abrir este PR.

### Criterios de aceptación PR B

- [ ] Vista ciudadano no muestra frase que prometa ejecutabilidad inmediata contradictoria con el tono institucional.
- [ ] Kicker de audiencia visible **solo** para `citizen`.
- [ ] KPIs siguen la decisión Planner (ocultos o atenuados) cuando no hay baseline válida.
- [ ] Otras audiencias no se ven afectadas.
- [ ] `npm run lint` y `tsc --noEmit` pasan.

---

## PR C · Aprende (`frontend/src/app/aprende/page.tsx`)

### Cambios

1. **Etiquetas "Sección 1", "Sección 2":** reemplazar por kickers temáticos:
   - "Qué es el RSU y por qué importa"
   - "Qué pasa después del bote"
   - "Cómo se evalúa una propuesta circular"
   - (ajustar según contenido real de la página)

2. **Listas con ✓ / ✗:** reemplazar por iconos Lucide `CheckCircle` / `XCircle` con `aria-label` accesible, manteniendo exactamente el mismo texto. Si el Planner prefiere tipografía sin símbolo decorativo: usar `•` o simplemente párrafo con negrita inicial.

### Criterios de aceptación PR C

- [ ] Ningún encabezado visible dice "Sección N" o equivalente con número ordinal.
- [ ] Listas con checks/equis usan iconos Lucide o tipografía pura, sin emoji ni símbolo unicode decorativo.
- [ ] Contenido textual idéntico al original — solo cambia la presentación.
- [ ] `npm run lint` y `tsc --noEmit` pasan.

---

## Criterios de aceptación globales (binarios)

| # | Criterio | Verificación |
|---|---------|--------------|
| 1 | Mensaje "no dictamen" condensado — usuario no lee 3 veces la misma idea | QA manual scroll en `/` |
| 2 | Cero emojis en bloque de módulos de la landing | Grep `emoji\|[^\x00-\x7F]` en `page.tsx` módulos |
| 3 | Vista ciudadano en `/simulator` sin frase de ejecutabilidad inmediata | QA manual audiencia `citizen` |
| 4 | KPIs del header según decisión Planner (ocultos o atenuados sin baseline) | QA manual antes de baseline |
| 5 | `npm run lint` + `tsc --noEmit` pasan | CI |

---

## Roles y responsabilidades

| Rol | Acción |
|-----|--------|
| **Planner / CSA** | Decidir Opción A vs B en cifras nacionales; decidir voz CTA; decidir ocultar vs atenuar KPIs antes de que Ejecutor abra PR B |
| **Aesthete** | Author de las observaciones; disponible para revisar diff de copy antes del merge |
| **Ejecutor** | Implementa PR A → PR B → PR C en ese orden; respeta decisiones Planner |
| **Auditor** | Verifica que ningún cambio de copy debilite disclaimers legales ya aprobados |

---

## Esquema de trabajo

```
PR A (landing)  →  QA en /  →  merge
PR B (simulador ciudadano)  →  QA en /simulator con 3 audiencias  →  merge
PR C (aprende)  →  QA en /aprende  →  merge
```

Esfuerzo orientativo: medio–bajo por PR. QA rápido con 3 URLs en staging.

---

## Decisiones pendientes antes de abrir PR B

- [ ] **Planner:** ¿ocultar KPIs (`citizen` sin baseline) o atenuar?
- [ ] **Planner:** ¿voz CTA unificada? Opciones: "simulador con datos ilustrativos" / "escenario de referencia" / otra.
- [ ] **Planner:** ¿cifras nacionales landing → Opción A (4 cifras baja jerarquía) u Opción B (2 visibles + expansión)?

Una vez que el Planner marque estas tres decisiones como aprobadas, el Ejecutor puede ejecutar sin reabrir discusión de negocio.
